module.exports = {
  publicRuntimeConfig: {
    spotifyClientId:
      process.env.SPOTIFY_CLIENT_ID ?? "392a9888d640453188dd42ed62d99939",
    serverUrl: process.env.SERVER_URL ?? "http://localhost:4000",
    clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
  },
};
