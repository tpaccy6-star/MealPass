/**
 * Frontend API client for communicating with the backend.
 * Automatically falls back to local simulation if the backend is unreachable.
 */

import { Customer, QRCodePass, MealRecord, PaymentRecord, RestaurantSettings, ScanResult, ShiftCloseRecord, MealShift } from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export interface DatabaseStatus {
  connected: boolean;
  databaseUrl: string;
  hasUrl: boolean;
  provider: string;
}

export const api = {
  // Database status and Neon connection
  async getDatabaseStatus(): Promise<DatabaseStatus> {
    return fetchJson<DatabaseStatus>('/database/status');
  },

  async connectDatabase(databaseUrl: string): Promise<{ success: boolean; message: string }> {
    return fetchJson<{ success: boolean; message: string }>('/database/connect', {
      method: 'POST',
      body: JSON.stringify({ databaseUrl }),
    });
  },

  // Settings
  async getSettings(): Promise<RestaurantSettings> {
    return fetchJson<RestaurantSettings>('/settings');
  },

  async updateSettings(settings: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
    return fetchJson<RestaurantSettings>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return fetchJson<Customer[]>('/customers');
  },

  async registerCustomer(
    name: string,
    phone: string,
    initialDepositRwf: number,
    category?: Customer['category']
  ): Promise<Customer> {
    return fetchJson<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify({ name, phone, initialDepositRwf, category }),
    });
  },

  async topUpCustomer(
    customerId: string,
    amountRwf: number,
    method: 'momo' | 'cash' | 'bank',
    referenceNo?: string,
    momoTransactionId?: string
  ): Promise<{ customer: Customer; payment: PaymentRecord }> {
    return fetchJson<{ customer: Customer; payment: PaymentRecord }>(`/customers/${customerId}/topup`, {
      method: 'POST',
      body: JSON.stringify({ amountRwf, method, referenceNo, momoTransactionId }),
    });
  },

  // QR Passes
  async getPasses(): Promise<QRCodePass[]> {
    return fetchJson<QRCodePass[]>('/passes');
  },

  async createPass(pass: QRCodePass): Promise<QRCodePass> {
    return fetchJson<QRCodePass>('/passes', {
      method: 'POST',
      body: JSON.stringify(pass),
    });
  },

  async deletePass(code: string): Promise<{ success: boolean }> {
    return fetchJson<{ success: boolean }>(`/passes/${encodeURIComponent(code)}`, {
      method: 'DELETE',
    });
  },

  // Scan
  async scanQRCode(code: string, shift?: MealShift): Promise<ScanResult> {
    return fetchJson<ScanResult>('/scan', {
      method: 'POST',
      body: JSON.stringify({ code, shift }),
    });
  },

  // Walk-in
  async recordWalkIn(
    mealCount: number,
    paymentMethod: 'cash' | 'momo',
    note?: string,
    momoReference?: string,
    shift?: MealShift
  ): Promise<MealRecord> {
    return fetchJson<MealRecord>('/walkin', {
      method: 'POST',
      body: JSON.stringify({ mealCount, paymentMethod, note, momoReference, shift }),
    });
  },

  // Meals
  async getMeals(): Promise<MealRecord[]> {
    return fetchJson<MealRecord[]>('/meals');
  },

  // Payments
  async getPayments(): Promise<PaymentRecord[]> {
    return fetchJson<PaymentRecord[]>('/payments');
  },

  async reconcilePayment(id: string, reconciled: boolean): Promise<{ success: boolean }> {
    return fetchJson<{ success: boolean }>(`/payments/${id}/reconcile`, {
      method: 'PATCH',
      body: JSON.stringify({ reconciled }),
    });
  },

  // Shift closes
  async getShiftCloses(): Promise<ShiftCloseRecord[]> {
    return fetchJson<ShiftCloseRecord[]>('/shift-closes');
  },

  async closeShift(
    date: string,
    shift: MealShift,
    countedCash: number,
    countedMomo: number,
    notes?: string
  ): Promise<ShiftCloseRecord> {
    return fetchJson<ShiftCloseRecord>('/shift-closes', {
      method: 'POST',
      body: JSON.stringify({ date, shift, countedCash, countedMomo, notes }),
    });
  },

  // Reset
  async resetData(): Promise<{ success: boolean }> {
    return fetchJson<{ success: boolean }>('/reset', {
      method: 'POST',
    });
  },
};
