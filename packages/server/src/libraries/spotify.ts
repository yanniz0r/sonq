import SpotifyWebApi from "spotify-web-api-node";
import dotenv from "dotenv";

dotenv.config();

const spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: "http://localhost:3000/spotify-redirect",
});

export default spotify;
