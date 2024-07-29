using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core
{
  public static class Constants
  {
    public const string Role_User = "User";
    public const string Role_Admin = "Admin";
    public const string Role_OrganizationAdmin = "OrganisationAdmin";
    public static readonly string[] Roles_Supported = [Role_User, Role_Admin, Role_OrganizationAdmin];
    public const string ClaimType_Role = "role";

    internal const string ModifiedBy_System_Username = "system@yoma.world";
    internal const int TimeIntervalSummary_Data_MaxNoOfPoints = 52;
  }
}
