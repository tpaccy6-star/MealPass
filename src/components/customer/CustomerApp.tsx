/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  Users, 
  Clock, 
  Wallet, 
  AlertTriangle, 
  Coffee, 
  Share2, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  Smartphone, 
  ShieldCheck, 
  RefreshCw, 
  Info, 
  Sun, 
  Moon,
  Receipt,
  Printer
} from 'lucide-react';
import { useMealApp } from '../../context/MealAppContext';
import { QRCodePass, MealRecord, MealShift } from '../../types';
import { sound } from '../../utils/audio';

export const CustomerApp: React.FC = () => {
  const {
    activeCustomer,
    customers,
    setActiveCustomerId,
    settings,
    todayQrPass,
    guestPasses,
    createGuestPass,
    deleteGuestPass,
    mealRecords,
    paymentRecords,
    topUpCustomer,
    theme,
    toggleTheme,
    currentShift,
    setCurrentShift,
  } = useMealApp();

  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'pass' | 'guests' | 'history' | 'wallet'>('pass');
  const [includeTeaPref, setIncludeTeaPref] = useState(false);
  const [showNewGuestModal, setShowNewGuestModal] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState('');
  const [guestLimitNotice, setGuestLimitNotice] = useState<string | null>(null);
  const [selectedPassModal, setSelectedPassModal] = useState<QRCodePass | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(20000); // 10 meals default
  const [momoPhone, setMomoPhone] = useState(activeCustomer.phone);
  const [momoTxReference, setMomoTxReference] = useState('');
  const [isProcessingMomo, setIsProcessingMomo] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  
  // Kitchen slip / digital receipt modal state
  const [selectedReceiptMeal, setSelectedReceiptMeal] = useState<MealRecord | null>(null);
  const [receiptCopied, setReceiptCopied] = useState(false);

  const isLow = activeCustomer.mealsRemaining <= settings.lowBalanceThreshold && activeCustomer.mealsRemaining > 0;
  const isExhausted = activeCustomer.mealsRemaining === 0;
  const isGuestLimitReached = guestPasses.length >= settings.maxGuestQrPerDay;

  // Filter history for current customer
  const customerMeals = mealRecords.filter(r => r.customerId === activeCustomer.id);
  const customerPayments = paymentRecords.filter(r => r.customerId === activeCustomer.id);

  const handleCreateGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestNameInput.trim()) return;
    if (activeCustomer.mealsRemaining <= 0) {
      sound.playError();
      return;
    }
    if (isGuestLimitReached) {
      sound.playError();
      setGuestLimitNotice(`Daily policy limit reached: You can only create ${settings.maxGuestQrPerDay} guest passes per day.`);
      return;
    }

    const newPass = createGuestPass(guestNameInput);
    if (!newPass) {
      setGuestLimitNotice(`Daily limit reached (${settings.maxGuestQrPerDay} max).`);
      return;
    }

    setGuestNameInput('');
    setShowNewGuestModal(false);
    setGuestLimitNotice(null);
    setSelectedPassModal(newPass);
  };

  const handleConfirmTopUp = () => {
    setIsProcessingMomo(true);
    sound.playTap();
    setTimeout(() => {
      topUpCustomer(
        activeCustomer.id,
        topUpAmount,
        'momo',
        `MOMO-RW-${Math.floor(1000000 + Math.random() * 9000000)}`,
        momoTxReference.trim() || undefined
      );
      setIsProcessingMomo(false);
      setShowTopUpModal(false);
      setMomoTxReference('');
    }, 1200);
  };

  const handleSharePass = (pass: QRCodePass) => {
    sound.playTap();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`Here is your lunch pass for ${settings.restaurantName}: Code ${pass.code}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const handleCopyReceipt = (rec: MealRecord) => {
    sound.playTap();
    const chitText = `
--- ${settings.restaurantName} ---
Location: ${settings.location}
Tel: ${settings.phone}
TIN: 156715536
---------------------------------
DIGITAL KITCHEN CHIT
Order ID: ${rec.id}
Date: ${new Date(rec.timestamp).toLocaleString()}
Shift: ${(rec.shift || currentShift).toUpperCase()}
Customer: ${rec.customerName}
---------------------------------
Item               Qty     Amount
Meal Serving        ${rec.mealCount}    ${(rec.mealCount * settings.mealPriceRwf).toLocaleString()} RWF
Spiced Tea          ${rec.teaCount}    ${(rec.teaCount * settings.teaPriceRwf).toLocaleString()} RWF
---------------------------------
TOTAL PAID:        ${rec.amountRwf.toLocaleString()} RWF
Paid via: ${rec.paymentMethod === 'balance' ? 'Prepaid Balance' : rec.paymentMethod.toUpperCase()}
Status: VERIFIED & LOGGED
---------------------------------
Thank you for dining with us!
    `.trim();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(chitText);
      setReceiptCopied(true);
      setTimeout(() => setReceiptCopied(false), 2000);
    }
  };

  return (
    <div className={`flex-1 flex flex-col ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} select-none pb-16`}>
      
      {/* Mobile App Header (React Native Native-stack Bar) */}
      <div className={`px-5 pt-2 pb-3 backdrop-blur-md border-b sticky top-0 z-30 transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800/80 text-white' : 'bg-white/90 border-slate-200 text-slate-900 shadow-xs'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {activeCustomer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <span>{settings.restaurantName}</span>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-500 font-mono text-[10px]">Kigali</span>
              </div>
              <h1 className={`text-sm font-semibold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeCustomer.name.split(' ')[0]}'s MealPass
              </h1>
            </div>
          </div>

          {/* Quick Customer Switcher for Demonstration */}
          <div className="relative">
            <select
              value={activeCustomer.id}
              onChange={(e) => {
                sound.playTap();
                setActiveCustomerId(e.target.value);
              }}
              className={`text-xs border rounded-lg px-2 py-1 pr-6 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name.split(' ')[0]} ({c.mealsRemaining} meals)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Shift Indicator & Selector (Proposal Section 9: Multi-shift lunch/dinner) */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-700/20 text-xs">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Shift:</span>
            <span className="font-semibold text-emerald-500 capitalize">{currentShift} service</span>
          </div>

          <div className={`flex items-center p-0.5 rounded-lg border text-[10px] ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            {(['lunch', 'dinner'] as MealShift[]).map(s => (
              <button
                key={s}
                onClick={() => {
                  sound.playTap();
                  setCurrentShift(s);
                }}
                className={`px-2 py-0.5 rounded-md font-semibold capitalize transition-colors ${
                  currentShift === s
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

        {/* 1. PASS & DAILY QR TAB */}
        {activeTab === 'pass' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Balance Alert Banner (Proposal requirement: Remind when 5 meals remain and when finished) */}
            {isExhausted ? (
              <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
                isDark ? 'bg-slate-800/90 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800 shadow-xs'
              }`}>
                <div className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  0
                </div>
                <div className="flex-1 text-xs">
                  <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Prepaid Meal Pass Finished (0 Meals Left)
                  </div>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    Your prepaid lunch balance has run out. Top up now to continue eating without delay.
                  </p>
                  <button
                    onClick={() => {
                      sound.playTap();
                      setShowTopUpModal(true);
                    }}
                    className="mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>Replenish with MTN MoMo</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : isLow ? (
              <div className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
                isDark ? 'bg-slate-800/90 border-emerald-500/40 text-slate-200' : 'bg-white border-emerald-500/50 text-slate-900 shadow-xs'
              }`}>
                <AlertTriangle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-emerald-500">
                    Low Balance Reminder: {activeCustomer.mealsRemaining} Meals Left!
                  </div>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    You have reached the 5-meal reminder threshold. Avoid dining queues by topping up today.
                  </p>
                  <button
                    onClick={() => {
                      sound.playTap();
                      setShowTopUpModal(true);
                    }}
                    className="mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>Quick Top-Up (+10 Meals)</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : null}

            {/* Daily Scannable QR Code Card */}
            <div className={`relative rounded-3xl border p-5 flex flex-col items-center text-center transition-colors ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700/80 text-white shadow-xl' 
                : 'bg-white border-slate-200 text-slate-900 shadow-xs'
            }`}>
              
              {/* Header inside QR Card */}
              <div className="w-full flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified Pass · <strong className="capitalize text-emerald-500">{currentShift}</strong></span>
                </div>
                <div className="font-mono text-[11px] text-slate-400">
                  {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
              </div>

              {/* QR Container with Frame and Laser Line */}
              <div className="relative p-3.5 bg-white rounded-2xl shadow-md border-2 border-slate-200 my-1 group">
                <QRCodeSVG
                  value={todayQrPass.code}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
                
                {/* Active Laser Sweep Animation in Emerald Green */}
                {!todayQrPass.isUsed && !isExhausted && (
                  <div className="absolute left-2 right-2 h-0.5 bg-emerald-500 shadow-[0_0_8px_#10b981] pointer-events-none animate-laser" />
                )}

                {/* Used Badge Overlay */}
                {todayQrPass.isUsed && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center p-3 text-white">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-1" />
                    <span className="font-bold text-xs">Scanned Today ({currentShift})</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {todayQrPass.usedAt ? new Date(todayQrPass.usedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Consumed'}
                    </span>
                  </div>
                )}
              </div>

              {/* Status and Anti-Fraud details */}
              <div className="mt-3.5 w-full">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {todayQrPass.isUsed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      Meal Claimed Today
                    </span>
                  ) : isExhausted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      Pass Inactive: 0 Balance
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Ready For {currentShift} Scan
                    </span>
                  )}
                </div>

                <div className="font-mono text-[10px] text-slate-400 truncate max-w-xs mx-auto">
                  {todayQrPass.code}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Refreshes daily · Works once per meal shift
                </div>
              </div>

              {/* Optional Tea Add-on Switch */}
              <div className={`mt-4 w-full pt-3 border-t flex items-center justify-between px-1 ${
                isDark ? 'border-slate-700/60' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-2 text-left">
                  <Coffee className={`w-4 h-4 ${includeTeaPref ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <div>
                    <div className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      Include Spiced Tea
                    </div>
                    <div className="text-[10px] text-slate-400">+{settings.teaPriceRwf} RWF / tea unit</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setIncludeTeaPref(!includeTeaPref);
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    includeTeaPref ? 'bg-emerald-600' : (isDark ? 'bg-slate-700' : 'bg-slate-300')
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      includeTeaPref ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>

            {/* Meal Countdown Summary Card */}
            <div className={`rounded-2xl border p-4 transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-slate-400">Meals Remaining</div>
                  <div className={`text-2xl font-bold font-mono tracking-tight flex items-baseline gap-1.5 mt-0.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    <span>{activeCustomer.mealsRemaining}</span>
                    <span className="text-xs text-slate-400 font-sans font-normal">
                      / {activeCustomer.totalMealsPurchased} paid
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Prepaid Value</div>
                  <div className="text-sm font-semibold font-mono text-emerald-500 mt-0.5">
                    {activeCustomer.balanceRwf.toLocaleString()} RWF
                  </div>
                </div>
              </div>

              {/* Progress Countdown Bar */}
              <div className={`w-full h-2.5 rounded-full overflow-hidden mb-2 ${
                isDark ? 'bg-slate-700/70' : 'bg-slate-200'
              }`}>
                <div
                  className={`h-full transition-all duration-500 ${
                    isExhausted ? 'bg-slate-400 w-0' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (activeCustomer.mealsRemaining / (activeCustomer.totalMealsPurchased || 25)) * 100)}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{settings.mealPriceRwf.toLocaleString()} RWF per meal</span>
                <span>
                  {activeCustomer.mealsRemaining > 0
                    ? `~${activeCustomer.mealsRemaining} lunches remaining`
                    : 'Balance depleted'}
                </span>
              </div>
            </div>

            {/* Quick Guest Pass Callout (Proposal: "More than one QR code" + Section 9 daily limit) */}
            <div className={`rounded-2xl border p-3.5 flex items-center justify-between gap-3 transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    Share Lunch with a Guest
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Daily limit: {guestPasses.length}/{settings.maxGuestQrPerDay} passes used
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  sound.playTap();
                  setShowNewGuestModal(true);
                }}
                disabled={isGuestLimitReached}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0 shadow-xs ${
                  isGuestLimitReached
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isGuestLimitReached ? 'Limit Reached' : 'New Pass'}</span>
              </button>
            </div>

          </div>
        )}

        {/* 2. GUEST PASSES TAB */}
        {activeTab === 'guests' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Guest Meal Passes
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Give lunch to classmates, friends or visitors.
                </p>
              </div>
              <button
                onClick={() => {
                  sound.playTap();
                  setShowNewGuestModal(true);
                }}
                disabled={isGuestLimitReached}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs ${
                  isGuestLimitReached
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isGuestLimitReached ? 'Daily Limit Full' : 'Create Guest QR'}</span>
              </button>
            </div>

            {/* Policy notice based on Section 9 */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
              isGuestLimitReached
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : isDark ? 'bg-slate-800/50 border-slate-700/50 text-slate-300' : 'bg-white border-slate-200 shadow-xs text-slate-700'
            }`}>
              <span className="text-[11px]">
                Restaurant Policy: <strong>Maximum {settings.maxGuestQrPerDay} guest passes</strong> per customer per day.
              </span>
              <span className="font-mono text-xs font-bold text-emerald-500">
                {guestPasses.length} / {settings.maxGuestQrPerDay} Used
              </span>
            </div>

            {guestPasses.length === 0 ? (
              <div className={`py-12 text-center rounded-2xl border border-dashed p-6 transition-colors ${
                isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-300 shadow-xs'
              }`}>
                <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  No Guest Passes Created Today
                </h3>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1">
                  Want to buy lunch for a coworker or friend? Create an extra QR code that deducts 1 meal from your balance.
                </p>
                <button
                  onClick={() => {
                    sound.playTap();
                    setShowNewGuestModal(true);
                  }}
                  className="mt-3.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-xs"
                >
                  Create First Guest Pass
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {guestPasses.map(pass => (
                  <div
                    key={pass.code}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                      isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-white border border-slate-200 rounded-lg shrink-0">
                        <QRCodeSVG value={pass.code} size={38} />
                      </div>
                      <div>
                        <div className={`text-xs font-semibold flex items-center gap-2 ${
                          isDark ? 'text-slate-200' : 'text-slate-900'
                        }`}>
                          <span>{pass.guestName || 'Guest'}</span>
                          {pass.isUsed ? (
                            <span className="text-[10px] text-slate-400 font-normal">· Used</span>
                          ) : (
                            <span className="text-[10px] text-emerald-500 font-normal font-semibold">· Active</span>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                          {pass.code}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          sound.playTap();
                          setSelectedPassModal(pass);
                        }}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                          isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        View QR
                      </button>
                      <button
                        onClick={() => handleSharePass(pass)}
                        title="Share pass"
                        className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={`p-3 rounded-xl border text-[11px] text-slate-400 flex items-start gap-2 ${
              isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Daily guest passes expire at midnight. Each scan uses 1 meal from your current balance of{' '}
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>{activeCustomer.mealsRemaining} meals</strong>.
              </span>
            </div>
          </div>
        )}

        {/* 3. HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Usage & Meal History
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every scanned meal, receipt chit, and payment recorded transparently.
              </p>
            </div>

            <div className="space-y-2">
              {customerMeals.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No meals scanned yet for this account.
                </div>
              ) : (
                customerMeals.map(rec => (
                  <div
                    key={rec.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                      isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        rec.status === 'valid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {rec.teaCount > 0 ? <Coffee className="w-3.5 h-3.5" /> : <QrCode className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                          {rec.type === 'guest' ? `Guest Meal (${rec.guestName || 'Friend'})` : 'Daily Lunch'}
                          {rec.teaCount > 0 && ' + Spiced Tea'}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="capitalize text-emerald-500 font-semibold">{rec.shift || currentShift}</span>
                          <span>·</span>
                          <span>{new Date(rec.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          <span>·</span>
                          <span>{new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className={`font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                          -1 Meal
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {rec.remainingMealsAfter !== undefined ? `${rec.remainingMealsAfter} left` : 'Deducted'}
                        </div>
                      </div>

                      {/* View Kitchen Chit Button */}
                      <button
                        onClick={() => {
                          sound.playTap();
                          setSelectedReceiptMeal(rec);
                        }}
                        title="View digital receipt chit"
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Top-Up Records */}
            <div className="pt-2">
              <h3 className={`text-xs font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                Past Top-Up Payments
              </h3>
              <div className="space-y-2">
                {customerPayments.map(p => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isDark ? 'bg-slate-800/80 border-emerald-500/20' : 'bg-white border-emerald-500/30 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-emerald-500 flex items-center gap-1.5">
                        <span>+{p.mealsCredited} Meals Credited</span>
                        <span className="text-[10px] uppercase font-mono text-emerald-600/80">({p.method})</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Ref: {p.referenceNo}
                        {p.momoTransactionId && ` · MoMo: ${p.momoTransactionId}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        +{p.amountRwf.toLocaleString()} RWF
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(p.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. WALLET & TOP-UP TAB */}
        {activeTab === 'wallet' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Account & Prepaid Wallet
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your meal plan, payments, and dining profile.
              </p>
            </div>

            {/* Profile Overview Card */}
            <div className={`p-4 rounded-2xl border space-y-3 transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base ${
                  isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {activeCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {activeCustomer.name}
                  </div>
                  <div className="text-xs text-slate-400">{activeCustomer.phone}</div>
                  <div className="text-[11px] text-emerald-500 font-medium">{activeCustomer.category} Plan</div>
                </div>
              </div>

              <div className={`grid grid-cols-2 gap-2 pt-2 border-t text-xs ${
                isDark ? 'border-slate-700/60' : 'border-slate-200'
              }`}>
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Purchased</span>
                  <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    {activeCustomer.totalMealsPurchased} Meals
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Remaining Balance</span>
                  <span className="font-semibold text-emerald-500 font-mono">
                    {activeCustomer.balanceRwf.toLocaleString()} RWF
                  </span>
                </div>
              </div>
            </div>

            {/* Fast Top-Up Selection */}
            <div className="space-y-2.5">
              <div className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                Select Meal Package to Top-Up
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { meals: 5, price: 10000, label: "Weekly (5 Meals)" },
                  { meals: 10, price: 20000, label: "2 Weeks (10 Meals)" },
                  { meals: 20, price: 40000, label: "Monthly (20 Meals)" },
                  { meals: 30, price: 60000, label: "Full Month (30 Meals)" },
                ].map(pkg => (
                  <button
                    key={pkg.meals}
                    onClick={() => {
                      sound.playTap();
                      setTopUpAmount(pkg.price);
                      setShowTopUpModal(true);
                    }}
                    className={`p-3 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                      isDark 
                        ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700' 
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {pkg.label}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {settings.mealPriceRwf.toLocaleString()} RWF / meal
                      </div>
                    </div>
                    <div className="mt-2 text-xs font-mono font-bold text-emerald-500">
                      {pkg.price.toLocaleString()} RWF
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Switcher Row in Wallet */}
            <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div>
                <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Theme Preference
                </div>
                <div className="text-slate-400 text-[10px]">
                  Current mode: <strong className="capitalize">{theme}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  isDark
                    ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 shadow-xs'
                }`}
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-700" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>

            {/* Restaurant Info & MTN MoMo Till Code */}
            <div className={`p-3 rounded-xl border text-xs space-y-1 transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Dining Partner Info & MoMo Code
              </div>
              <div className="text-slate-400 text-[11px]">
                {settings.restaurantName} · {settings.location}
              </div>
              <div className="text-slate-400 text-[11px]">
                Owner Phone: {settings.phone}
              </div>
              <div className="text-emerald-500 font-mono text-[11px] font-semibold pt-1">
                MoMo Merchant Pay Code: *182*8*1*{settings.momoMerchantCode}#
              </div>
            </div>
          </div>
        )}

      </div>

      {/* React Native Bottom Tab Navigation Bar */}
      <div className={`h-16 shrink-0 backdrop-blur-md border-t px-2 grid grid-cols-4 items-center z-30 transition-colors ${
        isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-sm'
      }`}>
        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('pass');
          }}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'pass' ? 'text-emerald-500 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <QrCode className="w-5 h-5" />
          <span className="text-[10px] mt-1">My Pass</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('guests');
          }}
          className={`relative flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'guests' ? 'text-emerald-500 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-1">Guests</span>
          {guestPasses.length > 0 && (
            <span className="absolute top-2 right-6 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('history');
          }}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'history' ? 'text-emerald-500 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] mt-1">History</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('wallet');
          }}
          className={`relative flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'wallet' ? 'text-emerald-500 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] mt-1">Wallet</span>
          {isLow && (
            <span className="absolute top-2 right-6 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* CREATE GUEST PASS MODAL */}
      {showNewGuestModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150">
          <div className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl transition-colors ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Create Guest Lunch Pass</h3>
              <button
                onClick={() => setShowNewGuestModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Generate a unique QR code for a friend or classmate. Scanning it will use{' '}
              <strong className="text-emerald-500 font-semibold">1 meal</strong> from your current balance of{' '}
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>{activeCustomer.mealsRemaining} meals</strong>.
            </p>

            {guestLimitNotice && (
              <div className="mb-3 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs">
                {guestLimitNotice}
              </div>
            )}

            <form onSubmit={handleCreateGuest} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Guest Name or Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Eric M., Aline, Colleague"
                  value={guestNameInput}
                  onChange={(e) => setGuestNameInput(e.target.value)}
                  autoFocus
                  required
                  className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewGuestModal(false)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGuestLimitReached}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-600/20"
                >
                  Generate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW SINGLE GUEST QR MODAL */}
      {selectedPassModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className={`w-full max-w-xs rounded-3xl p-5 border shadow-2xl text-center flex flex-col items-center ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
          }`}>
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>Guest Meal Pass</span>
              </span>
              <button
                onClick={() => setSelectedPassModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <h4 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {selectedPassModal.guestName || 'Guest Lunch'}
            </h4>
            <div className="text-[11px] text-slate-400 mb-3">
              Valid today only at {settings.restaurantName}
            </div>

            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 my-1">
              <QRCodeSVG value={selectedPassModal.code} size={170} />
            </div>

            <div className="font-mono text-[10px] text-slate-400 mt-3 truncate max-w-[220px]">
              {selectedPassModal.code}
            </div>

            <div className="mt-4 w-full flex items-center gap-2">
              <button
                onClick={() => handleSharePass(selectedPassModal)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{shareCopied ? 'Code Copied!' : 'Copy / Share'}</span>
              </button>
              <button
                onClick={() => {
                  deleteGuestPass(selectedPassModal.code);
                  setSelectedPassModal(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-medium transition-colors border ${
                  isDark 
                    ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800' 
                    : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP-UP VIA MOMO SIMULATION MODAL (With MoMo SMS Reference ID reconciliation) */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150">
          <div className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  MoMo
                </div>
                <h3 className="text-sm font-semibold">Top-Up via Mobile Money</h3>
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Payment will instantly add meals to <strong className={isDark ? 'text-white' : 'text-slate-900'}>{activeCustomer.name}</strong>'s balance at {settings.mealPriceRwf.toLocaleString()} RWF per meal.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Amount to Deposit (RWF)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={settings.mealPriceRwf}
                    min={settings.mealPriceRwf}
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-emerald-500 font-semibold">
                    = {Math.floor(topUpAmount / settings.mealPriceRwf)} Meals
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  MTN Mobile Money Phone (Rwanda)
                </label>
                <input
                  type="text"
                  value={momoPhone}
                  onChange={(e) => setMomoPhone(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  MTN SMS Reference ID (Optional for fast verification)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MP261027.0041.H12345"
                  value={momoTxReference}
                  onChange={(e) => setMomoTxReference(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className={`p-3 rounded-xl border text-[11px] flex items-center gap-2 ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Simulating instant USSD push approval to {momoPhone}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTopUp}
                disabled={isProcessingMomo}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors"
              >
                {isProcessingMomo ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Authorizing MoMo...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm {topUpAmount.toLocaleString()} RWF</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIGITAL KITCHEN CHIT / RECEIPT MODAL */}
      {selectedReceiptMeal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className={`w-full max-w-xs rounded-3xl p-5 border shadow-2xl flex flex-col items-center text-center ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="w-full flex items-center justify-between mb-2 pb-2 border-b border-slate-700/40">
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <Receipt className="w-4 h-4" />
                <span>Digital Kitchen Chit</span>
              </span>
              <button
                onClick={() => setSelectedReceiptMeal(null)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            </div>

            {/* Thermal Slip Simulation Design */}
            <div className="w-full bg-slate-950 text-slate-100 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-left space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-slate-700">
                <div className="font-bold text-xs">{settings.restaurantName}</div>
                <div className="text-[10px] text-slate-400">{settings.location}</div>
                <div className="text-[9px] text-slate-500">TIN: 156715536 · Tel: {settings.phone}</div>
              </div>

              <div className="text-[10px] space-y-0.5 text-slate-300">
                <div>Chit #: {selectedReceiptMeal.id.slice(-8).toUpperCase()}</div>
                <div>Date: {new Date(selectedReceiptMeal.timestamp).toLocaleString()}</div>
                <div>Customer: {selectedReceiptMeal.customerName}</div>
                <div>Shift: <strong className="text-emerald-400 uppercase">{selectedReceiptMeal.shift || currentShift}</strong></div>
              </div>

              <div className="border-t border-b border-dashed border-slate-700 py-1.5 space-y-1">
                <div className="flex justify-between">
                  <span>Regular Meal Serving</span>
                  <span>{(selectedReceiptMeal.mealCount * settings.mealPriceRwf).toLocaleString()} RWF</span>
                </div>
                {selectedReceiptMeal.teaCount > 0 && (
                  <div className="flex justify-between">
                    <span>Spiced Tea Cup</span>
                    <span>{(selectedReceiptMeal.teaCount * settings.teaPriceRwf).toLocaleString()} RWF</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between font-bold text-xs pt-0.5">
                <span>TOTAL DEDUCTED</span>
                <span className="text-emerald-400">{selectedReceiptMeal.amountRwf.toLocaleString()} RWF</span>
              </div>

              <div className="text-center pt-2 text-[9px] text-emerald-500 font-bold border-t border-dashed border-slate-700">
                ● OFFICIAL KITCHEN RECEIPT · LOGGED
              </div>
            </div>

            <div className="mt-4 w-full flex items-center gap-2">
              <button
                onClick={() => handleCopyReceipt(selectedReceiptMeal)}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{receiptCopied ? 'Chit Copied!' : 'Copy / Share Receipt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
