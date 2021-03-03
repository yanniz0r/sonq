import { NextPage } from 'next'
import SpotifyWebApi from 'spotify-web-api-node'
import { FaInfo, FaSpotify } from 'react-icons/fa';
import getConfig from 'next/config';

const config = getConfig();

interface HomePageProps {
  spotifyAuthorizeUrl: string;
}

const Home: NextPage<HomePageProps> = (props) => {
  return (
    <div>
      <div className="text-white fixed w-full bg-black bg-opacity-70">
        <div className="max-w-screen-lg mx-auto flex">
          <div className="p-5">
            <div className="text-4xl font-bold mb-1">
              Son<span className="text-pink-600">q</span>
            </div>
            <div className="text-white text-opacity-50 text-xs">
              Interactive Song guessing
            </div>
          </div>
        </div>
      </div>
      <div className="flex py-52 px-5 md:py-80 flex-col items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center">
          <h1 className="text-6xl text-gray-200">Song Raten in <span className="font-bold">Modern</span></h1>
          <a href={props.spotifyAuthorizeUrl} style={{ background: '#1DD05D' }} className="text-white p-4 px-5 inline-flex items-center font-bold rounded-full mt-10 transform transition hover:scale-110">
            <FaSpotify className="mr-2 text-xl" />
            Start with Spotify
          </a>
        </div>
      </div>
      <div className="bg-pink-600 px-5 py-10 md:py-20 text-white">
        <div className="max-w-screen-lg mx-auto">
          <h2 className="text-center text-3xl font-bold">How good do you know popular songs?</h2>
          <p className="text-center mt-5 text-lg">Challenge your friends/colleagues/whatever in a competative song guessing game</p>
        </div>
      </div>
      <div className="py-10 md:py-20 px-5 bg-gray-50">
        <div className="max-w-screen-lg mx-auto">
          <h2 className="text-4xl font-bold text-gray-900">What's the deal</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-2xl font-bold text-pink-600 pt-4">You choose the playlist</h3>
              <p className="pt-3 text-lg">
                You select a playlist that you want to play so you don't have to worry about songs that nobody knows.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-pink-600 pt-4">Play in a group</h3>
              <p className="pt-3 text-lg">
                By sharing the link with your buddies you can start a comepetative song-guessing-match.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-pink-600 pt-4">Enjoy spotify features</h3>
              <p className="pt-3 text-lg">
                This whole beast is backed by the spotify API. Therfore you can access all those fance spotify features.
              </p>
            </div>
          </div>
          <div className="bg-blue-100 p-5 mt-10 flex rounded-lg">
            <div className="mr-5 text-blue-600 text-3xl mt-2">
              <FaInfo />
            </div>
            <div>
              <h3 className="font-bold">But why do I have to sign in?</h3>
              In order to access functions of spotify, the person creating a game has to sign in with their spotify account. We do nothing else than requesting spotifies data with your account. If you do not trust us, you can have a look at the <a href="https://github.com/yanniz0r/sonq" className="text-blue-600">source code</a>.
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-900 py-20">
        <div className="max-w-screen-lg mx-auto">
          <p className="text-center text-gray-200">Built with heart by <a href="https://github.com/yanniz0r/sonq" className="text-pink-600">yanniz0r</a></p>
        </div>
      </div>
    </div>
  )
}

Home.getInitialProps = () => {
  const spotify = new SpotifyWebApi({
    clientId: config.spotifyClientId,
    redirectUri: `${config.clientUrl}/spotify-redirect`
  })
  return {
    spotifyAuthorizeUrl: spotify.createAuthorizeURL([], '')
  }
}


export default Home;
