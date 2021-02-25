import { Domain, SocketClient } from "@sonq/api";
import { FC, useCallback } from "react";
import { Button } from "../button";
import PlayerScores from "../player-scores";

interface SummaryProps {
  io: SocketIOClient.Socket;
  phaseData: Domain.SummaryGamePhaseData;
}

const Summary: FC<SummaryProps> = ({ io, phaseData }) => {
  const continueGame = useCallback(() => {
    io.emit(SocketClient.Events.Continue);
  }, [io])

  return <div>
    Summary
    <Button onClick={continueGame}>Next Round</Button>
  </div>
}

export default Summary;