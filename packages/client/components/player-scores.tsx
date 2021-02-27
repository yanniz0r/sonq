import { Domain } from "@sonq/api";
import { FC, useEffect, useMemo, useState } from "react";

interface PlayerScoresProps {
  scores: Domain.PlayerScore[],
  answers: Domain.ReviewGamePhaseAnswer[],
}

const PlayerScores: FC<PlayerScoresProps> = ({ scores, answers }) => {
  const highestScore = useMemo(() => scores[0]?.score ?? 0, [scores]);
  const [growBars, setGrowBars] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setGrowBars(true);
    })
    return () => clearTimeout(timeout)
  }, []);

  return <div>
    {scores.map((playerScore) => {
      const answerTime = answers.find((answer) => answer.player.id === playerScore.player.id)?.time ?? null;
      const answeredInText = answerTime && `answered in ${answerTime} seconds`
      return <div key={playerScore.player.username} className="relative space my-5 px-2 p-1 md:p-2 md:px-4 rounded-lg overflow-hidden bg-gray-800">
        <span className="z-10 relative font-bold text-blue-100 flex items-center">
          {playerScore.player.username}
          <small className="ml-2">{answeredInText}</small>
        </span>
        <div
          className="absolute top-0 left-0 bg-blue-500 h-full z-0"
          style={{ 
            width: growBars ? `${Math.round(playerScore.score * 100 / highestScore)}%` : '0%',
            transition: 'all 1s'
          }}
        >
          {playerScore.added &&
            <div className="h-full bg-blue-400 w-0 absolute right-0 text-blue-800 items-center justify-center flex" style={{ width: `${Math.round(playerScore.added * 100 / playerScore.score)}%` }}>
              +{playerScore.added}
            </div>
          }
        </div>
      </div>
    })}
  </div>
}

export default PlayerScores;
