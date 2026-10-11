import { Domain, SocketClient } from "@sonq/api";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import useSpotifyTrackSearch from "../../hooks/use-spotify-track-search";
import Input from "../input";
import { FaCheck, FaExclamationTriangle, FaInfo, FaPlay, FaStopwatch, FaTimes } from "react-icons/fa";
import { debounce } from "lodash";
import useCountdown from "../../hooks/use-countdown";
import { useTranslation } from "react-i18next";
import Alert from "../alert";
import { HIDESONGSEARCHHELP } from "../../constants/local-storage";
import { Socket } from "socket.io-client";
import { Track } from "@spotify/web-api-ts-sdk";

interface PlaySongProps {
  io: Socket;
  phaseData: Domain.PlaySongGamePhaseData;
  gameId: string;
  volume: number;
}

function applyVolumeOnAudioElement(audio: HTMLAudioElement, volume: number) {
  audio.volume = volume / 10;
}

const PlaySong: FC<PlaySongProps> = ({ gameId, phaseData, io, volume }) => {
  const { t } = useTranslation("game");
  const [canGuess, setCanGuess] = useState(true);
  const [playbackFailure, setPlaybackFailure] = useState(false);
  const [showSearchHelp, setShowSearchHelp] = useState(
    typeof window !== "undefined" &&
      localStorage.getItem(HIDESONGSEARCHHELP) !== "true"
  );
  const [guessWasCorrect, setGuessWasCorrect] = useState<boolean>();
  const [incorrectGuess, setIncorrectGuess] = useState<string>();
  const [isPreDelay, setPreDelay] = useState(true);
  const startRoundCountdown = useCountdown(phaseData.phaseStart);
  const endRoundCountdown = useCountdown(phaseData.phaseEnd);
  const audioRef = useRef<HTMLAudioElement>();

  useEffect(() => {
    if (audioRef.current) {
      applyVolumeOnAudioElement(audioRef.current, volume)
    }
  }, [volume]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPreDelay(false);
    }, phaseData.phaseStart);
    return () => clearTimeout(timeout);
  }, [phaseData.phaseEnd]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      audioRef.current
      try {
        applyVolumeOnAudioElement(audioRef.current, volume)
        await audioRef.current.play();
      } catch (error) {
        console.log('Error caught during playback', error);
        if (error instanceof Error && error.message) {
          if (error.name === 'NotAllowedError') {
            setPlaybackFailure(true)
          }
        }
      }
    }, phaseData.phaseStart);
    return () => clearTimeout(timeout);
  }, [phaseData.previewUrl]);

  const [songQueryInput, setSongQueryInput] = useState("");
  const [songQuery, setSongQuery] = useState("");
  const debouncedSetSongQuery = useMemo(() => debounce(setSongQuery, 500), [
    setSongQuery,
  ]);

  useEffect(() => {
    debouncedSetSongQuery(songQueryInput);
  }, [songQueryInput]);

  useEffect(() => {
    if (incorrectGuess) {
      setTimeout(() => {
        setIncorrectGuess(undefined);
      }, 1000);
    }
  }, [incorrectGuess]);

  const trackSearchQuery = useSpotifyTrackSearch(gameId, songQuery);

  const submitGuessFn = (
    id: string,
    track: Track,
  ) => () => {
    if (!canGuess) return;

    setCanGuess(false);

    setTimeout(() => {
      setCanGuess(true)
    }, 2000)

    const event: SocketClient.GuessSongEvent = {
      artistName: track.artists[0].name,
      songName: track.name,
      spotifyId: track.id,
    };
    const guessSongAck: SocketClient.GuessSongAck = (correct) => {
      if (!correct) {
        setIncorrectGuess(id);
      }
      setGuessWasCorrect(correct);
    };
    io.emit(SocketClient.Events.GuessSong, event, guessSongAck);
  };

  return (
    <div className="py-20">
      <audio ref={audioRef}>
        <source src={phaseData.previewUrl} />
      </audio>
      {isPreDelay ? (
        <div>
          <h1 className="text-center mb-10 text-4xl text-white font-bold">
            {t("playSong.roundStartHeadline", { count: startRoundCountdown })}
          </h1>
        </div>
      ) : (
        <div>
          <h1 className="text-center mb-4 text-4xl text-white font-bold">
            {t("playSong.guessSongHeadline")}
          </h1>
          <p className="text-gray-300 text-center text-lg mb-5">
            {t("playSong.guessSongDescription", { count: endRoundCountdown })}
          </p>
          {guessWasCorrect && (
            <div className="bg-green-500 flex p-4 text-white rounded-lg">
              <div className="text-2xl mr-4">
                <FaCheck />
              </div>
              <div>
                <h2 className="font-bold">{t("playSong.guessCorrectAlert")}</h2>
              </div>
            </div>
          )}
          {!guessWasCorrect && (
            <>
              {showSearchHelp && (
                <Alert
                  icon={<FaInfo />}
                  className="mb-4"
                  onClose={() => {
                    localStorage.setItem(HIDESONGSEARCHHELP, "true");
                    setShowSearchHelp(false);
                  }}
                >
                  {t("playSong.searchSongHelperText")}
                </Alert>
              )}
              {playbackFailure && (
                <>
                  <div className="flex justify-center">
                    <button onClick={() => {
                      audioRef.current.play()
                      setPlaybackFailure(false)
                    }} className="text-3xl text-white bg-pink-600 p-10 rounded-full mb-5 transform transition hover:scale-110">
                      <FaPlay />
                    </button>
                  </div>
                  <Alert
                    type="warning"
                    icon={<FaExclamationTriangle/>}
                    className="mb-4"
                    >
                    {t("playSong.playbackFailureHelperText")}
                  </Alert>
                </>
              )}
              <Input
                className="w-full"
                value={songQueryInput}
                onChange={(e) => setSongQueryInput(e.currentTarget.value)}
                placeholder="Search for your song guess"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mt-7">
                {trackSearchQuery.data?.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={submitGuessFn(item.id, item)}
                    className="bg-pink-600 relative rounded-lg overflow-hidden transform transition hover:scale-110 flex flex-col"
                  >
                    <img src={item.album.images[0].url} />
                    <div className="p-2">
                      <span className="font-bold">{item.name}</span> ·{" "}
                      {item.artists.map((a) => a.name).join(", ")}
                    </div>
                    {item.id === incorrectGuess && (
                      <div className="absolute top-0 left-0 w-full h-full bg-red-600 bg-opacity-90 text-white flex items-center justify-center">
                        <FaTimes className="text-3xl" />
                      </div>
                    )}
                    {item.id !== incorrectGuess && !canGuess && (
                      <div className="absolute top-0 left-0 w-full h-full bg-white bg-opacity-50 text-gray-800 flex flex-col items-center justify-center">
                        <FaStopwatch className="text-3xl" />
                        <span className="uppercase text-lg mt-2">
                          {t('playSong.cooldown')}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaySong;
