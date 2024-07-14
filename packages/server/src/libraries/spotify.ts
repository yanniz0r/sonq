import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import dotenv from "dotenv";

dotenv.config();

const spotify = SpotifyApi.withClientCredentials(
  process.env.SPOTIFY_CLIENT_ID!,
  process.env.SPOTIFY_CLIENT_SECRET!,
);

export default spotify;
