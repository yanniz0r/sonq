import { Domain, SocketClient } from "@sonq/api";
import { FC, useCallback } from "react";
import PlayerScores from "../player-scores";
import { useTranslation } from "react-i18next";
import useIsAdmin from "../../hooks/use-is-admin";
import Link from "next/link";
import { BasePane, DetailPane, PaneButton, PlaylistGrid } from "../grid";
import { FaCogs, FaPlay } from "react-icons/fa";

interface SummaryProps {
  io: SocketIOClient.Socket;
  phaseData: Domain.SummaryGamePhaseData;
  gameId: string;
}

const Summary: FC<SummaryProps> = ({ io, phaseData, gameId }) => {
  const { t } = useTranslation("game");
  const isAdmin = useIsAdmin(gameId);
  const continueGame = useCallback(() => {
    io.emit(SocketClient.Events.Continue);
  }, [io]);

  const noData = <DetailPane
    secondaryText={t('summary.noData.headline')}
    primaryText={t('summary.noData.value')}
    tertiaryText={t('summary.noData.caption')}
  />
  return (
    <div className="py-20">
      <h1 className="text-3xl font-bold text-gray-200">
        {t("summary.headline")}
      </h1>
      <div className="grid grid-cols-3 grid-rows-4 gap-7">
        <div className="col-span-2 row-span-2">
          <BasePane>
            <PlayerScores scores={phaseData.score} />
          </BasePane>
        </div>
        {phaseData.fastestAnswer
          ? <DetailPane 
              secondaryText={t('summary.fastestAnswer.headline')}
              primaryText={phaseData.fastestAnswer.player.username}
              tertiaryText={t('summary.fastestAnswer.caption', { count: phaseData.fastestAnswer?.value, player: phaseData.fastestAnswer?.player.username })}
            />
          : noData
        }
        {phaseData.leastWrongAnswers
          ? <DetailPane 
              secondaryText={t('summary.mostPrecise.headline')}
              primaryText={phaseData.leastWrongAnswers.player.username}
              tertiaryText={t('summary.mostPrecise.caption', { count: phaseData.leastWrongAnswers.value, player: phaseData.leastWrongAnswers.player.username })}
            />
          : noData
        }
        {phaseData.mostWrongAnswers
          ? <DetailPane 
              secondaryText={t('summary.mostEffort.headline')}
              primaryText={phaseData.mostWrongAnswers.player.username}
              tertiaryText={t('summary.mostEffort.caption', { count: phaseData.mostWrongAnswers.value, player: phaseData.mostWrongAnswers.player.username })}
            />
          : noData
        }
        {phaseData.closestCall
          ? <DetailPane 
              secondaryText={t('summary.closestCall.headline')}
              primaryText={phaseData.closestCall ? phaseData.closestCall.player.username : t('summary.noData')}
              tertiaryText={t('summary.closestCall.caption', { count: phaseData.closestCall.value, player: phaseData.closestCall.player.username })}
            />
          : noData
        }
        <PlaylistGrid songs={phaseData.songs} />
        
        {isAdmin && 
          <>
            <PaneButton icon={<FaCogs />} text="Edit game" />
            <Link href={`/game/${gameId}/options`}>
              <PaneButton icon={<FaPlay />} text="Start again" />
            </Link>
          </>
        }
      </div>
    </div>
  );
};

export default Summary;
