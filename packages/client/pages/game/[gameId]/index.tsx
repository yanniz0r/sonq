import { NextPage } from "next";
import { useCallback, useMemo, useState } from "react";
import useOn from "../../../hooks/use-on";
import socketio from "socket.io-client";
import Modal from "../../../components/modal";
import Input from "../../../components/input";
import { Button } from "../../../components/button";
import JoinGameModal from "../../../components/join-game-modal";
import { SocketClient } from "@sonq/api";
import useSpotifyTrackSearch from "../../../hooks/use-spotify-track-search";

interface GamePageProps {
  gameId: string;
}

const GamePage: NextPage<GamePageProps> = ({ gameId }) => {
  const [joinedGame, setJoinedGame] = useState(false);
  const [songQuery, setSongQuery] = useState('');
  const trackSearchQuery = useSpotifyTrackSearch(gameId, songQuery)

  const io = useMemo(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    return socketio('http://localhost:4000', {
      query: {
        game: gameId
      }
    });
  }, [gameId]);

  useOn(io, 'play-song', (payload: any) => {
    const audio = new Audio(payload.url);
    audio.play();
    console.log(payload)
  });

  const joinGame = useCallback((username: string) => {
    const joinEvent: SocketClient.JoinEvent = {
      username,
    };
    io.emit(SocketClient.Events.Join, joinEvent);
    setJoinedGame(true);
  }, [io]);

  const playSong = useCallback(() => {
    io.emit('play-next-song');
  }, [io]);

  return <div className="bg-gray-900 min-h-screen">
    <JoinGameModal open={!joinedGame} onJoin={joinGame} />
    <h1>Sonq</h1>
    <button onClick={playSong}>Play Song</button>
    <div className="max-w-screen-lg mx-auto">
      <h1 className="text-center mb-10 text-4xl text-white font-bold">Wie heißt dieser Song?</h1>

      <Input className="w-full" value={songQuery} onChange={e => setSongQuery(e.currentTarget.value)} />
      <div className="grid grid-cols-4 gap-5 mt-7">
        {trackSearchQuery.data?.tracks.items.map(item => (
          <button className="bg-green-500 rounded-lg overflow-hidden transform transition hover:scale-110 flex flex-col">
            <img src={item.album.images[0].url} />
            <div className="p-2">
              <span className="font-bold">{item.name}</span> · {item.artists.map(a => a.name).join(', ')}
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
}

GamePage.getInitialProps = (context) => {
  return {
    gameId: context.query.gameId as string
  }
}

export default GamePage;
