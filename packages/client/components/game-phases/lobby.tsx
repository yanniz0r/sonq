import { SocketClient } from "@sonq/api";
import { FC, useCallback } from "react";
import useIsAdmin from "../../hooks/use-is-admin";
import { Button } from "../button";
import { useTranslation } from 'react-i18next'

interface LobbyProps {
  io: SocketIOClient.Socket;
  gameId: string;
}

const Lobby: FC<LobbyProps> = ({ io, gameId }) => {
  const {t} = useTranslation('game')
  const continueGame = useCallback(() => {
    io.emit(SocketClient.Events.Continue);
  }, [io])
  const isAdmin = useIsAdmin(gameId)

  return <div className="py-44 flex items-center justify-center">
    {!isAdmin &&
      <div>
        <h1 className="text-center text-gray-200 text-3xl">
          {t('waitingForGameStart')}
        </h1>
      </div>
    }
    {isAdmin && <Button onClick={continueGame}>{t('startGame')}</Button>}
  </div>
}

export default Lobby;