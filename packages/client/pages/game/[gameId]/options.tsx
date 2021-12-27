import { useFormik } from "formik";
import { NextPage } from "next";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaGamepad } from "react-icons/fa";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import useMutateGameOptions from "../../../hooks/use-mutate-game-options";
import Input, { Label } from "../../../components/input";
import { Domain } from "@sonq/api";
import { useRouter } from "next/router";
import useGame from "../../../hooks/use-game";
import useIsAdmin from "../../../hooks/use-is-admin";
import getGameUrl from "../../../helpers/get-game-url";
import PlaylistSelection from "../../../components/playlist-selection";
import Head from "next/head";
import { Toolbar, ToolbarButton } from "../../../components/toolbar";
import Container from "../../../components/container";

interface GameOptionsProps {
  gameId: string;
}

const isClientSide = typeof window !== "undefined";

const GameOptionsPage: NextPage<GameOptionsProps> = ({ gameId }) => {
  const isAdmin = useIsAdmin(gameId);
  const { t } = useTranslation("gameOptions");
  const router = useRouter();
  const formInitiallyPopulatedRef = useRef(false)
  const [justCopied, setJustCopied] = useState(false);

  const copyGameLink = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        text: t("lobby.shareText"),
        title: t("lobby.shareTitle"),
        url: getGameUrl(gameId),
      });
    } else {
      setJustCopied(true);
      window.navigator.clipboard.writeText(getGameUrl(gameId));
    }
  }, [gameId]);

  useEffect(() => {
    if (justCopied) {
      setTimeout(() => {
        setJustCopied(false);
      }, 2000);
    }
  }, [justCopied]);

  useEffect(() => {
    if (isClientSide && !isAdmin) {
      router.replace(`/game/${gameId}`);
    }
  }, [isAdmin]);

  const gameOptionsForm = useFormik<Domain.GameOptions>({
    validateOnMount: true,
    initialValues: {
      rounds: 10,
      spotifyPlaylistId: undefined,
    },
    validationSchema: yup.object({
      rounds: yup.number().required(t('validation.rounds.required')).min(1, t('validation.rounds.min', { count: 1 })).max(100, t('validation.rounds.max', { count: 100 })),
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
    }), true)
  }, [])

  const gameQuery = useGame(gameId, {
    refetchInterval: gameOptionsForm.isSubmitting ? 750 : undefined,
  });

  useEffect(() => {
    if (gameQuery.isSuccess && !formInitiallyPopulatedRef.current) {
      gameOptionsForm.setValues({
        rounds: gameQuery.data.options.rounds,
        spotifyPlaylistId: gameQuery.data.options.spotifyPlaylistId,
      })
      formInitiallyPopulatedRef.current = true
    }
  }, [gameQuery, gameOptionsForm])

  return (
    <form
      className="min-w-screen min-h-screen bg-gray-900 text-white pb-36"
      onSubmit={gameOptionsForm.handleSubmit}
    >
      <Head>
        <title>Sonq - {gameId}</title>
      </Head>
      <Container>
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
      </Container>
      <div className="fixed bottom-0 w-full">
        <Toolbar>
          <div className="grid grid-cols-1 md:grid-cols-2 grid-gap-10">
            <div className="hidden md:block">
            <div>
              <div className="overflow-hidden rounded-lg transform transition hover:scale-110 relative inline-flex flex-col items-center">
                <button
                  onClick={copyGameLink}
                  type="button"
                  className="px-3 py-2 text-lg bg-pink-500 text-white rounded-lg"
                >
                  {getGameUrl(gameId)}
                </button>
                {justCopied && (
                  <div className="absolute bg-pink-700 text-white font-bold h-full w-full flex justify-center items-center">
                    {t("game:copied")}
                  </div>
                )}
              </div>
            </div>
            </div>
            <div className="flex justify-end items-center">
              <span className="hidden md:inline-block text-white opacity-80 mr-4">
                {gameOptionsForm.isSubmitting && t("startGameHint")}
                {!gameOptionsForm.isValid && Object.values(gameOptionsForm.errors)[0]}
              </span>
              <ToolbarButton
                loadingText={`${Math.round((gameQuery.data?.playlistDataDownloadProgress ?? 0) * 100)}%`}
                loading={gameOptionsForm.isSubmitting}
                disableHover={!gameOptionsForm.isValid}
                icon={<FaGamepad className="mr-2" />}
              >
                {t("startGame")}
              </ToolbarButton>
            </div>
          </div>
        </Toolbar>
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
