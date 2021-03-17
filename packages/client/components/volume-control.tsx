import { FC, useEffect, useState } from "react";
import { FaVolumeDown, FaVolumeUp } from "react-icons/fa";

interface VolumeControlProps {
  onChange(volume: number): void;
}

const VolumeControl: FC<VolumeControlProps> = ({ onChange }) => {
  const [volume, setVolume] = useState(5);

  useEffect(() => {
    onChange(volume);
  }, [volume, onChange]);

  return (
    <>
      <style jsx>{`
        .slider::-webkit-slider-thumb,
        .slider::-moz-range-thumb {
          border: none;
          background-color: rgb(219, 39, 119);
        }
      `}</style>
      <div className="flex items-center p-4 bg-black bg-opacity-40 rounded-full">
        <FaVolumeDown className="text-gray-600 mr-2" />
        <input
          type="range"
          min="0"
          max="10"
          value={volume}
          onChange={(e) => setVolume(Number(e.currentTarget.value))}
          className="bg-gray-800 min-w-0 h-5 appearance-none rounded-lg slider"
        />
        <FaVolumeUp className="text-gray-600 ml-2" />
      </div>
    </>
  );
};

export default VolumeControl;
