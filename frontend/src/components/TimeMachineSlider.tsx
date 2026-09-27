import React from 'react';
import * as Slider from '@radix-ui/react-slider';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Clock, Play, Square } from 'lucide-react';

interface TimeMachineSliderProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

export default function TimeMachineSlider({ value, max, onChange }: TimeMachineSliderProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        onChange((prev) => {
          if (prev >= max) {
            setIsPlaying(false);
            return max;
          }
          // If -1 (all shown), reset to 0 to start playback
          if (prev === -1) return 0;
          return prev + 1;
        });
      }, 1000); // 1 hop per second
    }
    return () => clearInterval(interval);
  }, [isPlaying, max, onChange]);

  // Visual value: if -1, we treat it visually as "max" for the slider handle position
  const displayValue = value === -1 ? max : value;

  return (
    <div className="flex items-center gap-4 bg-black/40 px-5 py-3 rounded-lg border border-white/10 flex-1 min-w-[300px]">
      <div className="flex items-center gap-2 shrink-0">
        <Clock className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold text-gray-200">Time Machine</span>
      </div>

      <button 
        onClick={() => {
          if (value === -1 || value === max) onChange(0); // reset if at end
          setIsPlaying(!isPlaying);
        }}
        className="p-1.5 hover:bg-white/10 rounded text-accent transition-colors shrink-0"
      >
        {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5 cursor-pointer"
              value={[displayValue]}
              max={max}
              min={0}
              step={1}
              onValueChange={(val) => {
                setIsPlaying(false);
                onChange(val[0]);
              }}
            >
              <Slider.Track className="bg-gray-800 relative grow rounded-full h-1.5 overflow-hidden">
                <Slider.Range className="absolute bg-gradient-to-r from-accent to-[#00ff88] rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 bg-white shadow-lg rounded-full focus:outline-none focus:ring-2 focus:ring-accent transition-transform hover:scale-125" />
            </Slider.Root>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-xl border border-white/10"
              sideOffset={5}
            >
              {value === -1 || value === max ? 'Full Trace' : `Step ${value} of ${max}`}
              <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>

      <div className="text-xs text-gray-400 font-mono w-16 text-right shrink-0">
        {value === -1 || value === max ? 'ALL' : `Step ${value}/${max}`}
      </div>
    </div>
  );
}
