import { Domain, SocketClient } from "@sonq/api";
import { FC, useCallback, useState } from "react";
import PlayerScores from "../player-scores";
import { useTranslation } from "react-i18next";
import useIsAdmin from "../../hooks/use-is-admin";
import Link from "next/link";
import { BasePane, DetailPane, PaneButton, PlaylistPane } from "../grid";
import { FaCogs, FaPlay, FaSpotify } from "react-icons/fa";
import Modal from "../modal";
import { Button } from "../button";
import { Toolbar } from "../toolbar";

interface SummaryProps {
  io: SocketIOClient.Socket;
  phaseData: Domain.SummaryGamePhaseData;
  gameId: string;
}

const Summary: FC<SummaryProps> = ({ io, phaseData, gameId }) => {
  const { t } = useTranslation("game");
  const isAdmin = useIsAdmin(gameId);
  const [showSongList, setShowSongList] = useState(false)
  const continueGame = useCallback(() => {
    io.emit(SocketClient.Events.Continue);
  }, [io]);
  const onSongListClose = useCallback(() => {
    setShowSongList(false)
  }, [])
  const onSongListOpen = useCallback(() => {
    setShowSongList(true)
  }, [])

  const noData = <DetailPane
    secondaryText={t('summary.noData.headline')}
    primaryText={t('summary.noData.value')}
    tertiaryText={t('summary.noData.caption')}
  />

  return (
    <div>
      <Modal open={showSongList} close={onSongListClose}>
        <table className="table-auto">
          {phaseData.songs.map((song, index) => (
            <tr key={index}>
              <td className="p-2">
                <img src={song.album.images[0].url} alt={song.album.name} className="w-10 rounded-lg" />
              </td>
              <td className="p-2 px-4 text-lg">
                <span className="font-bold mr-2">{song.name}</span>
                <span className="text-gray-400">{song.artists.map(artist => artist.name).join(', ')}</span>
              </td>
              <td>
                <a href={song.external_urls.spotify}><FaSpotify /></a>
              </td>
            </tr>
          ))}
        </table>
      </Modal>
      <div className="p-5">
        <h1 className="text-3xl font-bold text-gray-200">
          {t("summary.headline")}
        </h1>
        <div className="grid grid-cols-3 grid-rows-4 gap-7">
          <div className="col-span-2 row-span-2">
            <BasePane>
              <div className="p-10">
                <PlayerScores scores={phaseData.score} />
              </div>
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
          <PlaylistPane songs={phaseData.songs} onClick={onSongListOpen} />
        </div>
      </div>
    </div>
  );
};

export default Summary;
