using System.ComponentModel;

namespace Yoma.Core.Domain.IdentityProvider
{
  public enum IdentityEventType
  {
    Undefined,
    [Description("REGISTER")]
    Register,
    [Description("UPDATE_PROFILE")]
    UpdateProfile,
    [Description("LOGIN")]
    Login
  }
}
