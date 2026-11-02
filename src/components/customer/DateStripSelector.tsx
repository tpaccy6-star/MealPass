/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar as CalendarIcon, Check } from 'lucide-react';
import { sound } from '../../utils/audio';
import { MealRecord } from '../../types';

interface DateStripSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  isDark: boolean;
  mealRecords: MealRecord[];
  customerId: string;
}

export const DateStripSelector: React.FC<DateStripSelectorProps> = ({
  selectedDate,
  onSelectDate,
  isDark,
  mealRecords,
  customerId,
}) => {
  // Generate 7 days: 3 past, today, 3 future
  const days = React.useMemo(() => {
    const list: Array<{
      dateStr: string;
      dayNum: number;
      dayShort: string;
      dayInitial: string;
      isToday: boolean;
      hasMealConsumed: boolean;
    }> = [];

    const dayInitials = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const dayShorts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = offset === 0;

      const hasMealConsumed = mealRecords.some(
        r => r.customerId === customerId && r.timestamp.startsWith(dateStr) && r.status === 'valid'
      );

      list.push({
        dateStr,
        dayNum: d.getDate(),
        dayShort: dayShorts[d.getDay()],
        dayInitial: dayInitials[d.getDay()],
        isToday,
        hasMealConsumed,
      });
    }

    return list;
  }, [mealRecords, customerId]);

  const activeDateObj = new Date(selectedDate);
  const monthName = activeDateObj.toLocaleDateString('en-GB', { month: 'short' });
  const dayName = activeDateObj.toLocaleDateString('en-GB', { weekday: 'short' });

  return (
    <div className="space-y-2">
      {/* Month & Selection Title */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <span className={isDark ? 'text-white' : 'text-slate-900'}>
            Schedule & Meal History
          </span>
          <span className="text-[10px] text-emerald-500 font-mono font-medium">
            ({monthName} {activeDateObj.getDate()})
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>{dayName}</span>
        </div>
      </div>

      {/* Horizontal Scrollable Day Strip */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
        {days.map((item) => {
          const isSelected = item.dateStr === selectedDate;

          return (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => {
                sound.playTap();
                onSelectDate(item.dateStr);
              }}
              className={`flex-1 min-w-[42px] py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all relative ${
                isSelected
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/40 scale-105'
                  : item.isToday
                  ? isDark
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isDark
                  ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs'
              }`}
            >
              {/* Day Initial (e.g. M, T, W, T...) */}
              <span
                className={`text-[10px] font-medium leading-none mb-1 ${
                  isSelected
                    ? 'text-emerald-100'
                    : 'text-slate-400'
                }`}
              >
                {item.dayInitial}
              </span>

              {/* Day Number */}
              <span className="text-xs font-bold leading-none font-mono">
                {item.dayNum}
              </span>

              {/* Indicator Dot: if active day or meal consumed */}
              <div className="h-1.5 flex items-center justify-center mt-1">
                {isSelected ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                ) : item.hasMealConsumed ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                ) : item.isToday ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
