export const PAGE_SIZE = 10;
export const PAGE_SIZE_MAXIMUM = 1000;
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

// colors for green, organge, purple, blue, yellow, red, pink, teal, indigo, cyan
export const CHART_COLORS = [
  "#387F6A",
  "#F9AB3E",
  "#240b36",
  "#4CADE9",
  "#F9AB3E",
  "#F87171",
  "#F472B6",
  "#60A5FA",
  "#818CF8",
  "#6EE7B7",
];
