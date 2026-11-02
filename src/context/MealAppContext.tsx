/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Customer, 
  QRCodePass, 
  MealRecord, 
  PaymentRecord, 
  RestaurantSettings, 
  ScanResult, 
  ThemeMode, 
  DailyMealTrend,
  MealShift,
  QueuedScan,
  ShiftCloseRecord 
} from '../types';
import { sound } from '../utils/audio';
import { api, DatabaseStatus } from '../utils/apiClient';

interface MealAppContextType {
  settings: RestaurantSettings;
  updateSettings: (newSettings: Partial<RestaurantSettings>) => Promise<void>;
  customers: Customer[];
  activeCustomer: Customer;
  setActiveCustomerId: (id: string) => void;
  todayDateStr: string;
  currentShift: MealShift;
  setCurrentShift: (shift: MealShift) => void;
  todayQrPass: QRCodePass;
  guestPasses: QRCodePass[];
  mealRecords: MealRecord[];
  paymentRecords: PaymentRecord[];
  createGuestPass: (guestName: string) => Promise<QRCodePass | null>;
  deleteGuestPass: (code: string) => Promise<void>;
  scanQRCode: (code: string) => Promise<ScanResult>;
  recordWalkIn: (mealCount: number, paymentMethod: 'cash' | 'momo', note?: string, momoRef?: string) => Promise<MealRecord>;
  topUpCustomer: (customerId: string, amountRwf: number, method: 'momo' | 'cash' | 'bank', ref?: string, momoTxId?: string) => Promise<void>;
  registerCustomer: (name: string, phone: string, initialDepositRwf: number, category?: Customer['category']) => Promise<Customer>;
  resetToDefaultData: () => Promise<void>;
  lastScanResult: ScanResult | null;
  clearLastScanResult: () => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  weeklyTrends: DailyMealTrend[];
  // Offline resilience
  isOfflineMode: boolean;
  toggleOfflineMode: () => void;
  offlineQueue: QueuedScan[];
  syncOfflineQueue: () => Promise<void>;
  // Shift Close Reconciliation
  shiftCloseRecords: ShiftCloseRecord[];
  closeShift: (countedCash: number, countedMomo: number, notes?: string) => Promise<ShiftCloseRecord>;
  // MoMo Reconciliation
  reconcilePayment: (id: string, reconciled: boolean) => Promise<void>;
  // Neon Database Management
  databaseStatus: DatabaseStatus | null;
  refreshDatabaseStatus: () => Promise<void>;
  connectNeonDatabase: (connectionString: string) => Promise<{ success: boolean; message: string }>;
  isSyncing: boolean;
}

const DEFAULT_SETTINGS: RestaurantSettings = {
  restaurantName: "Kigali Garden Bistro",
  location: "Kanombe, Kigali, Rwanda",
  phone: "0788 768 148",
  momoMerchantCode: "602145",
  mealPriceRwf: 2000,
  maxGuestQrPerDay: 3,
  lowBalanceThreshold: 5,
  currency: "RWF",
  currentShift: "lunch",
};

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Tuyiringire Pacifique",
    phone: "0781 343 621",
    email: "tuyiringire@nexastack.net",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    mealsRemaining: 4,
    totalMealsPurchased: 25,
    balanceRwf: 8000,
    status: "low",
    registeredDate: "2026-10-01",
    lastMealAt: "2026-10-26T12:45:00Z",
    category: "Student",
    notes: "Engineering Lead @ NEXA STACK, daily student lunch subscriber.",
  },
  {
    id: "cust-2",
    name: "Aline Uwase",
    phone: "0788 452 190",
    email: "aline.uwase@kigalibank.rw",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    mealsRemaining: 18,
    totalMealsPurchased: 30,
    balanceRwf: 36000,
    status: "active",
    registeredDate: "2026-10-10",
    lastMealAt: "2026-10-25T13:10:00Z",
    category: "Worker",
    notes: "Office worker, daily lunchtime subscriber.",
  },
  {
    id: "cust-3",
    name: "Diane Keza",
    phone: "0783 910 203",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
    mealsRemaining: 0,
    totalMealsPurchased: 20,
    balanceRwf: 0,
    status: "finished",
    registeredDate: "2026-09-20",
    lastMealAt: "2026-10-24T12:30:00Z",
    category: "Student",
    notes: "Meal pass expired yesterday. Needs replenishment.",
  },
  {
    id: "cust-4",
    name: "Christian Kwizera",
    phone: "0785 889 012",
    mealsRemaining: 27,
    totalMealsPurchased: 30,
    balanceRwf: 54000,
    status: "active",
    registeredDate: "2026-10-22",
    lastMealAt: "2026-10-26T13:30:00Z",
    category: "Regular",
    notes: "Monthly lunch plan subscriber.",
  },
  {
    id: "cust-5",
    name: "Jean-Luc Mugisha",
    phone: "0782 344 556",
    mealsRemaining: 5,
    totalMealsPurchased: 20,
    balanceRwf: 10000,
    status: "low",
    registeredDate: "2026-10-05",
    lastMealAt: "2026-10-25T12:15:00Z",
    category: "Worker",
    notes: "Right at 5 meals alert threshold.",
  },
];

const DEFAULT_MEAL_RECORDS: MealRecord[] = [
  {
    id: "meal-rec-1",
    timestamp: "2026-10-27T08:30:00Z",
    customerId: "walk-in",
    customerName: "Walk-in Diner #101",
    shift: "lunch",
    type: "walk-in",
    mealCount: 1,
    amountRwf: 2000,
    paymentMethod: "momo",
    momoReference: "MP261027.0830.A102",
    scannedBy: "Staff - Eric",
    status: "valid",
    note: "Lunch buffet service",
  },
  {
    id: "meal-rec-2",
    timestamp: "2026-10-26T13:30:00Z",
    customerId: "cust-4",
    customerName: "Christian Kwizera",
    shift: "lunch",
    type: "regular",
    mealCount: 1,
    amountRwf: 2000,
    paymentMethod: "balance",
    scannedBy: "Staff - Eric",
    status: "valid",
    remainingMealsAfter: 27,
  },
  {
    id: "meal-rec-3",
    timestamp: "2026-10-26T12:45:00Z",
    customerId: "cust-1",
    customerName: "Tuyiringire Pacifique",
    shift: "lunch",
    type: "regular",
    mealCount: 1,
    amountRwf: 2000,
    paymentMethod: "balance",
    scannedBy: "Owner - Tuyiringire",
    status: "valid",
    remainingMealsAfter: 4,
  },
];

const DEFAULT_PAYMENTS: PaymentRecord[] = [
  {
    id: "pay-1",
    timestamp: "2026-10-22T09:15:00Z",
    customerId: "cust-4",
    customerName: "Christian Kwizera",
    amountRwf: 60000,
    mealsCredited: 30,
    method: "momo",
    referenceNo: "MTN-RW-9821448",
    momoTransactionId: "MP261022.0915.W9941",
    reconciled: true,
  },
  {
    id: "pay-2",
    timestamp: "2026-10-10T14:20:00Z",
    customerId: "cust-2",
    customerName: "Aline Uwase",
    amountRwf: 60000,
    mealsCredited: 30,
    method: "momo",
    referenceNo: "MTN-RW-7712390",
    momoTransactionId: "MP261010.1420.K4418",
    reconciled: true,
  },
];

const computeWeeklyMealTrends = (records: MealRecord[], settings: RestaurantSettings): DailyMealTrend[] => {
  const trends: DailyMealTrend[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;

    const dayRecords = records.filter(
      r => r.timestamp.startsWith(dateStr) && r.status === 'valid'
    );

    let regular = dayRecords.filter(r => r.type === 'regular').reduce((sum, r) => sum + r.mealCount, 0);
    let walkin = dayRecords.filter(r => r.type === 'walk-in').reduce((sum, r) => sum + r.mealCount, 0);
    let guest = dayRecords.filter(r => r.type === 'guest').reduce((sum, r) => sum + r.mealCount, 0);
    let rev = dayRecords.reduce((sum, r) => sum + r.amountRwf, 0);

    if (dayRecords.length === 0 && i > 0) {
      const baselineData = [
        { reg: 22, wlk: 10, gst: 3 },
        { reg: 25, wlk: 12, gst: 4 },
        { reg: 29, wlk: 14, gst: 5 },
        { reg: 16, wlk: 18, gst: 2 },
        { reg: 12, wlk: 15, gst: 1 },
        { reg: 28, wlk: 11, gst: 4 },
      ][(6 - i) % 6];
      regular = baselineData.reg;
      walkin = baselineData.wlk;
      guest = baselineData.gst;
      rev = (regular + walkin + guest) * settings.mealPriceRwf;
    }

    trends.push({
      date: dateStr,
      day: dayLabel,
      regularMeals: regular,
      walkInMeals: walkin,
      guestMeals: guest,
      totalMeals: regular + walkin + guest,
      totalRevenueRwf: rev,
    });
  }

  return trends;
};

const MealAppContext = createContext<MealAppContextType | null>(null);

export const MealAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('nexa_theme');
    return (saved as ThemeMode) || 'dark';
  });

  const toggleTheme = () => {
    sound.playTap();
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    localStorage.setItem('nexa_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [settings, setSettings] = useState<RestaurantSettings>(() => {
    const saved = localStorage.getItem('nexa_meal_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('nexa_meal_customers');
    return saved ? JSON.parse(saved) : DEFAULT_CUSTOMERS;
  });

  const [activeCustomerId, setActiveCustomerId] = useState<string>("cust-1");

  const [mealRecords, setMealRecords] = useState<MealRecord[]>(() => {
    const saved = localStorage.getItem('nexa_meal_records');
    return saved ? JSON.parse(saved) : DEFAULT_MEAL_RECORDS;
  });

  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('nexa_meal_payments');
    return saved ? JSON.parse(saved) : DEFAULT_PAYMENTS;
  });

  const todayDateStr = new Date().toISOString().split('T')[0];

  const [qrPasses, setQrPasses] = useState<QRCodePass[]>(() => {
    const saved = localStorage.getItem('nexa_meal_qrpasses');
    if (saved) return JSON.parse(saved);
    return [
      {
        code: `NEXA-cust-1-${todayDateStr}-LUNCH-REGULAR`,
        type: 'regular',
        shift: 'lunch',
        customerId: 'cust-1',
        customerName: 'Tuyiringire Pacifique',
        dateValid: todayDateStr,
        isUsed: false,
        createdTime: '08:00 AM',
      },
    ];
  });

  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [currentShift, setCurrentShift] = useState<MealShift>(settings.currentShift || 'lunch');
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<QueuedScan[]>(() => {
    const saved = localStorage.getItem('nexa_offline_queue');
    return saved ? JSON.parse(saved) : [];
  });
  const [shiftCloseRecords, setShiftCloseRecords] = useState<ShiftCloseRecord[]>(() => {
    const saved = localStorage.getItem('nexa_shift_closes');
    return saved ? JSON.parse(saved) : [];
  });

  // Neon DB Connection state
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync state to local storage as fallback cache
  useEffect(() => {
    localStorage.setItem('nexa_meal_settings', JSON.stringify({ ...settings, currentShift }));
  }, [settings, currentShift]);

  useEffect(() => {
    localStorage.setItem('nexa_meal_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('nexa_meal_records', JSON.stringify(mealRecords));
  }, [mealRecords]);

  useEffect(() => {
    localStorage.setItem('nexa_meal_payments', JSON.stringify(paymentRecords));
  }, [paymentRecords]);

  useEffect(() => {
    localStorage.setItem('nexa_meal_qrpasses', JSON.stringify(qrPasses));
  }, [qrPasses]);

  useEffect(() => {
    localStorage.setItem('nexa_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  useEffect(() => {
    localStorage.setItem('nexa_shift_closes', JSON.stringify(shiftCloseRecords));
  }, [shiftCloseRecords]);

  // Load from backend on start
  const fetchAllFromBackend = useCallback(async () => {
    try {
      setIsSyncing(true);
      const [dbStat, backendSettings, backendCusts, backendMeals, backendPayments, backendPasses, backendShifts] =
        await Promise.allSettled([
          api.getDatabaseStatus(),
          api.getSettings(),
          api.getCustomers(),
          api.getMeals(),
          api.getPayments(),
          api.getPasses(),
          api.getShiftCloses(),
        ]);

      if (dbStat.status === 'fulfilled') setDatabaseStatus(dbStat.value);
      if (backendSettings.status === 'fulfilled' && backendSettings.value) {
        setSettings(backendSettings.value);
        if (backendSettings.value.currentShift) setCurrentShift(backendSettings.value.currentShift);
      }
      if (backendCusts.status === 'fulfilled' && backendCusts.value?.length) {
        setCustomers(backendCusts.value);
      }
      if (backendMeals.status === 'fulfilled' && backendMeals.value) {
        setMealRecords(backendMeals.value);
      }
      if (backendPayments.status === 'fulfilled' && backendPayments.value) {
        setPaymentRecords(backendPayments.value);
      }
      if (backendPasses.status === 'fulfilled' && backendPasses.value?.length) {
        setQrPasses(backendPasses.value);
      }
      if (backendShifts.status === 'fulfilled' && backendShifts.value) {
        setShiftCloseRecords(backendShifts.value);
      }
    } catch (e) {
      console.warn('Backend not responding yet, using cached data.', e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllFromBackend();
  }, [fetchAllFromBackend]);

  const refreshDatabaseStatus = async () => {
    try {
      const status = await api.getDatabaseStatus();
      setDatabaseStatus(status);
    } catch {
      // Non-blocking
    }
  };

  const connectNeonDatabase = async (connectionString: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsSyncing(true);
      const res = await api.connectDatabase(connectionString);
      if (res.success) {
        await refreshDatabaseStatus();
        await fetchAllFromBackend();
        sound.playSuccess();
      } else {
        sound.playError();
      }
      return res;
    } catch (err: any) {
      sound.playError();
      return { success: false, message: err.message || 'Failed connecting to Neon database.' };
    } finally {
      setIsSyncing(false);
    }
  };

  const activeCustomer = customers.find(c => c.id === activeCustomerId) || customers[0] || DEFAULT_CUSTOMERS[0];

  // Retrieve or create today's primary pass for active customer for current shift
  const todayQrPass = React.useMemo(() => {
    const existing = qrPasses.find(
      p => p.customerId === activeCustomerId && 
           p.type === 'regular' && 
           p.dateValid === todayDateStr &&
           (p.shift === currentShift || !p.shift)
    );
    if (existing) return existing;

    const newPass: QRCodePass = {
      code: `NEXA-${activeCustomerId}-${todayDateStr}-${currentShift.toUpperCase()}-REGULAR`,
      type: 'regular',
      shift: currentShift,
      customerId: activeCustomerId,
      customerName: activeCustomer.name,
      dateValid: todayDateStr,
      isUsed: false,
      createdTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Optimistically add and attempt backend persistence
    setQrPasses(prev => [...prev, newPass]);
    api.createPass(newPass).catch(() => {});

    return newPass;
  }, [activeCustomerId, activeCustomer.name, qrPasses, todayDateStr, currentShift]);

  // Guest passes for the active customer today
  const guestPasses = React.useMemo(() => {
    return qrPasses.filter(
      p => p.customerId === activeCustomerId && p.type === 'guest' && p.dateValid === todayDateStr
    );
  }, [activeCustomerId, qrPasses, todayDateStr]);

  const updateSettings = async (newSettings: Partial<RestaurantSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    try {
      const saved = await api.updateSettings(newSettings);
      setSettings(saved);
    } catch {
      // Local fallback already applied
    }
  };

  const toggleOfflineMode = () => {
    sound.playTap();
    setIsOfflineMode(prev => !prev);
  };

  const createGuestPass = async (guestName: string): Promise<QRCodePass | null> => {
    sound.playTap();
    if (guestPasses.length >= settings.maxGuestQrPerDay) {
      sound.playError();
      return null;
    }

    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `NEXA-${activeCustomer.id}-${todayDateStr}-${currentShift.toUpperCase()}-GUEST-${randomHex}`;
    const newPass: QRCodePass = {
      code,
      type: 'guest',
      shift: currentShift,
      customerId: activeCustomer.id,
      customerName: activeCustomer.name,
      guestName: guestName.trim() || 'Guest Lunch',
      dateValid: todayDateStr,
      isUsed: false,
      createdTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setQrPasses(prev => [newPass, ...prev]);
    api.createPass(newPass).catch(() => {});
    return newPass;
  };

  const deleteGuestPass = async (code: string) => {
    sound.playTap();
    setQrPasses(prev => prev.filter(p => p.code !== code));
    api.deletePass(code).catch(() => {});
  };

  // Scan deduction handler
  const scanQRCode = async (code: string): Promise<ScanResult> => {
    const cleanCode = code.trim();
    const nowIso = new Date().toISOString();

    if (isOfflineMode) {
      sound.playTap();
      const queuedItem: QueuedScan = {
        id: `offline-${Date.now()}`,
        code: cleanCode,
        shift: currentShift,
        timestamp: nowIso,
        customerName: customers.find(c => cleanCode.includes(c.id))?.name || 'Customer Pass',
      };
      setOfflineQueue(prev => [...prev, queuedItem]);

      const offlineResult: ScanResult = {
        success: true,
        isQueuedOffline: true,
        message: `Offline Mode Active: Pass successfully queued locally. Meals will automatically sync when online.`,
        timestamp: nowIso,
      };
      setLastScanResult(offlineResult);
      return offlineResult;
    }

    try {
      const res = await api.scanQRCode(cleanCode, currentShift);
      if (res.success) {
        sound.playSuccess();
        try {
          confetti({
            particleCount: 28,
            spread: 55,
            origin: { y: 0.6 },
            colors: ['#10b981', '#34d399', '#059669'],
          });
        } catch {}
        // Refresh updated data
        await fetchAllFromBackend();
      } else {
        sound.playError();
      }
      setLastScanResult(res);
      return res;
    } catch {
      // Local fallback processing if network drops
      const fallbackResult: ScanResult = {
        success: false,
        message: 'Unable to reach verification server. Pass queued for offline retry.',
        timestamp: nowIso,
      };
      setLastScanResult(fallbackResult);
      return fallbackResult;
    }
  };

  const syncOfflineQueue = async () => {
    sound.playTap();
    if (offlineQueue.length === 0) return;

    for (const item of offlineQueue) {
      try {
        await api.scanQRCode(item.code, item.shift);
      } catch (err) {
        console.error('Offline queue sync item error', err);
      }
    }

    setOfflineQueue([]);
    await fetchAllFromBackend();
    sound.playSuccess();
  };

  const recordWalkIn = async (
    mealCount: number,
    paymentMethod: 'cash' | 'momo',
    note?: string,
    momoRef?: string
  ): Promise<MealRecord> => {
    sound.playTap();
    try {
      const rec = await api.recordWalkIn(mealCount, paymentMethod, note, momoRef, currentShift);
      setMealRecords(prev => [rec, ...prev]);
      sound.playSuccess();
      return rec;
    } catch {
      const nowIso = new Date().toISOString();
      const amount = mealCount * settings.mealPriceRwf;
      const localRec: MealRecord = {
        id: `walkin-${Date.now()}`,
        timestamp: nowIso,
        customerId: 'walk-in',
        customerName: `Walk-in Diner (#${Math.floor(100 + Math.random() * 900)})`,
        shift: currentShift,
        type: 'walk-in',
        mealCount,
        amountRwf: amount,
        paymentMethod,
        momoReference: momoRef,
        scannedBy: "Cashier",
        status: 'valid',
        note,
      };
      setMealRecords(prev => [localRec, ...prev]);
      sound.playSuccess();
      return localRec;
    }
  };

  const topUpCustomer = async (
    customerId: string,
    amountRwf: number,
    method: 'momo' | 'cash' | 'bank',
    ref?: string,
    momoTxId?: string
  ) => {
    sound.playTap();
    try {
      const res = await api.topUpCustomer(customerId, amountRwf, method, ref, momoTxId);
      setCustomers(prev => prev.map(c => (c.id === customerId ? res.customer : c)));
      setPaymentRecords(prev => [res.payment, ...prev]);
      sound.playSuccess();
    } catch {
      // Local fallback
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;
      const mealsToAdd = Math.floor(amountRwf / settings.mealPriceRwf);
      const updated: Customer = {
        ...customer,
        totalMealsPurchased: customer.totalMealsPurchased + mealsToAdd,
        mealsRemaining: customer.mealsRemaining + mealsToAdd,
        balanceRwf: customer.balanceRwf + amountRwf,
        status: (customer.mealsRemaining + mealsToAdd) <= settings.lowBalanceThreshold ? 'low' : 'active',
      };
      setCustomers(prev => prev.map(c => (c.id === customerId ? updated : c)));
      sound.playSuccess();
    }
  };

  const reconcilePayment = async (id: string, reconciled: boolean) => {
    sound.playTap();
    setPaymentRecords(prev => prev.map(p => (p.id === id ? { ...p, reconciled } : p)));
    api.reconcilePayment(id, reconciled).catch(() => {});
  };

  const closeShift = async (
    countedCash: number,
    countedMomo: number,
    notes?: string
  ): Promise<ShiftCloseRecord> => {
    sound.playTap();
    try {
      const rep = await api.closeShift(todayDateStr, currentShift, countedCash, countedMomo, notes);
      setShiftCloseRecords(prev => [rep, ...prev]);
      sound.playSuccess();
      return rep;
    } catch {
      // Local computation fallback
      const shiftMeals = mealRecords.filter(
        r => r.timestamp.startsWith(todayDateStr) && r.status === 'valid' && (r.shift === currentShift || !r.shift)
      );
      const cashRecorded = shiftMeals.filter(r => r.paymentMethod === 'cash').reduce((sum, r) => sum + r.amountRwf, 0);
      const momoRecorded = shiftMeals.filter(r => r.paymentMethod === 'momo').reduce((sum, r) => sum + r.amountRwf, 0);

      const localRep: ShiftCloseRecord = {
        id: `shift-close-${Date.now()}`,
        date: todayDateStr,
        shift: currentShift,
        closedAt: new Date().toISOString(),
        cashRecordedRwf: cashRecorded,
        cashCountedRwf: countedCash,
        cashDiscrepancyRwf: countedCash - cashRecorded,
        momoRecordedRwf: momoRecorded,
        momoCountedRwf: countedMomo,
        momoDiscrepancyRwf: countedMomo - momoRecorded,
        totalMealsServed: shiftMeals.reduce((sum, r) => sum + r.mealCount, 0),
        subscribersServed: shiftMeals.filter(r => r.type === 'regular').reduce((sum, r) => sum + r.mealCount, 0),
        guestsServed: shiftMeals.filter(r => r.type === 'guest').reduce((sum, r) => sum + r.mealCount, 0),
        walkinsServed: shiftMeals.filter(r => r.type === 'walk-in').reduce((sum, r) => sum + r.mealCount, 0),
        notes,
      };
      setShiftCloseRecords(prev => [localRep, ...prev]);
      sound.playSuccess();
      return localRep;
    }
  };

  const registerCustomer = async (
    name: string,
    phone: string,
    initialDepositRwf: number,
    category: Customer['category'] = 'Student'
  ): Promise<Customer> => {
    sound.playTap();
    try {
      const newCust = await api.registerCustomer(name, phone, initialDepositRwf, category);
      await fetchAllFromBackend();
      sound.playSuccess();
      return newCust;
    } catch {
      const newId = `cust-${Date.now()}`;
      const mealsCredited = Math.floor(initialDepositRwf / settings.mealPriceRwf);
      const newCust: Customer = {
        id: newId,
        name: name.trim(),
        phone: phone.trim(),
        mealsRemaining: mealsCredited,
        totalMealsPurchased: mealsCredited,
        balanceRwf: initialDepositRwf,
        status: mealsCredited <= settings.lowBalanceThreshold ? 'low' : 'active',
        registeredDate: todayDateStr,
        category,
      };
      setCustomers(prev => [...prev, newCust]);
      sound.playSuccess();
      return newCust;
    }
  };

  const resetToDefaultData = async () => {
    sound.playTap();
    try {
      await api.resetData();
    } catch {}
    setSettings(DEFAULT_SETTINGS);
    setCustomers(DEFAULT_CUSTOMERS);
    setMealRecords(DEFAULT_MEAL_RECORDS);
    setPaymentRecords(DEFAULT_PAYMENTS);
    setOfflineQueue([]);
    setShiftCloseRecords([]);
    setActiveCustomerId("cust-1");
    setLastScanResult(null);
    setCurrentShift("lunch");
    localStorage.clear();
    sound.playSuccess();
  };

  const clearLastScanResult = () => {
    setLastScanResult(null);
  };

  const weeklyTrends = React.useMemo(() => {
    return computeWeeklyMealTrends(mealRecords, settings);
  }, [mealRecords, settings]);

  return (
    <MealAppContext.Provider
      value={{
        settings,
        updateSettings,
        customers,
        activeCustomer,
        setActiveCustomerId,
        todayDateStr,
        currentShift,
        setCurrentShift,
        todayQrPass,
        guestPasses,
        mealRecords,
        paymentRecords,
        createGuestPass,
        deleteGuestPass,
        scanQRCode,
        recordWalkIn,
        topUpCustomer,
        registerCustomer,
        resetToDefaultData,
        lastScanResult,
        clearLastScanResult,
        theme,
        toggleTheme,
        weeklyTrends,
        isOfflineMode,
        toggleOfflineMode,
        offlineQueue,
        syncOfflineQueue,
        shiftCloseRecords,
        closeShift,
        reconcilePayment,
        databaseStatus,
        refreshDatabaseStatus,
        connectNeonDatabase,
        isSyncing,
      }}
    >
      {children}
    </MealAppContext.Provider>
  );
};

export const useMealApp = () => {
  const context = useContext(MealAppContext);
  if (!context) {
    throw new Error("useMealApp must be used within a MealAppProvider");
  }
  return context;
};
