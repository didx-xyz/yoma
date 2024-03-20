namespace Yoma.Core.Domain.Core
{
  public static class Constants
  {
    public const string Role_User = "User";
    public const string Role_Admin = "Admin";
    public const string Role_OrganizationAdmin = "OrganisationAdmin";

    public static readonly string[] Roles_Supported = [Role_User, Role_Admin, Role_OrganizationAdmin];

    public const string ModifiedBy_System_Username = "system@yoma.world";
  }
}
