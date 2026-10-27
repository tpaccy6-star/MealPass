/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Scan, 
  Users, 
  UtensilsCrossed, 
  BarChart3, 
  Settings as SettingsIcon, 
  Coffee, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Search, 
  Download, 
  Camera, 
  CameraOff, 
  TrendingUp, 
  Sun, 
  Moon,
  MessageSquare,
  Receipt,
  Printer,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  ShieldCheck,
  Check,
  Copy,
  Smartphone
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useMealApp } from '../../context/MealAppContext';
import { Customer, MealRecord, MealShift, ShiftCloseRecord } from '../../types';
import { sound } from '../../utils/audio';
import { BatchReminderModal } from './BatchReminderModal';

export const OwnerApp: React.FC = () => {
  const {
    settings,
    updateSettings,
    customers,
    scanQRCode,
    recordWalkIn,
    topUpCustomer,
    registerCustomer,
    mealRecords,
    paymentRecords,
    todayDateStr,
    lastScanResult,
    clearLastScanResult,
    theme,
    toggleTheme,
    weeklyTrends,
    currentShift,
    setCurrentShift,
    isOfflineMode,
    toggleOfflineMode,
    offlineQueue,
    syncOfflineQueue,
    shiftCloseRecords,
    closeShift,
    reconcilePayment,
  } = useMealApp();

  const isDark = theme === 'dark';
  const [chartMetric, setChartMetric] = useState<'all' | 'total' | 'regular' | 'walkin' | 'tea'>('all');
  const [activeTab, setActiveTab] = useState<'scanner' | 'walkin' | 'customers' | 'reports' | 'settings'>('scanner');
  
  // Scanner state
  const [includeTea, setIncludeTea] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Walk-in state
  const [walkInMeals, setWalkInMeals] = useState(1);
  const [walkInTea, setWalkInTea] = useState(0);
  const [walkInPayment, setWalkInPayment] = useState<'cash' | 'momo'>('cash');
  const [walkInMomoRef, setWalkInMomoRef] = useState('');
  const [walkInNote, setWalkInNote] = useState('');
  const [justLoggedWalkIn, setJustLoggedWalkIn] = useState<MealRecord | null>(null);

  // Customers management state
  const [customerFilter, setCustomerFilter] = useState<'all' | 'low' | 'finished' | 'active'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustDeposit, setNewCustDeposit] = useState(40000); // 20 meals
  const [newCustCategory, setNewCustCategory] = useState<Customer['category']>('Student');

  // Customer Top-Up modal for Owner
  const [showOwnerTopUpModal, setShowOwnerTopUpModal] = useState(false);
  const [topUpCustomerTarget, setTopUpCustomerTarget] = useState<Customer | null>(null);
  const [topUpOwnerAmount, setTopUpOwnerAmount] = useState(20000);
  const [topUpOwnerMethod, setTopUpOwnerMethod] = useState<'momo' | 'cash' | 'bank'>('momo');
  const [topUpOwnerMomoTxId, setTopUpOwnerMomoTxId] = useState('');

  // WhatsApp & SMS Renewal Reminder modal
  const [reminderCustomer, setReminderCustomer] = useState<Customer | null>(null);
  const [reminderLang, setReminderLang] = useState<'en' | 'rw'>('en');
  const [reminderCopied, setReminderCopied] = useState(false);
  const [showBatchReminderModal, setShowBatchReminderModal] = useState(false);

  // Shift Close Reconciliation Modal
  const [showShiftCloseModal, setShowShiftCloseModal] = useState(false);
  const [countedCashInput, setCountedCashInput] = useState<number>(0);
  const [countedMomoInput, setCountedMomoInput] = useState<number>(0);
  const [shiftCloseNotes, setShiftCloseNotes] = useState('');
  const [latestShiftReport, setLatestShiftReport] = useState<ShiftCloseRecord | null>(null);
  const [shiftReportCopied, setShiftReportCopied] = useState(false);

  // Digital Kitchen Chit view modal
  const [activeKitchenChitMeal, setActiveKitchenChitMeal] = useState<MealRecord | null>(null);
  const [chitCopied, setChitCopied] = useState(false);

  // Today's summary calculations
  const todayMeals = mealRecords.filter(r => r.timestamp.startsWith(todayDateStr) && r.status === 'valid');
  const todayTotalMealsCount = todayMeals.reduce((acc, r) => acc + r.mealCount, 0);
  const todayRegularMealsCount = todayMeals.filter(r => r.type === 'regular').reduce((acc, r) => acc + r.mealCount, 0);
  const todayGuestMealsCount = todayMeals.filter(r => r.type === 'guest').reduce((acc, r) => acc + r.mealCount, 0);
  const todayWalkInMealsCount = todayMeals.filter(r => r.type === 'walk-in').reduce((acc, r) => acc + r.mealCount, 0);
  const todayTeaCount = todayMeals.reduce((acc, r) => acc + r.teaCount, 0);
  const todayTotalRevenueRwf = todayMeals.reduce((acc, r) => acc + r.amountRwf, 0);

  // Shift specific recorded revenue
  const shiftMeals = todayMeals.filter(r => r.shift === currentShift || !r.shift);
  const shiftCashRecorded = shiftMeals.filter(r => r.paymentMethod === 'cash').reduce((sum, r) => sum + r.amountRwf, 0);
  const shiftMomoRecorded = shiftMeals.filter(r => r.paymentMethod === 'momo').reduce((sum, r) => sum + r.amountRwf, 0);

  const lowBalanceCustomers = customers.filter(c => c.mealsRemaining <= settings.lowBalanceThreshold && c.mealsRemaining > 0);
  const finishedCustomers = customers.filter(c => c.mealsRemaining === 0);

  // 7-day trend summary calculations
  const total7DaysMeals = weeklyTrends.reduce((sum, d) => sum + d.totalMeals, 0);
  const avgDailyMeals = Math.round(total7DaysMeals / (weeklyTrends.length || 7));
  const peakDay = weeklyTrends.reduce(
    (max, d) => (d.totalMeals > max.totalMeals ? d : max),
    weeklyTrends[0] || { day: '-', totalMeals: 0 }
  );

  // Camera start/stop handlers
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      setCameraError("Camera unavailable in preview frame. Use the 1-tap simulator buttons below.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleExecuteScan = (codeToScan: string) => {
    sound.playTap();
    scanQRCode(codeToScan, includeTea);
    setManualCodeInput('');
  };

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (walkInMeals <= 0) return;
    const newRecord = recordWalkIn(walkInMeals, walkInTea, walkInPayment, walkInNote, walkInMomoRef);
    setJustLoggedWalkIn(newRecord);
    setWalkInMeals(1);
    setWalkInTea(0);
    setWalkInMomoRef('');
    setWalkInNote('');
  };

  const handleRegisterNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;
    registerCustomer(newCustName, newCustPhone, newCustDeposit, newCustCategory);
    setNewCustName('');
    setNewCustPhone('');
    setShowAddCustomerModal(false);
  };

  const handleOwnerTopUpSubmit = () => {
    if (!topUpCustomerTarget) return;
    topUpCustomer(
      topUpCustomerTarget.id,
      topUpOwnerAmount,
      topUpOwnerMethod,
      undefined,
      topUpOwnerMomoTxId.trim() || undefined
    );
    setShowOwnerTopUpModal(false);
    setTopUpCustomerTarget(null);
    setTopUpOwnerMomoTxId('');
  };

  const handleSaveShiftClose = (e: React.FormEvent) => {
    e.preventDefault();
    const report = closeShift(countedCashInput, countedMomoInput, shiftCloseNotes);
    setLatestShiftReport(report);
  };

  // CSV Report download simulation
  const handleExportCsv = () => {
    sound.playTap();
    const rows = [
      ["Timestamp", "Customer", "Shift", "Type", "Meals", "Tea", "Amount (RWF)", "Payment Method", "MoMo Reference", "Status"],
      ...mealRecords.map(r => [
        r.timestamp,
        r.customerName,
        r.shift || 'lunch',
        r.type,
        r.mealCount,
        r.teaCount,
        r.amountRwf,
        r.paymentMethod,
        r.momoReference || '-',
        r.status
      ])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `restaurant_meal_report_${todayDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateReminderMessage = (c: Customer, lang: 'en' | 'rw') => {
    const replenishMeals = 10;
    const replenishRwf = replenishMeals * settings.mealPriceRwf;
    if (lang === 'rw') {
      return `Muraho ${c.name}, ifatabuguzi ryanyu ryo kurya muri ${settings.restaurantName} risigaranye amafunguro ${c.mealsRemaining}. Komeza urye neza wiyandikisha cyangwa wishyura kuri MTN Mobile Money (*182*8*1*${settings.momoMerchantCode}#) amafaranga ${replenishRwf.toLocaleString()} RWF (amafunguro 10). Murakoze!`;
    }
    return `Hello ${c.name}, your ${settings.restaurantName} meal pass has only ${c.mealsRemaining} meals remaining. To avoid cafeteria lunch queues, please replenish your balance (${replenishMeals} meals = ${replenishRwf.toLocaleString()} RWF) via MTN Mobile Money (*182*8*1*${settings.momoMerchantCode}#). Thank you!`;
  };

  const handleSendWhatsAppReminder = (c: Customer) => {
    sound.playTap();
    const cleanPhone = c.phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('250') ? cleanPhone : `250${cleanPhone.slice(-9)}`;
    const msg = generateReminderMessage(c, reminderLang);
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
    if (typeof window !== 'undefined') {
      // In web applet environment, we also copy and allow user to open
      navigator.clipboard?.writeText(msg);
      setReminderCopied(true);
      setTimeout(() => setReminderCopied(false), 2500);
      window.open(url, '_blank');
    }
  };

  const handleCopyReminderText = (c: Customer) => {
    sound.playTap();
    const msg = generateReminderMessage(c, reminderLang);
    navigator.clipboard?.writeText(msg);
    setReminderCopied(true);
    setTimeout(() => setReminderCopied(false), 2000);
  };

  // Filtered customer list
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery);
    if (!matchesSearch) return false;
    if (customerFilter === 'low') return c.mealsRemaining <= settings.lowBalanceThreshold && c.mealsRemaining > 0;
    if (customerFilter === 'finished') return c.mealsRemaining === 0;
    if (customerFilter === 'active') return c.mealsRemaining > settings.lowBalanceThreshold;
    return true;
  });

  return (
    <div className={`flex-1 flex flex-col ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} select-none pb-16`}>
      
      {/* Restaurant POS Header with Offline Toggle and Shift Indicator */}
      <div className={`px-5 pt-2 pb-3 backdrop-blur-md border-b sticky top-0 z-30 transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800/80' : 'bg-white/90 border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-600/30">
              POS
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                {isOfflineMode ? (
                  <button
                    onClick={toggleOfflineMode}
                    className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                    title="Click to switch to Online Mode"
                  >
                    <WifiOff className="w-3 h-3 text-slate-400" />
                    <span>OFFLINE (SIMULATED)</span>
                  </button>
                ) : (
                  <button
                    onClick={toggleOfflineMode}
                    className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1 font-semibold"
                    title="Click to simulate Offline Mode"
                  >
                    <Wifi className="w-3 h-3 text-emerald-500" />
                    <span>ONLINE</span>
                  </button>
                )}
                <span>·</span>
                <span>{settings.location.split(',')[0]}</span>
              </div>
              <h1 className={`text-sm font-bold truncate max-w-[170px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {settings.restaurantName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Shift Switcher */}
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

            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block">Today's Meals</span>
              <span className="text-sm font-bold font-mono text-emerald-500">
                {todayTotalMealsCount} Served
              </span>
            </div>
          </div>
        </div>

        {/* Offline Queue Sticky Buffer Banner */}
        {offlineQueue.length > 0 && (
          <div className="mt-2 p-2 rounded-xl bg-slate-800 border border-emerald-500/30 text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-200 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
              <span>Offline Buffer: <strong>{offlineQueue.length} scans queued</strong></span>
            </div>
            <button
              onClick={syncOfflineQueue}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Sync Now</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

        {/* 1. QR SCANNER TAB */}
        {activeTab === 'scanner' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Scanner Controls / Options */}
            <div className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center gap-2.5">
                <Coffee className={`w-4 h-4 ${includeTea ? 'text-emerald-500' : 'text-slate-400'}`} />
                <div>
                  <div className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    Optional Tea With Meal ({currentShift})
                  </div>
                  <div className="text-[10px] text-slate-400">+{settings.teaPriceRwf} RWF deducted</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setIncludeTea(!includeTea);
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  includeTea ? 'bg-emerald-600' : (isDark ? 'bg-slate-700' : 'bg-slate-300')
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    includeTea ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Camera Viewfinder Mockup */}
            <div className="relative rounded-3xl bg-black border-2 border-slate-800 overflow-hidden h-[260px] flex flex-col items-center justify-center shadow-2xl">
              
              {isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-2">
                    <Scan className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="text-xs font-semibold text-white">Ready to Scan Customer QR</div>
                  <div className="text-[11px] text-slate-400 max-w-xs mt-1">
                    Point camera at customer's daily {currentShift} QR code or guest pass
                  </div>
                </div>
              )}

              {/* Viewfinder Target Framing Box with Emerald Laser */}
              <div className="absolute inset-8 border-2 border-dashed border-emerald-500/60 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="absolute left-2 right-2 h-0.5 bg-emerald-500 shadow-[0_0_10px_#10b981] animate-laser" />
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
              </div>

              {/* Live Camera Toggle Button */}
              <div className="absolute bottom-3 right-3 z-20">
                <button
                  onClick={isCameraActive ? stopCamera : startCamera}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-[11px] font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 backdrop-blur-md"
                >
                  {isCameraActive ? (
                    <>
                      <CameraOff className="w-3.5 h-3.5 text-slate-400" />
                      <span>Turn Camera Off</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Use Real Camera</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {cameraError && (
              <div className={`text-[11px] p-2.5 rounded-xl border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                {cameraError}
              </div>
            )}

            {/* Quick Demo Scan Buttons (One-tap simulation) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  Quick-Tap Customer QR Simulators ({currentShift})
                </span>
                <span className="text-[10px] font-mono">1-Click Test</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* 1. Pacifique (Active with meals remaining) */}
                <button
                  onClick={() => handleExecuteScan(`NEXA-cust-1-${todayDateStr}-${currentShift.toUpperCase()}-REGULAR`)}
                  className={`p-2.5 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                    isDark ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Pacifique T.</span>
                    <span className="text-[10px] font-mono text-emerald-500 font-bold">Valid</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {customers.find(c => c.id === 'cust-1')?.mealsRemaining || 0} meals left (Regular)
                  </div>
                </button>

                {/* 2. Aline Uwase (Healthy balance) */}
                <button
                  onClick={() => handleExecuteScan(`NEXA-cust-2-${todayDateStr}-${currentShift.toUpperCase()}-REGULAR`)}
                  className={`p-2.5 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                    isDark ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Aline Uwase</span>
                    <span className="text-[10px] font-mono text-emerald-500 font-bold">Valid</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {customers.find(c => c.id === 'cust-2')?.mealsRemaining || 0} meals left (Banker)
                  </div>
                </button>

                {/* 3. Diane Keza (0 Balance -> Triggers NOT VALID!) */}
                <button
                  onClick={() => handleExecuteScan(`NEXA-cust-3-${todayDateStr}-${currentShift.toUpperCase()}-REGULAR`)}
                  className={`p-2.5 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                    isDark ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Diane Keza</span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">0 Meals</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Test "Not Valid" (Exhausted)
                  </div>
                </button>

                {/* 4. Guest Lunch Pass */}
                <button
                  onClick={() => handleExecuteScan(`NEXA-cust-1-${todayDateStr}-${currentShift.toUpperCase()}-GUEST-EMMA`)}
                  className={`p-2.5 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                    isDark ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Pacifique's Guest</span>
                    <span className="text-[10px] font-mono text-emerald-500 font-bold">Guest QR</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Test Guest Lunch Scan
                  </div>
                </button>
              </div>
            </div>

            {/* Manual Code Input Bar */}
            <div className="pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Or paste/type QR code string..."
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  onClick={() => handleExecuteScan(manualCodeInput)}
                  disabled={!manualCodeInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs transition-colors shrink-0 shadow-xs"
                >
                  Scan Code
                </button>
              </div>
            </div>

          </div>
        )}

        {/* 2. WALK-IN CUSTOMERS POS TAB */}
        {activeTab === 'walkin' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Quick Walk-In Diner POS ({currentShift})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record people who pass by and eat on the go. Count every meal and payment.
                </p>
              </div>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              
              {/* Meals Counter Stepper */}
              <div className={`p-4 rounded-2xl border space-y-2 transition-colors ${
                isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Meal Servings
                      </div>
                      <div className="text-[10px] text-slate-400">{settings.mealPriceRwf.toLocaleString()} RWF each</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setWalkInMeals(Math.max(1, walkInMeals - 1));
                      }}
                      className={`w-8 h-8 rounded-lg font-bold text-base flex items-center justify-center transition-colors ${
                        isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                      }`}
                    >
                      -
                    </button>
                    <span className={`font-mono text-base font-bold w-5 text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {walkInMeals}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setWalkInMeals(walkInMeals + 1);
                      }}
                      className={`w-8 h-8 rounded-lg font-bold text-base flex items-center justify-center transition-colors ${
                        isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Subtotal Meals */}
                <div className="text-right text-xs font-mono text-slate-400 pt-1">
                  Subtotal: {(walkInMeals * settings.mealPriceRwf).toLocaleString()} RWF
                </div>
              </div>

              {/* Tea Counter Stepper */}
              <div className={`p-4 rounded-2xl border space-y-2 transition-colors ${
                isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Optional Spiced Tea
                      </div>
                      <div className="text-[10px] text-slate-400">{settings.teaPriceRwf.toLocaleString()} RWF each</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setWalkInTea(Math.max(0, walkInTea - 1));
                      }}
                      className={`w-8 h-8 rounded-lg font-bold text-base flex items-center justify-center transition-colors ${
                        isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                      }`}
                    >
                      -
                    </button>
                    <span className={`font-mono text-base font-bold w-5 text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {walkInTea}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setWalkInTea(walkInTea + 1);
                      }}
                      className={`w-8 h-8 rounded-lg font-bold text-base flex items-center justify-center transition-colors ${
                        isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>

                {walkInTea > 0 && (
                  <div className="text-right text-xs font-mono text-slate-400 pt-1">
                    Subtotal: {(walkInTea * settings.teaPriceRwf).toLocaleString()} RWF
                  </div>
                )}
              </div>

              {/* Payment Method Selector & MoMo Ref */}
              <div className="space-y-2">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setWalkInPayment('cash');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      walkInPayment === 'cash'
                        ? 'bg-emerald-600/15 border-emerald-500 text-emerald-500'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>💵 Cash in Hand</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setWalkInPayment('momo');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      walkInPayment === 'momo'
                        ? 'bg-emerald-600/15 border-emerald-500 text-emerald-500'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>📱 MTN MoMo (*182#)</span>
                  </button>
                </div>

                {walkInPayment === 'momo' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="MTN Transaction ID (e.g. MP261027.0830.A102)"
                      value={walkInMomoRef}
                      onChange={(e) => setWalkInMomoRef(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Total Card & Submit */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
                isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div>
                  <div className="text-[11px] text-slate-400">Total Due From Walk-in</div>
                  <div className={`text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {(walkInMeals * settings.mealPriceRwf + walkInTea * settings.teaPriceRwf).toLocaleString()} RWF
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-transform active:scale-95"
                >
                  Record & Log Meal
                </button>
              </div>

            </form>

            {/* Quick Kitchen Chit Print for just logged walk-in */}
            {justLoggedWalkIn && (
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="text-xs">
                    <div className="font-semibold">Walk-in Logged ({justLoggedWalkIn.amountRwf.toLocaleString()} RWF)</div>
                    <div className="text-[10px] text-slate-400">Customer or buffet server requested receipt?</div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveKitchenChitMeal(justLoggedWalkIn)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Kitchen Chit</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. CUSTOMERS & BALANCES MANAGEMENT TAB */}
        {activeTab === 'customers' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Customer Balances
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track prepaid meals, 1-click renewal alerts, and top-ups.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    sound.playTap();
                    setShowBatchReminderModal(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-500 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Batch Remind Low-Balance ({lowBalanceCustomers.length + finishedCustomers.length})</span>
                </button>
                <button
                  onClick={() => {
                    sound.playTap();
                    setShowAddCustomerModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Customer</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by customer name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* Filter Tabs */}
            <div className={`flex items-center gap-1 p-1 rounded-xl text-xs overflow-x-auto ${
              isDark ? 'bg-slate-800/80' : 'bg-slate-100 border border-slate-200'
            }`}>
              <button
                onClick={() => {
                  sound.playTap();
                  setCustomerFilter('all');
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  customerFilter === 'all'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                All ({customers.length})
              </button>
              <button
                onClick={() => {
                  sound.playTap();
                  setCustomerFilter('low');
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  customerFilter === 'low'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Low (≤5 meals: {lowBalanceCustomers.length})
              </button>
              <button
                onClick={() => {
                  sound.playTap();
                  setCustomerFilter('finished');
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  customerFilter === 'finished'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Finished ({finishedCustomers.length})
              </button>
              <button
                onClick={() => {
                  sound.playTap();
                  setCustomerFilter('active');
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  customerFilter === 'active'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Active
              </button>
            </div>

            {/* Customers List */}
            <div className="space-y-2">
              {filteredCustomers.map(cust => {
                const isCustLow = cust.mealsRemaining <= settings.lowBalanceThreshold && cust.mealsRemaining > 0;
                const isCustFinished = cust.mealsRemaining === 0;

                return (
                  <div
                    key={cust.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                      isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {cust.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <span>{cust.name}</span>
                          {isCustFinished ? (
                            <span className="text-[10px] text-slate-400 font-mono">· 0 left</span>
                          ) : isCustLow ? (
                            <span className="text-[10px] text-emerald-500 font-mono font-semibold">· {cust.mealsRemaining} left</span>
                          ) : null}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{cust.phone}</span>
                          <span>·</span>
                          <span>{cust.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {cust.mealsRemaining} Meals
                        </div>
                        <div className="text-[10px] font-mono text-emerald-500">
                          {cust.balanceRwf.toLocaleString()} RWF
                        </div>
                      </div>

                      {/* WhatsApp / SMS Renewal Reminder Button */}
                      {(isCustLow || isCustFinished) && (
                        <button
                          onClick={() => {
                            sound.playTap();
                            setReminderCustomer(cust);
                          }}
                          title="Send renewal reminder via WhatsApp / SMS"
                          className="p-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-500 border border-emerald-500/30 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          sound.playTap();
                          setTopUpCustomerTarget(cust);
                          setShowOwnerTopUpModal(true);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                          isDark 
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        + Top-up
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* 4. REPORTS & ANALYTICS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Daily & Monthly Reports
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Shift reconciliation, automated audit, and MoMo statement matching.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* End of Shift Reconciliation CTA */}
                <button
                  onClick={() => {
                    sound.playTap();
                    setCountedCashInput(shiftCashRecorded);
                    setCountedMomoInput(shiftMomoRecorded);
                    setShowShiftCloseModal(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Close Shift</span>
                </button>

                <button
                  onClick={handleExportCsv}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Current Shift Summary Callout */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div>
                <div className="text-[10px] text-slate-400">Current Active Shift</div>
                <div className="font-bold text-sm text-emerald-500 capitalize flex items-center gap-1.5">
                  <span>{currentShift} Shift</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Recorded Walk-ins: {shiftCashRecorded + shiftMomoRecorded} RWF)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-slate-400">Cash: {shiftCashRecorded.toLocaleString()}</span>
                <span>·</span>
                <span className="text-slate-400">MoMo: {shiftMomoRecorded.toLocaleString()}</span>
              </div>
            </div>

            {/* 7-DAY MEAL TRENDS RECHARTS LINE CHART */}
            <div className={`p-4 rounded-2xl border transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Meal Trends (Last 7 Days)
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Daily consumption across Regular subscribers, Walk-in diners, and Spiced Teas
                  </p>
                </div>

                {/* Filter Pill Controls */}
                <div className="flex items-center gap-1 self-start sm:self-auto">
                  {(['all', 'total', 'regular', 'walkin', 'tea'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => {
                        sound.playTap();
                        setChartMetric(m);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize transition-colors ${
                        chartMetric === m
                          ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                          : isDark
                          ? 'text-slate-400 hover:text-white bg-slate-700/50'
                          : 'text-slate-600 hover:text-slate-950 bg-slate-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Trend Badges */}
              <div className={`grid grid-cols-3 gap-2 my-2.5 p-2 rounded-xl text-center text-xs ${
                isDark ? 'bg-slate-900/60' : 'bg-slate-50 border border-slate-200'
              }`}>
                <div>
                  <span className="text-[10px] text-slate-400 block">7-Day Total</span>
                  <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {total7DaysMeals} Meals
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Daily Average</span>
                  <span className="font-mono font-bold text-emerald-500">
                    ~{avgDailyMeals} / day
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Peak Volume</span>
                  <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {peakDay.totalMeals} ({peakDay.day.split(' ')[0]})
                  </span>
                </div>
              </div>

              {/* Recharts LineChart Component - Strictly White, Dark & Green Palette */}
              <div className="h-48 sm:h-52 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={weeklyTrends}
                    margin={{ top: 8, right: 10, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? '#334155' : '#e2e8f0'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tickFormatter={(val: string) => val.split(' ')[0]}
                      stroke={isDark ? '#94a3b8' : '#64748b'}
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={isDark ? '#94a3b8' : '#64748b'}
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div
                              className={`p-2.5 rounded-xl border text-xs shadow-xl backdrop-blur-md ${
                                isDark
                                  ? 'bg-slate-900/95 border-slate-700 text-slate-100'
                                  : 'bg-white/95 border-slate-200 text-slate-900'
                              }`}
                            >
                              <div className="font-bold pb-1 mb-1 border-b border-slate-700/30 flex items-center justify-between gap-3 text-[11px]">
                                <span>{d.day}</span>
                                <span className="font-mono text-emerald-500 font-bold">{d.totalMeals} Meals</span>
                              </div>
                              <div className="space-y-1 text-[10px]">
                                <div className="flex items-center justify-between gap-3 text-emerald-500 font-medium">
                                  <span>● Regular Subscribers:</span>
                                  <span className="font-mono font-semibold">{d.regularMeals}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 text-emerald-400">
                                  <span>● Walk-in Diners:</span>
                                  <span className="font-mono font-semibold">{d.walkInMeals}</span>
                                </div>
                                {d.guestMeals > 0 && (
                                  <div className={`flex items-center justify-between gap-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    <span>● Guest Lunches:</span>
                                    <span className="font-mono font-semibold">{d.guestMeals}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between gap-3 text-emerald-600">
                                  <span>● Spiced Tea:</span>
                                  <span className="font-mono font-semibold">{d.teaCount} cups</span>
                                </div>
                                <div className="pt-1 mt-1 border-t border-slate-700/30 flex items-center justify-between gap-3 text-slate-400 font-mono text-[9px]">
                                  <span>Day Turnover:</span>
                                  <span className={isDark ? 'text-white' : 'text-slate-900'}>
                                    {d.totalRevenueRwf.toLocaleString()} RWF
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
                      iconType="circle"
                      iconSize={7}
                    />
                    {(chartMetric === 'all' || chartMetric === 'total') && (
                      <Line
                        type="monotone"
                        dataKey="totalMeals"
                        name="Total Meals"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 2.5, fill: '#10b981' }}
                        activeDot={{ r: 5 }}
                      />
                    )}
                    {(chartMetric === 'all' || chartMetric === 'regular') && (
                      <Line
                        type="monotone"
                        dataKey="regularMeals"
                        name="Regular"
                        stroke={isDark ? '#e2e8f0' : '#0f172a'}
                        strokeWidth={2.2}
                        dot={{ r: 2.5, fill: isDark ? '#e2e8f0' : '#0f172a' }}
                        activeDot={{ r: 5 }}
                      />
                    )}
                    {(chartMetric === 'all' || chartMetric === 'walkin') && (
                      <Line
                        type="monotone"
                        dataKey="walkInMeals"
                        name="Walk-in"
                        stroke="#34d399"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        dot={{ r: 2, fill: '#34d399' }}
                        activeDot={{ r: 4 }}
                      />
                    )}
                    {(chartMetric === 'all' || chartMetric === 'tea') && (
                      <Line
                        type="monotone"
                        dataKey="teaCount"
                        name="Spiced Tea"
                        stroke="#059669"
                        strokeWidth={1.8}
                        strokeDasharray="2 2"
                        dot={{ r: 2, fill: '#059669' }}
                        activeDot={{ r: 4 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className={`p-3.5 rounded-2xl border transition-colors ${
                isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <span className="text-[11px] text-slate-400 block">Total Meals Today</span>
                <span className={`text-2xl font-bold font-mono mt-1 block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {todayTotalMealsCount}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {todayRegularMealsCount} Regular · {todayWalkInMealsCount} Walk-in · {todayGuestMealsCount} Guest
                </span>
              </div>

              <div className={`p-3.5 rounded-2xl border transition-colors ${
                isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <span className="text-[11px] text-slate-400 block">Spiced Tea Cups</span>
                <span className="text-2xl font-bold font-mono text-emerald-500 mt-1 block">
                  {todayTeaCount}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {(todayTeaCount * settings.teaPriceRwf).toLocaleString()} RWF revenue
                </span>
              </div>

              <div className={`p-3.5 rounded-2xl border transition-colors ${
                isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <span className="text-[11px] text-slate-400 block">Today's Meal Turnover</span>
                <span className="text-lg font-bold font-mono text-emerald-500 mt-1 block">
                  {todayTotalRevenueRwf.toLocaleString()} RWF
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Value of meals consumed
                </span>
              </div>

              <div className={`p-3.5 rounded-2xl border transition-colors ${
                isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <span className="text-[11px] text-slate-400 block">Renewal Reminders</span>
                <span className={`text-2xl font-bold font-mono mt-1 block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {lowBalanceCustomers.length + finishedCustomers.length}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Eligible for 1-click WhatsApp alert
                </span>
              </div>
            </div>

            {/* MTN MoMo Reconciliation Audit Module */}
            <div className={`p-3.5 rounded-2xl border space-y-2.5 transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    MTN MoMo Statement Reconciliation
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Verify advance deposits against your MTN Business *182*8*1*{settings.momoMerchantCode}# SMS records.
                  </p>
                </div>
                <div className="text-[10px] font-mono text-emerald-500 font-semibold">
                  {paymentRecords.filter(p => p.reconciled).length} / {paymentRecords.length} Verified
                </div>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {paymentRecords.map(p => (
                  <div
                    key={p.id}
                    className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                      isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>{p.customerName}</span>
                        <span className="text-[10px] font-mono text-slate-400">+{p.amountRwf.toLocaleString()} RWF</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {p.momoTransactionId ? `MTN ID: ${p.momoTransactionId}` : `Ref: ${p.referenceNo}`}
                      </div>
                    </div>

                    <button
                      onClick={() => reconcilePayment(p.id, !p.reconciled)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors ${
                        p.reconciled
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{p.reconciled ? 'Matched' : 'Mark Reconciled'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Live Audit Log with Kitchen Chit View */}
            <div className="space-y-2">
              <h3 className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                Today's Transactions Timeline
              </h3>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {mealRecords.slice(0, 10).map(rec => (
                  <div
                    key={rec.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        {rec.customerName}
                        {rec.type === 'guest' && ` (${rec.guestName || 'Guest'})`}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span className="capitalize text-emerald-500 font-semibold">{rec.shift || currentShift}</span>
                        <span>·</span>
                        <span className="capitalize">{rec.type}</span>
                        <span>·</span>
                        <span>{new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {rec.teaCount > 0 && <span className="text-emerald-500 font-semibold">· +Tea</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right font-mono">
                        <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {rec.amountRwf.toLocaleString()} RWF
                        </div>
                        <div className="text-[10px] text-emerald-500 font-medium">
                          {rec.status === 'valid' ? 'Valid' : 'Blocked'}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          sound.playTap();
                          setActiveKitchenChitMeal(rec);
                        }}
                        title="Print kitchen chit"
                        className="p-1 rounded-lg border border-slate-700 text-slate-400 hover:text-white"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Value Proposition Box from Proposal */}
            <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="font-bold text-emerald-500 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>NEXA STACK Ltd ROI Guarantee</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                "Records get lost or unclear, counting takes hours and names are missed or doubled. The key benefit is less work, fewer errors, and stopping meals without valid payment."
              </p>
            </div>

          </div>
        )}

        {/* 5. RESTAURANT SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Restaurant Pricing & Policies
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure tariffs, daily guest limits (Proposal Sec. 9), and MoMo Till code.
              </p>
            </div>

            <div className={`space-y-3 p-4 rounded-2xl border text-xs transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={settings.restaurantName}
                  onChange={(e) => updateSettings({ restaurantName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  MTN MoMo Merchant Till Code (Rwanda)
                </label>
                <input
                  type="text"
                  value={settings.momoMerchantCode}
                  onChange={(e) => updateSettings({ momoMerchantCode: e.target.value })}
                  placeholder="e.g. 602145"
                  className={`w-full px-3 py-2 rounded-xl font-mono text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Price Per Regular Meal (RWF)
                </label>
                <input
                  type="number"
                  step={100}
                  value={settings.mealPriceRwf}
                  onChange={(e) => updateSettings({ mealPriceRwf: Number(e.target.value) })}
                  className={`w-full px-3 py-2 rounded-xl font-mono text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Optional Spiced Tea Price (RWF)
                </label>
                <input
                  type="number"
                  step={50}
                  value={settings.teaPriceRwf}
                  onChange={(e) => updateSettings({ teaPriceRwf: Number(e.target.value) })}
                  className={`w-full px-3 py-2 rounded-xl font-mono text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Proposal Section 9: Configurable max guest passes per day */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Max Guest QR Passes Allowed Per Customer Per Day (Proposal Section 9)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.maxGuestQrPerDay}
                  onChange={(e) => updateSettings({ maxGuestQrPerDay: Number(e.target.value) })}
                  className={`w-full px-3 py-2 rounded-xl font-mono text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Prevents balance dumping or uncontrolled group sharing.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Low Balance Reminder Threshold (Meals)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.lowBalanceThreshold}
                  onChange={(e) => updateSettings({ lowBalanceThreshold: Number(e.target.value) })}
                  className={`w-full px-3 py-2 rounded-xl font-mono text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Offline buffer simulation toggle */}
              <div className="pt-2 border-t border-slate-700/30 flex items-center justify-between">
                <div>
                  <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Simulate Offline Queue Mode
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Test network downtime buffering and deferred auto-sync
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleOfflineMode}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                    isOfflineMode
                      ? 'bg-slate-800 text-white border-slate-700'
                      : 'bg-emerald-600/15 border-emerald-500 text-emerald-500'
                  }`}
                >
                  {isOfflineMode ? 'Offline Simulated' : 'Online Active'}
                </button>
              </div>

              {/* Theme Toggle in Settings */}
              <div className={`pt-2 border-t flex items-center justify-between ${
                isDark ? 'border-slate-700/60' : 'border-slate-200'
              }`}>
                <div>
                  <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Interface Theme Mode
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Current: <strong className="capitalize">{theme} mode</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    isDark
                      ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {isDark ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Switch to Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-slate-700" />
                      <span>Switch to Dark</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Proposal Contact info */}
            <div className={`p-3.5 rounded-2xl border text-xs space-y-1 transition-colors ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                Prepared by NEXA STACK Ltd
              </div>
              <div className="text-slate-400 text-[11px]">
                Engineering Lead: Tuyiringire Pacifique
              </div>
              <div className="text-slate-400 text-[11px]">
                Kanombe, Kigali, Rwanda · Tel: 0788 768 148 / 0781 343 621
              </div>
            </div>
          </div>
        )}

      </div>

      {/* POS Bottom Tab Navigation Bar */}
      <div className={`h-16 shrink-0 backdrop-blur-md border-t px-2 grid grid-cols-5 items-center z-30 transition-colors ${
        isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-sm'
      }`}>
        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('scanner');
          }}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'scanner' ? 'text-emerald-500 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Scan className="w-5 h-5" />
          <span className="text-[10px] mt-1">Scan QR</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('walkin');
          }}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'walkin' ? 'text-emerald-500 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UtensilsCrossed className="w-5 h-5" />
          <span className="text-[10px] mt-1">Walk-In</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('customers');
          }}
          className={`relative flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'customers' ? 'text-emerald-500 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-1">Balances</span>
          {lowBalanceCustomers.length > 0 && (
            <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('reports');
          }}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'reports' ? 'text-emerald-500 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] mt-1">Reports</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('settings');
          }}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'settings' ? 'text-emerald-500 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[10px] mt-1">Settings</span>
        </button>
      </div>

      {/* SCAN RESULT POPUP DIALOG */}
      {lastScanResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl text-center flex flex-col items-center transition-colors ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Status Icon */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
              lastScanResult.success ? 'bg-emerald-500/20 text-emerald-500 ring-4 ring-emerald-500/10' : 'bg-slate-700 text-slate-300 ring-4 ring-slate-700/20'
            }`}>
              {lastScanResult.success ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <XCircle className="w-10 h-10" />
              )}
            </div>

            {/* Status Heading */}
            <h3 className={`text-xl font-extrabold ${lastScanResult.success ? 'text-emerald-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
              {lastScanResult.isQueuedOffline
                ? 'QUEUED LOCALLY (OFFLINE)'
                : lastScanResult.success
                ? 'VALID PASS - MEAL DEDUCTED'
                : 'NOT VALID'}
            </h3>

            {/* Explanation Message */}
            <p className="text-xs text-slate-400 mt-1.5 px-2 leading-relaxed">
              {lastScanResult.message}
            </p>

            {/* Customer & Balance Breakdown */}
            {lastScanResult.customer && (
              <div className={`w-full mt-4 p-3 rounded-2xl border text-left space-y-2 ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Customer Name:</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{lastScanResult.customer.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Shift:</span>
                  <span className="font-semibold text-emerald-500 uppercase">{currentShift}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Meals Remaining:</span>
                  <span className="font-bold font-mono text-emerald-500">
                    {lastScanResult.mealsRemaining} Meals
                  </span>
                </div>
                {lastScanResult.teaIncluded && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Included Add-on:</span>
                    <span className="font-medium text-emerald-500">+ Spiced Tea (Recorded)</span>
                  </div>
                )}
                <div className={`flex items-center justify-between text-[11px] pt-1 border-t ${
                  isDark ? 'border-slate-700' : 'border-slate-200'
                }`}>
                  <span className="text-slate-400">Scan Timestamp:</span>
                  <span className="font-mono text-slate-400">
                    {new Date(lastScanResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            )}

            {/* Dismiss & Chit Buttons */}
            <div className="mt-4 w-full flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playTap();
                  clearLastScanResult();
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                Scan Next Customer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* WHATSAPP & SMS RENEWAL REMINDER MODAL */}
      {reminderCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-3.5 ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold">1-Click Renewal Notice</h3>
              </div>
              <button
                onClick={() => setReminderCustomer(null)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className={`p-3 rounded-xl border text-xs space-y-1 ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between font-semibold">
                <span>{reminderCustomer.name}</span>
                <span className="text-emerald-500 font-mono">{reminderCustomer.mealsRemaining} Meals Left</span>
              </div>
              <div className="text-[11px] text-slate-400">Phone: {reminderCustomer.phone}</div>
            </div>

            {/* Language toggle */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Message Language:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setReminderLang('en')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    reminderLang === 'en' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setReminderLang('rw')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    reminderLang === 'rw' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Kinyarwanda
                </button>
              </div>
            </div>

            {/* Message Preview */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed font-mono">
              {generateReminderMessage(reminderCustomer, reminderLang)}
            </div>

            {reminderCopied && (
              <div className="text-center text-xs text-emerald-500 font-bold">
                ✓ Message copied to clipboard & WhatsApp opened!
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleCopyReminderText(reminderCustomer)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SMS</span>
              </button>

              <button
                onClick={() => handleSendWhatsAppReminder(reminderCustomer)}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-transform active:scale-95"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Send WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHIFT CLOSE RECONCILIATION MODAL */}
      {showShiftCloseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold">Shift Close & Cash Drawer Audit</h3>
              </div>
              <button
                onClick={() => setShowShiftCloseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Reconcile physical cash drawer and MTN MoMo balance for today's <strong className="text-emerald-500 capitalize">{currentShift} service</strong>.
            </div>

            {/* Recorded vs Counted Matrix */}
            <form onSubmit={handleSaveShiftClose} className="space-y-3">
              <div className={`p-3 rounded-2xl border space-y-2 text-xs ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between items-center font-medium">
                  <span className="text-slate-400">Recorded Walk-in Cash:</span>
                  <span className="font-mono font-bold">{shiftCashRecorded.toLocaleString()} RWF</span>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Physical Cash Counted in Till (RWF)
                  </label>
                  <input
                    type="number"
                    step={100}
                    value={countedCashInput}
                    onChange={(e) => setCountedCashInput(Number(e.target.value))}
                    className={`w-full px-3 py-1.5 rounded-xl font-mono text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <div className="text-[11px] pt-1 flex justify-between font-mono">
                    <span className="text-slate-400">Cash Variance:</span>
                    <span className={countedCashInput - shiftCashRecorded === 0 ? 'text-emerald-500 font-bold' : 'text-slate-300 font-bold'}>
                      {countedCashInput - shiftCashRecorded >= 0 ? '+' : ''}{(countedCashInput - shiftCashRecorded).toLocaleString()} RWF
                    </span>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-2xl border space-y-2 text-xs ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between items-center font-medium">
                  <span className="text-slate-400">Recorded MoMo Walk-in:</span>
                  <span className="font-mono font-bold">{shiftMomoRecorded.toLocaleString()} RWF</span>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Today's MoMo Statement Total (RWF)
                  </label>
                  <input
                    type="number"
                    step={100}
                    value={countedMomoInput}
                    onChange={(e) => setCountedMomoInput(Number(e.target.value))}
                    className={`w-full px-3 py-1.5 rounded-xl font-mono text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <div className="text-[11px] pt-1 flex justify-between font-mono">
                    <span className="text-slate-400">MoMo Variance:</span>
                    <span className={countedMomoInput - shiftMomoRecorded === 0 ? 'text-emerald-500 font-bold' : 'text-slate-300 font-bold'}>
                      {countedMomoInput - shiftMomoRecorded >= 0 ? '+' : ''}{(countedMomoInput - shiftMomoRecorded).toLocaleString()} RWF
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Cashier Notes / Remarks
                </label>
                <textarea
                  placeholder="e.g. Till balanced. Eric closed shift."
                  value={shiftCloseNotes}
                  onChange={(e) => setShiftCloseNotes(e.target.value)}
                  rows={2}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowShiftCloseModal(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  Save Shift Close
                </button>
              </div>
            </form>

            {latestShiftReport && (
              <div className="mt-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                <div className="text-emerald-400 font-bold text-center">✓ Shift Saved Successfully</div>
                <div className="text-[11px] text-slate-300">Total Meals: {latestShiftReport.totalMealsServed}</div>
                <div className="text-[11px] text-slate-300">Cash Variance: {latestShiftReport.cashDiscrepancyRwf} RWF</div>
                <div className="text-[11px] text-slate-300">MoMo Variance: {latestShiftReport.momoDiscrepancyRwf} RWF</div>
                <button
                  onClick={() => {
                    const text = `
SHIFT CLOSE REPORT (${latestShiftReport.shift.toUpperCase()})
Restaurant: ${settings.restaurantName}
Date: ${latestShiftReport.date}
Total Meals Served: ${latestShiftReport.totalMealsServed}
Cash Counted: ${latestShiftReport.cashCountedRwf.toLocaleString()} RWF (Variance: ${latestShiftReport.cashDiscrepancyRwf} RWF)
MoMo Counted: ${latestShiftReport.momoCountedRwf.toLocaleString()} RWF (Variance: ${latestShiftReport.momoDiscrepancyRwf} RWF)
Notes: ${latestShiftReport.notes || 'None'}
                    `.trim();
                    navigator.clipboard?.writeText(text);
                    setShiftReportCopied(true);
                    setTimeout(() => setShiftReportCopied(false), 2000);
                  }}
                  className="mt-2 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{shiftReportCopied ? 'Report Copied!' : 'Copy Summary for WhatsApp'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIGITAL KITCHEN CHIT / RECEIPT MODAL */}
      {activeKitchenChitMeal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className={`w-full max-w-xs rounded-3xl p-5 border shadow-2xl flex flex-col items-center text-center ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="w-full flex items-center justify-between mb-2 pb-2 border-b border-slate-700/40">
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <Receipt className="w-4 h-4" />
                <span>Kitchen Chit / Receipt</span>
              </span>
              <button
                onClick={() => setActiveKitchenChitMeal(null)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            </div>

            {/* Thermal POS Slip Simulation */}
            <div className="w-full bg-slate-950 text-slate-100 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-left space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-slate-700">
                <div className="font-bold text-xs">{settings.restaurantName}</div>
                <div className="text-[10px] text-slate-400">{settings.location}</div>
                <div className="text-[9px] text-slate-500">TIN: 156715536 · Tel: {settings.phone}</div>
              </div>

              <div className="text-[10px] space-y-0.5 text-slate-300">
                <div>Chit #: {activeKitchenChitMeal.id.slice(-8).toUpperCase()}</div>
                <div>Date: {new Date(activeKitchenChitMeal.timestamp).toLocaleString()}</div>
                <div>Customer: {activeKitchenChitMeal.customerName}</div>
                <div>Shift: <strong className="text-emerald-400 uppercase">{activeKitchenChitMeal.shift || currentShift}</strong></div>
              </div>

              <div className="border-t border-b border-dashed border-slate-700 py-1.5 space-y-1">
                <div className="flex justify-between">
                  <span>Meal Serving</span>
                  <span>{(activeKitchenChitMeal.mealCount * settings.mealPriceRwf).toLocaleString()} RWF</span>
                </div>
                {activeKitchenChitMeal.teaCount > 0 && (
                  <div className="flex justify-between">
                    <span>Spiced Tea Cup</span>
                    <span>{(activeKitchenChitMeal.teaCount * settings.teaPriceRwf).toLocaleString()} RWF</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between font-bold text-xs pt-0.5">
                <span>TOTAL PAID</span>
                <span className="text-emerald-400">{activeKitchenChitMeal.amountRwf.toLocaleString()} RWF</span>
              </div>

              <div className="text-[10px] text-slate-400">
                Paid via: <strong className="text-white uppercase">{activeKitchenChitMeal.paymentMethod}</strong>
                {activeKitchenChitMeal.momoReference && ` (${activeKitchenChitMeal.momoReference})`}
              </div>

              <div className="text-center pt-2 text-[9px] text-emerald-500 font-bold border-t border-dashed border-slate-700">
                ● OFFICIAL KITCHEN RECEIPT · LOGGED
              </div>
            </div>

            <div className="mt-4 w-full flex items-center gap-2">
              <button
                onClick={() => {
                  const text = `
--- ${settings.restaurantName} ---
KITCHEN CHIT #${activeKitchenChitMeal.id.slice(-8).toUpperCase()}
Customer: ${activeKitchenChitMeal.customerName}
Shift: ${activeKitchenChitMeal.shift || currentShift}
Meals: ${activeKitchenChitMeal.mealCount} | Tea: ${activeKitchenChitMeal.teaCount}
Total: ${activeKitchenChitMeal.amountRwf.toLocaleString()} RWF
Payment: ${activeKitchenChitMeal.paymentMethod.toUpperCase()}
                  `.trim();
                  navigator.clipboard?.writeText(text);
                  setChitCopied(true);
                  setTimeout(() => setChitCopied(false), 2000);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{chitCopied ? 'Chit Copied!' : 'Copy / Share Chit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER NEW CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150">
          <div className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Register Regular Customer</h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Set up a new prepaid customer. The initial deposit automatically converts into meal credits.
            </p>

            <form onSubmit={handleRegisterNewCustomer} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jean-Paul Kagabo"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  required
                  className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Phone (WhatsApp / MTN MoMo)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0788 123 456"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  required
                  className={`w-full px-3 py-2 rounded-xl text-sm font-mono border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Customer Category
                </label>
                <select
                  value={newCustCategory}
                  onChange={(e) => setNewCustCategory(e.target.value as Customer['category'])}
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Student">Student (University / Campus)</option>
                  <option value="Worker">Worker / Office</option>
                  <option value="Regular">Regular Resident</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Initial Deposit (RWF)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={settings.mealPriceRwf}
                    value={newCustDeposit}
                    onChange={(e) => setNewCustDeposit(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-mono border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-emerald-500 font-semibold">
                    = {Math.floor(newCustDeposit / settings.mealPriceRwf)} Meals
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOP-UP MODAL FOR OWNER */}
      {showOwnerTopUpModal && topUpCustomerTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150">
          <div className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Add Advance Payment: {topUpCustomerTarget.name}
              </h3>
              <button
                onClick={() => setShowOwnerTopUpModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Record payment collected in cash or MTN MoMo to restore meals.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Payment Amount (RWF)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={settings.mealPriceRwf}
                    value={topUpOwnerAmount}
                    onChange={(e) => setTopUpOwnerAmount(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-mono border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-emerald-500 font-semibold">
                    + {Math.floor(topUpOwnerAmount / settings.mealPriceRwf)} Meals
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Payment Received Via
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['momo', 'cash', 'bank'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setTopUpOwnerMethod(m);
                      }}
                      className={`py-2 rounded-xl text-xs font-semibold capitalize border ${
                        topUpOwnerMethod === m
                          ? 'bg-emerald-600/15 border-emerald-500 text-emerald-500'
                          : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {topUpOwnerMethod === 'momo' && (
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    MTN SMS Reference ID (from phone inbox)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MP261027.0910.X7712"
                    value={topUpOwnerMomoTxId}
                    onChange={(e) => setTopUpOwnerMomoTxId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowOwnerTopUpModal(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleOwnerTopUpSubmit}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20"
              >
                Credit +{Math.floor(topUpOwnerAmount / settings.mealPriceRwf)} Meals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH REMAINDER MODAL */}
      <BatchReminderModal
        isOpen={showBatchReminderModal}
        onClose={() => setShowBatchReminderModal(false)}
        customers={customers}
        settings={settings}
        isDark={isDark}
        todayDateStr={todayDateStr}
      />

    </div>
  );
};
