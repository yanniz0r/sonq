import { Domain, SocketClient } from "@sonq/api";
import { FC, useCallback } from "react";
import useIsAdmin from "../../hooks/use-is-admin";
import { Button } from "../button";
import PlayerScores from "../player-scores";

interface ReviewProps {
  io: SocketIOClient.Socket;
  phaseData: Domain.ReviewGamePhaseData;
  gameId: string;
}

const Review: FC<ReviewProps> = ({ io, phaseData, gameId }) => {
  const continueGame = useCallback(() => {
    io.emit(SocketClient.Events.Continue);
  }, [io])
  const isAdmin = useIsAdmin(gameId)

  return <div>
    <div className="flex flex-col justify-center items-center">
      <img src={phaseData.track.album.images[0].url} className="h-72 w-72" />
      <h1 className="text-white text-4xl mt-2 flex flex-col items-center">
        <span>{phaseData.track.name}</span>
        <small className="text-gray-400 text-2xl">{phaseData.track.artists[0].name}</small>
      </h1>
    </div>
    <PlayerScores scores={phaseData.score} answers={phaseData.answers} />
    {isAdmin &&
      <div className="flex items-center justify-center">
        <Button onClick={continueGame}>Next Round</Button>
      </div>
    }
  </div>
}

export default Review;