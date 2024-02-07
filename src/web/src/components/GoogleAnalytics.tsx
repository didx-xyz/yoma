declare global {
  interface Window {
    GA_INITIALIZED: boolean;
  }
}

import { useEffect } from "react";
import initializeGA from "~/lib/google-analytics";

export const GoogleAnalytics: React.FC = () => {
  useEffect(() => {
    if (!window.GA_INITIALIZED) {
      initializeGA();
      window.GA_INITIALIZED = true;
    }
  }, []);

  return null; // Replace 'void' with 'null' or add your desired JSX here
};
