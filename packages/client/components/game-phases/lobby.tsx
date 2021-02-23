import { SocketClient } from "@sonq/api";
import { FC, useCallback } from "react";
import { Button } from "../button";

interface LobbyProps {
  io: SocketIOClient.Socket;
}

const Lobby: FC<LobbyProps> = ({ io }) => {
  const continueGame = useCallback(() => {
    io.emit(SocketClient.Events.Continue);
  }, [io])

  return <div>
    <Button onClick={continueGame}>Start</Button>
  </div>
}

export default Lobby;