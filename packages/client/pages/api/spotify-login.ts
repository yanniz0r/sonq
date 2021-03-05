import { NextApiHandler } from "next";
import getConfig from "next/config"
import SpotifyWebApi from "spotify-web-api-node";

const SpotifyLoginHandler: NextApiHandler = (_request, response) => {
  const config = getConfig();
  const spotify = new SpotifyWebApi({
    clientId: config.publicRuntimeConfig.spotifyClientId,
    redirectUri: `${config.publicRuntimeConfig.clientUrl}/spotify-redirect`
  })
  const authorizeUrl = spotify.createAuthorizeURL([], '')
  response.redirect(authorizeUrl);
}

export default SpotifyLoginHandler;
