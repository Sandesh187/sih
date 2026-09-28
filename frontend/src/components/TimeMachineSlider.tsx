'use client';

import React from 'react';
import * as Slider from '@radix-ui/react-slider';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Clock, Play, Square, RotateCcw } from 'lucide-react';

interface TimeMachineSliderProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

export default function TimeMachineSlider({ value, max, onChange }: TimeMachineSliderProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const effectiveMax = Math.max(max, 1);

  // Keep a ref to the current value so the setInterval always reads the latest value
  const valueRef = React.useRef(value);
  valueRef.current = value;

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        const current = valueRef.current;
        if (current === -1 || current >= effectiveMax) {
          // Finished playback: reset or stop
          setIsPlaying(false);
          onChange(-1);
        } else {
          const nextVal = current + 1;
          if (nextVal >= effectiveMax) {
            setIsPlaying(false);
            onChange(effectiveMax);
          } else {
            onChange(nextVal);
          }
        }
      }, 1200); // 1.2s per step for clear visual comprehension
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, effectiveMax, onChange]);

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      // If at end or showing all, start from step 1
      if (value === -1 || value >= effectiveMax) {
        onChange(1);
      }
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    onChange(-1); // Show all
  };

  // Slider position: if -1, display at max
  const displayValue = value === -1 ? effectiveMax : value;

  return (
    <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-xl border border-white/10 flex-1 min-w-[320px]">
      <div className="flex items-center gap-2 shrink-0">
        <Clock className="w-4 h-4 text-[#00d4ff]" />
        <span className="text-xs font-semibold text-gray-200">Time Machine</span>
      </div>

      <button
        onClick={handlePlayToggle}
        className="p-1.5 hover:bg-white/10 rounded-lg text-[#00d4ff] hover:text-white transition-colors shrink-0"
        title={isPlaying ? 'Pause replay' : 'Play hop-by-hop replay'}
      >
        {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
      </button>

      <button
        onClick={handleReset}
        className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors shrink-0"
        title="Reset to full trace"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5 cursor-pointer"
              value={[displayValue]}
              max={effectiveMax}
              min={0}
              step={1}
              onValueChange={(val) => {
                setIsPlaying(false);
                const chosen = val[0];
                onChange(chosen === effectiveMax ? -1 : chosen);
              }}
            >
              <Slider.Track className="bg-gray-800 relative grow rounded-full h-1.5 overflow-hidden">
                <Slider.Range className="absolute bg-gradient-to-r from-[#00d4ff] to-[#00ff88] rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 bg-white shadow-[0_0_10px_rgba(0,212,255,0.5)] rounded-full focus:outline-none focus:ring-2 focus:ring-[#00d4ff] transition-transform hover:scale-125" />
            </Slider.Root>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="bg-gray-900 text-white text-xs px-2.5 py-1 rounded shadow-xl border border-white/10 font-mono"
              sideOffset={5}
            >
              {value === -1 || value === effectiveMax ? 'Full Trace (All Hops)' : `Hop ${value} of ${effectiveMax}`}
              <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>

      <div className="text-xs text-[#00d4ff] font-mono w-20 text-right shrink-0">
        {value === -1 || value === effectiveMax ? 'ALL HOPS' : `Hop ${value}/${effectiveMax}`}
      </div>
    </div>
  );
}
