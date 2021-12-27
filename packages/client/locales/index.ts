import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import de from "./de";

export default function initI18n(language: string) {
  if (!i18next.isInitialized) {
    i18next
      .use(initReactI18next) // passes i18n down to react-i18next
      .init({
        resources: {
          en,
          de,
        },
        lng: language,
        fallbackLng: "en",
        ns: [...Object.keys(de)],
        interpolation: {
          escapeValue: false,
        },
        debug: true,
      });
  }

  return i18next
}