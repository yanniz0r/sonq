import { FC } from "react";
import Container from "./container";

export const Toolbar: FC = ({ children }) => {
  return <div className="bg-pink-600 text-white w-full shadow-xl">
    <Container>
      <div className="py-5">
        {children}
      </div>
    </Container>
  </div>
}