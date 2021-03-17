import { NextPage, NextPageContext } from "next";
import Image from 'next/image'
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
      <div className="bg-gray-900 relative">
        <div className="absolute w-full h-full bg-center bg-fixed bg-cover opacity-20" style={{ backgroundImage: "url('/images/landingpage-header.jpg')" }}/>
        <div className="text-white">
          <div className="flex">
            <div className="p-5">
              <div className="text-4xl font-bold mb-1">
                Son<span className="text-pink-600">q</span>
              </div>
              <div className="text-white text-opacity-50 text-xs">
                Interactive Song guessing
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
              Song Raten in <span className="font-bold">Modern</span>
            </h1>
            <a
              href="/api/spotify-login"
              style={{ background: "#1DD05D" }}
              className="text-white p-4 px-5 inline-flex items-center font-bold rounded-full mt-10 transform transition hover:scale-110"
            >
              <FaSpotify className="mr-2 text-xl" />
              Start with Spotify
            </a>
          </div>
        </div>
      </div>
      <div className="bg-pink-600 px-5 py-10 md:py-20 text-white">
        <div className="max-w-screen-lg mx-auto">
          <h2 className="text-center text-4xl font-bold">
            How good do you know popular songs?
          </h2>
          <p className="text-center mt-5 text-lg">
            Challenge your friends/colleagues/whatever in a competative song
            guessing game
          </p>
        </div>
      </div>
      <div className="py-10 md:py-20 px-5 bg-white">
        <div className="max-w-screen-lg mx-auto">
          <h2 className="text-4xl font-bold text-gray-900">What's the deal</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-2xl font-bold text-pink-600 pt-4">
                You choose the playlist
              </h3>
              <p className="pt-3 text-lg">
                You select a playlist that you want to play so you don't have to
                worry about songs that nobody knows.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-pink-600 pt-4">
                Play in a group
              </h3>
              <p className="pt-3 text-lg">
                By sharing the link with your buddies you can start a
                comepetative song-guessing-match.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-pink-600 pt-4">
                Enjoy spotify features
              </h3>
              <p className="pt-3 text-lg">
                This whole beast is backed by the spotify API. Therfore you can
                access all those fance spotify features.
              </p>
            </div>
          </div>
          <div className="bg-blue-100 p-5 mt-10 flex rounded-lg">
            <div className="mr-5 text-blue-600 text-3xl mt-2">
              <FaInfo />
            </div>
            <div>
              <h3 className="font-bold">But why do I have to sign in?</h3>
              In order to access functions of spotify, the person creating a
              game has to sign in with their spotify account. We do nothing else
              than requesting spotifies data with your account. If you do not
              trust us, you can have a look at the{" "}
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
      <div className="py-10 md:py-20 px-5 bg-pink-50">
        <div className="max-w-screen-lg mx-auto">
          <h2 className="text-center text-4xl font-bold">How does it work?</h2>
          <p className="text-pink-600 font-bold text-center text-lg">Get started with Sonq in X easy steps</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7 mt-10">
            <div className="relative bg-gray-800 text-gray-200 shadow-sm rounded-lg p-10">
              <div className="z-10 relative">
                <h3 className="text-gray-100 text-2xl font-bold mb-3">Sign in</h3>
                <p className="text-lg">Use spotify to sign in and create a game for you and your friends</p>
              </div>
              <div className="absolute bottom-5 right-5">
                <FaSpotify className="text-black opacity-30 text-9xl z-0" />
              </div>
            </div>
            <div className="relative bg-gray-800 text-gray-200 shadow-sm rounded-lg p-10">
              <div className="z-10 relative">
                <h3 className="text-gray-100 text-2xl font-bold mb-3">Adjust the game to your liking</h3>
                <p className="text-lg">You want a spicy playlist? Play 100 rounds in a row? Punish wrong answers with an enormous timeout? We gou you</p>
              </div>
              <div className="absolute bottom-5 right-5">
                <FaCogs className="text-black opacity-30 text-9xl z-0" />
              </div>
            </div>
            <div className="relative bg-gray-800 text-gray-200 shadow-sm rounded-lg p-10">
              <div className="z-10 relative">
                <h3 className="text-gray-100 text-2xl font-bold mb-3">Invite others</h3>
                <p className="text-lg">Share your game link to allow your friends to join the game and play with you</p>
              </div>
              <div className="absolute bottom-5 right-5">
                <FaShare className="text-black opacity-30 text-9xl z-0" />
              </div>
            </div>
            <div className="relative bg-gray-800 text-gray-200 shadow-sm rounded-lg p-10">
              <div className="z-10 relative">
                <h3 className="text-gray-100 text-2xl font-bold mb-3">Play!</h3>
                <p className="text-lg">Start the game, select a username and have fun with your friends.</p>
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
