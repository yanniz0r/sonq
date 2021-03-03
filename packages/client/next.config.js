module.exports = {
  publicRuntimeConfig: {
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID ?? '01c8e06b52aa40328e5382eca409846c',
    serverUrl: process.env.SERVER_URL ?? 'http://localhost:4000',
    clientUrl: process.env.CLIENT_URL ?? 'http://localhost:3000'
  },
}