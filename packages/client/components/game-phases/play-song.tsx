import { Domain, SocketClient } from "@sonq/api";
import { FC, useEffect, useMemo, useState } from "react";
import useSpotifyTrackSearch from "../../hooks/use-spotify-track-search";
import Countdown from "../countdown";
import Input from "../input";
import dayjs from 'dayjs';
import { FaCheck } from "react-icons/fa";
import useIsAdmin from "../../hooks/use-is-admin";
import { debounce } from 'lodash';

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
  const [guessWasCorrect, setGuessWasCorrect] = useState<boolean>();
  useEffect(() => {
    return executeAt(() => {
      console.log("EXECUTED!")
      const audio = new Audio(phaseData.previewUrl);
      audio.play();
    }, new Date(phaseData.phaseStartDate));
  }, [phaseData.previewUrl])

  const [songQueryInput, setSongQueryInput] = useState('');
  const [songQuery, setSongQuery] = useState('');
  const debouncedSetSongQuery = useMemo(() => debounce(setSongQuery, 500), [setSongQuery])

  useEffect(() => {
    debouncedSetSongQuery(songQueryInput);
  }, [songQueryInput]);

  const trackSearchQuery = useSpotifyTrackSearch(gameId, songQuery)

  const submitGuessFn = (songName: string, artistName: string) => () => {
    const event: SocketClient.GuessSongEvent = {
      artistName,
      songName,
    }
    const guessSongAck: SocketClient.GuessSongAck = setGuessWasCorrect;
    io.emit(SocketClient.Events.GuessSong, event, guessSongAck);
  }

  return <div>
    <p className="text-3xl text-white"><Countdown date={new Date(phaseData.phaseEndDate)} /></p>
    <p className="text-3xl text-white"><Countdown date={new Date(phaseData.phaseStartDate)} /></p>
    <h1 className="text-center mb-10 text-4xl text-white font-bold">Wie heißt dieser Song?</h1>
    {guessWasCorrect &&
      <div className="bg-green-500 flex p-4 text-white rounded-lg">
        <div className="text-2xl mr-4">
          <FaCheck />
        </div>
        <div>
          <h2 className="font-bold">Du hast den Song erfolgreich erraten</h2>
        </div>
      </div>
    }
    {!guessWasCorrect &&
      <>
        <Input className="w-full" value={songQueryInput} onChange={e => setSongQueryInput(e.currentTarget.value)} placeholder="Search for your song guess" />
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
      </>
    }
  </div>

}

export default PlaySong;
