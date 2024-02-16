using Microsoft.AspNetCore.Mvc;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Entity.Extensions;
using Microsoft.AspNetCore.Authorization;
using Yoma.Core.Domain.Keycloak.Models;
using Yoma.Core.Infrastructure.Keycloak;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces;

namespace Yoma.Core.Api.Controllers
{
    [Route("api/v3/keycloak")]
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
        public IActionResult ReceiveKeyCloakEvent([FromBody] KeycloakWebhookRequest payload)
        {
            var authorized = false;
            try
            {
                authorized = _identityProviderClient.AuthenticateWebhook(HttpContext);

                return authorized ? StatusCode(StatusCodes.Status200OK) : StatusCode(StatusCodes.Status403Forbidden);
            }
            finally
            {
                Response.OnCompleted(async () =>
                {
                    if (!authorized)
                    {
                        _logger.LogInformation("Authorization failed");
                        return;
                    }

                    if (payload == null)
                    {
                        _logger.LogError("Webhook payload is empty. Processing skipped");
                        return;
                    }

                    var sType = payload.type;
                    _logger.LogInformation("{sType} event received", sType);

                    Enum.TryParse<WebhookRequestEventType>(sType, true, out var type);

                    switch (type)
                    {
                        case WebhookRequestEventType.Register:
                        case WebhookRequestEventType.UpdateProfile:
                            _logger.LogInformation("{type} event processing", type);

                            await UpdateUserProfile(type, payload);

                            _logger.LogInformation("{type} event processed", type);
                            break;

                        case WebhookRequestEventType.Login:
                            _logger.LogInformation("{type} event processing", type);

                            await UpdateUserProfile(type, payload);

                            _logger.LogInformation("{type} event processed", type);
                            break;

                        default:
                            _logger.LogInformation("Unknown event type of '{sType}' receive. Processing skipped", sType);
                            return;
                    }
                });
            }
        }
        #endregion

        #region Private Members
        private async Task UpdateUserProfile(WebhookRequestEventType type, KeycloakWebhookRequest payload)
        {
            if (string.IsNullOrEmpty(payload?.details?.username))
            {
                _logger.LogError("Webhook payload contains no associated Keycloak username");
                return;
            }

            _logger.LogInformation("Trying to find the Keycloak user with username '{username}'", payload?.details?.username);
            var kcUser = await _identityProviderClient.GetUser(payload?.details?.username);
            if (kcUser == null)
            {
                _logger.LogError("Failed to retrieve the Keycloak user with username '{username}'", payload?.details.username);
                return;
            }

            var userRequest = _userService.GetByEmailOrNull(kcUser.Username, false, false)?.ToUserRequest();

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

                    userRequest.Email = kcUser.Username.Trim();
                    userRequest.FirstName = kcUser.FirstName.Trim();
                    userRequest.Surname = kcUser.LastName.Trim();
                    userRequest.EmailConfirmed = kcUser.EmailVerified;
                    userRequest.PhoneNumber = kcUser.PhoneNumber;

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
                        await _identityProviderClient.EnsureRoles(kcUser.Id, new List<string> { Constants.Role_User });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "{type}: Failed to assign the default 'User' role to the newly register user with email '{email}'", type, userRequest.Email);
                    }
                    break;

                case WebhookRequestEventType.Login:
                    if (userRequest == null)
                    {
                        _logger.LogError("{type}: Failed to retrieve the Yoma user with email '{email}'", type, kcUser.Username);
                        return;
                    }

                    //updated here after email verification a login event is raised
                    userRequest.EmailConfirmed = kcUser.EmailVerified;
                    userRequest.DateLastLogin = DateTime.Now;

                    try
                    {
                        _logger.LogInformation("Creating or scheduling creation of rewards wallet for user with '{email}'", userRequest.Email);
                        await _walletService.CreateWalletOrScheduleCreation(userRequest.Id);
                        _logger.LogInformation("Rewards wallet created or creation scheduled for user with '{email}'", userRequest.Email);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to create or schedule creation of rewards wallet for user with username '{email}'", userRequest.Email);
                    }

                    break;

                default: //event not supported
                    _logger.LogError("{type}: Event not supported", type);
                    return;
            }

            userRequest.ExternalId = kcUser.Id;

            await _userService.Upsert(userRequest);
        }
    }
    #endregion
}
