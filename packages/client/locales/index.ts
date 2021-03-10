import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import de from "./de";

i18next
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en,
      de,
    },
    lng: "de",
    fallbackLng: "en",
    ns: [...Object.keys(de)],
    interpolation: {
      escapeValue: false,
    },
    debug: true,
  });
