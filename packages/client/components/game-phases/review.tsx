import { Domain, SocketClient } from "@sonq/api";
import { FC, useCallback } from "react";
import { Button } from "../button";

interface ReviewProps {
  io: SocketIOClient.Socket;
  phaseData: Domain.ReviewGamePhaseData;
}

const Review: FC<ReviewProps> = ({ io, phaseData }) => {
  const continueGame = useCallback(() => {
    io.emit(SocketClient.Events.Continue);
  }, [io])

  return <div>
    <div className="flex flex-col justify-center items-center">
      <img src={phaseData.track.album.images[0].url} className="h-72 w-72" />
      <h1 className="text-white text-4xl mt-2 flex flex-col items-center">
        <span>{phaseData.track.name}</span>
        <small className="text-gray-400 text-2xl">{phaseData.track.artists[0].name}</small>
      </h1>
    </div>
    <ul className="text-white p-5">
      {phaseData.answers.map((answer, index) => (
        <li key={index} className="text-center">{answer.player.username}: {answer.time}</li>
      ))}
    </ul>
    <div className="flex items-center justify-center">
      <Button onClick={continueGame}>Next Round</Button>
    </div>
  </div>
}

export default Review;