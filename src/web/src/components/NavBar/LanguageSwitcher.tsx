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
import { useRouter } from "next/router";

// Use Next.js 15's cookie for locale
const COOKIE_NAME = "NEXT_LOCALE";

// Hard-coded language configuration
const hardcodedConfig = {
  languages: [
    { name: "en", title: "English" },
    { name: "es", title: "Español" },
    { name: "fr", title: "Français" },
    { name: "pt", title: "Português" },
    { name: "sw", title: "Swahili" },
  ],
  defaultLanguage: "en",
};

interface LanguageDescriptor {
  name: string;
  title: string;
}

const LanguageSwitcher: React.FC<{
  className?: string;
  classNameIcon?: string;
  classNameSelect?: string;
  tabIndex?: number;
}> = ({ className, classNameIcon, classNameSelect, tabIndex }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>();
  const [languageConfig, setLanguageConfig] =
    useState<typeof hardcodedConfig>();
  const router = useRouter();
  const setCurrentLanguageAtom = useSetAtom(currentLanguageAtom);

  useEffect(() => {
    // 1. Read the cookie NEXT_LOCALE
    const cookies = parseCookies();
    let languageValue = cookies[COOKIE_NAME];

    // 2. If cookie is not present, use the hard-coded default language.
    if (!languageValue) {
      languageValue = hardcodedConfig.defaultLanguage;
    }
    setCurrentLanguage(languageValue);
    setCurrentLanguageAtom(languageValue);

    // 3. Set the language config.
    setLanguageConfig(hardcodedConfig);
  }, [setCurrentLanguageAtom]);

  // Don't display anything if current language information is unavailable.
  if (!currentLanguage || !languageConfig) {
    return null;
  }

  // Function to switch the current language
  const switchLanguage = (lang: string) => {
    // Set the NEXT_LOCALE cookie with the new language value.
    setCookie(null, COOKIE_NAME, lang, {
      path: "/",
    });

    // 📊 GOOGLE ANALYTICS: track event
    trackGAEvent(GA_CATEGORY_USER, GA_ACTION_USER_LANGUAGE_CHANGE, lang);

    // Instead of reloading the page, use the router to change the locale
    // This will work with your middleware.ts
    const { pathname, asPath, query } = router;
    router.push({ pathname, query }, asPath, { locale: lang });
  };

  return (
    <>
      <div
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

      <style jsx>{`
        @media (max-width: 768px) {
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
