/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';
import { useMealApp } from '../../context/MealAppContext';

interface DeviceFrameProps {
  children: React.ReactNode;
  title?: string;
  isSimulatorMode?: boolean;
  modelName?: string;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  children,
  isSimulatorMode = true,
  modelName = "iPhone 16 Pro",
}) => {
  const { theme } = useMealApp();
  const isDark = theme === 'dark';
  const [timeStr, setTimeStr] = useState("12:45");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  if (!isSimulatorMode) {
    return (
      <div className={`w-full h-full min-h-screen transition-colors ${
        isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
        {children}
      </div>
    );
  }

  return (
    <div className="relative mx-auto my-3 transition-all duration-300">
      {/* Device Body / Chassis */}
      <div className={`relative w-[385px] sm:w-[400px] h-[820px] max-h-[92vh] rounded-[50px] p-3 transition-colors duration-300 flex flex-col overflow-hidden ${
        isDark 
          ? 'bg-slate-950 shadow-2xl shadow-black/80 ring-1 ring-white/15 border-4 border-slate-800/80' 
          : 'bg-slate-200 shadow-2xl shadow-slate-500/20 ring-1 ring-slate-300 border-4 border-slate-300'
      }`}>
        
        {/* Dynamic Island / Top Camera Pill */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="w-28 h-7 bg-black rounded-full flex items-center justify-between px-2.5 shadow-md border border-white/10">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800" />
            <div className="w-2 h-2 rounded-full bg-slate-900/60" />
          </div>
        </div>

        {/* Screen Bezel Interior */}
        <div className={`relative w-full h-full rounded-[38px] overflow-hidden flex flex-col border shadow-inner transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-900 border-white/5' 
            : 'bg-white border-slate-200'
        }`}>
          
          {/* iOS / Mobile Status Bar */}
          <div className={`h-11 shrink-0 px-6 pt-2 flex items-center justify-between text-xs font-semibold select-none z-40 bg-transparent transition-colors ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}>
            <span>{timeStr}</span>
            <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <BatteryMedium className="w-4 h-4 text-emerald-500" />
            </div>
          </div>

          {/* Screen Content - Viewport */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative">
            {children}
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="h-5 shrink-0 flex items-center justify-center bg-transparent z-40 pointer-events-none">
            <div className={`w-32 h-1 rounded-full ${
              isDark ? 'bg-slate-500/50' : 'bg-slate-400'
            }`} />
          </div>

        </div>

      </div>

      {/* Device Model Label Underneath */}
      <div className="text-center mt-2 text-[11px] font-mono text-slate-500 flex items-center justify-center gap-2">
        <span>{modelName}</span>
        <span>·</span>
        <span className="text-emerald-500 font-medium">React Native</span>
      </div>
    </div>
  );
};
