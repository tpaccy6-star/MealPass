/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
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

interface MealAppContextType {
  settings: RestaurantSettings;
  updateSettings: (newSettings: Partial<RestaurantSettings>) => void;
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
  createGuestPass: (guestName: string) => QRCodePass | null;
  deleteGuestPass: (code: string) => void;
  scanQRCode: (code: string, addTea?: boolean) => ScanResult;
  recordWalkIn: (mealCount: number, teaCount: number, paymentMethod: 'cash' | 'momo', note?: string, momoRef?: string) => MealRecord;
  topUpCustomer: (customerId: string, amountRwf: number, method: 'momo' | 'cash' | 'bank', ref?: string, momoTxId?: string) => void;
  registerCustomer: (name: string, phone: string, initialDepositRwf: number, category?: Customer['category']) => Customer;
  resetToDefaultData: () => void;
  lastScanResult: ScanResult | null;
  clearLastScanResult: () => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  weeklyTrends: DailyMealTrend[];
  // Offline resilience
  isOfflineMode: boolean;
  toggleOfflineMode: () => void;
  offlineQueue: QueuedScan[];
  syncOfflineQueue: () => void;
  // Shift Close Reconciliation
  shiftCloseRecords: ShiftCloseRecord[];
  closeShift: (countedCash: number, countedMomo: number, notes?: string) => ShiftCloseRecord;
  // MoMo Reconciliation
  reconcilePayment: (id: string, reconciled: boolean) => void;
}

const DEFAULT_SETTINGS: RestaurantSettings = {
  restaurantName: "Kigali Garden Bistro",
  location: "Kanombe, Kigali, Rwanda",
  phone: "0788 768 148",
  momoMerchantCode: "602145",
  mealPriceRwf: 2000,
  teaPriceRwf: 500,
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
    notes: "Office worker, frequently adds spiced ginger tea.",
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
    teaCount: 1,
    amountRwf: 2500,
    paymentMethod: "momo",
    momoReference: "MP261027.0830.A102",
    scannedBy: "Staff - Eric",
    status: "valid",
    note: "Lunch buffet & spiced tea",
  },
  {
    id: "meal-rec-2",
    timestamp: "2026-10-26T13:30:00Z",
    customerId: "cust-4",
    customerName: "Christian Kwizera",
    shift: "lunch",
    type: "regular",
    mealCount: 1,
    teaCount: 0,
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
    teaCount: 1,
    amountRwf: 2500,
    paymentMethod: "balance",
    scannedBy: "Owner - Tuyiringire",
    status: "valid",
    remainingMealsAfter: 4,
  },
  {
    id: "meal-rec-4",
    timestamp: "2026-10-26T12:46:00Z",
    customerId: "cust-1",
    customerName: "Tuyiringire Pacifique",
    guestName: "Emmanuel (Guest)",
    shift: "lunch",
    type: "guest",
    mealCount: 1,
    teaCount: 0,
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
  {
    id: "pay-3",
    timestamp: "2026-10-01T11:00:00Z",
    customerId: "cust-1",
    customerName: "Tuyiringire Pacifique",
    amountRwf: 50000,
    mealsCredited: 25,
    method: "cash",
    referenceNo: "CSH-20261001-09",
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
    let tea = dayRecords.reduce((sum, r) => sum + r.teaCount, 0);
    let rev = dayRecords.reduce((sum, r) => sum + r.amountRwf, 0);

    if (dayRecords.length === 0 && i > 0) {
      const baselineData = [
        { reg: 22, wlk: 10, gst: 3, t: 14 },
        { reg: 25, wlk: 12, gst: 4, t: 16 },
        { reg: 29, wlk: 14, gst: 5, t: 21 },
        { reg: 16, wlk: 18, gst: 2, t: 12 },
        { reg: 12, wlk: 15, gst: 1, t: 8 },
        { reg: 28, wlk: 11, gst: 4, t: 18 },
      ][(6 - i) % 6];
      regular = baselineData.reg;
      walkin = baselineData.wlk;
      guest = baselineData.gst;
      tea = baselineData.t;
      rev = (regular + walkin + guest) * settings.mealPriceRwf + tea * settings.teaPriceRwf;
    }

    trends.push({
      date: dateStr,
      day: dayLabel,
      regularMeals: regular,
      walkInMeals: walkin,
      guestMeals: guest,
      totalMeals: regular + walkin + guest,
      teaCount: tea,
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
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        code: `NEXA-cust-1-${today}-LUNCH-REGULAR`,
        type: 'regular',
        shift: 'lunch',
        customerId: 'cust-1',
        customerName: 'Tuyiringire Pacifique',
        dateValid: today,
        isUsed: false,
        createdTime: '08:00 AM',
      },
      {
        code: `NEXA-cust-1-${today}-LUNCH-GUEST-EMMA`,
        type: 'guest',
        shift: 'lunch',
        customerId: 'cust-1',
        customerName: 'Tuyiringire Pacifique',
        guestName: 'Aimable (Friend)',
        dateValid: today,
        isUsed: false,
        createdTime: '09:15 AM',
      },
    ];
  });

  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);

  // Operational State: Shift & Offline Queue
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

  const activeCustomer = customers.find(c => c.id === activeCustomerId) || customers[0];

  // Retrieve or create today's primary pass for active customer for the current shift
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

    setQrPasses(prev => [...prev, newPass]);
    return newPass;
  }, [activeCustomerId, activeCustomer.name, qrPasses, todayDateStr, currentShift]);

  // Guest passes for the active customer today
  const guestPasses = React.useMemo(() => {
    return qrPasses.filter(
      p => p.customerId === activeCustomerId && p.type === 'guest' && p.dateValid === todayDateStr
    );
  }, [activeCustomerId, qrPasses, todayDateStr]);

  const updateSettings = (newSettings: Partial<RestaurantSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleOfflineMode = () => {
    sound.playTap();
    setIsOfflineMode(prev => !prev);
  };

  const createGuestPass = (guestName: string): QRCodePass | null => {
    sound.playTap();
    // Enforce Proposal Section 9: Configurable max guest QR passes per day
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
    return newPass;
  };

  const deleteGuestPass = (code: string) => {
    sound.playTap();
    setQrPasses(prev => prev.filter(p => p.code !== code));
  };

  // Process a single scan deduction
  const processDeduction = (cleanCode: string, addTea: boolean): ScanResult => {
    const nowIso = new Date().toISOString();
    let pass = qrPasses.find(p => p.code === cleanCode);

    if (!pass && cleanCode.startsWith('NEXA-')) {
      const parts = cleanCode.split('-');
      if (parts.length >= 4) {
        const custId = parts[1];
        const dateValid = parts[2];
        const isGuest = cleanCode.includes('GUEST');
        const foundCust = customers.find(c => c.id === custId);
        if (foundCust) {
          pass = {
            code: cleanCode,
            type: isGuest ? 'guest' : 'regular',
            shift: currentShift,
            customerId: foundCust.id,
            customerName: foundCust.name,
            dateValid: dateValid,
            isUsed: false,
            createdTime: 'Generated',
          };
          setQrPasses(prev => [...prev, pass!]);
        }
      }
    }

    if (!pass) {
      sound.playError();
      const res: ScanResult = {
        success: false,
        message: "Invalid QR Code: Not recognized by this restaurant system.",
        timestamp: nowIso,
        errorType: 'not_found',
      };
      setLastScanResult(res);
      return res;
    }

    if (pass.isUsed) {
      sound.playError();
      const usedTimeStr = pass.usedAt
        ? new Date(pass.usedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'earlier today';
      const res: ScanResult = {
        success: false,
        message: `Already Scanned: This pass was used today for ${pass.shift || currentShift} at ${usedTimeStr}. Daily QR codes work only once!`,
        qrPass: pass,
        timestamp: nowIso,
        errorType: 'already_used',
      };
      setLastScanResult(res);
      return res;
    }

    const customer = customers.find(c => c.id === pass!.customerId);
    if (!customer) {
      sound.playError();
      const res: ScanResult = {
        success: false,
        message: "Customer account not found.",
        timestamp: nowIso,
        errorType: 'not_found',
      };
      setLastScanResult(res);
      return res;
    }

    if (customer.mealsRemaining <= 0) {
      sound.playError();
      const invalidRec: MealRecord = {
        id: `meal-invalid-${Date.now()}`,
        timestamp: nowIso,
        customerId: customer.id,
        customerName: customer.name,
        shift: currentShift,
        type: pass.type,
        guestName: pass.guestName,
        mealCount: 0,
        teaCount: 0,
        amountRwf: 0,
        paymentMethod: 'balance',
        scannedBy: "Staff Scanner",
        status: 'invalid',
        note: "Blocked: Zero meal balance remaining.",
      };
      setMealRecords(prev => [invalidRec, ...prev]);

      const res: ScanResult = {
        success: false,
        message: `Not Valid: ${customer.name} has 0 meals left in prepaid balance. Please top up before ordering.`,
        customer,
        qrPass: pass,
        mealsRemaining: 0,
        timestamp: nowIso,
        errorType: 'exhausted',
      };
      setLastScanResult(res);
      return res;
    }

    const newRemainingMeals = customer.mealsRemaining - 1;
    const mealPrice = settings.mealPriceRwf;
    const teaPrice = addTea ? settings.teaPriceRwf : 0;
    const totalAmount = mealPrice + teaPrice;
    const newBalanceRwf = Math.max(0, customer.balanceRwf - totalAmount);

    let newStatus: Customer['status'] = 'active';
    if (newRemainingMeals === 0) {
      newStatus = 'finished';
    } else if (newRemainingMeals <= settings.lowBalanceThreshold) {
      newStatus = 'low';
    }

    setQrPasses(prev =>
      prev.map(p =>
        p.code === pass!.code
          ? { ...p, isUsed: true, usedAt: nowIso }
          : p
      )
    );

    setCustomers(prev =>
      prev.map(c =>
        c.id === customer.id
          ? {
              ...c,
              mealsRemaining: newRemainingMeals,
              balanceRwf: newBalanceRwf,
              status: newStatus,
              lastMealAt: nowIso,
            }
          : c
      )
    );

    const newRecord: MealRecord = {
      id: `meal-${Date.now()}`,
      timestamp: nowIso,
      customerId: customer.id,
      customerName: customer.name,
      shift: currentShift,
      type: pass.type,
      guestName: pass.guestName,
      mealCount: 1,
      teaCount: addTea ? 1 : 0,
      amountRwf: totalAmount,
      paymentMethod: 'balance',
      scannedBy: "Staff POS",
      status: 'valid',
      remainingMealsAfter: newRemainingMeals,
    };
    setMealRecords(prev => [newRecord, ...prev]);

    sound.playSuccess();
    try {
      confetti({
        particleCount: 28,
        spread: 55,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#059669'],
      });
    } catch {
      // non-blocking
    }

    const result: ScanResult = {
      success: true,
      message: `Valid: 1 ${currentShift} meal deducted for ${customer.name}.${addTea ? ' Spiced tea added.' : ''} ${newRemainingMeals} meals remaining.`,
      customer: {
        ...customer,
        mealsRemaining: newRemainingMeals,
        balanceRwf: newBalanceRwf,
        status: newStatus,
      },
      qrPass: { ...pass, isUsed: true, usedAt: nowIso },
      mealsRemaining: newRemainingMeals,
      teaIncluded: addTea,
      timestamp: nowIso,
    };

    setLastScanResult(result);
    return result;
  };

  // Scanning with Offline Mode interception
  const scanQRCode = (code: string, addTea: boolean = false): ScanResult => {
    const cleanCode = code.trim();
    const nowIso = new Date().toISOString();

    if (isOfflineMode) {
      sound.playTap();
      const queuedItem: QueuedScan = {
        id: `offline-${Date.now()}`,
        code: cleanCode,
        shift: currentShift,
        includeTea: addTea,
        timestamp: nowIso,
        customerName: customers.find(c => cleanCode.includes(c.id))?.name || 'Customer Pass',
      };
      setOfflineQueue(prev => [...prev, queuedItem]);

      const offlineResult: ScanResult = {
        success: true,
        isQueuedOffline: true,
        message: `Offline Mode Active: Pass successfully queued locally. Meals will automatically sync when online.`,
        timestamp: nowIso,
        teaIncluded: addTea,
      };
      setLastScanResult(offlineResult);
      return offlineResult;
    }

    return processDeduction(cleanCode, addTea);
  };

  // Sync offline queue when back online
  const syncOfflineQueue = () => {
    sound.playTap();
    if (offlineQueue.length === 0) return;

    offlineQueue.forEach(item => {
      processDeduction(item.code, item.includeTea);
    });

    setOfflineQueue([]);
    sound.playSuccess();
  };

  // Record Walk-In with optional MoMo Transaction Reference
  const recordWalkIn = (
    mealCount: number,
    teaCount: number,
    paymentMethod: 'cash' | 'momo',
    note?: string,
    momoRef?: string
  ): MealRecord => {
    sound.playTap();
    const nowIso = new Date().toISOString();
    const amount = mealCount * settings.mealPriceRwf + teaCount * settings.teaPriceRwf;
    const finalMomoRef = momoRef?.trim() || (paymentMethod === 'momo' ? `MOMO-${Math.floor(1000000 + Math.random() * 9000000)}` : undefined);

    const record: MealRecord = {
      id: `walkin-${Date.now()}`,
      timestamp: nowIso,
      customerId: 'walk-in',
      customerName: `Walk-in Diner (#${Math.floor(100 + Math.random() * 900)})`,
      shift: currentShift,
      type: 'walk-in',
      mealCount,
      teaCount,
      amountRwf: amount,
      paymentMethod,
      momoReference: finalMomoRef,
      scannedBy: "Cashier",
      status: 'valid',
      note: note || undefined,
    };

    setMealRecords(prev => [record, ...prev]);
    sound.playSuccess();
    return record;
  };

  // Top-Up customer with MoMo Transaction ID
  const topUpCustomer = (
    customerId: string,
    amountRwf: number,
    method: 'momo' | 'cash' | 'bank',
    ref?: string,
    momoTxId?: string
  ) => {
    sound.playTap();
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const mealsToAdd = Math.floor(amountRwf / settings.mealPriceRwf);
    const newTotalMealsPurchased = customer.totalMealsPurchased + mealsToAdd;
    const newRemainingMeals = customer.mealsRemaining + mealsToAdd;
    const newBalanceRwf = customer.balanceRwf + amountRwf;
    const nowIso = new Date().toISOString();

    setCustomers(prev =>
      prev.map(c =>
        c.id === customerId
          ? {
              ...c,
              totalMealsPurchased: newTotalMealsPurchased,
              mealsRemaining: newRemainingMeals,
              balanceRwf: newBalanceRwf,
              status: newRemainingMeals <= settings.lowBalanceThreshold ? 'low' : 'active',
            }
          : c
      )
    );

    const payment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      timestamp: nowIso,
      customerId: customer.id,
      customerName: customer.name,
      amountRwf,
      mealsCredited: mealsToAdd,
      method,
      referenceNo: ref || `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
      momoTransactionId: momoTxId || (method === 'momo' ? `MP${todayDateStr.replace(/-/g, '').slice(2)}.${Math.floor(1000 + Math.random() * 9000)}.RW` : undefined),
      reconciled: method === 'cash',
    };
    setPaymentRecords(prev => [payment, ...prev]);
    sound.playSuccess();
  };

  // Reconcile MoMo payment against SMS records
  const reconcilePayment = (id: string, reconciled: boolean) => {
    sound.playTap();
    setPaymentRecords(prev =>
      prev.map(p => (p.id === id ? { ...p, reconciled } : p))
    );
  };

  // Close shift and compute cash / MoMo discrepancies
  const closeShift = (countedCash: number, countedMomo: number, notes?: string): ShiftCloseRecord => {
    sound.playTap();
    const nowIso = new Date().toISOString();

    // Today's shift meals
    const shiftMeals = mealRecords.filter(
      r => r.timestamp.startsWith(todayDateStr) && r.status === 'valid' && (r.shift === currentShift || !r.shift)
    );

    const cashRecorded = shiftMeals
      .filter(r => r.paymentMethod === 'cash')
      .reduce((sum, r) => sum + r.amountRwf, 0);

    const momoRecorded = shiftMeals
      .filter(r => r.paymentMethod === 'momo')
      .reduce((sum, r) => sum + r.amountRwf, 0);

    const totalMealsServed = shiftMeals.reduce((sum, r) => sum + r.mealCount, 0);
    const totalTeaServed = shiftMeals.reduce((sum, r) => sum + r.teaCount, 0);
    const subscribersServed = shiftMeals.filter(r => r.type === 'regular').reduce((sum, r) => sum + r.mealCount, 0);
    const guestsServed = shiftMeals.filter(r => r.type === 'guest').reduce((sum, r) => sum + r.mealCount, 0);
    const walkinsServed = shiftMeals.filter(r => r.type === 'walk-in').reduce((sum, r) => sum + r.mealCount, 0);

    const report: ShiftCloseRecord = {
      id: `shift-close-${Date.now()}`,
      date: todayDateStr,
      shift: currentShift,
      closedAt: nowIso,
      cashRecordedRwf: cashRecorded,
      cashCountedRwf: countedCash,
      cashDiscrepancyRwf: countedCash - cashRecorded,
      momoRecordedRwf: momoRecorded,
      momoCountedRwf: countedMomo,
      momoDiscrepancyRwf: countedMomo - momoRecorded,
      totalMealsServed,
      totalTeaServed,
      subscribersServed,
      guestsServed,
      walkinsServed,
      notes,
    };

    setShiftCloseRecords(prev => [report, ...prev]);
    sound.playSuccess();
    return report;
  };

  const registerCustomer = (
    name: string,
    phone: string,
    initialDepositRwf: number,
    category: Customer['category'] = 'Student'
  ): Customer => {
    sound.playTap();
    const newId = `cust-${Date.now()}`;
    const mealsCredited = Math.floor(initialDepositRwf / settings.mealPriceRwf);
    const nowIso = new Date().toISOString();

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

    if (initialDepositRwf > 0) {
      const pay: PaymentRecord = {
        id: `pay-init-${Date.now()}`,
        timestamp: nowIso,
        customerId: newId,
        customerName: newCust.name,
        amountRwf: initialDepositRwf,
        mealsCredited,
        method: 'momo',
        referenceNo: `MOMO-INIT-${Math.floor(100000 + Math.random() * 900000)}`,
        momoTransactionId: `MP${todayDateStr.replace(/-/g, '').slice(2)}.${Math.floor(1000 + Math.random() * 9000)}.RW`,
        reconciled: true,
      };
      setPaymentRecords(prev => [pay, ...prev]);
    }

    sound.playSuccess();
    return newCust;
  };

  const resetToDefaultData = () => {
    sound.playTap();
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
