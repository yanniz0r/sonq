import { Domain, SocketClient } from "@sonq/api";
import { FC, useCallback } from "react";
import useIsAdmin from "../../hooks/use-is-admin";
import { Button } from "../button";
import PlayerScores from "../player-scores";
import { useTranslation } from 'react-i18next'
import { FaSpotify } from "react-icons/fa";

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

  const bonusInterpolation = {
    trackName: phaseData.track.name,
    bonus: `${phaseData.popularityBonus * 100}%`
  }
  let popularityBonusDescription = t('review.popularityBonusDescriptionAverage', bonusInterpolation);
  if (phaseData.track.popularity < 0.7) {
    popularityBonusDescription = t('review.popularityBonusDescriptionLow', bonusInterpolation);
  } else if (phaseData.track.popularity > 1.3) {
    popularityBonusDescription = t('review.popularityBonusDescriptionHigh', bonusInterpolation);
  }

  return <div className="py-20 px-5">
    <h1 className="text-gray-200 text-5xl font-bold mb-10">{t('review.headline')}</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-7 auto-rows-min">
      <div className="md:col-span-2 md:row-span-2 bg-black bg-opacity-20 rounded-lg p-10 order-3 md:order-1 flex flex-col">
        <h2 className="text-2xl text-white font-bold">{t('review.scoresHeadline')}</h2>
        <div className="flex-grow">
          <PlayerScores scores={phaseData.score} answers={phaseData.answers} />
        </div>
        {isAdmin &&
          <Button onClick={continueGame} className="block w-full">Next Round</Button>
        }
      </div>
      <div className="rounded-xl overflow-hidden shadow-xl order-2">
        <img src={phaseData.track.album.images[0].url} />
      </div>
      <div className="bg-black bg-opacity-20 rounded-xl flex flex-col justify-center p-10 order-1 md:order-3">
        <div>
          <h2 className="text-gray-300 text-xl font-bold">{phaseData.track.artists[0].name}</h2>
          <span className="text-4xl font-extrabold mb text-pink-600 my-4">{phaseData.track.name}</span>
          <p className="text-gray-400 text-xs">{phaseData.track.album.name}</p>
          <div>
            <a href={`https://open.spotify.com/track/${phaseData.track.id}`} target="_blank" className="mt-5 py-2 px-3 font-bold text-sm text-white inline-flex items-center rounded-full" style={{ backgroundColor: '#1DD05D' }}>
              <FaSpotify className="mr-2" />{t('review.checkoutOnSpotify')}
            </a>
          </div>
        </div>
      </div>
      <div className="bg-black bg-opacity-20 rounded-xl flex flex-col justify-center p-10 order-4 md:order-4">
        <div>
          <span className="text-6xl font-extrabold mb text-pink-600">{Math.round(phaseData.popularityBonus * 100)}%</span>
          <h2 className="text-gray-300 text-xl font-bold my-2">{t('review.popularityBonusHeadline')}</h2>
          <p className="text-gray-400 text-xs">{popularityBonusDescription}</p>
        </div>
      </div>
      <div className="md:col-span-2 bg-black bg-opacity-20 p-10 rounded-xl order-5 md:order-5">
        <h2 className="text-white mt-10 text-3xl font-bold">{t('review.wrongGuessesHeadline')}</h2>
        <div className="my-5 flex flex-wrap">
          {phaseData.wrongGuesses.map(wrongGuess => (
            <div className="text-white bg-pink-600 p-1 px-2 text-xs rounded-full mr-2 mb-2">{wrongGuess.songName} - {wrongGuess.artistName}</div>
          ))}
        </div>
      </div>
    </div>
  </div>
}

export default Review;