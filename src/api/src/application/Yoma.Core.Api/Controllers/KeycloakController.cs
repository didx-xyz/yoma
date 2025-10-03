using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Infrastructure.Keycloak;
using Yoma.Core.Infrastructure.Keycloak.Models;

namespace Yoma.Core.Api.Controllers
{
  [Route($"api/{Common.Constants.Api_Version}/keycloak")]
  [ApiController]
  [AllowAnonymous]
  [ApiExplorerSettings(IgnoreApi = true)]
  public class KeycloakController : ControllerBase
  {
    #region Class Variables
    private readonly ILogger _logger;
    private readonly AppSettings _appSettings;
    private readonly IIdempotencyService _idempotencyService;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IIdentityProviderClient _identityProviderClient;
    private readonly IUserService _userService;
    private readonly IGenderService _genderService;
    private readonly ICountryService _countryService;
    private readonly IEducationService _educationService;
    private readonly IWalletService _walletService;

    private const string Key_Prefix = "keycloak_event";
    #endregion

    #region Constructors
    public KeycloakController(ILogger<KeycloakController> logger,
      IOptions<AppSettings> appSettings,
      IIdempotencyService idempotencyService,
      IDistributedLockService distributedLockService,
      IIdentityProviderClientFactory identityProviderClientFactory,
      IUserService userService,
      IGenderService genderService,
      ICountryService countryService,
      IEducationService educationService,
      IWalletService walletService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _idempotencyService = idempotencyService ?? throw new ArgumentNullException(nameof(idempotencyService));
      _distributedLockService = distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService));
      _identityProviderClient = identityProviderClientFactory.CreateClient() ?? throw new ArgumentNullException(nameof(identityProviderClientFactory));
      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _genderService = genderService ?? throw new ArgumentNullException(nameof(genderService));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
      _educationService = educationService ?? throw new ArgumentNullException(nameof(educationService));
      _walletService = walletService ?? throw new ArgumentNullException(nameof(walletService));
    }
    #endregion

    #region Public Members
    [HttpPost("webhook")]
    public IActionResult ReceiveKeyCloakEvent([FromBody] JObject request)
    {
      //only logged when logging level is set to debug
      _logger.LogDebug("Raw request: {request}", request == null ? "Empty" : request.ToString());

      var authorized = false;
      try
      {
        authorized = _identityProviderClient.AuthenticateWebhook(HttpContext);

        return authorized ? StatusCode(StatusCodes.Status200OK) : StatusCode(StatusCodes.Status403Forbidden);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "An error occurred during authentication: {errorMessage}", ex.Message);
        return StatusCode(StatusCodes.Status500InternalServerError);
      }
      finally
      {
        Response.OnCompleted(async () =>
        {
          try
          {
            if (!authorized)
            {
              _logger.LogError("Authorization failed");
              return;
            }

            if (request == null)
            {
              _logger.LogError("Webhook payload is empty. Processing skipped");
              return;
            }

            var payload = request.ToObject<KeycloakWebhookRequest>();
            if (payload == null)
            {
              _logger.LogError("Failed to deserialize payload. Processing skipped");
              return;
            }

            if (string.IsNullOrWhiteSpace(payload.Id))
            {
              _logger.LogError("Webhook payload contains no id. Processing skipped");
              return;
            }

            var idempotencyKey = $"{Key_Prefix}:{payload.Id.Trim()}";
            var proceed = true;
            try
            {
              proceed = await _idempotencyService.TryCreateAsync(idempotencyKey);
            }
            catch (Exception ex)
            {
              _logger.LogError(ex, "Idempotency check failed for event id '{eventId}' – proceeding anyway", payload.Id);
            }

            if (!proceed)
            {
              _logger.LogInformation("Duplicate Keycloak event suppressed (id={eventId})", payload.Id);
              return;
            }

            var sType = payload.Type;
            _logger.LogInformation("{sType} event received (id={eventId})", sType, payload.Id);

            var type = EnumHelper.GetValueFromDescription<WebhookRequestEventType>(sType);
            if (!type.HasValue) type = WebhookRequestEventType.Undefined;

            switch (type)
            {
              case WebhookRequestEventType.Register:
              case WebhookRequestEventType.UpdateProfile:
              case WebhookRequestEventType.Login:
                _logger.LogInformation("{type} event processing", type.Value);

                await UpdateUserProfile(type.Value, payload);

                _logger.LogInformation("{type} event processed", type.Value);
                break;

              default:
                _logger.LogInformation("Unknown event type of '{sType}' receive. Processing skipped", sType);
                return;
            }
          }
          catch (Exception ex)
          {
            _logger.LogError(ex, "An error occurred during event processing: {errorMessage}", ex.Message);
            return;
          }
        });
      }
    }
    #endregion

    #region Private Members
    private async Task UpdateUserProfile(WebhookRequestEventType type, KeycloakWebhookRequest payload)
    {
      var userId = Guid.Parse(payload.UserId);
      var lockKey = $"{Key_Prefix}:{userId}";
      var lockDuration = TimeSpan.FromSeconds(_appSettings.DistributedLockKeycloakEventDurationInSeconds);

      await _distributedLockService.RunWithLockAsync(lockKey, lockDuration, async () =>
      {
        if (string.IsNullOrEmpty(payload.Details?.Username))
        {
          _logger.LogError("Webhook payload contains no associated Keycloak username");
          return;
        }

        _logger.LogInformation("Trying to find the Keycloak user with id '{userId}'", userId);
        var kcUser = await _identityProviderClient.GetUserById(userId);
        if (kcUser == null)
        {
          _logger.LogError("Failed to retrieve the Keycloak user with id '{userId}'", userId);
          return;
        }

        _logger.LogInformation("Found Keycloak user with username '{username}'", kcUser.Username);

        var userRequest = RetryHelper.RetryUntil(
            () =>
            {
              // try to locate the user based on their external Keycloak ID.
              // this is the preferred lookup since users who have already completed their first login
              // will have an external ID stored in the system.
              var user = _userService.GetByExternalIdOrNull(kcUser.Id, false, false)?.ToUserRequest();

              // if no user is found by their external ID, fall back to locating the user by their username.
              // this caters to cases where the user was created in Yoma (via B2B integration) before
              // registering and completing their first login. In such cases, the external ID won't exist yet.
              // also, handle test users on the development environment who might not have an associated external ID.
              // a user cannot change their phone number or email address until they have completed their first login.
              return user ?? _userService.GetByUsernameOrNull(kcUser.Username, false, false)?.ToUserRequest();
            },
            exitCondition: result =>
            {
              // only attempt lookup once during registration.
              // retries are reserved for UpdateProfile and Login to handle race conditions
              // where those webhooks may fire before the registration transaction completes
              return type == WebhookRequestEventType.Register || result != null;
            },
            timeout: TimeSpan.FromSeconds(10),
            retryOnException: false,
            delay: TimeSpan.FromSeconds(1),
            onRetry: attempt =>
            {
              _logger.LogDebug("Retry {attempt}: Retrying retrieval of the Yoma user: ExternalId: '{externalId}' | Username '{username}'", attempt, kcUser.Id, kcUser.Username);
            },
            logger: _logger
        );

        switch (type)
        {
          case WebhookRequestEventType.Register:
          case WebhookRequestEventType.UpdateProfile:
            if (userRequest == null)
            {
              if (type == WebhookRequestEventType.UpdateProfile)
              {
                _logger.LogError("{type}: Failed to retrieve the Yoma user with username '{username}'", type, kcUser.Username);
                return;
              }
              userRequest = new UserRequest();
            }

            userRequest.Username = kcUser.Username.Trim();
            userRequest.Email = kcUser.Email?.Trim().ToLower();
            userRequest.FirstName = kcUser.FirstName?.Trim().TitleCase();
            userRequest.Surname = kcUser.LastName?.Trim().TitleCase();
            userRequest.EmailConfirmed = kcUser.EmailVerified;
            userRequest.PhoneNumber = kcUser.PhoneNumber?.Trim();
            userRequest.PhoneNumberConfirmed = kcUser.PhoneNumberVerified;

            _logger.LogInformation("{type}: Updating user with username '{username}' - EmailConfirmed {emailConfirmed}", type, userRequest.Username, userRequest.EmailConfirmed);
            _logger.LogInformation("{type}: Updating user with username '{username}' - PhoneNumberConfirmed {phoneNumberConfirmed}", type, userRequest.Username, userRequest.PhoneNumberConfirmed);

            if (!string.IsNullOrEmpty(kcUser.Country))
            {
              var country = _countryService.GetByNameOrNull(kcUser.Country);

              if (country == null)
                _logger.LogError("Failed to parse Keycloak '{customAttribute}' with value '{country}'", CustomAttributes.Country, kcUser.Country);
              else
                userRequest.CountryId = country.Id;
            }

            if (!string.IsNullOrEmpty(kcUser.Education))
            {
              var country = _educationService.GetByNameOrNull(kcUser.Education);

              if (country == null)
                _logger.LogError("Failed to parse Keycloak '{customAttributes}' with value '{education}'", CustomAttributes.Education, kcUser.Education);
              else
                userRequest.EducationId = country.Id;
            }

            if (!string.IsNullOrEmpty(kcUser.Gender))
            {
              var gender = _genderService.GetByNameOrNull(kcUser.Gender);

              if (gender == null)
                _logger.LogError("Failed to parse Keycloak '{customAttribute}' with value '{gender}'", CustomAttributes.Gender, kcUser.Gender);
              else
                userRequest.GenderId = gender.Id;
            }


            if (!string.IsNullOrEmpty(kcUser.DateOfBirth))
            {
              if (!DateTime.TryParse(kcUser.DateOfBirth, out var dateOfBirth))
                _logger.LogError("Failed to parse Keycloak '{customAttributes}' with value '{dateOfBirth}'", CustomAttributes.DateOfBirth, kcUser.DateOfBirth);
              else
                userRequest.DateOfBirth = dateOfBirth;
            }

            if (type == WebhookRequestEventType.UpdateProfile) break;

            try
            {
              //add newly registered user to the default "User" role
              await _identityProviderClient.EnsureRoles(kcUser.Id, [Domain.Core.Constants.Role_User]);
            }
            catch (Exception ex)
            {
              _logger.LogError(ex, "{type} - Failed to assign the default 'User' role to the newly register user with username '{username}': {errorMessage};", type, userRequest.Username, ex.Message);
            }
            break;

          case WebhookRequestEventType.Login:
            if (userRequest == null)
            {
              _logger.LogError("{type}: Failed to retrieve the Yoma user with username '{username}'", type, kcUser.Username);
              return;
            }

            // after email verification, the login event is raised.
            // an admin may have reverted an email update request, so ensure the email matches Keycloak — the source of truth.
            // the phone number is synced for eventual consistency and to handle changes made outside of the standard flow.
            userRequest.Username = kcUser.Username.Trim();
            userRequest.Email = kcUser.Email?.Trim().ToLower();
            userRequest.EmailConfirmed = kcUser.EmailVerified;
            userRequest.PhoneNumber = kcUser.PhoneNumber?.Trim();
            userRequest.PhoneNumberConfirmed = kcUser.PhoneNumberVerified;
            userRequest.DateLastLogin = DateTimeOffset.UtcNow;

            _logger.LogInformation("{type}: Updating user with username '{username}' - EmailConfirmed {emailConfirmed}", type, userRequest.Username, userRequest.EmailConfirmed);
            _logger.LogInformation("{type}: Updating user with username '{username}' - PhoneNumberConfirmed {phoneNumberConfirmed}", type, userRequest.Username, userRequest.PhoneNumberConfirmed);

            try
            {
              await _identityProviderClient.EnsureVerifyEmailActionRemovedIfNoEmail(kcUser.Id);
            }
            catch (Exception ex)
            {
              _logger.LogError(ex, "Failed to remove the 'VERIFY_EMAIL' action for the newly registered user with username '{username}' when no email is provided: {errorMessage}", userRequest.Username, ex.Message);
            }

            await ScheduleWalletCreation(userRequest);
            await TrackLogin(payload, userRequest);

            break;

          default: //event not supported
            _logger.LogError("{type}: Event not supported", type);
            return;
        }

        userRequest.ExternalId = kcUser.Id;

        await _userService.Upsert(userRequest);
      });
    }

    private async Task TrackLogin(KeycloakWebhookRequest payload, UserRequest userRequest)
    {
      try
      {
        _logger.LogInformation("Tracking login for user with username '{username}'", userRequest.Username);
        await _userService.TrackLogin(new UserRequestLoginEvent
        {
          UserId = userRequest.Id,
          ClientId = payload.ClientId,
          IpAddress = payload.IpAddress,
          AuthMethod = payload.Details?.Auth_method,
          AuthType = payload.Details?.Auth_type,
          IdentityProvider = payload.Details?.Identity_provider,
        });

        _logger.LogInformation("Tracked login for user with username '{username}'", userRequest.Username);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to track login for user with username '{username}': {errorMessage}", userRequest.Username, ex.Message);
      }
    }

    private async Task ScheduleWalletCreation(UserRequest userRequest)
    {
      try
      {
        _logger.LogInformation("Scheduling rewards wallet creation (or username update) for user '{username}'", userRequest.Username);

        await _walletService.ScheduleWalletCreation(userRequest.Id);

        _logger.LogInformation("Rewards wallet creation scheduled (or username update) for user '{username}'", userRequest.Username);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to schedule rewards wallet creation (or username update) for user '{username}': {errorMessage}", userRequest.Username, ex.Message);
      }
    }
  }
  #endregion
}
