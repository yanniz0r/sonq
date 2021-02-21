import { NextPage } from 'next'
import SpotifyWebApi from 'spotify-web-api-node'
import { FaSpotify } from 'react-icons/fa';

interface HomePageProps {
  spotifyAuthorizeUrl: string;
}

const Home: NextPage<HomePageProps> = (props) => {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center">
        <h1 className="text-6xl text-gray-200">Song Raten in <span className="font-bold">Modern</span></h1>
        <a href={props.spotifyAuthorizeUrl} style={{ background: '#1DD05D' }} className="text-white p-4 inline-flex items-center font-bold rounded-full mt-10 transform transition hover:scale-110">
          <FaSpotify className="mr-2 text-xl" />
          Mit Spotify starten
        </a>
      </div>
    </div>
  )
}

Home.getInitialProps = () => {
  const spotify = new SpotifyWebApi({
    clientId: '01c8e06b52aa40328e5382eca409846c',
    redirectUri: 'http://localhost:3000/spotify-redirect'
  })
  return {
    spotifyAuthorizeUrl: spotify.createAuthorizeURL([], '')
  }
}


export default Home;
