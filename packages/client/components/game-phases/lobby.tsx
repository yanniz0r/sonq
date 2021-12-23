import { Domain } from "@sonq/api";
import { FC, useCallback, useEffect, useState } from "react";
import useIsAdmin from "../../hooks/use-is-admin";
import { useTranslation } from "react-i18next";
import getGameUrl from "../../helpers/get-game-url";
import { Socket } from "socket.io-client";

interface LobbyProps {
  io: Socket;
  gameId: string;
  players: Domain.Player[];
}

const Lobby: FC<LobbyProps> = ({ io, gameId, players }) => {
  const { t } = useTranslation("game");
  const [justCopied, setJustCopied] = useState(false);

  useEffect(() => {
    if (justCopied) {
      setTimeout(() => {
        setJustCopied(false);
      }, 2000);
    }
  }, [justCopied]);
  const isAdmin = useIsAdmin(gameId)
  const copyGameLink = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        text: t("lobby.shareText"),
        title: t("lobby.shareTitle"),
        url: getGameUrl(gameId),
      });
    } else {
      setJustCopied(true);
      window.navigator.clipboard.writeText(getGameUrl(gameId));
    }
  }, [gameId]);

  return (
    <div className="flex h-full flex-col justify-center">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-white mb-5">
          {t("lobby.waitingForPlayers")}
        </h1>
        <div className="flex flex-row">
          {players.map((player) => (
            <div className="p-5 text-white flex flex-col items-center">
              <div className="h-16 w-16 rounded-full font-bold flex items-center justify-center bg-pink-600">
                {player.username[0].toUpperCase()}
              </div>
              {player.username}
            </div>
          ))}
        </div>
        <div>
          <div className="w-full overflow-hidden rounded-lg transform transition hover:scale-110 relative inline-flex flex-col items-center my-10">
            <button
              onClick={copyGameLink}
              type="button"
              className="px-3 py-2 text-lg bg-gray-800 text-gray-300"
            >
              {getGameUrl(gameId)}
            </button>
            {justCopied && (
              <div className="absolute bg-pink-600 text-white font-bold h-full w-full flex justify-center items-center">
                {t("copied")}
              </div>
            )}
          </div>
        </div>
        {!isAdmin && (
          <div>
            <h1 className="text-center text-gray-200 text-3xl">
              {t("lobby.waitingForGameStart")}
            </h1>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
