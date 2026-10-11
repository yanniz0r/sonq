import { ADMINKEY } from "../constants/local-storage";

const useIsAdmin = (gameId: string) => {
  return (
    typeof window !== "undefined" &&
    Boolean(localStorage.getItem(ADMINKEY(gameId)))
  );
};

export default useIsAdmin;
