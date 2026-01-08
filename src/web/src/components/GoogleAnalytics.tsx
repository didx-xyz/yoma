declare global {
  interface Window {
    GA_INITIALIZED: boolean;
  }
}

import { useEffect, useMemo } from "react";
import { useAtomValue } from "jotai";
import initializeGA, { setGaSoftEnabled } from "~/lib/google-analytics";
import { SETTING_USER_RUM_CONSENT } from "~/lib/constants";
import { rumConsentAtom, userProfileAtom } from "~/lib/store";

export const GoogleAnalytics: React.FC = () => {
  const userProfile = useAtomValue(userProfileAtom);
  const localRumConsent = useAtomValue(rumConsentAtom);

  const dbRumConsent = useMemo((): boolean | null => {
    const items = userProfile?.settings?.items;
    if (!items) return null;

    const item = items.find((x) => x.key === SETTING_USER_RUM_CONSENT);
    if (item?.value === true) return true;
    if (item?.value === false) return false;
    return null;
  }, [userProfile]);

  const effectiveConsent = userProfile ? dbRumConsent : localRumConsent;

  useEffect(() => {
    const enabled = effectiveConsent === true;
    setGaSoftEnabled(enabled);
    if (!enabled) return;

    if (!window.GA_INITIALIZED) {
      void initializeGA();
      window.GA_INITIALIZED = true;
    }
  }, [effectiveConsent]);

  return null; // Replace 'void' with 'null' or add your desired JSX here
};
