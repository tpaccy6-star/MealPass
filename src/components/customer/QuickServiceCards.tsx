/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  QrCode, 
  ShoppingBag, 
  Users, 
  Smartphone, 
  Check, 
  Plus 
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface QuickServiceCardsProps {
  isDark: boolean;
  currentShift: 'lunch' | 'dinner';
  isPassUsed: boolean;
  isTakeaway?: boolean;
  onToggleTakeaway?: () => void;
  guestCount: number;
  maxGuests: number;
  onNewGuestClick: () => void;
  onTopUpClick: () => void;
  momoMerchantCode: string;
}

export const QuickServiceCards: React.FC<QuickServiceCardsProps> = ({
  isDark,
  currentShift,
  isPassUsed,
  isTakeaway = false,
  onToggleTakeaway,
  guestCount,
  maxGuests,
  onNewGuestClick,
  onTopUpClick: _onTopUpClick,
  momoMerchantCode,
}) => {
  const [copiedMomo, setCopiedMomo] = React.useState(false);

  const handleCopyMomo = () => {
    sound.playTap();
    const code = `*182*8*1*${momoMerchantCode}#`;
    navigator.clipboard?.writeText(code);
    setCopiedMomo(true);
    setTimeout(() => setCopiedMomo(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Pass Options & Services
        </h3>
        <span className="text-[10px] text-emerald-500 font-medium">Quick Access</span>
      </div>

      {/* Grid matching the 2-column cards from mockup reference */}
      <div className="grid grid-cols-2 gap-2">
        {/* Card 1: Shift Daily Pass */}
        <div
          className={`p-3 rounded-2xl border relative flex flex-col justify-between transition-all ${
            !isPassUsed
              ? isDark
                ? 'bg-slate-800/90 border-emerald-500/40 text-white'
                : 'bg-white border-emerald-500/40 text-slate-900 shadow-xs'
              : isDark
              ? 'bg-slate-800/50 border-slate-700/60 text-slate-400'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}
        >
          {/* Top-Right Checkmark Badge */}
          <div className="flex items-center justify-between mb-2">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                !isPassUsed
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'bg-slate-700/30 text-slate-400'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
            </div>
            {!isPassUsed && (
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
          </div>

          <div>
            <div className={`text-xs font-bold capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {currentShift} Buffet
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {!isPassUsed ? 'Ready to scan' : 'Claimed for today'}
            </div>
          </div>
        </div>

        {/* Card 2: Takeaway / Dine-In Pack */}
        <button
          type="button"
          onClick={() => {
            sound.playTap();
            onToggleTakeaway?.();
          }}
          className={`p-3 rounded-2xl border text-left relative flex flex-col justify-between transition-all ${
            isTakeaway
              ? 'bg-emerald-500/15 border-emerald-500 text-white'
              : isDark
              ? 'bg-slate-800/90 border-slate-700/80 text-white hover:bg-slate-700/60'
              : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                isTakeaway
                  ? 'bg-emerald-600 text-white'
                  : isDark
                  ? 'bg-slate-700/60 text-slate-400'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>

            {isTakeaway ? (
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-400">Dine-in</span>
            )}
          </div>

          <div>
            <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Takeaway Pack
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isTakeaway ? 'Packed to-go' : 'Buffet dine-in'}
            </div>
          </div>
        </button>

        {/* Card 3: Guest Pass Invite */}
        <button
          type="button"
          onClick={() => {
            sound.playTap();
            onNewGuestClick();
          }}
          className={`p-3 rounded-2xl border text-left relative flex flex-col justify-between transition-all ${
            isDark
              ? 'bg-slate-800/90 border-slate-700/80 text-white hover:bg-slate-700/60'
              : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-slate-700/60 text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[10px]">
              <Plus className="w-3 h-3" />
            </span>
          </div>

          <div>
            <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Guest Lunch Pass
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {guestCount}/{maxGuests} passes used
            </div>
          </div>
        </button>

        {/* Card 4: MoMo Pay Till Code */}
        <button
          type="button"
          onClick={handleCopyMomo}
          className={`p-3 rounded-2xl border text-left relative flex flex-col justify-between transition-all ${
            copiedMomo
              ? 'bg-emerald-500/15 border-emerald-500 text-white'
              : isDark
              ? 'bg-slate-800/90 border-slate-700/80 text-white hover:bg-slate-700/60'
              : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                copiedMomo
                  ? 'bg-emerald-600 text-white'
                  : isDark
                  ? 'bg-slate-700/60 text-slate-400'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            {copiedMomo ? (
              <span className="text-[9px] font-bold text-emerald-500">Copied!</span>
            ) : (
              <span className="text-[10px] text-emerald-500 font-medium">Till</span>
            )}
          </div>

          <div>
            <div className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              *{momoMerchantCode}#
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {copiedMomo ? 'Dial code copied' : 'Tap to copy MoMo'}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
