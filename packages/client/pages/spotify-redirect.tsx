import { NextPage } from "next";
import { useEffect } from "react";
import { useMutation } from "react-query";
import { useRouter } from 'next/router'
import { Rest } from "@sonq/api";
import { ADMINKEY } from "../constants/local-storage";
import getConfig from 'next/config';

const config = getConfig();

interface SpotifyRedirectPageProps {
  code: string;
}

const SpotifyRedirectPage: NextPage<SpotifyRedirectPageProps> = (props) => {
  const createGameMutation = useMutation(async (code: string) => {
    const response = await fetch(`${config.publicRuntimeConfig.erverUrl}/game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code
      })
    });
    const json: Rest.PostGame = await response.json();
    return json;
  });
  const router = useRouter();

  useEffect(() => {
    createGameMutation
      .mutateAsync(props.code)
      .then(data => {
        localStorage.setItem(ADMINKEY(data.gameId), data.adminKey);
        router.push(`/game/${data.gameId}/options`);
      })
  }, [props.code])

  return <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-900">
    <div className="flex flex-col items-center">
      <h1 className="text-6xl text-gray-200">Wir erstellen dein Spiel...</h1>
    </div>
  </div>
}

SpotifyRedirectPage.getInitialProps = (context) => {
  return {
    code: context.query.code as string
  }
}

export default SpotifyRedirectPage;
