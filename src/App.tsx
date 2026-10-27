/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Smartphone, 
  Store, 
  SplitSquareVertical, 
  FileText, 
  RotateCcw, 
  Zap, 
  Coffee, 
  Shield, 
  Check, 
  Sun, 
  Moon 
} from 'lucide-react';
import { MealAppProvider, useMealApp } from './context/MealAppContext';
import { CustomerApp } from './components/customer/CustomerApp';
import { OwnerApp } from './components/owner/OwnerApp';
import { DeviceFrame } from './components/common/DeviceFrame';
import { sound } from './utils/audio';

type ViewMode = 'dual' | 'customer' | 'owner';

function MainShell() {
  const [viewMode, setViewMode] = useState<ViewMode>('dual');
  const [useDeviceFrame, setUseDeviceFrame] = useState(true);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [bridgeIncludeTea, setBridgeIncludeTea] = useState(false);

  const {
    activeCustomer,
    todayQrPass,
    guestPasses,
    scanQRCode,
    resetToDefaultData,
    settings,
    theme,
    toggleTheme,
    currentShift,
  } = useMealApp();

  const isDark = theme === 'dark';

  const handleQuickBridgeScan = (targetCode: string) => {
    sound.playTap();
    scanQRCode(targetCode, bridgeIncludeTea);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      
      {/* Universal Top Bar: Zone 1 (Brand) — Zone 2 (Mode Tabs) — Zone 3 (Utility Actions) */}
      <header className={`flex items-center justify-between gap-4 md:gap-8 px-4 sm:px-6 py-3 border-b sticky top-0 z-50 transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 backdrop-blur-md' : 'bg-white/95 border-slate-200 shadow-xs backdrop-blur-md'
      }`}>
        
        {/* Zone 1: Brand Zone */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-extrabold text-white text-base shadow-md shadow-emerald-600/30">
            N
          </div>
          <div className="flex items-baseline gap-2 whitespace-nowrap">
            <span className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              NEXA MealPass
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Restaurant Meal Management
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Segmented Mode Selector */}
        <nav className={`flex items-center gap-1 p-1 rounded-xl border text-xs font-medium transition-colors ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => {
              sound.playTap();
              setViewMode('dual');
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              viewMode === 'dual'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dual Live Demo</span>
            <span className="sm:hidden">Dual</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setViewMode('customer');
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              viewMode === 'customer'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customer App</span>
            <span className="sm:hidden">Customer</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setViewMode('owner');
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              viewMode === 'owner'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restaurant POS</span>
            <span className="sm:hidden">POS</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Utility Actions (Theme toggle, Frame, Brief) */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Theme Toggle Button (White / Dark modes) */}
          <button
            onClick={toggleTheme}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isDark
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-xs'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Dark</span>
              </>
            )}
          </button>

          {/* Device Frame Toggle */}
          <button
            onClick={() => {
              sound.playTap();
              setUseDeviceFrame(!useDeviceFrame);
            }}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              isDark
                ? (useDeviceFrame ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200')
                : (useDeviceFrame ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')
            }`}
            title="Toggle phone chassis frame"
          >
            <span>{useDeviceFrame ? 'Frame' : 'Fluid'}</span>
          </button>

          {/* Proposal Brief Button */}
          <button
            onClick={() => {
              sound.playTap();
              setShowProposalModal(true);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden lg:inline">Proposal Brief</span>
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={resetToDefaultData}
            title="Reset to default demo data"
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark
                ? 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

      </header>

      {/* Interactive Quick Simulation Bridge Bar (Only in Dual View) */}
      {viewMode === 'dual' && (
        <div className={`border-b px-6 py-2.5 transition-colors ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800 text-slate-300' 
            : 'bg-emerald-50/70 border-slate-200 text-slate-800 shadow-xs'
        }`}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                <strong>Live Demonstration Bridge:</strong> Tap below to simulate scanning{' '}
                <strong className={isDark ? 'text-white' : 'text-slate-950'}>{activeCustomer.name.split(' ')[0]}'s</strong> phone in real-time.
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Optional Tea Checkbox */}
              <label className={`flex items-center gap-1.5 cursor-pointer select-none ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <input
                  type="checkbox"
                  checked={bridgeIncludeTea}
                  onChange={(e) => setBridgeIncludeTea(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-0 w-3.5 h-3.5"
                />
                <Coffee className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px]">+ Tea (+{settings.teaPriceRwf} RWF)</span>
              </label>

              {/* Instant Scan Button */}
              <button
                onClick={() => handleQuickBridgeScan(todayQrPass.code)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <span>⚡ Scan {activeCustomer.name.split(' ')[0]}'s {currentShift} Pass</span>
                <span className="text-[10px] opacity-80">({activeCustomer.mealsRemaining} left)</span>
              </button>

              {guestPasses.length > 0 && (
                <button
                  onClick={() => handleQuickBridgeScan(guestPasses[0].code)}
                  className={`px-3 py-1.5 font-medium text-xs rounded-lg border transition-colors ${
                    isDark 
                      ? 'border-emerald-600/50 text-emerald-400 hover:bg-emerald-600/20' 
                      : 'border-emerald-600 text-emerald-700 bg-white hover:bg-emerald-50'
                  }`}
                >
                  <span>Scan Guest Pass</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Viewport Workspace */}
      <main className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 overflow-x-hidden">
        
        {/* DUAL MODE: Side-by-Side Customer & Restaurant Staff Phones */}
        {viewMode === 'dual' && (
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start justify-center">
            
            {/* Left Column: Customer Mobile App */}
            <div className="flex flex-col items-center">
              <div className="mb-2 text-center">
                <div className="text-xs font-mono uppercase tracking-wider text-emerald-500 font-bold">
                  Client Perspective (Customer Phone)
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Daily unique QR, countdown balance, 5-meal warning & guest passes
                </div>
              </div>

              <DeviceFrame isSimulatorMode={useDeviceFrame} modelName="iPhone 16 Pro · Customer">
                <CustomerApp />
              </DeviceFrame>
            </div>

            {/* Right Column: Restaurant Staff / Owner POS */}
            <div className="flex flex-col items-center">
              <div className="mb-2 text-center">
                <div className="text-xs font-mono uppercase tracking-wider text-emerald-500 font-bold">
                  Restaurant Staff Perspective (POS / Scanner)
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Instant camera scan, Valid/Not-valid verdict, walk-in diner counter & reports
                </div>
              </div>

              <DeviceFrame isSimulatorMode={useDeviceFrame} modelName="iPhone 16 Pro · Restaurant Staff">
                <OwnerApp />
              </DeviceFrame>
            </div>

          </div>
        )}

        {/* SINGLE VIEW: Customer Only */}
        {viewMode === 'customer' && (
          <div className="w-full max-w-md mx-auto flex flex-col items-center">
            <DeviceFrame isSimulatorMode={useDeviceFrame} modelName="iPhone 16 Pro · Customer">
              <CustomerApp />
            </DeviceFrame>
          </div>
        )}

        {/* SINGLE VIEW: Owner Only */}
        {viewMode === 'owner' && (
          <div className="w-full max-w-md mx-auto flex flex-col items-center">
            <DeviceFrame isSimulatorMode={useDeviceFrame} modelName="iPhone 16 Pro · Restaurant Staff">
              <OwnerApp />
            </DeviceFrame>
          </div>
        )}

      </main>

      {/* Footer / Info Strip */}
      <footer className={`border-t px-6 py-3 text-center text-xs flex flex-col sm:flex-row items-center justify-between gap-2 transition-colors ${
        isDark ? 'border-slate-900 bg-slate-950 text-slate-500' : 'border-slate-200 bg-white text-slate-600 shadow-xs'
      }`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold">NEXA STACK Ltd</span>
          <span>·</span>
          <span>Kanombe, Kigali, Rwanda</span>
          <span>·</span>
          <span>Lead: Tuyiringire Pacifique</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Meal Price: {settings.mealPriceRwf.toLocaleString()} RWF</span>
          <span>·</span>
          <span>Tea: {settings.teaPriceRwf.toLocaleString()} RWF</span>
          <span>·</span>
          <span className="text-emerald-500 font-semibold">Proposal PRO-2026-001</span>
        </div>
      </footer>

      {/* PROJECT PROPOSAL DETAILS MODAL */}
      {showProposalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className={`w-full max-w-2xl border rounded-3xl p-6 shadow-2xl max-h-[88vh] overflow-y-auto space-y-4 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div>
                <div className="text-[11px] font-mono text-emerald-500 font-bold uppercase tracking-wider">
                  NEXA STACK Ltd · Project Proposal
                </div>
                <h2 className={`text-lg font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  QR Code Meal Management App for Restaurants
                </h2>
              </div>
              <button
                onClick={() => setShowProposalModal(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                ✕
              </button>
            </div>

            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl text-xs border ${
              isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className="text-slate-400 block text-[10px]">Prepared By</span>
                <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Tuyiringire Pacifique</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Role</span>
                <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Engineering Lead</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Location</span>
                <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Kanombe, Kigali</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Contact</span>
                <span className={`font-semibold font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>0781 343 621</span>
              </div>
            </div>

            {/* Core Requirements Checkoff */}
            <div className="space-y-2 text-xs">
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Proposal Deliverables Implemented in Prototype
              </h3>
              
              <div className="space-y-1.5">
                {[
                  { title: "Pay in advance", desc: `Owner records advance payment; app converts amount into meal credits at restaurant meal price (${settings.mealPriceRwf.toLocaleString()} RWF).` },
                  { title: "New QR code every day", desc: "Unique daily QR code that works once per meal, preventing screenshots or reuse." },
                  { title: "More than one QR code (Guests)", desc: "Customer can create extra guest QR codes to buy lunch for friends, with each scan deducting 1 meal." },
                  { title: "Automatic deduction & Verification", desc: "Instant 'Valid' with countdown or 'Not Valid' when balance is 0 or code already scanned today." },
                  { title: "Optional Tea", desc: "Toggle spiced tea with meals, tracked separately and deducted from customer balance." },
                  { title: "Walk-in Customers", desc: "Instant POS counter for pass-by diners paying cash or MTN Mobile Money." },
                  { title: "Countdown & 5-Meal Reminder", desc: "Balance countdown bar with proactive alerts when 5 meals remain and when balance runs out." },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 p-2.5 rounded-xl border ${
                      isDark ? 'bg-slate-800/40 border-slate-700/40 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className={isDark ? 'text-white' : 'text-slate-950'}>{item.title}: </strong>
                      <span>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowProposalModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
              >
                Close & Return to Prototype
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <MealAppProvider>
      <MainShell />
    </MealAppProvider>
  );
}
