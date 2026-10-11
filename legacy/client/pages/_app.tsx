import { QueryClientProvider } from "react-query";
import "../styles/globals.css";
import "tailwindcss/tailwind.css";
import "../locales";
import queryClient from "../config/query-client";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import initI18n from "../locales";

function MyApp({ Component, pageProps }) {
  const router = useRouter()

  const language = router.locale ?? router.defaultLocale ?? 'de'

  const i18n = useMemo(() => initI18n(language), [language])

  return (
    <>
      <script defer data-domain="sonq.de" src="https://analytics.coolify.inseldu.de/js/script.js"></script>
      <script defer src="https://umami.inselmann.online/script.js" data-website-id="c257cd0b-8174-439a-8dd3-db3937df0327"></script>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <Component {...pageProps} />
        </QueryClientProvider>
      </I18nextProvider>
    </>
  );
}

export default MyApp;
