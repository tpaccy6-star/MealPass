/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LogOut,
  Sun, 
  Moon,
  RotateCcw,
  Store,
  UserCheck
} from 'lucide-react';
import { MealAppProvider, useMealApp } from './context/MealAppContext';
import { CustomerApp } from './components/customer/CustomerApp';
import { OwnerApp } from './components/owner/OwnerApp';
import { AppLoginGate } from './components/common/AppLoginGate';
import { sound } from './utils/audio';

type ActiveRole = 'gate' | 'customer' | 'owner';

function MainAppShell() {
  const [role, setRole] = useState<ActiveRole>(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('nexa_app_active_role');
      if (savedRole === 'customer' || savedRole === 'owner') return savedRole;
    }
    return 'gate';
  });

  const {
    settings,
    theme,
    toggleTheme,
    resetToDefaultData,
  } = useMealApp();

  const isDark = theme === 'dark';

  const handleSelectCustomer = () => {
    localStorage.setItem('nexa_app_active_role', 'customer');
    setRole('customer');
  };

  const handleSelectOwner = () => {
    localStorage.setItem('nexa_app_active_role', 'owner');
    setRole('owner');
  };

  const handleExitToGate = () => {
    sound.playTap();
    localStorage.removeItem('nexa_app_active_role');
    setRole('gate');
  };

  // If user has not chosen an app role, show the real entrance gate (login / register)
  if (role === 'gate') {
    return (
      <AppLoginGate
        onSelectCustomer={handleSelectCustomer}
        onSelectOwner={handleSelectOwner}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Production App Utility Navigation Bar */}
      <header className={`px-4 sm:px-6 py-2.5 border-b sticky top-0 z-40 flex items-center justify-between transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 backdrop-blur-md' : 'bg-white/95 border-slate-200 backdrop-blur-md shadow-xs'
      }`}>
        {/* Brand / Mode badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-emerald-600/30">
            {role === 'customer' ? 'M' : 'P'}
          </div>
          <div>
            <div className={`text-sm font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {settings.restaurantName}
            </div>
            <div className="text-[10px] text-emerald-500 font-mono font-semibold uppercase flex items-center gap-1">
              {role === 'customer' ? (
                <>
                  <UserCheck className="w-3 h-3" />
                  <span>Customer MealPass Portal</span>
                </>
              ) : (
                <>
                  <Store className="w-3 h-3" />
                  <span>Restaurant POS Terminal</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Universal App Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-xl border text-xs transition-colors ${
              isDark ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
            }`}
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4 text-emerald-600" />}
          </button>

          {/* Reset App State */}
          <button
            onClick={resetToDefaultData}
            className={`p-1.5 rounded-xl border text-xs transition-colors ${
              isDark ? 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Reset to default data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Switch Role / Log Out */}
          <button
            onClick={handleExitToGate}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
              isDark
                ? 'bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border-slate-700'
                : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border-slate-300'
            }`}
            title="Log Out or Switch App Role"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Switch Role</span>
          </button>
        </div>
      </header>

      {/* Main Single App View (Full Height, Native App Feel) */}
      <main className="flex-1 flex flex-col max-w-lg w-full mx-auto shadow-2xl relative">
        {role === 'customer' ? <CustomerApp /> : <OwnerApp />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <MealAppProvider>
      <MainAppShell />
    </MealAppProvider>
  );
}
