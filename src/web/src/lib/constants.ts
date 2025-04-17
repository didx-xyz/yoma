export const PAGE_SIZE = 12;
export const PAGE_SIZE_MEDIUM = 100;
export const PAGE_SIZE_MAXIMUM = 1000;
export const PAGE_SIZE_MINIMUM = 8;
export const MAX_INT32 = 2147483647;
export const DATE_FORMAT_HUMAN = "DD MMM YYYY";
export const DATE_FORMAT_HUMAN_LONG = "dddd Do MMMM YYYY";
export const DATETIME_FORMAT_HUMAN = "MMM D YYYY, h:mm a";
export const DATE_FORMAT_SYSTEM = "YYYY-MM-DD";
export const DATETIME_FORMAT_SYSTEM = "YYYY-MM-DD HH:mm:ss";
export const MAX_FILE_SIZE = 10000000;
export const MAX_FILE_SIZE_LABEL = "10MB";
export const MAX_FILE_VIDEO_SIZE = 100000000;
export const MAX_FILE_VIDEO_SIZE_LABEL = "100MB";
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
export const ACCEPTED_IMAGE_TYPES_LABEL = [".jpg", ".jpeg", ".png", ".webp"];
export const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
export const ACCEPTED_DOC_TYPES_LABEL = [".pdf", ".doc", ".docx", ".pptx"];
export const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/amr",
  "audio/ogg",
  "audio/3gpp",
];
export const ACCEPTED_AUDIO_TYPES_LABEL = [
  ".mp3",
  ".wav",
  ".m4a",
  ".amr",
  ".ogg",
  ".3gp",
];
export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/x-ms-wmv",
  "video/webm",
  "video/x-flv",
  "video/3gpp",
  "video/x-m4v",
];

export const ACCEPTED_VIDEO_TYPES_LABEL = [
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".wmv",
  ".webm",
  ".flv",
  ".3gp",
  ".m4v",
];
export const ACCEPTED_CSV_TYPES = ["text/csv", "application/vnd.ms-excel"];
export const ACCEPTED_CSV_TYPES_LABEL = [".csv"];

export const REGEX_URL_VALIDATION =
  /^(https?:\/\/)?((www\.)?)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;

export const ROLE_ADMIN = "Admin";
export const ROLE_ORG_ADMIN = "OrganisationAdmin";
export const ROLE_USER = "User";

export const OPPORTUNITY_TYPES_LEARNING = [
  "25F5A835-C3F7-43CA-9840-D372A1D26694",
];
export const OPPORTUNITY_TYPES_TASK = ["F12A9D90-A8F6-4914-8CA5-6ACF209F7312"];
export const OPPORTUNITY_TYPES_EVENT = ["e20dcceb-59c3-46d0-ab0a-d321d8bc4c31"];
export const OPPORTUNITY_TYPES_OTHER = ["5d67758f-3f06-47c6-8b62-420b33126665"];

export const THEME_BLUE = "blue";
export const THEME_GREEN = "green";
export const THEME_PURPLE = "purple";
export const THEME_ORANGE = "orange";

export const MAXINT32 = 2147483647;

// google analytics categories, actions and labels
export const GA_CATEGORY_USER = "User";
export const GA_CATEGORY_ORGANISATION = "Organisation";
export const GA_CATEGORY_OPPORTUNITY = "Opportunity";
export const GA_CATEGORY_SCHEMA = "Schema";
export const GA_CATEGORY_OPPORTUNITY_LINK = "Opportunity Link";
export const GA_CATEGORY_STORE_ACCESS_CONTROL_RULE =
  "Store Access Control Rule";

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
export const GA_ACTION_OPPORTUNITY_COMPLETION_VERIFY =
  "Opportunity Verification";

export const GA_ACTION_MARKETPLACE_ITEM_BUY = "Marketplace Item Purchased";

export const GA_ACTION_ADMIN_SCHEMA_CREATE = "Created Schema";
export const GA_ACTION_ADMIN_SCHEMA_UPDATE = "Created Schema";

export const GA_ACTION_USER_LOGIN_BEFORE = "User Logging In";
export const GA_ACTION_USER_LOGIN_AFTER = "User Logged In";
export const GA_ACTION_USER_LOGOUT = "User Logged Out";
export const GA_ACTION_USER_PROFILE_UPDATE = "User Updated Profile";
export const GA_ACTION_APP_SETTING_UPDATE = "User Updated App Settings";

export const GA_ACTION_OPPORTUNITY_LINK_CREATE = "Created Opportunity Link";
export const GA_ACTION_OPPORTUNITY_LINK_UPDATE_STATUS =
  "Updated Status for Opportunity Link";

export const GA_ACTION_STORE_ACCESS_CONTROL_RULE_CREATE =
  "Created Store Access Control Rule";
export const GA_ACTION_STORE_ACCESS_CONTROL_RULE_UPDATE =
  "Updated Store Access Control Rule";
export const GA_ACTION_STORE_ACCESS_CONTROL_RULE_UPDATE_STATUS =
  "Updated Status for Store Access Control Rule";

// colors for green, organge, blue, purple, red, pink, teal, indigo, cyan
export const CHART_COLORS = [
  "#387F6A",
  "#F9AB3E",
  "#4CADE9",
  "#240b36",
  "#F87171",
  "#F472B6",
  "#60A5FA",
  "#818CF8",
  "#6EE7B7",
];

export const LINE_DASH_STYLES = [
  [], // Solid
  [4, 4], // Dotted
  [8, 4, 2, 4], // Dashed
  [4, 8], // Dot-dashed
  [12, 4], // Long dashed
];

export const VIEWPORT_SIZE = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  "2XL": 1536,
};

export const COUNTRY_CODE_WW = "WW";
export const COUNTRY_ID_NIGERIA = "2ba19f1d-998f-40ee-9af6-c6ab562e3040";
export const COUNTRY_ID_SOUTH_AFRICA = "bab77522-001d-42cb-a1ee-394e16ee5613";
export const COUNTRY_ID_KENYA = "a0573190-e86f-489e-8e05-87fdba1d442f";
export const COUNTRY_ID_MOZAMIQUE = "96ff7073-fde0-4c70-a56b-b7e1256568c0";
export const COOKIE_KEYCLOAK_SESSION = "KEYCLOAK_SESSION";
export const SLOW_NETWORK_MESSAGE_TIMEOUT = 10000; // 10 seconds
export const SLOW_NETWORK_ABORT_TIMEOUT = 45000; // 45 seconds

export const DELIMETER_PASTE_MULTI = /\s|\||,|;/;

export const XS2_BREAKPOINT = 480;
export const XS_BREAKPOINT = 600;
export const SM_BREAKPOINT = 768;
export const MD_BREAKPOINT = 1024;
export const LG_BREAKPOINT = 1280;

export const SETTING_USER_SETTINGS_CONFIGURED = "User_Settings_Configured";
export const SETTING_USER_POPUP_LEAVINGYOMA = "User_PopUp_LeavingYoma";

export const PLURAL_MAPPING: Record<string, string> = {
  organizations: "Organisations",
  opportunities: "Opportunities",
  categories: "Categories",
  countries: "Countries",
};
