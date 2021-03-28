import { FC } from "react";

export const Toolbar: FC = ({ children }) => {
  return <div className="bg-pink-600 text-white w-full shadow-xl">
    <div className="mx-auto max-w-screen-lg p-5">
      {children}
    </div>
  </div>
}