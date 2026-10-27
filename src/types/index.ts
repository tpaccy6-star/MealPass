/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  mealsRemaining: number;
  totalMealsPurchased: number;
  balanceRwf: number;
  status: 'active' | 'low' | 'finished';
  registeredDate: string;
  lastMealAt?: string;
  category: 'Student' | 'Worker' | 'Regular';
  notes?: string;
}

export type MealShift = 'lunch' | 'dinner';

export interface QRCodePass {
  code: string;
  type: 'regular' | 'guest';
  shift?: MealShift;
  customerId: string;
  customerName: string;
  dateValid: string; // YYYY-MM-DD
  isUsed: boolean;
  usedAt?: string;
  guestName?: string;
  createdTime: string;
}

export interface MealRecord {
  id: string;
  timestamp: string;
  customerId: string;
  customerName: string;
  shift?: MealShift;
  type: 'regular' | 'guest' | 'walk-in';
  guestName?: string;
  mealCount: number;
  teaCount: number;
  amountRwf: number;
  paymentMethod: 'balance' | 'cash' | 'momo';
  momoReference?: string;
  scannedBy: string;
  status: 'valid' | 'invalid';
  note?: string;
  remainingMealsAfter?: number;
}

export interface PaymentRecord {
  id: string;
  timestamp: string;
  customerId: string;
  customerName: string;
  amountRwf: number;
  mealsCredited: number;
  method: 'momo' | 'cash' | 'bank';
  referenceNo: string;
  momoTransactionId?: string;
  reconciled?: boolean;
}

export interface RestaurantSettings {
  restaurantName: string;
  location: string;
  phone: string;
  momoMerchantCode: string;
  mealPriceRwf: number;
  teaPriceRwf: number;
  maxGuestQrPerDay: number;
  lowBalanceThreshold: number;
  currency: string;
  currentShift: MealShift;
}

export interface QueuedScan {
  id: string;
  code: string;
  shift: MealShift;
  includeTea: boolean;
  timestamp: string;
  customerName?: string;
}

export interface ShiftCloseRecord {
  id: string;
  date: string;
  shift: MealShift;
  closedAt: string;
  cashRecordedRwf: number;
  cashCountedRwf: number;
  cashDiscrepancyRwf: number;
  momoRecordedRwf: number;
  momoCountedRwf: number;
  momoDiscrepancyRwf: number;
  totalMealsServed: number;
  totalTeaServed: number;
  subscribersServed: number;
  guestsServed: number;
  walkinsServed: number;
  notes?: string;
}

export interface ScanResult {
  success: boolean;
  message: string;
  isQueuedOffline?: boolean;
  customer?: Customer;
  qrPass?: QRCodePass;
  mealsRemaining?: number;
  teaIncluded?: boolean;
  timestamp: string;
  errorType?: 'already_used' | 'exhausted' | 'not_found' | 'expired' | 'limit_reached';
}

export type ThemeMode = 'dark' | 'light';

export interface DailyMealTrend {
  date: string;
  day: string;
  regularMeals: number;
  walkInMeals: number;
  guestMeals: number;
  totalMeals: number;
  teaCount: number;
  totalRevenueRwf: number;
}
