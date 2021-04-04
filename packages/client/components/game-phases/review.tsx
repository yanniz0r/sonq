import { Domain, SocketClient } from "@sonq/api";
import { FC, useCallback } from "react";
import useIsAdmin from "../../hooks/use-is-admin";
import PlayerScores from "../player-scores";
import { useTranslation } from "react-i18next";
import { FaSpotify } from "react-icons/fa";
import { BasePane, DetailPane } from "../grid";

interface ReviewProps {
  io: SocketIOClient.Socket;
  phaseData: Domain.ReviewGamePhaseData;
  gameId: string;
}

const Review: FC<ReviewProps> = ({ io, phaseData, gameId }) => {
  const { t } = useTranslation("game");
  const continueGame = useCallback(() => {
    io.emit(SocketClient.Events.Continue);
  }, [io]);
  const isAdmin = useIsAdmin(gameId);

  const bonusInterpolation = {
    trackName: phaseData.track.name,
    bonus: `${Math.round(phaseData.popularityBonus * 100)}%`,
  };
  let popularityBonusDescription = t(
    "review.popularityBonusDescriptionAverage",
    bonusInterpolation
  );
  if (phaseData.track.popularity < 0.7) {
    popularityBonusDescription = t(
      "review.popularityBonusDescriptionLow",
      bonusInterpolation
    );
  } else if (phaseData.track.popularity > 1.3) {
    popularityBonusDescription = t(
      "review.popularityBonusDescriptionHigh",
      bonusInterpolation
    );
  }

  return (
    <div className="py-20">
      <h1 className="text-gray-200 text-3xl md:text-5xl font-bold mb-10">
        {t("review.headline")}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-7 auto-rows-min">
        <div className="md:col-span-2 md:row-span-2">
          <BasePane>
            <div className="p-10">
              <h2 className="text-2xl text-white font-bold">
                {t("review.scoresHeadline")}
              </h2>
              <PlayerScores
                scores={phaseData.score}
                answers={phaseData.answers}
              />
            </div>
          </BasePane>
        </div>
        <BasePane>
          <img src={phaseData.track.album.images[0].url} />
        </BasePane>
        <DetailPane
          primaryText={phaseData.track.name}
          secondaryText={phaseData.track.artists[0].name}
          tertiaryText={phaseData.track.album.name}
        >
          <a
            href={`https://open.spotify.com/track/${phaseData.track.id}`}
            target="_blank"
            className="mt-5 py-2 px-3 font-bold text-sm text-white inline-flex items-center rounded-full"
            style={{ backgroundColor: "#1DD05D" }}
          >
            <FaSpotify className="mr-2" />
            {t("review.checkoutOnSpotify")}
          </a>
        </DetailPane>
        <DetailPane 
          primaryText={`${Math.round(phaseData.popularityBonus * 100)}%`}
          secondaryText={t("review.popularityBonusHeadline")}
          tertiaryText={popularityBonusDescription}
        />
        <div className="md:col-span-2 order-5 md:order-5">
          <BasePane>
            <div className="p-10">
              <h2 className="text-white mt-10 text-3xl font-bold">
                {t("review.wrongGuessesHeadline")}
              </h2>
              <div className="my-5 flex flex-wrap">
                {phaseData.wrongGuesses.length === 0 && (
                  <p className="text-gray-400 text-lg">
                    {t("review.wrongGuessesEmpty")}
                  </p>
                )}
                {phaseData.wrongGuesses.map((wrongGuess) => (
                  <div className="text-white bg-pink-600 p-1 px-2 text-xs rounded-full mr-2 mb-2">
                    {wrongGuess.songName} - {wrongGuess.artistName}
                  </div>
                ))}
              </div>
            </div>
          </BasePane>
        </div>
      </div>
    </div>
  );
};

export default Review;
