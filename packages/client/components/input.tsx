import { FC, HTMLProps } from "react";

const Input: FC<HTMLProps<HTMLInputElement>> = (props) => {
  return <input className="flex-grow rounded-lg bg-gray-800 p-2 px-4" {...props} />
}

export const InputErrorMessage: FC = ({ children }) => {
  return <div className="text-red-600">
    {children}
  </div>
}

export default Input;
