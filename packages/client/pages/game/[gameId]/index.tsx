import { NextPage } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";
import useOn from "../../../hooks/use-on";
import socketio from "socket.io-client";
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
import { Toolbar } from "../../../components/toolbar";
import useIsAdmin from "../../../hooks/use-is-admin";
import { useTranslation } from "react-i18next";
import { GamePhaseType } from "@sonq/api/dist/domain";
import Link from "next/link";
import getGameUrl from "../../../helpers/get-game-url";

const config = getConfig();

interface GamePageProps {
  gameId: string;
}

const GamePage: NextPage<GamePageProps> = ({ gameId }) => {
  const {t} = useTranslation('game');
  const [volume, setVolume] = useState(5);
  const isAdmin = useIsAdmin(gameId)
  const [joinedGame, setJoinedGame] = useState(false);
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

    return socketio(config.publicRuntimeConfig.serverUrl, {
      query: {
        game: gameId,
        adminKey: localStorage.getItem(ADMINKEY(gameId)),
      },
    });
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
            {/* {gamePhase.type !== Domain.GamePhaseType.Lobby &&
              <Players players={players} io={io} phase={gamePhase.type} />
            } */}
            <div className="flex-grow overflow-y-auto relative z-10">
              <div className="max-w-screen-lg mx-auto h-full">
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
              </div>
            </div>
            {isAdmin && gamePhase.type !== GamePhaseType.PlaySong &&
              <div className="z-10">
                <Toolbar>
                  <div className="flex justify-between">
                    {gamePhase.type === GamePhaseType.Lobby &&
                      <button onClick={continueGame} className="bg-pink-700 px-3 py-2 text-white rounded-lg font-bold">
                        {t('toolbar.startGame')}
                      </button>
                    }
                    {gamePhase.type === GamePhaseType.Review &&
                      <button onClick={continueGame} className="bg-pink-700 px-3 py-2 text-white rounded-lg font-bold">
                        {t('toolbar.nextRound')}
                      </button>
                    }
                    {gamePhase.type === GamePhaseType.Summary &&
                      <>
                        <Link href={getGameUrl(gameId) + '/options'} passHref>
                          <a onClick={continueGame} className="bg-pink-700 px-3 py-2 text-white rounded-lg font-bold">
                            {t('toolbar.settings')}
                          </a>
                        </Link>
                        <button onClick={continueGame} className="bg-pink-700 px-3 py-2 text-white rounded-lg font-bold">
                          {t('toolbar.startAgain')}
                        </button>
                      </>
                    }
                  </div>
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
