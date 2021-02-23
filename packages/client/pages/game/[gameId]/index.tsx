import { NextPage } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";
import useOn from "../../../hooks/use-on";
import socketio from "socket.io-client";
import Modal from "../../../components/modal";
import Input from "../../../components/input";
import { Button } from "../../../components/button";
import JoinGameModal from "../../../components/join-game-modal";
import { Domain, SocketClient, SocketServer } from "@sonq/api";
import useSpotifyTrackSearch from "../../../hooks/use-spotify-track-search";
import useGame from "../../../hooks/use-game";
import Lobby from "../../../components/game-phases/lobby";
import PlaySong from "../../../components/game-phases/play-song";
import Review from "../../../components/game-phases/review";

interface GamePageProps {
  gameId: string;
}

const GamePage: NextPage<GamePageProps> = ({ gameId }) => {
  const [joinedGame, setJoinedGame] = useState(false);
  const gameQuery = useGame(gameId);
  const [gamePhase, setGamePhase] = useState<Domain.GamePhase>({
    type: Domain.GamePhaseType.Lobby,
    data: undefined,
  })

  useEffect(() => {
    if (gameQuery.data?.phase) {
      setGamePhase(gameQuery.data.phase)
    }
  }, [gameQuery.data?.phase?.type])

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

  useOn(io, SocketServer.Events.PhaseChange, (event: SocketServer.PhaseChangeEvent) => {
    setGamePhase(event.phase);
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

  return <div className="bg-gray-900 min-h-screen">
    <JoinGameModal open={!joinedGame} onJoin={joinGame} />
    <h1>Sonq</h1>
    <button onClick={playSong}>Play Song</button>
    <div className="max-w-screen-lg mx-auto">
      {gamePhase.type === Domain.GamePhaseType.Lobby && <Lobby io={io} />}
      {gamePhase.type === Domain.GamePhaseType.PlaySong && <PlaySong io={io} phaseData={gamePhase.data} gameId={gameId} />}
      {gamePhase.type === Domain.GamePhaseType.Review && <Review io={io} phaseData={gamePhase.data} />}
      {gamePhase.type === Domain.GamePhaseType.Summary && 'Summary'}
    </div>
  </div>
}

GamePage.getInitialProps = (context) => {
  return {
    gameId: context.query.gameId as string
  }
}

export default GamePage;
