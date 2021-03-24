import { NextPage, NextPageContext } from "next";
import Head from "next/head"
import { FaCogs, FaGamepad, FaInfo, FaShare, FaSpotify, FaTimes } from "react-icons/fa";

import * as zod from "zod";
import Alert from "../components/alert";
import { useTranslation } from "react-i18next";
import { useState } from "react";

interface HomePageProps {
  error?: string;
}

const HomePageQuerySchema = zod.object({
  error: zod.string().optional(),
});

const Home: NextPage<HomePageProps> = ({ error }) => {
  const [hideError, setHideError] = useState(false);
  const { t } = useTranslation("landingPage");
  return (
    <div>
      <Head>
        <title>Sonq - {t("landing.logoSubtitle")}</title>
      </Head>
      <div className="bg-gray-900 relative">
        <div className="absolute w-full h-full bg-center bg-fixed bg-cover opacity-20" style={{ backgroundImage: "url('/images/landingpage-header.jpg')" }}/>
        <div className="text-white">
          <div className="flex">
            <div className="p-5">
              <div className="text-4xl font-bold mb-1">
                Son<span className="text-pink-600">q</span>
              </div>
              <div className="text-white text-opacity-50 text-xs">
                {t("landing.logoSubtitle")}
              </div>
            </div>
          </div>
        </div>
        {!hideError && (
          <div className="mx-auto max-w-screen-lg">
            {error === "game-not-found" && (
              <Alert
                icon={<FaTimes />}
                type="error"
                onClose={() => setHideError(true)}
              >
                {t("errors.gameNotFound")}
              </Alert>
            )}
          </div>
        )}

        <div className="flex py-52 px-5 md:py-80 flex-col items-center justify-center relative">
          <div className="flex flex-col items-center">
            <h1 className="text-6xl text-gray-200">
              {t("landing.slogan")}
            </h1>
            <a
              href="/api/spotify-login"
              style={{ background: "#1DD05D" }}
              className="text-white p-4 px-5 inline-flex items-center font-bold rounded-full mt-10 transform transition hover:scale-110"
            >
              <FaSpotify className="mr-2 text-xl" />
              {t("landing.spotifyLogin")}
            </a>
          </div>
        </div>
      </div>
      <div className="bg-pink-600 px-5 py-10 md:py-20 text-white">
        <div className="max-w-screen-lg mx-auto">
          <h2 className="text-center text-4xl font-bold">
            {t("divider.title")}
          </h2>
          <p className="text-center mt-5 text-lg">
            {t("divider.text")}
          </p>
        </div>
      </div>
      <div className="py-10 md:py-20 px-5 bg-white">
        <div className="max-w-screen-lg mx-auto">
          <h2 className="text-4xl font-bold text-gray-900">
            {t("information.howToPlay")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-2xl font-bold text-pink-600 pt-4">
                {t("information.choosePlaylist.title")}
              </h3>
              <p className="pt-3 text-lg">
                {t("information.choosePlaylist.text")}
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-pink-600 pt-4">
                {t("information.playInGroup.title")}
              </h3>
              <p className="pt-3 text-lg">
                {t("information.playInGroup.text")}
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-pink-600 pt-4">
                {t("information.enjoySpotify.title")}
              </h3>
              <p className="pt-3 text-lg">
                {t("information.enjoySpotify.text")}
              </p>
            </div>
          </div>
          <div className="bg-blue-100 p-5 mt-10 flex rounded-lg">
            <div className="mr-5 text-blue-600 text-3xl mt-2">
              <FaInfo />
            </div>
            <div>
              <h3 className="font-bold text-blue">{t("information.whySignIn.title")}</h3>
              <p>
                {t("information.whySignIn.text")}
                <a
                  href="https://github.com/yanniz0r/sonq"
                  className="text-blue-600"
                >
                  source code
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="py-10 md:py-20 px-5 bg-pink-50">
        <div className="max-w-screen-lg mx-auto">
          <h2 className="text-center text-4xl font-bold">How does it work?</h2>
          <p className="text-pink-600 font-bold text-center text-lg">Get started with Sonq in X easy steps</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7 mt-10">
            <div className="relative bg-gray-800 text-gray-200 shadow-sm rounded-lg p-10">
              <div className="z-10 relative">
                <h3 className="text-gray-100 text-2xl font-bold mb-3">{t('explanation.signIn.title')}</h3>
                <p className="text-lg">{t('explanation.signIn.text')}</p>
              </div>
              <div className="absolute bottom-5 right-5">
                <FaSpotify className="text-black opacity-30 text-9xl z-0" />
              </div>
            </div>
            <div className="relative bg-gray-800 text-gray-200 shadow-sm rounded-lg p-10">
              <div className="z-10 relative">
                <h3 className="text-gray-100 text-2xl font-bold mb-3">{t('explanation.adjust.title')}</h3>
                <p className="text-lg">{t('explanation.adjust.text')}</p>
              </div>
              <div className="absolute bottom-5 right-5">
                <FaCogs className="text-black opacity-30 text-9xl z-0" />
              </div>
            </div>
            <div className="relative bg-gray-800 text-gray-200 shadow-sm rounded-lg p-10">
              <div className="z-10 relative">
                <h3 className="text-gray-100 text-2xl font-bold mb-3">{t('explanation.invite.title')}</h3>
                <p className="text-lg">{t('explanation.invite.text')}</p>
              </div>
              <div className="absolute bottom-5 right-5">
                <FaShare className="text-black opacity-30 text-9xl z-0" />
              </div>
            </div>
            <div className="relative bg-gray-800 text-gray-200 shadow-sm rounded-lg p-10">
              <div className="z-10 relative">
                <h3 className="text-gray-100 text-2xl font-bold mb-3">{t('explanation.play.title')}</h3>
                <p className="text-lg">{t('explanation.play.text')}</p>
              </div>
              <div className="absolute bottom-5 right-5">
                <FaGamepad className="text-black opacity-30 text-9xl z-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-900 py-20">
        <div className="max-w-screen-lg mx-auto">
          <p className="text-center text-gray-200">
            Built with ❤️ by{" "}
            <a
              href="https://github.com/yanniz0r/sonq"
              className="text-pink-600"
            >
              yanniz0r
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

Home.getInitialProps = (context: NextPageContext) => {
  const parsedQuery = HomePageQuerySchema.safeParse(context.query);
  if (parsedQuery.success) {
    return {
      error: parsedQuery.data.error,
    };
  }
};

export default Home;
