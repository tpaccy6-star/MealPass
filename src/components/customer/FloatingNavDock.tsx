/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { QrCode, Users, Clock, Wallet } from 'lucide-react';
import { sound } from '../../utils/audio';

interface FloatingNavDockProps {
  activeTab: 'pass' | 'guests' | 'history' | 'wallet';
  onTabChange: (tab: 'pass' | 'guests' | 'history' | 'wallet') => void;
  guestCount: number;
  isLow: boolean;
  isDark: boolean;
}

export const FloatingNavDock: React.FC<FloatingNavDockProps> = ({
  activeTab,
  onTabChange,
  guestCount,
  isLow,
  isDark,
}) => {
  const tabs = [
    { id: 'pass' as const, label: 'My Pass', icon: QrCode },
    { id: 'guests' as const, label: 'Guests', icon: Users, badge: guestCount > 0 ? guestCount : undefined },
    { id: 'history' as const, label: 'History', icon: Clock },
    { id: 'wallet' as const, label: 'Wallet', icon: Wallet, alertDot: isLow },
  ];

  return (
    <div className="sticky bottom-3 inset-x-0 mx-auto w-[92%] max-w-[340px] z-40 pointer-events-auto mt-auto">
      {/* Floating Capsule Bar (Inspired by Mockups 1, 3, & 4) */}
      <nav
        className={`px-3 py-2 rounded-full border shadow-2xl backdrop-blur-xl flex items-center justify-between gap-1 transition-all duration-300 ${
          isDark
            ? 'bg-slate-900/95 border-slate-700/80 text-white shadow-black/60'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/15'
        }`}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                sound.playTap();
                onTabChange(tab.id);
              }}
              className={`relative flex items-center justify-center transition-all duration-200 rounded-full ${
                isActive
                  ? 'w-11 h-11 bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 scale-105 ring-2 ring-emerald-500/30'
                  : 'w-10 h-10 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              title={tab.label}
              aria-label={tab.label}
            >
              <Icon className={`transition-transform ${isActive ? 'w-5 h-5 scale-110' : 'w-4 h-4'}`} />

              {/* Number badge for guest pass count */}
              {tab.badge && !isActive && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {tab.badge}
                </span>
              )}

              {/* Alert dot for low balance / wallet */}
              {tab.alertDot && !isActive && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
