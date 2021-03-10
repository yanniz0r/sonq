import { SocketServer } from "@sonq/api";
import { FC, useLayoutEffect, useRef, useState } from "react";
import useOn from "../hooks/use-on";
import { shuffle } from 'lodash';


interface PlayerAnwswer {
  id: number;
  artistName: string;
  songName: string;
  coverImage: string;
}

interface BubbleProps {
  horizontalPosition: number;
  answer: PlayerAnwswer;
}

const Bubble: FC<BubbleProps> = ({ horizontalPosition, answer }) => {
  const [animating, setAnimating] = useState(false);

  useLayoutEffect(() => {
    const timeout = setTimeout(() => {
      setAnimating(true);
    }, 500)
    return () => clearTimeout(timeout);
  });

  return <div className={`w-56 h-56 rounded-lg opacity-50 shadow-xl overflow-hidden absolute transition-all duration-50000 ${animating ? '-top-full' : 'top-full'}`} style={{ left: `${horizontalPosition}%` }}>
    <img src={answer.coverImage} className="max-w-full max-h-full top-full" />
  </div>
}

interface GuessBubblesProps {
  io: SocketIOClient.Socket
}

const totalPositions = 12;
let horizontalPositions: number[] = [];
for (let index = 1; index < totalPositions; index++) {
  horizontalPositions.push(Math.round(100 / totalPositions) * index)
}
horizontalPositions = shuffle(horizontalPositions);

const GuessBubbles: FC<GuessBubblesProps> = ({ io }) => {
  const id = useRef(0);
  const [playerAnswers, setPlayerAnswers] = useState<PlayerAnwswer[]>([]);

  useOn<SocketServer.SongGuessedEvent>(io, SocketServer.Events.SongGuessed, (event) => {
    if (event.correct === true) {
      return
    }
    const newId = ++id.current;
    setPlayerAnswers((otherAnswers) => ([
      ...otherAnswers,
      {
        id: newId,
        ...event
      },
    ]));
    setTimeout(() => {
      setPlayerAnswers((oldAnswers) => {
        return oldAnswers.filter((oldAnswer) => oldAnswer.id !== newId)
      })
    }, 50000)
  });

  return <div className="w-full h-full overflow-hidden absolute top-0 left-0 z-0">
    {playerAnswers.map(answer => 
      <Bubble key={answer.id} horizontalPosition={horizontalPositions[answer.id % horizontalPositions.length]} answer={answer} />
    )}
  </div>
}

export default GuessBubbles;