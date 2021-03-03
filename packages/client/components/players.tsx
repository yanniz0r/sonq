import { Domain, SocketServer } from "@sonq/api";
import { FC, useEffect, useState } from "react";
import { FaCheck, FaTimes } from "react-icons/fa"
import useOn from "../hooks/use-on";

interface PlayersProps {
  phase: Domain.GamePhaseType;
  players: Domain.Player[];
  io: SocketIOClient.Socket;
}

type PlayerAnwswer = ({
  success: true;
} | {
  success: false;
  artistName: string;
  songName: string;
})

interface AvatarProps {
  player: Domain.Player;
  answer?: PlayerAnwswer;
}

const Avatar: FC<AvatarProps> = ({ children, player, answer }) => {
  return <div className="flex items-center mb-2">
    <div className="h-16 w-16 overflow-hidden bg-gray-200 flex items-center justify-center font-bold text-white rounded-full text-xl">
      <img src={`https://avatars.dicebear.com/api/identicon/${player.username}.svg`} />
      {children}
    </div>
    <span className="ml-4 text-lg text-gray-500">
      {player.username}
    </span>
    <div className="ml-2">
      {answer && answer.success === true &&
        <div className="p-1 px-2 text-xs font-bold rounded-lg bg-green-500 text-white flex flex-row items-center"><FaCheck className="mr-1" />Song erraten</div>
      }
      {answer && answer.success === false &&
        <div className="p-1 px-2 text-xs font-bold rounded-lg bg-red-500 text-white flex flex-row items-center"><FaTimes className="mr-1" /> {answer.songName} von {answer.artistName}</div>
      }
    </div>
  </div> 
}

const Players: FC<PlayersProps> = ({ io, players, phase }) => {
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

  return <div className="absolute pl-2 pt-2">
    {players.map(player => (
      <Avatar key={player.id} player={player} answer={playerAnswers[player.id]} />
    ))}
  </div>
}

export default Players;
