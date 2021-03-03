import dayjs from "dayjs";
import { useEffect, useState } from "react";

const differenceToNowInSeconds = (date: Date) => {
  return dayjs(date).diff(new Date(), 's')
}

const useCountdown = (date: Date) => {
  const [seconds, setSeconds] = useState(differenceToNowInSeconds(date));
  useEffect(() => {
    const id = setInterval(() => {
      const newSeconds = differenceToNowInSeconds(date);
      if (newSeconds < 0) {
        clearInterval(id);
        return;
      }
      setSeconds(newSeconds);
    }, 250);
    return () => clearInterval(id);
  }, [date])
  return seconds;
}

export default useCountdown;
