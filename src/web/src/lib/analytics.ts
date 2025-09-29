/**
 * Centralized Analytics Tracking System
 * Consolidates Google Analytics and DataDog RUM tracking into a single interface
 * to reduce code complexity and improve maintainability.
 */

import { trackGAEvent } from "~/lib/google-analytics";
import {
  trackUserAction,
  trackError as ddTrackError,
  setDatadogUser,
  addRumGlobalContext,
} from "~/lib/datadog";
import type { User } from "~/server/auth";

/**
 * Centralized analytics tracking that sends events to both GA and DataDog
 */
class Analytics {
  /**
   * Set user information for all tracking systems
   */
  setUser(user: User | null) {
    // DataDog user tracking
    setDatadogUser(user);

    // Google Analytics user properties could be set here if needed
    if (user) {
      addRumGlobalContext("user.id", user.id);

      // Note: user.email and user.userName are now set properly via setDatadogUser()
      // which uses datadogRum.setUser() with custom fields, so no need to add them
      // as global context properties
    }
  }

  /**
   * Track opportunity-related events
   */
  opportunity = {
    viewed: (opportunityId: string, title: string) => {
      // DataDog tracking
      trackUserAction("opportunity_viewed", {
        opportunityId,
        opportunityTitle: title,
      });

      // GA tracking
      trackGAEvent("Opportunity", "View", title);
    },

    applied: (opportunityId: string, title: string) => {
      trackUserAction("opportunity_applied", {
        opportunityId,
        opportunityTitle: title,
      });

      trackGAEvent("Opportunity", "Apply", title);
    },

    completed: (opportunityId: string, title: string) => {
      trackUserAction("opportunity_completed", {
        opportunityId,
        opportunityTitle: title,
      });

      trackGAEvent("Opportunity", "Complete", title);
    },

    cancelled: (opportunityId: string, title: string) => {
      trackUserAction("opportunity_cancelled", {
        opportunityId,
        opportunityTitle: title,
      });

      trackGAEvent("Opportunity", "Cancel", title);
    },

    saved: (opportunityId: string, title: string) => {
      trackUserAction("opportunity_saved", {
        opportunityId,
        opportunityTitle: title,
      });

      trackGAEvent("Opportunity", "Save", title);
    },

    unsaved: (opportunityId: string, title: string) => {
      trackUserAction("opportunity_unsaved", {
        opportunityId,
        opportunityTitle: title,
      });

      trackGAEvent("Opportunity", "Unsave", title);
    },

    externalLinkClicked: (
      opportunityId: string,
      title: string,
      url: string,
    ) => {
      trackUserAction("opportunity_external_link_clicked", {
        opportunityId,
        opportunityTitle: title,
        externalUrl: url,
      });

      trackGAEvent("Opportunity", "External Link", url);
    },

    shared: (opportunityId: string, title: string, platform?: string) => {
      trackUserAction("opportunity_shared", {
        opportunityId,
        opportunityTitle: title,
        platform: platform || "unknown",
      });

      trackGAEvent(
        "Opportunity",
        "Share",
        `${title} - ${platform || "unknown"}`,
      );
    },
  };

  /**
   * Track user authentication events
   */
  auth = {
    loginAttempt: (provider: string) => {
      trackUserAction("login_attempt", { provider });
      trackGAEvent("Auth", "Login Attempt", provider);
    },

    logout: () => {
      trackUserAction("logout");
      trackGAEvent("Auth", "Logout", "");
    },
  };

  /**
   * Track user profile actions
   */
  profile = {
    updated: (fieldsUpdated: string[]) => {
      trackUserAction("profile_updated", { fieldsUpdated });
      trackGAEvent("Profile", "Update", fieldsUpdated.join(", "));
    },
  };

  /**
   * Track marketplace events
   */
  marketplace = {
    itemViewed: (
      itemId: string,
      itemName: string,
      category?: string,
      price?: number,
    ) => {
      trackUserAction("marketplace_item_viewed", {
        itemId,
        itemName,
        category,
        price,
      });

      trackGAEvent("Marketplace", "Item View", itemName);
    },

    itemPurchased: (
      itemId: string,
      itemName: string,
      category?: string,
      price?: number,
      quantity?: number,
    ) => {
      trackUserAction("marketplace_item_purchased", {
        itemId,
        itemName,
        category,
        price,
        quantity: quantity || 1,
        totalValue: price ? price * (quantity || 1) : undefined,
      });

      trackGAEvent(
        "Marketplace",
        "Purchase",
        `${itemName} - ${price || "N/A"}`,
      );
    },
  };

  /**
   * Track errors (consolidated error tracking)
   */
  trackError(error: Error | string, context?: Record<string, any>) {
    const errorObj = typeof error === "string" ? new Error(error) : error;

    // DataDog error tracking
    ddTrackError(errorObj, context);

    // GA error tracking
    trackGAEvent("Error", context?.errorType || "Generic", errorObj.message);
  }

  /**
   * Track custom events
   */
  trackEvent(eventName: string, context?: Record<string, any>) {
    trackUserAction(eventName, context);

    // GA custom event
    trackGAEvent("Custom", eventName, context ? JSON.stringify(context) : "");
  }

  /**
   * Set global context for all tracking
   */
  setContext(key: string, value: any) {
    addRumGlobalContext(key, value);
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Export individual tracking methods for convenience
export const { opportunity, auth, profile, marketplace } = analytics;

export default analytics;
