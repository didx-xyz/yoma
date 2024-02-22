export const PAGE_SIZE = 10;
export const DATE_FORMAT_HUMAN = "DD MMM YYYY";
export const DATE_FORMAT_HUMAN_LONG = "dddd Do MMMM YYYY";
export const DATETIME_FORMAT_HUMAN = "MMM D YYYY, h:mm a";
export const DATE_FORMAT_SYSTEM = "YYYY-MM-DD";
export const DATETIME_FORMAT_SYSTEM = "YYYY-MM-DD HH:mm:ss";
export const MAX_IMAGE_SIZE = 5000000;
export const MAX_IMAGE_SIZE_LABEL = "5MB";
export const MAX_DOC_SIZE = 10000000;
export const MAX_DOC_SIZE_LABEL = "10MB";
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
export const ACCEPTED_IMAGE_TYPES_LABEL = ".jpg, .jpeg, .png and .webp";
export const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const ACCEPTED_DOC_TYPES_LABEL = ".pdf, .doc and .docx";
export const ACCEPTED_AUDIO_TYPES = ["audio/mpeg", "audio/wav"];
export const ACCEPTED_AUDIO_TYPES_LABEL = ".mp3, .wav";
export const REGEX_URL_VALIDATION =
  /^(https?:\/\/)?((www\.)?)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;

export const ROLE_ADMIN = "Admin";
export const ROLE_ORG_ADMIN = "OrganisationAdmin";
export const ROLE_USER = "User";

export const OPPORTUNITY_TYPES_LEARNING = [
  "25F5A835-C3F7-43CA-9840-D372A1D26694",
];
export const OPPORTUNITY_TYPES_TASK = ["F12A9D90-A8F6-4914-8CA5-6ACF209F7312"];

export const THEME_BLUE = "blue";
export const THEME_GREEN = "green";
export const THEME_PURPLE = "purple";

export const MAXINT32 = 2147483647;

// google analytics categories, actions and labels
export const GA_CATEGORY_USER = "User";
export const GA_CATEGORY_ORGANISATION = "Organisation";
export const GA_CATEGORY_OPPORTUNITY = "Opportunity";
export const GA_CATEGORY_SCHEMA = "Schema";

export const GA_ACTION_USER_YOIDONBOARDINGCONFIRMED =
  "YoID Onboarding Confirmed";
export const GA_ACTION_USER_LANGUAGE_CHANGE = "Changed Language";

export const GA_ACTION_ORGANISATION_REGISTER =
  "Submitted Organisation Registeration Form";
export const GA_ACTION_ORGANISATION_UPATE = "Updated Organisation Details";
export const GA_ACTION_ORGANISATION_VERIFY = "Verified Organisation";

export const GA_ACTION_OPPORTUNITY_CREATE = "Created Opportunity";
export const GA_ACTION_OPPORTUNITY_UPDATE = "Updated Opportunity";
export const GA_ACTION_OPPORTUNITY_DELETE = "Deleted Opportunity";
export const GA_ACTION_OPPORTUNITY_FOLLOWEXTERNAL =
  "External Opportunity Link Followed";
export const GA_ACTION_OPPORTUNITY_COMPLETED = "Opportunity Completed";
export const GA_ACTION_OPPORTUNITY_CANCELED = "Opportunity Cancled";

export const GA_ACTION_MARKETPLACE_ITEM_BUY = "Marketplace Item Purchased";

export const GA_ACTION_ADMIN_SCHEMA_CREATE = "Created Schema";
export const GA_ACTION_ADMIN_SCHEMA_UPDATE = "Created Schema";

export const GA_ACTION_USER_LOGIN_BEFORE = "User Logging In";
export const GA_ACTION_USER_LOGIN_AFTER = "User Logged In";
export const GA_ACTION_USER_LOGOUT = "User Logged Out";
export const GA_ACTION_USER_PROFILE_UPDATE = "User Updated Profile";

// export const GA_CATEGORY_PROVIDER = "Provider";
// export const GA_CATEGORY_SEARCH = "Search";
// export const GA_CATEGORY_OTHER = "Other";
// export const GA_ACTION_CREATE = "Create";
// export const GA_ACTION_UPDATE = "Update";
// export const GA_ACTION_DELETE = "Delete";
// export const GA_ACTION_VIEW = "View";
// export const GA_ACTION_SEARCH = "Search";
// export const GA_ACTION_FILTER = "Filter";
// export const GA_ACTION_SORT = "Sort";
// export const GA_ACTION_CLICK = "Click";
// export const GA_ACTION_DOWNLOAD = "Download";
// export const GA_ACTION_SHARE = "Share";
// export const GA_ACTION_LOGIN = "Login";
// export const GA_ACTION_LOGOUT = "Logout";
// export const GA_ACTION_SIGNUP = "Signup";
// export const GA_ACTION_FORGOT_PASSWORD = "ForgotPassword";
// export const GA_ACTION_RESET_PASSWORD = "ResetPassword";
// export const GA_ACTION_VERIFY_EMAIL = "VerifyEmail";
// export const GA_ACTION_UPDATE_PROFILE = "UpdateProfile";
// export const GA_ACTION_UPDATE_PASSWORD = "UpdatePassword";
// export const GA_ACTION_UPDATE_EMAIL = "UpdateEmail";
// export const GA_ACTION_UPDATE_NOTIFICATIONS = "UpdateNotifications";
// export const GA_ACTION_UPDATE_PRIVACY = "UpdatePrivacy";
// export const GA_ACTION_UPDATE_TERMS = "UpdateTerms";
// export const GA_ACTION_UPDATE_ROLES = "UpdateRoles";
// export const GA_ACTION_UPDATE_STATUS = "UpdateStatus";
// export const GA_ACTION_UPDATE_AVAILABILITY = "UpdateAvailability";
// export const GA_ACTION_UPDATE_LOCATION = "UpdateLocation";
// export const GA_ACTION_UPDATE_CONTACT = "UpdateContact";
// export const GA_ACTION_UPDATE_SOCIAL = "UpdateSocial";
// export const GA_ACTION_UPDATE_MEDIA = "UpdateMedia";
// export const GA_ACTION_UPDATE_SETTINGS = "UpdateSettings";
// export const GA_ACTION_UPDATE_PREFERENCES = "UpdatePreferences";
// export const GA_ACTION_UPDATE_CATEGORIES = "UpdateCategories";
// export const GA_ACTION_UPDATE_TYPES = "UpdateTypes";
// export const GA_ACTION_UPDATE_SKILLS = "UpdateSkills";
// export const GA_ACTION_UPDATE_LANGUAGES = "UpdateLanguages";
// export const GA_ACTION_UPDATE_EDUCATION = "UpdateEducation";
// export const GA_ACTION_UPDATE_EXPERIENCE = "UpdateExperience";
// export const GA_ACTION_UPDATE_CERTIFICATIONS = "UpdateCertifications";
// export const GA_ACTION_UPDATE_AWARDS = "UpdateAwards";
// export const GA_ACTION_UPDATE_PUBLICATIONS = "UpdatePublications";
// export const GA_ACTION_UPDATE_PROJECTS = "UpdateProjects";
// export const GA_ACTION_UPDATE_REFERENCES = "UpdateReferences";
// export const GA_ACTION_UPDATE_RECOMMENDATIONS = "UpdateRecommendations";
// export const GA_ACTION_UPDATE_REVIEWS = "UpdateReviews";
// export const GA_ACTION_UPDATE_REPORTS = "UpdateReports";
// export const GA_ACTION_UPDATE_REQUESTS = "UpdateRequests";
// export const GA_ACTION_UPDATE_RESPONSES = "UpdateResponses";
// export const GA_ACTION_UPDATE_COMMENTS = "UpdateComments";
// export const GA_ACTION_UPDATE_MESSAGES = "UpdateMessages";
// export const GA_ACTION_UPDATE_NOTIFICATIONS = "UpdateNotifications";
// export const GA_ACTION_UPDATE_INVITES = "UpdateInvites";
// export const GA_ACTION_UPDATE_MEMBERS = "UpdateMembers";
// export const GA_ACTION_UPDATE_USERS = "UpdateUsers";

//export const GA_LABEL_CREATE_ORGANISATION = "CreateOrganisation";

// export const GA_LABEL_CREATE_USER = "CreateUser";
// export const GA_LABEL_UPDATE_USER = "UpdateUser";
// export const GA_LABEL_DELETE_USER = "DeleteUser";
// export const GA_LABEL_VIEW_USER = "ViewUser";
// export const GA_LABEL_SEARCH_USER = "SearchUser";
// export const GA_LABEL_FILTER_USER = "FilterUser";
// export const GA_LABEL_SORT_USER = "SortUser";
// export const GA_LABEL_CLICK_USER = "ClickUser";
// export const GA_LABEL_DOWNLOAD_USER = "DownloadUser";
// export const GA_LABEL_SHARE_USER = "ShareUser";
// export const GA_LABEL_LOGIN_USER = "LoginUser";
// export const GA_LABEL_LOGOUT_USER = "LogoutUser";
// export const GA_LABEL_SIGNUP_USER = "SignupUser";
