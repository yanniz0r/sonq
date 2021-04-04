import { FC } from "react";

const Container: FC = ({ children }) => {
  return <div className="mx-auto max-w-screen-lg px-5">
    {children}
  </div>
}

export default Container
