import { Domain, SocketClient } from "@sonq/api";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import useSpotifyTrackSearch from "../../hooks/use-spotify-track-search";
import Countdown from "../countdown";
import Input from "../input";
import dayjs from 'dayjs';
import { FaCheck, FaInfo, FaTimes } from "react-icons/fa";
import useIsAdmin from "../../hooks/use-is-admin";
import { debounce } from 'lodash';
import useCountdown from "../../hooks/use-countdown";
import { useTranslation } from 'react-i18next';
import Alert from "../alert";
import { HIDESONGSEARCHHELP } from "../../constants/local-storage";

interface PlaySongProps {
  io: SocketIOClient.Socket;
  phaseData: Domain.PlaySongGamePhaseData;
  gameId: string;
  volume: number;
}

const executeAt = (fn: () => void, date: Date) => {
  const timeout = setTimeout(fn, dayjs(date).diff(new Date(), 'ms'));
  return () => clearTimeout(timeout);
}

const PlaySong: FC<PlaySongProps> = ({ gameId, phaseData, io, volume }) => {
  const {t} = useTranslation('game');
  const [showSearchHelp, setShowSearchHelp] = useState(typeof window !== 'undefined' && localStorage.getItem(HIDESONGSEARCHHELP) !== 'true')
  const [guessWasCorrect, setGuessWasCorrect] = useState<boolean>();
  const [incorrectGuess, setIncorrectGuess] = useState<string>();
  const [isPreDelay, setPreDelay] = useState(true);
  const startRoundCountdown = useCountdown(new Date(phaseData.phaseStartDate))
  const endRoundCountdown = useCountdown(new Date(phaseData.phaseEndDate))
  const audioRef = useRef<HTMLAudioElement>()

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 10;
    }
  }, [volume])

  useEffect(() => {
    return executeAt(() => {
      setPreDelay(false);
    }, new Date(phaseData.phaseStartDate))
  }, [phaseData.phaseEndDate])

  useEffect(() => {
    return executeAt(() => {
      console.log("EXECUTED!")
      audioRef.current = new Audio(phaseData.previewUrl);
      audioRef.current.volume = volume / 10;
      audioRef.current.play();
    }, new Date(phaseData.phaseStartDate));
  }, [phaseData.previewUrl])

  const [songQueryInput, setSongQueryInput] = useState('');
  const [songQuery, setSongQuery] = useState('');
  const debouncedSetSongQuery = useMemo(() => debounce(setSongQuery, 500), [setSongQuery])

  useEffect(() => {
    debouncedSetSongQuery(songQueryInput);
  }, [songQueryInput]);

  useEffect(() => {
    if (incorrectGuess) {
      setTimeout(() => {
        setIncorrectGuess(undefined);
      }, 1000);
    }
  }, [incorrectGuess])

  const trackSearchQuery = useSpotifyTrackSearch(gameId, songQuery)

  const submitGuessFn = (id: string, songName: string, artistName: string) => () => {
    const event: SocketClient.GuessSongEvent = {
      artistName,
      songName,
    }
    const guessSongAck: SocketClient.GuessSongAck = (correct) => {
      if (!correct) {
        setIncorrectGuess(id)
      }
      setGuessWasCorrect(correct);
    }
    io.emit(SocketClient.Events.GuessSong, event, guessSongAck);
  }

  return <div className="py-20">
    {isPreDelay
      ? <div>
          <h1 className="text-center mb-10 text-4xl text-white font-bold">{t('playSong.roundStartHeadline', { count: startRoundCountdown })}</h1>
        </div>
      : <div>
          <h1 className="text-center mb-4 text-4xl text-white font-bold">{t('playSong.guessSongHeadline')}</h1>
          <p className="text-gray-300 text-center text-lg mb-5">{t('playSong.guessSongDescription', { count: endRoundCountdown })}</p>
          {guessWasCorrect &&
            <div className="bg-green-500 flex p-4 text-white rounded-lg">
              <div className="text-2xl mr-4">
                <FaCheck />
              </div>
              <div>
                <h2 className="font-bold">{t('playSong.guessCorrectAlert')}</h2>
              </div>
            </div>
          }
          {!guessWasCorrect &&
            <>
              {showSearchHelp &&
                <Alert icon={<FaInfo />} className="mb-4" onClose={() => {
                  localStorage.setItem(HIDESONGSEARCHHELP, 'true');
                  setShowSearchHelp(false);
                }}>
                {t('playSong.searchSongHelperText')}
              </Alert>
              }
              <Input className="w-full" value={songQueryInput} onChange={e => setSongQueryInput(e.currentTarget.value)} placeholder="Search for your song guess" />
              <div className="grid grid-cols-4 gap-5 mt-7">
                {trackSearchQuery.data?.tracks.items.map(item => (
                  <button onClick={submitGuessFn(item.id, item.name, item.artists[0].name)} className="bg-green-500 relative rounded-lg overflow-hidden transform transition hover:scale-110 flex flex-col">
                    <img src={item.album.images[0].url} />
                    <div className="p-2">
                      <span className="font-bold">{item.name}</span> · {item.artists.map(a => a.name).join(', ')}
                    </div>
                    {item.id === incorrectGuess &&
                      <div className="absolute top-0 left-0 w-full h-full bg-red-600 bg-opacity-90 text-white flex items-center justify-center">
                        <FaTimes className="text-3xl" />
                      </div>
                    }
                  </button>
                ))}
              </div>
            </>
          }
        </div>
    }
  </div>

}

export default PlaySong;
