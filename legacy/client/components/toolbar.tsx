import { FC, HTMLAttributes, ReactNode } from "react";
import Container from "./container";
import LoadingSpinner from "./loading-spinner";

export const Toolbar: FC = ({ children }) => {
  return <div className="bg-pink-600 text-white w-full shadow-xl">
    <Container>
      <div className="py-5">
        {children}
      </div>
    </Container>
  </div>
}

interface ToolbarButtonProps extends HTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  icon?: ReactNode
  disableHover?: boolean
}

export const ToolbarButton: FC<ToolbarButtonProps> = ({ loading, loadingText, icon, children, disableHover, ...rest }) => {
  return <button
    {...rest}
    className={`bg-pink-700 relative px-4 p-2 rounded-lg font-bold disabled:opacity-50 w-full md:w-auto transform transition ${!disableHover ? 'md:hover:scale-110' : ''}`}
  >
  <div
    className={`flex items-center justify-center ${
      loading ? "opacity-0" : "opacity-100"
    }`}
  >
    {icon &&
      <div className="mr-2">
        {icon}
      </div>
    }
    {children}
  </div>
    {loading &&
      <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center">
        <LoadingSpinner />
        {loadingText &&
          <span className="ml-2">
            {loadingText}
          </span>
        }
      </div>
    }
  </button>
}
