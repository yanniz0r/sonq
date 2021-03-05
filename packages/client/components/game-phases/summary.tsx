import { Domain, SocketClient } from "@sonq/api";
import { FC, useCallback } from "react";
import { Button, ButtonLink } from "../button";
import PlayerScores from "../player-scores";
import {useTranslation} from "react-i18next";
import useIsAdmin from "../../hooks/use-is-admin";
import Link from 'next/link'

interface SummaryProps {
  io: SocketIOClient.Socket;
  phaseData: Domain.SummaryGamePhaseData;
  gameId: string;
}

const Summary: FC<SummaryProps> = ({ io, phaseData, gameId }) => {
  const {t} = useTranslation('game');
  const isAdmin = useIsAdmin(gameId);
  const continueGame = useCallback(() => {
    io.emit(SocketClient.Events.Continue);
  }, [io])

  return <div className="py-20">
    <h1 className="text-3xl font-bold text-gray-200">{t('summary.headline')}</h1>
    <PlayerScores scores={phaseData.score} />
    <Button onClick={continueGame} className="mr-2">{t('summary.startNextRound')}</Button>
    {isAdmin &&
      <Link href={`/game/${gameId}/options`} passHref>
        <ButtonLink onClick={continueGame}>{t('summary.options')}</ButtonLink>
      </Link>
    }
  </div>
}

export default Summary;