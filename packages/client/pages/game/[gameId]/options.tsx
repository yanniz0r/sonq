import { useFormik } from "formik";
import { NextPage } from "next";
import { useCallback, useEffect, useState } from "react";
import { FaGamepad } from "react-icons/fa";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import useMutateGameOptions from "../../../hooks/use-mutate-game-options";
import Input, { Label } from "../../../components/input";
import { Domain } from "@sonq/api";
import LoadingSpinner from "../../../components/loading-spinner";
import { useRouter } from "next/router";
import useGame from "../../../hooks/use-game";
import useIsAdmin from "../../../hooks/use-is-admin";
import getGameUrl from "../../../helpers/get-game-url";
import PlaylistSelection from "../../../components/playlist-selection";

interface GameOptionsProps {
  gameId: string;
}

const isClientSide = typeof window !== "undefined";

const GameOptionsPage: NextPage<GameOptionsProps> = ({ gameId }) => {
  const isAdmin = useIsAdmin(gameId);
  const { t } = useTranslation("gameOptions");
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (isClientSide && !isAdmin) {
      router.replace(`/game/${gameId}`);
    }
  }, [isAdmin]);

  const gameOptionsForm = useFormik<Domain.GameOptions>({
    validateOnMount: true,
    initialValues: {
      rounds: 15,
      spotifyPlaylistId: undefined,
    },
    validationSchema: yup.object({
      rounds: yup.number().required(t('validation.rounds.required')).min(1, t('validation.rounds.min', { count: 10 })).max(100, t('validation.rounds.max', { count: 10 })),
      spotifyPlaylistId: yup.string().required(t('validation.spotifyPlaylist.required')),
    }),
    async onSubmit(values) {
      await mutateGameOptions.mutateAsync(values);
      router.push(`/game/${gameId}`);
    },
  });

  const mutateGameOptions = useMutateGameOptions(gameId);

  const onPlaylistSelect = useCallback((spotifyPlaylistId: string) => {
    gameOptionsForm.setValues((oldValues) => ({
      ...oldValues,
      spotifyPlaylistId,
    }))
  }, [])

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
        <h2 className="text-3xl md:text-5xl pt-7">{t("selectPlaylist")}</h2>
        <PlaylistSelection gameId={gameId} onSelect={onPlaylistSelect} selectedPlaylist={gameOptionsForm.values.spotifyPlaylistId} />
        <h2 className="text-3xl md:text-5xl pt-7">{t("gameOptionsHeadline")}</h2>
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
        <div className="mx-auto max-w-screen-lg grid grid-cols-1 md:grid-cols-2 grid-gap-10 px-5">
          <div className="hidden md:block">
            <input
              className="bg-pink-500 p-2 px-4 rounded-lg"
              readOnly
              value={getGameUrl(gameId)}
            />
          </div>
          <div className="flex justify-end items-center">
            <span className="hidden md:inline-block text-white opacity-80 mr-4">
              {gameOptionsForm.isSubmitting && t("startGameHint")}
              {!gameOptionsForm.isValid && Object.values(gameOptionsForm.errors)[0]}
            </span>
            <button
              disabled={!gameOptionsForm.isValid}
              type="submit"
              className={`bg-pink-700 relative px-4 p-2 rounded-lg font-bold disabled:opacity-50 w-full md:w-auto transform transition ${gameOptionsForm.isValid ? 'hover:scale-110' : ''}`}
            >
              <div
                className={`flex items-center justify-center ${
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
