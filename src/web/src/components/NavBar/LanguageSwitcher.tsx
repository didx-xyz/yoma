import { useEffect, useState } from "react";
import { parseCookies, setCookie } from "nookies";
import { IoMdGlobe } from "react-icons/io";
import { useSetAtom } from "jotai";
import { currentLanguageAtom } from "~/lib/store";
import analytics from "~/lib/analytics";

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

const LanguageSwitcher: React.FC<{
  className?: string;
  classNameIcon?: string;
  classNameSelect?: string;
  tabIndex?: number;
}> = ({ className, classNameIcon, classNameSelect, tabIndex }) => {
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

    // 📊 ANALYTICS: track language change
    analytics.trackEvent("language_changed", { language: lang });

    window.location.reload();
  };

  return (
    <>
      <div
        //id="languageSwitcher"
        className={`notranslate flex flex-row gap-2 rounded-md px-1 py-3 ${className}`}
      >
        <IoMdGlobe className={`h-6 w-6 ${classNameIcon}`} />
        <select
          value={currentLanguage}
          onChange={(e) => switchLanguage(e.target.value)}
          className={`cursor-pointer rounded-md bg-transparent font-semibold focus:outline-none ${classNameSelect}`}
          title="Language"
          tabIndex={tabIndex}
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
    </>
  );
};

export { LanguageSwitcher, COOKIE_NAME };
