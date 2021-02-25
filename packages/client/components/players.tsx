import { Domain, SocketServer } from "@sonq/api";
import { FC, useState } from "react";
import useOn from "../hooks/use-on";

interface PlayersProps {
  io: SocketIOClient.Socket;
}

interface AvatarProps {
  player: Domain.Player;
}

const Avatar: FC<AvatarProps> = ({ children, player }) => {
  return <div className="flex items-center mb-2">
    <div className="h-16 w-16 overflow-hidden bg-gray-200 flex items-center justify-center font-bold text-white rounded-full text-xl">
      <img src={`https://avatars.dicebear.com/api/identicon/${player.username}.svg`} />
      {children}
    </div>
    <span className="ml-4 text-lg text-gray-500">
      {player.username}
    </span>
  </div> 
}

const Players: FC<PlayersProps> = ({ io }) => {
  const [players, setPlayers] = useState<Domain.Player[]>([]);
  useOn<SocketServer.PlayerJoinedEvent>(io, SocketServer.Events.PlayerJoined, (event) => {
    setPlayers(event.players);
  });

  return <div className="absolute pl-2 pt-2">
    {players.map(player => (
      <Avatar player={player} />
    ))}
  </div>
}

export default Players;
