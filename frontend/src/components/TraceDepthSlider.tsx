'use client';
import React from 'react';
import * as Slider from '@radix-ui/react-slider';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Layers } from 'lucide-react';

interface TraceDepthSliderProps {
  value: number;
  onChange: (v: number) => void;
  onCommit?: (v: number) => void;
  min?: number;
  max?: number;
}

export default function TraceDepthSlider({ value, onChange, onCommit, min = 1, max = 15 }: TraceDepthSliderProps) {
  return (
    <div className="flex flex-col gap-3 w-64">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-300 font-medium">
          <Layers className="w-4 h-4 text-[#00d4ff]" /> Trace Depth
        </div>
        <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded text-xs">
          {value} Hops
        </span>
      </div>
      
      <Tooltip.Provider>
        <Tooltip.Root open={true} delayDuration={0}>
          <Tooltip.Trigger asChild>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              value={[value]}
              onValueChange={(vals) => onChange(vals[0])}
              onValueCommit={(vals) => onCommit?.(vals[0])}
              max={max}
              min={min}
              step={1}
            >
              <Slider.Track className="bg-[#12121a] border border-white/10 relative grow rounded-full h-[6px]">
                <Slider.Range className="absolute bg-gradient-to-r from-[#00d4ff] to-[#00ff88] rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb
                className="block w-4 h-4 bg-white shadow-[0_0_10px_rgba(0,212,255,0.8)] rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00d4ff] transition-colors"
                aria-label="Trace Depth"
              />
            </Slider.Root>
          </Tooltip.Trigger>
          {/* We handle tooltip display manually for this slider style or just show the value in the header */}
        </Tooltip.Root>
      </Tooltip.Provider>
      
      <div className="flex justify-between text-[10px] text-gray-500 font-mono px-1">
        <span>{min}</span>
        <span>5</span>
        <span>10</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
