import { Domain, SocketServer } from "@sonq/api";
import { FC, useEffect, useState } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import useOn from "../hooks/use-on";
import VolumeControl from "./volume-control";

interface GameSideBarProps {
  players: Domain.Player[];
  setVolume(volume: number);
  phase: Domain.GamePhaseType;
  io: SocketIOClient.Socket;
}

type PlayerAnwswer = ({
  success: true;
} | {
  success: false;
  artistName: string;
  songName: string;
})

const GameSideBar: FC<GameSideBarProps> = ({ players, setVolume, phase, io }) => {
  const [playerAnswers, setPlayerAnswers] = useState<Record<string, PlayerAnwswer>>({});

  useEffect(() => {
    if (phase === Domain.GamePhaseType.PlaySong) {
      console.log("setPlayerAnswers");
      setPlayerAnswers(() => ({}));
    }
  }, [phase])

  useOn<SocketServer.SongGuessedEvent>(io, SocketServer.Events.SongGuessed, (event) => {
    let playerAnswer: PlayerAnwswer;
    if (event.correct === true) {
      playerAnswer = {
        success: true,
      }
    } else {
      playerAnswer = {
        success: false,
        artistName: event.artistName,
        songName: event.songName,
      }
    }
    setPlayerAnswers((otherAnswers) => ({
      ...otherAnswers,
      [event.player.id]: playerAnswer
    }))
  });

  return <div className="w-64 bg-gray-800 shadow-xl hidden md:flex  flex-col">
    <div className="text-4xl text-white font-bold p-5">
      Son<span className="text-pink-600">q</span>
    </div>
    <ul className="flex-grow">
      {players.map(player => {
        const answer = playerAnswers[player.id];
        return <li className="flex p-5 py-2">
          <div className="bg-purple-600 w-12 h-12 flex items-center justify-center rounded-full font-bold text-white">
            {player.username[0].toUpperCase()}
          </div>
          <div className="ml-4 flex flex-col justify-center relative">
            <span className="text-gray-200 font-bold">
              {player.username}
            </span>
            {answer && answer.success === true &&
              <div className="absolute left-full whitespace-nowrap ml-2 p-1 px-2 text-xs font-bold rounded-lg bg-green-500 text-white flex flex-row items-center">
                <FaCheck className="mr-1" />Song erraten
              </div>
            }
            {answer && answer.success === false &&
              <div className="absolute left-full whitespace-nowrap ml-2 max-w-xl p-1 px-2 text-xs font-bold rounded-lg bg-red-500 text-white flex flex-row items-center">
                {answer.songName} von {answer.artistName}
              </div>
            }
          </div>
        </li>
      })}
    </ul>
    <div className="p-5">
      <VolumeControl onChange={setVolume} />
    </div>
  </div>
}

export default GameSideBar;
