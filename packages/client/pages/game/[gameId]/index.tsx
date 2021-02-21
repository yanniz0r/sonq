import { NextPage } from "next";
import { useCallback, useMemo, useState } from "react";
import useOn from "../../../hooks/use-on";
import socketio from "socket.io-client";
import Modal from "../../../components/modal";
import Input from "../../../components/input";
import { Button } from "../../../components/button";
import JoinGameModal from "../../../components/join-game-modal";
import { SocketClient } from "@sonq/api";

interface GamePageProps {
  gameId: string;
}

const GamePage: NextPage<GamePageProps> = ({ gameId }) => {
  const [joinedGame, setJoinedGame] = useState(false);

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

  const joinGame = useCallback((username: string) => {
    const joinEvent: SocketClient.JoinEvent = {
      username,
    };
    io.emit(SocketClient.Events.Join, joinEvent);
    setJoinedGame(true);
  }, [io]);

  const playSong = useCallback(() => {
    io.emit('play-next-song');
  }, [io]);

  return <>
    <JoinGameModal open={!joinedGame} onJoin={joinGame} />
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
