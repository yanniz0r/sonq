import { Rest } from "@sonq/api";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { NextPage } from "next";
import getConfig from "next/config";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useMutation } from "react-query";
import LoadingSpinner from "../components/loading-spinner";
import { ADMINKEY } from "../constants/local-storage";

const config = getConfig();

interface SpotifyRedirectPageProps {
  code: string;
}

const SpotifyRedirectPage: NextPage<SpotifyRedirectPageProps> = (props) => {
  console.log(props)
  const {t} = useTranslation('gameOptions')
  const createGameMutation = useMutation(async () => {
    const response = await fetch(
      `${config.publicRuntimeConfig.serverUrl}/game`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const json: Rest.PostGame = await response.json();
    return json;
  });
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const config = getConfig();
    const clientId = config.publicRuntimeConfig.spotifyClientId
    createGameMutation.mutateAsync().then(async (game) => {
      const authenticationResponse = await SpotifyApi.performUserAuthorization(
        clientId,
        'http://localhost:3000/spotify-redirect',
        [],
        `http://localhost:4000/game/${game.gameId}/spotify-auth`,
      )
      if (authenticationResponse.authenticated) {
        localStorage.setItem(ADMINKEY(game.gameId), game.adminKey);
        router.push(`/game/${game.gameId}/options`);
      }
    })
  }, [])

  // useEffect(() => {
  //   createGameMutation.mutateAsync(props.code).then((data) => {
  //     localStorage.setItem(ADMINKEY(data.gameId), data.adminKey);
  //     router.push(`/game/${data.gameId}/options`);
  //   });
  // }, [props.code]);

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-900">
      <Head>
        <title>Sonq - {t('creatingGame')}</title>
      </Head>
      <div className="flex flex-col items-center p-5">
        <div className="text-pink-600 text-6xl mb-12">
          <LoadingSpinner />
        </div>
        <h1 className="text-6xl text-gray-200">{t('creatingGame')}</h1>
      </div>
    </div>
  );
};

SpotifyRedirectPage.getInitialProps = (context) => {
  return {
    code: context.query.code as string,
  };
};

export default SpotifyRedirectPage;
