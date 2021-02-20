import { NextPage } from 'next'
import SpotifyWebApi from 'spotify-web-api-node'

interface HomePageProps {
  spotifyAuthorizeUrl: string;
}

const Home: NextPage<HomePageProps> = (props) => {
  return (
    <div>
      <a href={props.spotifyAuthorizeUrl}>Login mit Spotify</a>
    </div>
  )
}

Home.getInitialProps = (context) => {
  const spotify = new SpotifyWebApi({
    clientId: '01c8e06b52aa40328e5382eca409846c',
    redirectUri: 'http://localhost:3000/spotify-redirect'
  })
  return {
    spotifyAuthorizeUrl: spotify.createAuthorizeURL([], '')
  }
}


export default Home;
