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

  // TODO: Confirm if optional can be dropped
  // TODO: Implement Notification Domain: Models and Service 
  // TODO: Setup Sendgrig, WhatsApp and SMS Templates. Map to configurations
  // TODO: ReferralProgram Seding:
  /*
      migrationBuilder.InsertData(
        table: "SettingsDefinition",
        columns: ["Id", "EntityType", "Key", "Title", "Description", "Group", "SubGroup", "Order", "Roles", "DefaultValue", "Type", "Enabled", "Visible"],
        values: new object?[,]
        {
          // Notifications: Referrals (Admin)
          { "C7E10477-87E2-4D0F-8128-7F7277ACF731", "User", "Admin_Notification_ReferralProgram_Expiration", "Referral program expiring/expired", "Notify when a referral program is nearing its end date and when it expires", "Notifications", "Referrals", 21, $"[\"{Constants.Role_Admin}\"]", "true", "Boolean", true, true },
          { "E1C9B472-463C-4B1F-BE7E-CE394AF28C38", "User", "Admin_Notification_ReferralProgram_UnCompletable", "Referral program became Un-Completable", "Notify when a referral program becomes un-completable due to missing or invalid opportunities", "Notifications", "Referrals", 22, $"[\"{Constants.Role_Admin}\"]", "true", "Boolean", true, true },
      
          // Notifications: Referrals (Referrer)
          { "4A7D9D94-4B94-40C0-96EE-8B147B6FA1E7", "User", "User_Referrer_Notification_ReferralLink_Completed_Awarded", "Referral completed", "Notify the referrer when someone they invited completes the program and they earn a reward", "Notifications", "Referrals", 24, $"[\"{Constants.Role_User}\"]", "true", "Boolean", true, true },
          { "78A34A2C-7A34-4C5C-8BBF-248E24D9F6E2", "User", "User_Referrer_Notification_Referral_AccessChange", "Referral access changed", "Notify the referrer when referral access is blocked or restored", "Notifications", "Referrals", 25, $"[\"{Constants.Role_User}\"]", "true", "Boolean", true, true },
      
          // Notifications: Referrals (Referee)
          { "CD46C821-7169-4EF6-AFD2-147A21E45A17", "User", "User_Referee_Notification_ReferralUsage_Welcome", "Welcome to the referral program", "Notify the referee after claiming a referral link with instructions and next steps", "Notifications", "Referrals", 27, $"[\"{Constants.Role_User}\"]", "true", "Boolean", true, true },
          { "AC2310A8-93A4-4C2E-A97F-9FE81B70D64B", "User", "User_Referee_Notification_ReferralUsage_Completed", "Referral program completed", "Notify the referee when they complete the referral program, including any reward earned", "Notifications", "Referrals", 28, $"[\"{Constants.Role_User}\"]", "true", "Boolean", true, true },
        },
        schema: "Entity");
  */
}
