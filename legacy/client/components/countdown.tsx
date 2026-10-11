import { FC, useEffect, useState } from "react";
import dayjs from "dayjs";

interface CountdownProps {
  date: Date;
}

const differenceToNowInSeconds = (date: Date) => {
  return dayjs(date).diff(new Date(), "s");
};

const Countdown: FC<CountdownProps> = ({ date }) => {
  const [seconds, setSeconds] = useState(differenceToNowInSeconds(date));

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(differenceToNowInSeconds(date));
    }, 250);
    return () => clearInterval(id);
  }, [date]);

  return <>{seconds >= 0 ? seconds : 0}</>;
};

export default Countdown;
