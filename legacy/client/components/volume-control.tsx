import { FC, useEffect, useState } from "react";
import { FaVolumeDown, FaVolumeMute, FaVolumeOff, FaVolumeUp } from "react-icons/fa";

interface VolumeControlProps {
  onChange(volume: number): void;
}

interface VolumeIconProps {
  value: number; 
  size: number
  className: string; 
}

const MAX_VOLUME = 10;

const VolumeIcon: FC<VolumeIconProps> = ({ value, className, size }) => {

  switch(true) {
    case value == 0: 
      return <FaVolumeMute size={size} className={className} />
    case value <= 1/3 * MAX_VOLUME: 
      return <FaVolumeDown size={size} className={className} />;
    case value <= 2/3 * MAX_VOLUME: 
      return <FaVolumeDown size={size} className={className} />;
    case value <= 3/3 * MAX_VOLUME: 
      return <FaVolumeUp size={size} className={className} />;
    default:
      return <FaVolumeDown size={size} className={className} />; 
  }
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

          border: solid rgb(17, 24, 39) 3px;
          border-radius: 50%;
          background-color: rgb(219, 39, 119);

          cursor: pointer;
        }

        .slider {
          height: 5px;
          background-color: rgb(219, 39, 119);
        }
      `}</style>
      <div className="flex items-center p-4 bg-gray-900 rounded-lg">

        <VolumeIcon size={24} value={volume} className="text-gray-600 mr-2" />

        <input
          type="range"
          min="0"
          max={MAX_VOLUME}
          value={volume}
          onChange={(e) => setVolume(Number(e.currentTarget.value))}
          className="bg-gray-800 min-w-0 h-5 appearance-none rounded-lg slider"
        />
      </div>
    </>
  );
};

export default VolumeControl;
