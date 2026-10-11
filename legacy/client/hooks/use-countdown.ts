import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";

const differenceToNowInSeconds = (someDate: Date) => {
  return dayjs(new Date()).diff(someDate, "s");
};

const useCountdown = (countDownFrom: number) => {
  const startDateRef = useRef(new Date());
  const [seconds, setSeconds] = useState(Math.round(countDownFrom / 1000));
  useEffect(() => {
    const id = setInterval(() => {
      const diff = differenceToNowInSeconds(startDateRef.current);
      const newSeconds = Math.round(countDownFrom / 1000 - diff);
      if (newSeconds < 0) {
        clearInterval(id);
        return;
      }
      setSeconds(newSeconds);
    }, 250);
    return () => clearInterval(id);
  }, []);
  return seconds;
};

export default useCountdown;
