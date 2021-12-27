import { Domain, SocketServer } from "@sonq/api";
import { FC, useEffect, useState } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { Socket } from "socket.io-client";
import useOn from "../hooks/use-on";
import VolumeControl from "./volume-control";

interface GameSideBarProps {
  players: Domain.Player[];
  setVolume(volume: number);
  phase: Domain.GamePhaseType;
  io: Socket;
}

const GameSideBar: FC<GameSideBarProps> = ({
  players,
  setVolume,
  phase,
  io,
}) => {
  const [playerAnswers, setPlayerAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (phase === Domain.GamePhaseType.PlaySong) {
      setPlayerAnswers(() => []);
    }
  }, [phase]);

  useOn<SocketServer.SongGuessedEvent>(
    io,
    SocketServer.Events.SongGuessed,
    (event) => {
      if (event.correct === true) {
        setPlayerAnswers((otherPlayers) => [...otherPlayers, event.player.id]);
      }
    }
  );

  return (
    <div className="w-64 bg-gray-800 shadow-xl hidden md:flex  flex-col">
      <div className="text-4xl text-white font-bold p-5">
        Son<span className="text-pink-600">q</span>
      </div>
      <ul className="flex-grow">
        {players.map((player) => {
          return (
            <li className="flex p-5 py-2 items-center flex-nowrap" key={player.id}>
              <div className="flex-shrink-0 bg-purple-600 w-12 h-12 flex items-center justify-center rounded-full font-bold text-white">
                {player.username[0].toUpperCase()}
              </div>
              <div className="ml-2">
                <span
                  className={`inline-block px-2 py-1 rounded-lg font-bold break-all line-clamp-1 ${
                    playerAnswers.includes(player.id)
                      ? "bg-green-500 text-white"
                      : "text-gray-200"
                  }`}
                >
                  {player.username}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="p-5">
        <VolumeControl onChange={setVolume} />
      </div>
    </div>
  );
};

export default GameSideBar;
