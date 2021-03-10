import { FC, ReactNode } from "react";
import { FaTimes } from "react-icons/fa";

interface AlertProps {
  icon?: ReactNode;
  type?: "info" | "error";
  className?: string;
  onClose?(): void;
}

const Alert: FC<AlertProps> = ({
  children,
  icon,
  type,
  className,
  onClose,
}) => {
  let backgroundColor: string;

  switch (type) {
    case "error":
      backgroundColor = "bg-red-500";
      break;
    default:
      backgroundColor = "bg-blue-500";
  }

  return (
    <div
      className={`p-4 ${backgroundColor} relative rounded-lg text-white flex ${
        className ?? ""
      }`}
    >
      {icon && <div className="pr-3 text-xl mt-1">{icon}</div>}
      <div className="text-lg">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`w-7 h-7 absolute -top-2 -right-2  ${backgroundColor} flex items-center justify-center rounded-full`}
        >
          <FaTimes />
        </button>
      )}
    </div>
  );
};

export default Alert;
