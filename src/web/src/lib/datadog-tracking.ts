/**
 * DataDog RUM tracking helpers for common user actions and errors
 * This file provides convenient wrapper functions for tracking specific user actions
 * and errors throughout the Yoma application.
 */

import {
  trackUserAction,
  trackError,
  trackTiming,
  addRumGlobalContext,
} from "./datadog";

/**
 * Track opportunity-related actions
 */
export const trackOpportunityAction = {
  viewed: (opportunityId: string, title: string) => {
    trackUserAction("opportunity_viewed", {
      opportunityId,
      opportunityTitle: title,
    });
  },

  applied: (opportunityId: string, title: string) => {
    trackUserAction("opportunity_applied", {
      opportunityId,
      opportunityTitle: title,
    });
  },

  completed: (opportunityId: string, title: string) => {
    trackUserAction("opportunity_completed", {
      opportunityId,
      opportunityTitle: title,
    });
  },

  searched: (searchTerm: string, resultsCount: number) => {
    trackUserAction("opportunity_searched", {
      searchTerm,
      resultsCount,
    });
  },

  filtered: (filters: Record<string, any>) => {
    trackUserAction("opportunity_filtered", {
      appliedFilters: filters,
    });
  },

  saved: (opportunityId: string, title: string) => {
    trackUserAction("opportunity_saved", {
      opportunityId,
      opportunityTitle: title,
    });
  },

  unsaved: (opportunityId: string, title: string) => {
    trackUserAction("opportunity_unsaved", {
      opportunityId,
      opportunityTitle: title,
    });
  },

  externalLinkClicked: (opportunityId: string, title: string, url: string) => {
    trackUserAction("opportunity_external_link_clicked", {
      opportunityId,
      opportunityTitle: title,
      externalUrl: url,
    });
  },

  shared: (opportunityId: string, title: string, platform?: string) => {
    trackUserAction("opportunity_shared", {
      opportunityId,
      opportunityTitle: title,
      platform: platform || "unknown",
    });
  },

  cancelled: (opportunityId: string, title: string) => {
    trackUserAction("opportunity_cancelled", {
      opportunityId,
      opportunityTitle: title,
    });
  },
};

/**
 * Track organization-related actions
 */
export const trackOrganizationAction = {
  viewed: (organizationId: string, name: string) => {
    trackUserAction("organization_viewed", {
      organizationId,
      organizationName: name,
    });
  },

  followed: (organizationId: string, name: string) => {
    trackUserAction("organization_followed", {
      organizationId,
      organizationName: name,
    });
  },

  unfollowed: (organizationId: string, name: string) => {
    trackUserAction("organization_unfollowed", {
      organizationId,
      organizationName: name,
    });
  },
};

/**
 * Track user profile actions
 */
export const trackUserProfileAction = {
  updated: (fieldsUpdated: string[]) => {
    trackUserAction("profile_updated", {
      fieldsUpdated,
    });
  },

  photoUploaded: () => {
    trackUserAction("profile_photo_uploaded");
  },

  skillsUpdated: (skillsAdded: number, skillsRemoved: number) => {
    trackUserAction("profile_skills_updated", {
      skillsAdded,
      skillsRemoved,
    });
  },

  passwordChanged: () => {
    trackUserAction("password_changed");
  },
};

/**
 * Track navigation actions
 */
export const trackNavigationAction = {
  pageVisited: (pageName: string, path: string) => {
    trackUserAction("page_visited", {
      pageName,
      path,
    });
  },

  externalLinkClicked: (url: string, context: string) => {
    trackUserAction("external_link_clicked", {
      url,
      context,
    });
  },

  menuItemClicked: (menuItem: string) => {
    trackUserAction("menu_item_clicked", {
      menuItem,
    });
  },
};

/**
 * Track form interactions
 */
export const trackFormAction = {
  submitted: (formName: string, success: boolean, errors?: string[]) => {
    trackUserAction("form_submitted", {
      formName,
      success,
      errors: errors || [],
    });
  },

  validated: (formName: string, fieldName: string, isValid: boolean) => {
    trackUserAction("form_field_validated", {
      formName,
      fieldName,
      isValid,
    });
  },

  abandoned: (
    formName: string,
    fieldsCompleted: number,
    totalFields: number,
  ) => {
    trackUserAction("form_abandoned", {
      formName,
      fieldsCompleted,
      totalFields,
      completionPercentage: (fieldsCompleted / totalFields) * 100,
    });
  },
};

/**
 * Track API and performance related metrics
 */
export const trackApiAction = {
  called: (endpoint: string, method: string, duration?: number) => {
    trackUserAction("api_called", {
      endpoint,
      method,
    });

    if (duration) {
      trackTiming(
        `api_${endpoint.replace(/[^a-zA-Z0-9]/g, "_")}_duration`,
        duration,
      );
    }
  },

  error: (
    endpoint: string,
    method: string,
    statusCode: number,
    errorMessage: string,
  ) => {
    trackError(new Error(`API Error: ${errorMessage}`), {
      errorType: "api_error",
      endpoint,
      method,
      statusCode,
    });
  },

  timeout: (endpoint: string, method: string, timeoutDuration: number) => {
    trackError(new Error("API Timeout"), {
      errorType: "api_timeout",
      endpoint,
      method,
      timeoutDuration,
    });
  },
};

/**
 * Track authentication related actions
 */
export const trackAuthAction = {
  loginAttempt: (provider: string) => {
    trackUserAction("login_attempt", {
      provider,
    });
  },

  loginSuccess: (provider: string, userId: string) => {
    trackUserAction("login_success", {
      provider,
      userId,
    });
  },

  loginFailure: (provider: string, error: string) => {
    trackError(new Error(`Login failed: ${error}`), {
      errorType: "authentication_error",
      provider,
    });
  },

  logoutInitiated: () => {
    trackUserAction("logout_initiated");
  },

  sessionExpired: () => {
    trackError(new Error("Session expired"), {
      errorType: "session_expired",
    });
  },
};

/**
 * Track marketplace/reward related actions
 */
export const trackMarketplaceAction = {
  itemViewed: (itemId: string, itemName: string, category: string) => {
    trackUserAction("marketplace_item_viewed", {
      itemId,
      itemName,
      category,
    });
  },

  itemPurchased: (
    itemId: string,
    itemName: string,
    price: number,
    currency: string,
  ) => {
    trackUserAction("marketplace_item_purchased", {
      itemId,
      itemName,
      price,
      currency,
    });
  },

  rewardEarned: (amount: number, currency: string, source: string) => {
    trackUserAction("reward_earned", {
      amount,
      currency,
      source,
    });
  },

  rewardRedeemed: (amount: number, currency: string, purpose: string) => {
    trackUserAction("reward_redeemed", {
      amount,
      currency,
      purpose,
    });
  },
};

/**
 * Set context information that will be attached to all RUM events
 */
export const setTrackingContext = {
  userRole: (role: string) => {
    addRumGlobalContext("user.role", role);
  },

  currentOrganization: (orgId: string, orgName: string) => {
    addRumGlobalContext("organization.id", orgId);
    addRumGlobalContext("organization.name", orgName);
  },

  userCountry: (countryId: string, countryName: string) => {
    addRumGlobalContext("user.country.id", countryId);
    addRumGlobalContext("user.country.name", countryName);
  },

  featureFlag: (flagName: string, flagValue: boolean) => {
    addRumGlobalContext(`feature.${flagName}`, flagValue);
  },

  experiment: (experimentName: string, variant: string) => {
    addRumGlobalContext(`experiment.${experimentName}`, variant);
  },
};

/**
 * Track common error scenarios
 */
export const trackCommonError = {
  pageNotFound: (path: string) => {
    trackError(new Error("Page not found"), {
      errorType: "page_not_found",
      path,
    });
  },

  unauthorizedAccess: (path: string, requiredRole?: string) => {
    trackError(new Error("Unauthorized access"), {
      errorType: "unauthorized_access",
      path,
      requiredRole,
    });
  },

  networkError: (url: string, networkStatus: string) => {
    trackError(new Error("Network error"), {
      errorType: "network_error",
      url,
      networkStatus,
    });
  },

  validationError: (
    formName: string,
    fieldName: string,
    validationRule: string,
  ) => {
    trackError(new Error("Validation error"), {
      errorType: "validation_error",
      formName,
      fieldName,
      validationRule,
    });
  },

  fileUploadError: (fileName: string, fileSize: number, error: string) => {
    trackError(new Error(`File upload error: ${error}`), {
      errorType: "file_upload_error",
      fileName,
      fileSize,
    });
  },
};
