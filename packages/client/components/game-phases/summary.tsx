import { Domain } from "@sonq/api";
import { FC, useCallback, useState } from "react";
import PlayerScores from "../player-scores";
import { useTranslation } from "react-i18next";
import { BasePane, DetailPane, PlaylistPane } from "../grid";
import { FaSpotify } from "react-icons/fa";
import Modal from "../modal";

interface SummaryProps {
  io: SocketIOClient.Socket;
  phaseData: Domain.SummaryGamePhaseData;
  gameId: string;
}

const Summary: FC<SummaryProps> = ({ phaseData }) => {
  const { t } = useTranslation("game");
  const [showSongList, setShowSongList] = useState(false)
  const onSongListClose = useCallback(() => {
    setShowSongList(false)
  }, [])
  const onSongListOpen = useCallback(() => {
    setShowSongList(true)
  }, [])

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
      <div className="p-5 md:py-10">
        <h1 className="text-gray-200 text-3xl md:text-5xl font-bold mb-10">
          {t("summary.headline")}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-4 gap-7">
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
            : <DetailPane 
                secondaryText={t('summary.fastestAnswer.headline')}
                primaryText={t('summary.noData')}
              />
          }
          {phaseData.leastWrongAnswers
            ? <DetailPane 
                secondaryText={t('summary.mostPrecise.headline')}
                primaryText={phaseData.leastWrongAnswers.player.username}
                tertiaryText={t('summary.mostPrecise.caption', { count: phaseData.leastWrongAnswers.value, player: phaseData.leastWrongAnswers.player.username })}
              />
            : <DetailPane 
                secondaryText={t('summary.mostPrecise.headline')}
                primaryText={t('summary.noData')}
              />
          }
          {phaseData.mostWrongAnswers
            ? <DetailPane 
                secondaryText={t('summary.mostEffort.headline')}
                primaryText={phaseData.mostWrongAnswers.player.username}
                tertiaryText={t('summary.mostEffort.caption', { count: phaseData.mostWrongAnswers.value, player: phaseData.mostWrongAnswers.player.username })}
              />
            : <DetailPane 
                secondaryText={t('summary.mostEffort.headline')}
                primaryText={t('summary.noData')}
              />
          }
          {phaseData.closestCall
            ? <DetailPane 
                secondaryText={t('summary.closestCall.headline')}
                primaryText={phaseData.closestCall ? phaseData.closestCall.player.username : t('summary.noData')}
                tertiaryText={t('summary.closestCall.caption', { count: phaseData.closestCall.value, player: phaseData.closestCall.player.username })}
              />
            : <DetailPane 
                secondaryText={t('summary.closestCall.headline')}
                primaryText={t('summary.noData')}
              />
          }
          <PlaylistPane songs={phaseData.songs} onClick={onSongListOpen} />
        </div>
      </div>
    </div>
  );
};

export default Summary;
