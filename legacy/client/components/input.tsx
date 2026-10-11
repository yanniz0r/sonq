import { FC, HTMLProps } from "react";

const Input: FC<HTMLProps<HTMLInputElement>> = ({ className, ...props }) => {
  return (
    <input
      className={`flex-grow rounded-lg bg-gray-800 p-2 px-4 text-gray-200 text-lg min-w-0 ${className}`}
      {...props}
    />
  );
};

export const InputErrorMessage: FC = ({ children }) => {
  return <div className="text-red-600">{children}</div>;
};

export const Label: FC = ({ children }) => {
  return (
    <label className="flex flex-col text-lg text-gray-400">{children}</label>
  );
};

export default Input;
