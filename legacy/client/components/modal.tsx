import { FC, useEffect, useState } from "react";

interface ModalProps {
  open?: boolean;
  close?(): void;
}

const Modal: FC<ModalProps> = ({ children, close, open }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
    } else {
      setTimeout(() => {
        setShouldRender(false);
      }, 500);
    }
    setVisible(open);
  }, [open]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 w-screen h-screen bg-black z-40 ${
        visible ? "bg-opacity-50" : "bg-opacity-0"
      } flex justify-center items-center`}
      onClick={close}
    >
      <div className="p-5 max-w-full">
        <div
          className={`bg-gray-900 max-w-screen-md p-5 rounded-lg  text-white transform transition ${
            visible ? "scale-100" : "scale-0"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
