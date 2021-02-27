import { Domain, SocketClient } from "@sonq/api";
import { FC, useEffect, useState } from "react";
import useSpotifyTrackSearch from "../../hooks/use-spotify-track-search";
import Countdown from "../countdown";
import Input from "../input";
import dayjs from 'dayjs';

interface PlaySongProps {
  io: SocketIOClient.Socket;
  phaseData: Domain.PlaySongGamePhaseData;
  gameId: string;
}

const executeAt = (fn: () => void, date: Date) => {
  const timeout = setTimeout(fn, dayjs(date).diff(new Date(), 'ms'));
  return () => clearTimeout(timeout);
}

const PlaySong: FC<PlaySongProps> = ({ gameId, phaseData, io }) => {

  useEffect(() => {
    return executeAt(() => {
      console.log("EXECUTED!")
      const audio = new Audio(phaseData.previewUrl);
      audio.play();
    }, new Date(phaseData.phaseStartDate));
  }, [phaseData.previewUrl])

  const [songQuery, setSongQuery] = useState('');
  const trackSearchQuery = useSpotifyTrackSearch(gameId, songQuery)

  const submitGuessFn = (songName: string, artistName: string) => () => {
    const event: SocketClient.GuessSongEvent = {
      artistName,
      songName,
    }
    io.emit(SocketClient.Events.GuessSong, event);
  }

  return <div>
    <p className="text-3xl text-white"><Countdown date={new Date(phaseData.phaseEndDate)} /></p>
    <p className="text-3xl text-white"><Countdown date={new Date(phaseData.phaseStartDate)} /></p>
    <h1 className="text-center mb-10 text-4xl text-white font-bold">Wie heißt dieser Song?</h1>
    <Input className="w-full" value={songQuery} onChange={e => setSongQuery(e.currentTarget.value)} />
    <div className="grid grid-cols-4 gap-5 mt-7">
      {trackSearchQuery.data?.tracks.items.map(item => (
        <button onClick={submitGuessFn(item.name, item.artists[0].name)} className="bg-green-500 rounded-lg overflow-hidden transform transition hover:scale-110 flex flex-col">
          <img src={item.album.images[0].url} />
          <div className="p-2">
            <span className="font-bold">{item.name}</span> · {item.artists.map(a => a.name).join(', ')}
          </div>
        </button>
      ))}
    </div>
  </div>

}

export default PlaySong;