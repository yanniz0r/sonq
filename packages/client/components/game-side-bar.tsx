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

const GameSideBar: FC<GameSideBarProps> = ({ players, setVolume, phase, io }) => {
  const [playerAnswers, setPlayerAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (phase === Domain.GamePhaseType.PlaySong) {
      setPlayerAnswers(() => []);
    }
  }, [phase])

  useOn<SocketServer.SongGuessedEvent>(io, SocketServer.Events.SongGuessed, (event) => {
    if (event.correct === true) {
      setPlayerAnswers((otherPlayers) => [...otherPlayers, event.player.id])
    }
  });

  return <div className="w-64 bg-gray-800 shadow-xl hidden md:flex  flex-col">
    <div className="text-4xl text-white font-bold p-5">
      Son<span className="text-pink-600">q</span>
    </div>
    <ul className="flex-grow">
      {players.map(player => {
        return <li className="flex p-5 py-2">
          <div className="bg-purple-600 w-12 h-12 flex items-center justify-center rounded-full font-bold text-white">
            {player.username[0].toUpperCase()}
          </div>
          <div className="ml-4 flex flex-col justify-center relative">
            <span className="text-gray-200 font-bold">
              {player.username}
            </span>
            {playerAnswers.includes(player.id) &&
              <div className="absolute left-full whitespace-nowrap ml-2 p-1 px-2 text-xs font-bold rounded-lg bg-green-500 text-white flex flex-row items-center">
                <FaCheck className="mr-1" />Song erraten
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
