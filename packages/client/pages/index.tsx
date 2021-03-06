import { NextPage, NextPageContext } from "next";
import { FaInfo, FaSpotify, FaTimes } from "react-icons/fa";
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
      <div className="bg-gray-900">
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
        <div className="flex py-52 px-5 md:py-80 flex-col items-center justify-center">
          <div className="flex flex-col items-center">
            <h1 className="text-6xl text-gray-200">{t("landing.slogan")}</h1>
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
          <h2 className="text-center text-3xl font-bold">
            {t("devider.title")}
          </h2>
          <p className="text-center mt-5 text-lg">{t("devider.text")}</p>
        </div>
      </div>
      <div className="py-10 md:py-20 px-5 bg-gray-50">
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
              <h3 className="font-bold">{t("information.whySignIn.title")}</h3>
              {t("information.whySignIn.text")}
              <a
                href="https://github.com/yanniz0r/sonq"
                className="text-blue-600"
              >
                source code
              </a>
              .
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-900 py-20">
        <div className="max-w-screen-lg mx-auto">
          <p className="text-center text-gray-200">
            Built with heart by{" "}
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
