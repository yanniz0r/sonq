import { FC, HTMLProps } from "react";

export const Button: FC<HTMLProps<HTMLButtonElement>> = ({ className, ...rest }) => {
  const newClassName = 'bg-purple-700 p-2 px-4 ml-2 rounded-lg disabled:opacity-50 ' + className;
  return <button className={newClassName} {...rest} />
}

export const ButtonLink: FC<HTMLProps<HTMLAnchorElement>> = ({ className, ...rest }) => {
  const newClassName = 'bg-purple-700 p-2 px-4 ml-2 rounded-lg disabled:opacity-50 ' + className;
  return <a className={newClassName} {...rest} />
}