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
    [Description("phoneNumberVerified")]
    PhoneNumberVerified
  }

  public enum WebhookRequestEventType
  {
    Undefined,
    [Description("REGISTER")]
    Register,
    [Description("UPDATE_PROFILE")]
    UpdateProfile,
    [Description("LOGIN")]
    Login
  }

  public enum RegisterMethod
  {
    [Description("form")]
    Form,
    [Description("broker")]
    Broker
  }
}
