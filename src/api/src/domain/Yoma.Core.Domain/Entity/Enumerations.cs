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
    // User notifications
    User_Notification_Opportunity_Published,
    User_Notification_Opportunity_Completion,

    // Organization admin notifications
    Organization_Admin_Notification_Opportunity_Expiration,
    Organization_Admin_Notification_Organization_Approval,
    Organization_Admin_Notification_Opportunity_Completion,
    Organization_Admin_Notification_ActionLink_Verify_Activated,

    // Admin notifications
    Admin_Notification_Opportunity_Posted,
    Admin_Notification_Organization_Approval,

    // User privacy settings
    User_Share_Contact_Info_With_Partners,

    // Organization privacy settings
    Organization_Share_Address_Details_With_Partners,
    Organization_Share_Contact_Info_With_Partners,

    // Referral notifications (admin)
    Admin_Notification_ReferralProgram_Expiration,
    Admin_Notification_ReferralProgram_UnCompletable,

    // Referral notifications (referrer)
    User_Referrer_Notification_ReferralLink_Completed_Awarded,
    User_Referrer_Notification_Referral_AccessChange,

    // Referral notifications (referee)
    User_Referee_Notification_ReferralUsage_Welcome,
    User_Referee_Notification_ReferralUsage_Completed,
  }
}
