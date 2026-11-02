/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Utensils, ArrowUpRight, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { sound } from '../../utils/audio';

interface RadialMealGaugeProps {
  remaining: number;
  total: number;
  balanceRwf: number;
  category: string;
  isDark: boolean;
  onTopUpClick: () => void;
}

export const RadialMealGauge: React.FC<RadialMealGaugeProps> = ({
  remaining,
  total,
  balanceRwf,
  category,
  isDark,
  onTopUpClick,
}) => {
  const safeTotal = Math.max(total, 1);
  const percentage = Math.round(Math.min(100, Math.max(0, (remaining / safeTotal) * 100)));
  const isLow = remaining <= 5 && remaining > 0;
  const isExhausted = remaining === 0;

  // Arc math for 180-degree semi-circle
  const radius = 68;
  const circumference = Math.PI * radius; // ~213.6
  const strokeOffset = circumference - (circumference * percentage) / 100;

  // Needle angle from -90deg (left) to +90deg (right)
  const needleAngle = -90 + (percentage / 100) * 180;

  return (
    <div
      className={`relative rounded-3xl p-5 border transition-all overflow-hidden ${
        isDark
          ? 'bg-slate-800/80 border-slate-700/80 text-white shadow-xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Top Header Row inside Gauge Card */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold leading-none">Meal Allowance Tracker</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{category} Prepaid Plan</div>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playTap();
            onTopUpClick();
          }}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-colors ${
            isExhausted || isLow
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs animate-pulse'
              : isDark
              ? 'bg-slate-700/80 hover:bg-slate-700 text-emerald-400 border border-slate-600'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
          }`}
        >
          <span>+ Top Up</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      {/* Semi-Circular SVG Gauge */}
      <div className="relative flex flex-col items-center justify-center pt-2 pb-1">
        <svg
          viewBox="0 0 200 115"
          className="w-56 h-32 overflow-visible select-none"
        >
          <defs>
            {/* Emerald Gradient */}
            <linearGradient id="mealGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>

            {/* Warning gradient for low balance */}
            <linearGradient id="warningGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Outer Segmented Ticks (Inspired by Image 1 measurement tracker) */}
          {Array.from({ length: 25 }).map((_, idx) => {
            const angle = 180 + (idx / 24) * 180;
            const rad = (angle * Math.PI) / 180;
            const rInner = 80;
            const rOuter = idx % 4 === 0 ? 87 : 84;
            const x1 = 100 + rInner * Math.cos(rad);
            const y1 = 98 + rInner * Math.sin(rad);
            const x2 = 100 + rOuter * Math.cos(rad);
            const y2 = 98 + rOuter * Math.sin(rad);
            const isTickActive = (idx / 24) * 100 <= percentage;

            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={
                  isTickActive
                    ? isLow
                      ? '#f59e0b'
                      : '#10b981'
                    : isDark
                    ? '#334155'
                    : '#e2e8f0'
                }
                strokeWidth={idx % 4 === 0 ? 2 : 1.2}
                strokeLinecap="round"
                className="transition-colors duration-500"
              />
            );
          })}

          {/* Background Arc Track */}
          <path
            d="M 32 98 A 68 68 0 0 1 168 98"
            fill="none"
            stroke={isDark ? '#1e293b' : '#f1f5f9'}
            strokeWidth="11"
            strokeLinecap="round"
          />

          {/* Foreground Progress Arc */}
          <path
            d="M 32 98 A 68 68 0 0 1 168 98"
            fill="none"
            stroke={isLow ? 'url(#warningGaugeGradient)' : 'url(#mealGaugeGradient)'}
            strokeWidth="11"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />

          {/* Center Indicator Needle / Pivot */}
          <g
            transform={`translate(100, 98) rotate(${needleAngle})`}
            className="transition-transform duration-700 ease-out"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-58"
              stroke={isDark ? '#f8fafc' : '#0f172a'}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="0" cy="0" r="5" fill={isDark ? '#f8fafc' : '#0f172a'} />
            <circle cx="0" cy="0" r="2.5" fill="#10b981" />
          </g>
        </svg>

        {/* Center Readout Badge (Under Needle Pivot) */}
        <div className="text-center -mt-8">
          <div className="flex items-baseline justify-center gap-1">
            <span
              className={`text-3xl font-extrabold font-mono tracking-tight ${
                isExhausted
                  ? 'text-slate-400'
                  : isLow
                  ? 'text-amber-500'
                  : isDark
                  ? 'text-white'
                  : 'text-slate-900'
              }`}
            >
              {remaining}
            </span>
            <span className="text-xs text-slate-400 font-sans font-medium">
              / {total} meals
            </span>
          </div>

          {/* Percentage Pill Badge */}
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isExhausted
                  ? 'bg-slate-700 text-slate-300'
                  : isLow
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
              }`}
            >
              {isLow ? (
                <AlertTriangle className="w-2.5 h-2.5" />
              ) : (
                <CheckCircle2 className="w-2.5 h-2.5" />
              )}
              <span>{percentage}% Available</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Summary Metrics Row */}
      <div
        className={`mt-2 pt-3 border-t grid grid-cols-2 gap-2 text-xs ${
          isDark ? 'border-slate-700/60' : 'border-slate-200'
        }`}
      >
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Prepaid Value</span>
          <span className="font-mono font-bold text-emerald-500 text-sm">
            {balanceRwf.toLocaleString()} RWF
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-medium">Status</span>
          <span
            className={`font-semibold text-xs capitalize ${
              isExhausted
                ? 'text-slate-400'
                : isLow
                ? 'text-amber-500'
                : 'text-emerald-500'
            }`}
          >
            {isExhausted ? 'Exhausted' : isLow ? 'Low Balance' : 'Active Pass'}
          </span>
        </div>
      </div>
    </div>
  );
};
