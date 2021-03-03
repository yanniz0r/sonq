import getConfig from 'next/config';

const config = getConfig();

const getGameUrl = (gameId: string) => {
  return `${config.publicRuntimeConfig.clientUrl}/game/${gameId}`;
}

export default getGameUrl;