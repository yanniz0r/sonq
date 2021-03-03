import { Domain, SocketClient } from "@sonq/api";
import { FC, useCallback } from "react";
import useIsAdmin from "../../hooks/use-is-admin";
import { Button } from "../button";
import PlayerScores from "../player-scores";
import { useTranslation } from 'react-i18next'

interface ReviewProps {
  io: SocketIOClient.Socket;
  phaseData: Domain.ReviewGamePhaseData;
  gameId: string;
}

const Review: FC<ReviewProps> = ({ io, phaseData, gameId }) => {
  const {t} = useTranslation('game')
  const continueGame = useCallback(() => {
    io.emit(SocketClient.Events.Continue);
  }, [io])
  const isAdmin = useIsAdmin(gameId)

  return <div className="py-20">
    <div className="flex flex-col justify-center items-center">
      <img src={phaseData.track.album.images[0].url} className="h-72 w-72" />
      <h1 className="text-white text-4xl mt-2 flex flex-col items-center">
        <span>{phaseData.track.name}</span>
        <small className="text-gray-400 text-2xl">{phaseData.track.artists[0].name}</small>
      </h1>
    </div>
    <PlayerScores scores={phaseData.score} answers={phaseData.answers} />
    {phaseData.wrongGuesses.length > 0 &&
      <div>
        <h2 className="text-center text-white mt-10 text-3xl">{t('review.wrongGuessesHeadline')}</h2>
        <div className="my-5 flex flex-wrap justify-center">
          {phaseData.wrongGuesses.map(wrongGuess => (
            <div className="text-white bg-red-500 p-1 px-2 text-xs rounded-full mr-2 mb-2">{wrongGuess.songName} - {wrongGuess.artistName}</div>
          ))}
        </div>
      </div>
    }
    {isAdmin &&
      <div className="flex items-center justify-center">
        <Button onClick={continueGame}>Next Round</Button>
      </div>
    }
  </div>
}

export default Review;