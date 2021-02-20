import { NextPage } from "next";
import { useCallback, useMemo } from "react";
import useOn from "../../../hooks/use-on";
import socketio from "socket.io-client";

interface GamePageProps {
  gameId: string;
}

const GamePage: NextPage<GamePageProps> = ({ gameId }) => {
  const io = useMemo(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    return socketio('http://localhost:4000', {
      query: {
        game: gameId
      }
    });
  }, [gameId]);

  useOn(io, 'play-song', (payload: any) => {
    const audio = new Audio(payload.url);
    audio.play();
    console.log(payload)
  });

  const playSong = useCallback(() => {
    io.emit('play-next-song');
  }, [io]);

  return <>
    <h1>Sonq</h1>
    <button onClick={playSong}>Play Song</button>
  </>
}

GamePage.getInitialProps = (context) => {
  return {
    gameId: context.query.gameId as string
  }
}

export default GamePage;
