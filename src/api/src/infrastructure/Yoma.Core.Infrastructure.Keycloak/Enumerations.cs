using System.ComponentModel;

namespace Yoma.Core.Infrastructure.Keycloak
{
  public enum CustomAttributes
  {
    [Description("phoneNumber")]
    PhoneNumber,
    [Description("gender")]
    Gender,
    [Description("country")]
    Country,
    [Description("education")]
    Education,
    [Description("dateOfBirth")]
    DateOfBirth,
    [Description("terms_and_conditions")]
    TermsAndConditions,
    [Description("phoneNumberVerified")]
    PhoneNumberVerified
  }

  public enum WebhookRequestEventType
  {
    Undefined,
    [Description("REGISTER")]
    Register,
    [Description("UPDATE_PROFILE")]
    Update_Profile,
    [Description("LOGIN")]
    Login
  }
}
