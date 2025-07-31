namespace Yoma.Core.Domain.Entity
{
  public enum OrganizationStatus
  {
    Inactive, //flagged as declined if inactive and not modified for x days
    Active,
    Declined, //flagged as deleted if declined and not modified for x days
    Deleted
  }

  public enum OrganizationDocumentType
  {
    Registration,
    EducationProvider,
    Business
  }

  public enum OrganizationProviderType
  {
    Education,
    Marketplace
  }

  public enum EntityType
  {
    User,
    Organization
  }

  internal enum OrganizationReapprovalAction
  {
    None,
    Reapproval,
    ReapprovalWithNotification
  }
  public enum SettingType
  {
    Boolean,
    Number,
    String
  }

  public enum Setting
  {
    User_Notification_Opportunity_Published,
    User_Notification_Opportunity_Completion,
    Organization_Admin_Notification_Opportunity_Expiration,
    Organization_Admin_Notification_Organization_Approval,
    Organization_Admin_Notification_Opportunity_Completion,
    Organization_Admin_Notification_ActionLink_Verify_Activated,
    Admin_Notification_Opportunity_Posted,
    Admin_Notification_Organization_Approval,
    User_Share_Contact_Info_With_Partners,
    Organization_Share_Address_Details_With_Partners,
    Organization_Share_Contact_Info_With_Partners
  }
}
