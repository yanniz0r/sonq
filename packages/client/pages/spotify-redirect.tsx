import { NextPage } from "next";
import { useEffect } from "react";
import { useMutation } from "react-query";
import { useRouter } from 'next/router'

interface SpotifyRedirectPageProps {
  code: string;
}

const SpotifyRedirectPage: NextPage<SpotifyRedirectPageProps> = (props) => {
  const createGameMutation = useMutation(async (code: string) => {
    const response = await fetch('http://localhost:4000/game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code
      })
    });
    const json = await response.json();
    return json.gameId as string;
  });
  const router = useRouter();

  useEffect(() => {
    createGameMutation
      .mutateAsync(props.code)
      .then(gameId => {
        console.log({ gameId });
        router.push(`/game/${gameId}/options`);
      })
  }, [props.code])

  return <div>
    Erstelle spiel
  </div>
}

SpotifyRedirectPage.getInitialProps = (context) => {
  return {
    code: context.query.code as string
  }
}

export default SpotifyRedirectPage;
