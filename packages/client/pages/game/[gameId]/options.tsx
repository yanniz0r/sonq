import { useFormik } from "formik";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import { FaGamepad, FaUser } from "react-icons/fa";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import SpotifyPlaylistTile from "../../../components/spotify-playlist-tile";
import useMutateGameOptions from "../../../hooks/use-mutate-game-options";
import useSpotifyPlaylistSearch from "../../../hooks/use-spotify-playlist-search";
import Input, { Label } from "../../../components/input";
import { Domain } from "@sonq/api";
import LoadingSpinner from "../../../components/loading-spinner";
import { useRouter } from "next/router";
import useGame from "../../../hooks/use-game";
import useIsAdmin from "../../../hooks/use-is-admin";
import Alert from "../../../components/alert";
import getGameUrl from "../../../helpers/get-game-url";

interface GameOptionsProps {
  gameId: string;
}

const queryPresets = [
  "2000s",
  "1990s",
  "1980s",
  "rock",
  "metal",
  "copyright free",
];

const isClientSide = typeof window !== "undefined";

const GameOptionsPage: NextPage<GameOptionsProps> = ({ gameId }) => {
  const isAdmin = useIsAdmin(gameId);
  const { t } = useTranslation("gameOptions");
  const [query, setQuery] = useState("");
  const router = useRouter();
  const searchForm = useFormik<{ query: string }>({
    initialValues: {
      query: "",
    },
    validationSchema: yup.object({
      query: yup.string().required().min(2),
    }),
    onSubmit(values) {
      setQuery(values.query);
    },
  });

  useEffect(() => {
    if (isClientSide && !isAdmin) {
      router.replace(`/game/${gameId}`);
    }
  }, [isAdmin]);

  const gameOptionsForm = useFormik<Domain.GameOptions>({
    initialValues: {
      rounds: 15,
    },
    async onSubmit(values) {
      await mutateGameOptions.mutateAsync(values);
      router.push(`/game/${gameId}`);
    },
  });

  const mutateGameOptions = useMutateGameOptions(gameId);
  const playlistsQuery = useSpotifyPlaylistSearch(gameId, query);

  const setPlaylistIdFn = (spotifyPlaylistId: string) => () => {
    gameOptionsForm.setValues({
      ...gameOptionsForm.values,
      spotifyPlaylistId,
    });
  };

  const gameQuery = useGame(gameId, {
    enabled: gameOptionsForm.isSubmitting,
    refetchInterval: gameOptionsForm.isSubmitting ? 750 : undefined,
  });

  return (
    <form
      className="min-w-screen min-h-screen bg-gray-900 text-white"
      onSubmit={gameOptionsForm.handleSubmit}
    >
      <div className="max-w-screen-lg mx-auto px-5 pb-32">
        <h2 className="text-5xl pt-7">{t("selectPlaylist")}</h2>
        <div className="flex mt-7">
          <Input
            name="query"
            value={searchForm.values.query}
            onChange={searchForm.handleChange}
            onKeyDown={(e) => {
              if(e.key === 'Enter') {
                e.preventDefault();
                searchForm.submitForm()
              }
            }}
          />
          <button
            type="button"
            className="bg-purple-700 p-2 px-4 rounded-lg disabled:opacity-50 ml-2"
            disabled={!searchForm.isValid}
            onClick={searchForm.submitForm}
          >
            {t("searchPlaylist")}
          </button>
        </div>
        <ul className="mt-4">
          {queryPresets.map((preset) => (
            <button
              type="button"
              className="p-2 bg-blue-400 font-bold mr-2 text-sm rounded-lg transform transition hover:scale-110"
              onClick={() => setQuery(preset)}
            >
              {preset}
            </button>
          ))}
        </ul>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-7">
          {playlistsQuery.isSuccess &&
            playlistsQuery.data.playlists.items.map((playlist) => {
              return (
                <SpotifyPlaylistTile
                  selected={
                    playlist.id === gameOptionsForm.values.spotifyPlaylistId
                  }
                  onClick={setPlaylistIdFn(playlist.id)}
                  playlist={playlist}
                />
              );
            })}
        </div>

        <h2 className="text-5xl pt-7">{t("gameOptionsHeadline")}</h2>
        <div className="mt-7">
          <Label>
            {t("rounds")}
            <Input
              type="number"
              value={gameOptionsForm.values.rounds}
              name="rounds"
              onChange={gameOptionsForm.handleChange}
            />
          </Label>
        </div>
      </div>
      <div className="fixed bg-pink-600 text-white w-full p-5 shadow-xl bottom-0">
        <div className="mx-auto max-w-screen-lg grid grid-cols-2 grid-gap-10 px-5">
          <div>
            <input
              className="bg-pink-500 p-2 px-4 rounded-lg"
              value={getGameUrl(gameId)}
            />
          </div>
          <div className="flex justify-end items-center">
            {gameOptionsForm.isSubmitting && (
              <span className="text-white opacity-80 mr-2">
                {t("startGameHint")}
              </span>
            )}
            <button
              type="submit"
              className="bg-pink-700 relative px-4 p-2 rounded-lg font-bold disabled:opacity-50"
            >
              <div
                className={`flex items-center ${
                  gameOptionsForm.isSubmitting ? "opacity-0" : "opacity-100"
                }`}
              >
                <FaGamepad className="mr-2" />
                {t("startGame")}
              </div>
              {gameOptionsForm.isSubmitting && (
                <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center">
                  <LoadingSpinner />
                  <span className="ml-2">
                    {Math.round(
                      (gameQuery.data?.playlistDataDownloadProgress ?? 0) * 100
                    )}
                    %
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

GameOptionsPage.getInitialProps = (context) => {
  return {
    gameId: context.query.gameId as string,
  };
};

export default GameOptionsPage;
