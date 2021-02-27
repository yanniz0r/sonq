import { FC } from "react";
import { CgSpinner } from "react-icons/cg"

const LoadingSpinner: FC = () => {
  return <CgSpinner className="animate-spin" />
}

export default LoadingSpinner;
