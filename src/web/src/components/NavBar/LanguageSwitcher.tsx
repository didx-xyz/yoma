import { useEffect, useState } from "react";
import { parseCookies, setCookie } from "nookies";
import { IoMdGlobe } from "react-icons/io";
import { useSetAtom } from "jotai";
import { currentLanguageAtom } from "~/lib/store";
import {
  GA_ACTION_USER_LANGUAGE_CHANGE,
  GA_CATEGORY_USER,
} from "~/lib/constants";
import { trackGAEvent } from "~/lib/google-analytics";

// The following cookie name is important because it's Google-predefined for the translation engine purpose
const COOKIE_NAME = "googtrans";

// We should know a predefined nickname of a language and provide its title (the name for displaying)
interface LanguageDescriptor {
  name: string;
  title: string;
}

// The following definition describes typings for JS-based declarations in public/assets/scripts/lang-config.js
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace globalThis {
    // eslint-disable-next-line
    var __GOOGLE_TRANSLATION_CONFIG__: {
      languages: LanguageDescriptor[];
      defaultLanguage: string;
    };
  }
}

const LanguageSwitcher = () => {
  const [currentLanguage, setCurrentLanguage] = useState<string>();
  const [languageConfig, setLanguageConfig] = useState<any>();

  const setCurrentLanguageAtom = useSetAtom(currentLanguageAtom);

  // When the component has initialized, we must activate the translation engine the following way.
  useEffect(() => {
    // 1. Read the cookie
    const cookies = parseCookies();
    const existingLanguageCookieValue = cookies[COOKIE_NAME];

    let languageValue;
    if (existingLanguageCookieValue) {
      // 2. If the cookie is defined, extract a language nickname from there.
      const sp = existingLanguageCookieValue.split("/");
      if (sp.length > 2) {
        languageValue = sp[2];
      }
    }
    // 3. If __GOOGLE_TRANSLATION_CONFIG__ is defined and we still not decided about languageValue, let's take a current language from the predefined defaultLanguage below.
    if (global.__GOOGLE_TRANSLATION_CONFIG__ && !languageValue) {
      languageValue = global.__GOOGLE_TRANSLATION_CONFIG__.defaultLanguage;
    }
    if (languageValue) {
      // 4. Set the current language if we have a related decision.
      setCurrentLanguage(languageValue);
      // 4.1. Set the current language atom (so other components can get the current langauge)
      setCurrentLanguageAtom(languageValue);
    }
    // 5. Set the language config.
    if (global.__GOOGLE_TRANSLATION_CONFIG__) {
      setLanguageConfig(global.__GOOGLE_TRANSLATION_CONFIG__);
    }
  }, [setCurrentLanguageAtom]);

  // Don't display anything if current language information is unavailable.
  if (!currentLanguage || !languageConfig) {
    return null;
  }

  // The following function switches the current language
  const switchLanguage = (lang: string) => {
    // We just need to set the related cookie and reload the page
    // "/auto/" prefix is Google's definition as far as a cookie name

    // Get the current hostname from the window location
    const cookieDomain = window.location.hostname;
    // Split the hostname into its constituent parts
    const domainParts = cookieDomain.split(".");
    // Get the last two parts of the domain (e.g., 'example.com' from 'www.example.com')
    // This works for domains of variable length (e.g., 'a.b.c.d', 'a.b.c', 'a.b', 'a')
    // If the domain has only one part (e.g., 'localhost'), it takes that single part
    const cookieParent = domainParts
      .slice(Math.max(domainParts.length - 2, 0))
      .join(".");

    setCookie(null, COOKIE_NAME, "/auto/" + lang);
    setCookie(null, COOKIE_NAME, "/auto/" + lang, {
      domain: `.${cookieParent}`,
    });

    // 📊 GOOGLE ANALYTICS: track event
    trackGAEvent(GA_CATEGORY_USER, GA_ACTION_USER_LANGUAGE_CHANGE, lang);

    window.location.reload();
  };

  return (
    <>
      <div className="notranslate -mr-4 flex flex-row text-center">
        <IoMdGlobe className="h-6 w-6 text-white" />
        <select
          value={currentLanguage}
          onChange={(e) => switchLanguage(e.target.value)}
          className="mobile-select mr-4 cursor-pointer bg-transparent pl-1 text-white hover:underline focus:outline-none md:mr-8"
        >
          {languageConfig.languages.map((ld: LanguageDescriptor) => (
            <option
              key={`l_s_${ld.name}`}
              value={ld.name}
              className="text-gray-dark"
            >
              {ld.title}
            </option>
          ))}
        </select>
      </div>

      <style jsx>{`
        @media (max-width: 767px) {
          .mobile-select {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ffffff'%3E%3Cpath d='M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 0.5rem center;
            background-size: 1.7rem;
            padding-right: 2rem;
            text-indent: -9999px;
            width: 1.5rem;
          }
        }
      `}</style>
    </>
  );
};

export { LanguageSwitcher, COOKIE_NAME };
