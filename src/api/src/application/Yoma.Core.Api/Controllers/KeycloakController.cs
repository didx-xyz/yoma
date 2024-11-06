using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
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
  public class KeycloakController : Controller
  {
    #region Class Variables
    private readonly ILogger _logger;
    private readonly IIdentityProviderClient _identityProviderClient;
    private readonly IUserService _userService;
    private readonly IGenderService _genderService;
    private readonly ICountryService _countryService;
    private readonly IEducationService _educationService;
    private readonly IWalletService _walletService;
    #endregion

    #region Constructors
    public KeycloakController(ILogger<KeycloakController> logger,
      IIdentityProviderClientFactory identityProviderClientFactory,
      IUserService userService,
      IGenderService genderService,
      ICountryService countryService,
      IEducationService educationService,
      IWalletService walletService)
    {
      _logger = logger;
      _identityProviderClient = identityProviderClientFactory.CreateClient();
      _userService = userService;
      _genderService = genderService;
      _countryService = countryService;
      _educationService = educationService;
      _walletService = walletService;
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
        _logger.LogError(ex, "An error occurred during authentication");
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

            var sType = payload.Type;
            _logger.LogInformation("{sType} event received", sType);

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
            _logger.LogError(ex, "An error occurred during event processing");
            return;
          }
        });
      }
    }
    #endregion

    #region Private Members
    private async Task UpdateUserProfile(WebhookRequestEventType type, KeycloakWebhookRequest payload)
    {
      if (string.IsNullOrEmpty(payload.Details?.Username))
      {
        _logger.LogError("Webhook payload contains no associated Keycloak username");
        return;
      }

      var username = payload.Details?.Username;

      _logger.LogInformation("Trying to find the Keycloak user with username '{username}'", username);
      var kcUser = await _identityProviderClient.GetUser(username);
      if (kcUser == null)
      {
        _logger.LogError("Failed to retrieve the Keycloak user with username '{username}'", username);
        return;
      }

      // try to locate the user based on their external Keycloak ID.
      // this is the preferred lookup since users who have already completed their first login
      // will have an external ID stored in the system.
      var userRequest = _userService.GetByExternalIdOrNull(kcUser.Id, false, false)?.ToUserRequest();

      // if no user is found by their external ID, fall back to locating the user by their username.
      // this caters to cases where the user was created in Yoma (via B2B integration) before
      // registering and completing their first login. In such cases, the external ID won't exist yet.
      // also, handle test users on the development environment who might not have an associated external ID.
      // a user cannot change their phone number or email address until they have completed their first login.
      userRequest ??= _userService.GetByUsernameOrNull(kcUser.Username, false, false)?.ToUserRequest();

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
            _logger.LogError(ex, "{type}: Failed to assign the default 'User' role to the newly register user with username '{username}'", type, userRequest.Username);
          }
          break;

        case WebhookRequestEventType.Login:
          if (userRequest == null)
          {
            _logger.LogError("{type}: Failed to retrieve the Yoma user with username '{username}'", type, kcUser.Username);
            return;
          }

          //after email verification, the login event is raised. 
          //an admin may have reverted an email update request, so ensure the email matches Keycloak, which is the source of truth.
          userRequest.Username = kcUser.Username.Trim();
          userRequest.Email = kcUser.Email?.Trim().ToLower();
          userRequest.EmailConfirmed = kcUser.EmailVerified;
          userRequest.DateLastLogin = DateTimeOffset.UtcNow;

          _logger.LogInformation("{type}: Updating user with username '{username}' - EmailConfirmed {emailConfirmed}", type, userRequest.Username, userRequest.EmailConfirmed);
          _logger.LogInformation("{type}: Updating user with username '{username}' - PhoneNumberConfirmed {phoneNumberConfirmed}", type, userRequest.Username, userRequest.PhoneNumberConfirmed);

          await CreateWalletOrScheduleCreation(userRequest);
          await TrackLogin(payload, userRequest);

          break;

        default: //event not supported
          _logger.LogError("{type}: Event not supported", type);
          return;
      }

      userRequest.ExternalId = kcUser.Id;

      await _userService.Upsert(userRequest);
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
          AuthType = payload.Details?.Auth_type
        });

        _logger.LogInformation("Tracked login for user with username '{username}'", userRequest.Username);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to track login for user with username '{username}'", userRequest.Username);
      }
    }

    private async Task CreateWalletOrScheduleCreation(UserRequest userRequest)
    {
      try
      {
        _logger.LogInformation("Creating or scheduling creation (create or update username) of rewards wallet for user with username '{username}'", userRequest.Username);
        await _walletService.CreateWalletOrScheduleCreation(userRequest.Id);
        _logger.LogInformation("Rewards wallet created or creation scheduled (create or update username) for user with username '{username}'", userRequest.Username);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to create or schedule creation (create or update username) of rewards wallet for user with username '{username}'", userRequest.Username);
      }
    }
  }
  #endregion
}
