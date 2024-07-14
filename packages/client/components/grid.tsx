import { FC, ReactNode } from "react";

export const BasePane: FC = ({ children }) => {
  return <div className="bg-black bg-opacity-20 h-full w-full rounded-xl overflow-hidden">
    {children}
  </div>
}

interface DetailPaneProps {
  primaryText: string;
  secondaryText: string;
  tertiaryText?: string;
}

export const DetailPane: FC<DetailPaneProps> = ({primaryText, secondaryText, tertiaryText, children}) => {
  return <BasePane>
    <div className="p-10 w-full h-full flex flex-col justify-center">
      <span className="text-gray-300 text-xl font-bold">{secondaryText}</span>
      <h2 className="text-4xl break-words font-extrabold mb text-pink-600 my-2 line-clamp-3">{primaryText}</h2>
      {tertiaryText && <p className="text-gray-400 text-xs">{tertiaryText}</p>}
      {children && 
        <div>
          {children}
        </div>
      }
    </div>
  </BasePane>
}

interface PlaylistGridProps {
  songs: any[] // FIXME: Type this
  onClick?(): void;
}

export const PlaylistPane: FC<PlaylistGridProps> = ({ songs, onClick }) => {
  let content: ReactNode;

  if (songs.length === 0) {
    content = <img src="http://placekitten.com/400/400" />
  } else if (songs.length < 4) {
    content = <img src={songs[0].album.images[0].url} />
  } else {
    const songsToShow = songs.slice(0, 4);
    content = <div className="grid grid-cols-2 grid-rows-2">
       {songsToShow.map(songToShow => (
         <img src={songToShow.album.images[0].url} />
       ))}
    </div>
  }

  return <button onClick={onClick} className="transition transform hover:scale-110">
    <BasePane>
      {content}
    </BasePane>
  </button>
}

interface PaneButtonProps {
  icon: ReactNode
  text: string
}
export const PaneButton: FC<PaneButtonProps> = ({icon, text}) => {
  return <button className="transition transform hover:scale-110">
    <BasePane>
      <div className="bg-pink-600 text-white p-5 flex flex-col justify-center">
        <div className="flex justify-center text-7xl mb-5">
          {icon}
        </div>
        <h2 className="text-center font-bold text-3xl" >
          {text}
        </h2>
      </div>
    </BasePane>
  </button>
}
