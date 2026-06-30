using System.ComponentModel;

namespace Yoma.Core.Infrastructure.Alison
{
  public enum UserAuthenticationRequestType
  {
    Login,
    Register
  }

  public enum VerificationCourseStatus
  {
    [Description("Completed")]
    Completed,
    [Description("In-Progress")]
    InProgress,
    [Description("Not-Started")]
    NotStarted
  }
}
