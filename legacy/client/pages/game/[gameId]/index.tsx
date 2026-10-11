import { NextPage } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";
import useOn from "../../../hooks/use-on";
import socketio, { Socket } from "socket.io-client";
import JoinGameModal from "../../../components/join-game-modal";
import { Domain, SocketClient, SocketServer } from "@sonq/api";
import useGame, { GameNotFoundError } from "../../../hooks/use-game";
import Lobby from "../../../components/game-phases/lobby";
import PlaySong from "../../../components/game-phases/play-song";
import Review from "../../../components/game-phases/review";
import Summary from "../../../components/game-phases/summary";
import { ADMINKEY } from "../../../constants/local-storage";
import getConfig from "next/config";
import { useRouter } from "next/router";
import LoadingSpinner from "../../../components/loading-spinner";
import GameSideBar from "../../../components/game-side-bar";
import GuessBubbles from "../../../components/guess-bubbles";
import Head from "next/head";
import { Toolbar, ToolbarButton } from "../../../components/toolbar";
import useIsAdmin from "../../../hooks/use-is-admin";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import getGameUrl from "../../../helpers/get-game-url";
import Container from "../../../components/container";

const config = getConfig();

declare global {
  interface Window {
    sonqSocketConnection?: Socket
  }
}

interface GamePageProps {
  gameId: string;
}

const isClient = typeof window !== 'undefined'

const GamePage: NextPage<GamePageProps> = ({ gameId }) => {
  const {t} = useTranslation('game');
  const [volume, setVolume] = useState(5);
  const isAdmin = useIsAdmin(gameId)
  const [joinedGame, setJoinedGame] = useState(isClient ? Boolean(window.sonqSocketConnection) : false);
  const router = useRouter();
  const gameQuery = useGame(gameId, {
    retry(_errorCount, error) {
      return !(error instanceof GameNotFoundError);
    },
    onError(error) {
      if (error instanceof GameNotFoundError) {
        console.warn(error.message);
        router.replace(`/?error=game-not-found`);
      }
    },
  });
  const [gamePhase, setGamePhase] = useState<Domain.GamePhase>({
    type: Domain.GamePhaseType.Lobby,
    data: undefined,
  });
  const [players, setPlayers] = useState<Domain.Player[]>([]);

  useEffect(() => {
    if (gameQuery.data) {
      setPlayers(gameQuery.data.players);
      setGamePhase(gameQuery.data.phase);
    }
  }, [gameQuery.data?.phase?.type]);

  const io = useMemo(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!window.sonqSocketConnection) {
      window.sonqSocketConnection = socketio(config.publicRuntimeConfig.serverUrl, {
        query: {
          game: gameId,
          adminKey: localStorage.getItem(ADMINKEY(gameId)),
        },
      });
    }
    return window.sonqSocketConnection
  }, [gameId]);

  const continueGame = useCallback(() => {
    io.emit(SocketClient.Events.Continue)
  }, [io])

  useOn(
    io,
    SocketServer.Events.PhaseChange,
    (event: SocketServer.PhaseChangeEvent) => {
      setGamePhase(event.phase);
    }
  );

  /**
   * When either a player leaves or joines, similar events are dispatched
   */
  const playerlistChanged = (
    event: SocketServer.PlayerJoinedEvent | SocketServer.PlayerLeftEvent
  ) => {
    setPlayers(event.players);
  };
  useOn(io, SocketServer.Events.PlayerJoined, playerlistChanged);
  useOn(io, SocketServer.Events.PlayerLeft, playerlistChanged);

  const joinGame = useCallback(
    (username: string) => {
      const joinEvent: SocketClient.JoinEvent = {
        username,
      };
      io.emit(SocketClient.Events.Join, joinEvent);
      setJoinedGame(true);
    },
    [io]
  );

  return (
    <div className="bg-gray-900">
      <Head>
        <title>Sonq - {gameId}</title>
      </Head>
      {gameQuery.isLoading ? (
        <div className="p-20 flex justify-center text-white">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="flex h-screen">
          <GameSideBar
            players={players}
            setVolume={setVolume}
            io={io}
            phase={gamePhase.type}
          />
          <div className="flex flex-col flex-grow max-h-full relative">
            <GuessBubbles io={io} />
            <JoinGameModal open={!joinedGame} onJoin={joinGame} />
            <div className="flex-grow overflow-y-auto relative z-10 py-5 md:pt-14 pb-24">
              <Container>
                {gamePhase.type === Domain.GamePhaseType.Lobby && (
                  <Lobby io={io} gameId={gameId} players={players} />
                )}
                {gamePhase.type === Domain.GamePhaseType.PlaySong && (
                  <PlaySong
                    volume={volume}
                    io={io}
                    phaseData={gamePhase.data}
                    gameId={gameId}
                  />
                )}
                {gamePhase.type === Domain.GamePhaseType.Review && (
                  <Review io={io} phaseData={gamePhase.data} gameId={gameId} />
                )}
                {gamePhase.type === Domain.GamePhaseType.Summary && (
                  <Summary io={io} gameId={gameId} phaseData={gamePhase.data} />
                )}
              </Container>
            </div>
            {isAdmin && gamePhase.type !== Domain.GamePhaseType.PlaySong &&
              <div className="z-10">
                <Toolbar>
                  {gamePhase.type === Domain.GamePhaseType.Lobby &&
                    <ToolbarButton onClick={continueGame}>
                      {t('toolbar.startGame')}
                    </ToolbarButton>
                  }
                  {gamePhase.type === Domain.GamePhaseType.Review &&
                    <ToolbarButton onClick={continueGame}>
                      {t('toolbar.nextRound')}
                    </ToolbarButton>
                  }
                  {gamePhase.type === Domain.GamePhaseType.Summary &&
                    <div className="flex justify-between">
                      <Link href={getGameUrl(gameId) + '/options'}>
                        <ToolbarButton>
                          {t('toolbar.settings')}
                        </ToolbarButton>
                      </Link>
                      <ToolbarButton onClick={continueGame}>
                        {t('toolbar.startAgain')}
                      </ToolbarButton>
                    </div>
                  }
                </Toolbar>
              </div>
            }
          </div>
        </div>
      )}
    </div>
  );
};

GamePage.getInitialProps = (context) => {
  return {
    gameId: context.query.gameId as string,
  };
};

export default GamePage;
