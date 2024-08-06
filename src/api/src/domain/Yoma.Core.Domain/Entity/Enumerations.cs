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
    ReapprovalWithEmail
  }
  public enum SettingType
  {
    Boolean,
    Number,
    String
  }

  public enum Setting
  {
    User_Email_Opportunity_Published,
    User_Email_Opportunity_Completion,
    Organization_Admin_Email_Opportunity_Expiration,
    Organization_Admin_Email_Organization_Approval,
    Organization_Admin_Email_Opportunity_Completion,
    Organization_Admin_Email_ActionLink_Verify_Approval,
    Admin_Email_Opportunity_Posted,
    Admin_Email_Organization_Approval,
    Admin_Email_ActionLink_Verify_Approval,
    User_Share_Email_With_Partners,
    Organization_Share_Address_Details_With_Partners,
    Organization_Share_Contact_Info_With_Partners
  }
}
