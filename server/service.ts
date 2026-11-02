/**
 * Service layer that routes queries to Neon PostgreSQL when connected,
 * or gracefully falls back to the local in-memory store.
 */

import { getPool, isDatabaseConnected } from './db';
import { fallbackStore } from './store';
import { Customer, QRCodePass, MealRecord, PaymentRecord, RestaurantSettings, ShiftCloseRecord, ScanResult } from '../src/types';

// Helper to convert snake_case postgres row to Customer
function mapCustomerRow(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || undefined,
    avatarUrl: row.avatar_url || undefined,
    mealsRemaining: Number(row.meals_remaining),
    totalMealsPurchased: Number(row.total_meals_purchased),
    balanceRwf: Number(row.balance_rwf),
    status: row.status,
    registeredDate: row.registered_date,
    lastMealAt: row.last_meal_at ? new Date(row.last_meal_at).toISOString() : undefined,
    category: row.category,
    notes: row.notes || undefined,
  };
}

function mapSettingsRow(row: any): RestaurantSettings {
  return {
    restaurantName: row.restaurant_name,
    location: row.location,
    phone: row.phone,
    momoMerchantCode: row.momo_merchant_code,
    mealPriceRwf: Number(row.meal_price_rwf),
    maxGuestQrPerDay: Number(row.max_guest_qr_per_day),
    lowBalanceThreshold: Number(row.low_balance_threshold),
    currency: row.currency,
    currentShift: row.current_shift,
  };
}

export const mealService = {
  // SETTINGS
  async getSettings(): Promise<RestaurantSettings> {
    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      const res = await pool.query('SELECT * FROM restaurant_settings WHERE id = $1', ['default']);
      if (res.rows.length > 0) {
        return mapSettingsRow(res.rows[0]);
      }
    }
    return fallbackStore.settings;
  },

  async updateSettings(updates: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
    const current = await this.getSettings();
    const updated: RestaurantSettings = { ...current, ...updates };

    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      await pool.query(
        `UPDATE restaurant_settings SET
          restaurant_name = $1,
          location = $2,
          phone = $3,
          momo_merchant_code = $4,
          meal_price_rwf = $5,
          max_guest_qr_per_day = $6,
          low_balance_threshold = $7,
          currency = $8,
          current_shift = $9,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 'default'`,
        [
          updated.restaurantName,
          updated.location,
          updated.phone,
          updated.momoMerchantCode,
          updated.mealPriceRwf,
          updated.maxGuestQrPerDay,
          updated.lowBalanceThreshold,
          updated.currency,
          updated.currentShift,
        ]
      );
    }
    fallbackStore.settings = updated;
    return updated;
  },

  // CUSTOMERS
  async getCustomers(): Promise<Customer[]> {
    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      const res = await pool.query('SELECT * FROM customers ORDER BY name ASC');
      return res.rows.map(mapCustomerRow);
    }
    return fallbackStore.customers;
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      const res = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
      if (res.rows.length > 0) return mapCustomerRow(res.rows[0]);
      return null;
    }
    return fallbackStore.customers.find(c => c.id === id) || null;
  },

  async createCustomer(cust: Omit<Customer, 'id'> & { id?: string }): Promise<Customer> {
    const newId = cust.id || `cust-${Date.now()}`;
    const newCustomer: Customer = {
      ...cust,
      id: newId,
    };

    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      await pool.query(
        `INSERT INTO customers (
          id, name, phone, email, avatar_url, meals_remaining, total_meals_purchased, balance_rwf, status, registered_date, last_meal_at, category, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          newCustomer.id,
          newCustomer.name,
          newCustomer.phone,
          newCustomer.email || null,
          newCustomer.avatarUrl || null,
          newCustomer.mealsRemaining,
          newCustomer.totalMealsPurchased,
          newCustomer.balanceRwf,
          newCustomer.status,
          newCustomer.registeredDate,
          newCustomer.lastMealAt || null,
          newCustomer.category,
          newCustomer.notes || null,
        ]
      );
    }

    fallbackStore.customers.push(newCustomer);
    return newCustomer;
  },

  // TOP-UP
  async topUpCustomer(
    customerId: string,
    amountRwf: number,
    method: 'momo' | 'cash' | 'bank',
    ref?: string,
    momoTxId?: string
  ): Promise<{ customer: Customer; payment: PaymentRecord }> {
    const settings = await this.getSettings();
    const customer = await this.getCustomerById(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const mealsToAdd = Math.floor(amountRwf / settings.mealPriceRwf);
    const newTotalMealsPurchased = customer.totalMealsPurchased + mealsToAdd;
    const newRemainingMeals = customer.mealsRemaining + mealsToAdd;
    const newBalanceRwf = customer.balanceRwf + amountRwf;
    const nowIso = new Date().toISOString();
    const newStatus: Customer['status'] = newRemainingMeals <= settings.lowBalanceThreshold ? 'low' : 'active';

    const updatedCustomer: Customer = {
      ...customer,
      totalMealsPurchased: newTotalMealsPurchased,
      mealsRemaining: newRemainingMeals,
      balanceRwf: newBalanceRwf,
      status: newStatus,
    };

    const payment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      timestamp: nowIso,
      customerId: customer.id,
      customerName: customer.name,
      amountRwf,
      mealsCredited: mealsToAdd,
      method,
      referenceNo: ref || `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
      momoTransactionId: momoTxId || (method === 'momo' ? `MP${nowIso.replace(/[-:TZ.]/g, '').slice(2, 12)}.RW` : undefined),
      reconciled: method === 'cash',
    };

    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      await pool.query(
        `UPDATE customers SET
          meals_remaining = $1,
          total_meals_purchased = $2,
          balance_rwf = $3,
          status = $4
        WHERE id = $5`,
        [newRemainingMeals, newTotalMealsPurchased, newBalanceRwf, newStatus, customerId]
      );

      await pool.query(
        `INSERT INTO payment_records (
          id, timestamp, customer_id, customer_name, amount_rwf, meals_credited, method, reference_no, momo_transaction_id, reconciled
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          payment.id,
          payment.timestamp,
          payment.customerId,
          payment.customerName,
          payment.amountRwf,
          payment.mealsCredited,
          payment.method,
          payment.referenceNo,
          payment.momoTransactionId || null,
          payment.reconciled || false,
        ]
      );
    }

    fallbackStore.customers = fallbackStore.customers.map(c => (c.id === customerId ? updatedCustomer : c));
    fallbackStore.paymentRecords.unshift(payment);

    return { customer: updatedCustomer, payment };
  },

  // QR PASSES
  async getQrPasses(): Promise<QRCodePass[]> {
    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      const res = await pool.query('SELECT * FROM qr_passes ORDER BY created_at DESC');
      return res.rows.map(r => ({
        code: r.code,
        type: r.type,
        shift: r.shift,
        customerId: r.customer_id,
        customerName: r.customer_name,
        dateValid: r.date_valid,
        isUsed: r.is_used,
        usedAt: r.used_at ? new Date(r.used_at).toISOString() : undefined,
        guestName: r.guest_name || undefined,
        createdTime: r.created_time,
      }));
    }
    return fallbackStore.qrPasses;
  },

  async createQrPass(pass: QRCodePass): Promise<QRCodePass> {
    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      await pool.query(
        `INSERT INTO qr_passes (
          code, type, shift, customer_id, customer_name, date_valid, is_used, used_at, guest_name, created_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (code) DO NOTHING`,
        [
          pass.code,
          pass.type,
          pass.shift || 'lunch',
          pass.customerId,
          pass.customerName,
          pass.dateValid,
          pass.isUsed,
          pass.usedAt || null,
          pass.guestName || null,
          pass.createdTime,
        ]
      );
    }
    if (!fallbackStore.qrPasses.some(p => p.code === pass.code)) {
      fallbackStore.qrPasses.unshift(pass);
    }
    return pass;
  },

  async deleteQrPass(code: string): Promise<boolean> {
    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      await pool.query('DELETE FROM qr_passes WHERE code = $1', [code]);
    }
    fallbackStore.qrPasses = fallbackStore.qrPasses.filter(p => p.code !== code);
    return true;
  },

  // SCAN AND DEDUCT
  async scanQRCode(code: string, currentShiftOverride?: 'lunch' | 'dinner'): Promise<ScanResult> {
    const cleanCode = code.trim();
    const nowIso = new Date().toISOString();
    const settings = await this.getSettings();
    const shift = currentShiftOverride || settings.currentShift;

    // Check pass
    let passes = await this.getQrPasses();
    let pass = passes.find(p => p.code === cleanCode);

    // Auto-generate if standard format NEXA-cust-X-...
    if (!pass && cleanCode.startsWith('NEXA-')) {
      const parts = cleanCode.split('-');
      if (parts.length >= 4) {
        const custId = parts[1];
        const dateValid = parts[2];
        const isGuest = cleanCode.includes('GUEST');
        const foundCust = await this.getCustomerById(custId);
        if (foundCust) {
          pass = {
            code: cleanCode,
            type: isGuest ? 'guest' : 'regular',
            shift,
            customerId: foundCust.id,
            customerName: foundCust.name,
            dateValid,
            isUsed: false,
            createdTime: 'Auto',
          };
          await this.createQrPass(pass);
        }
      }
    }

    if (!pass) {
      return {
        success: false,
        message: 'Invalid QR Code: Not recognized by this restaurant system.',
        timestamp: nowIso,
        errorType: 'not_found',
      };
    }

    if (pass.isUsed) {
      const usedTimeStr = pass.usedAt
        ? new Date(pass.usedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'earlier';
      return {
        success: false,
        message: `Already Scanned: This pass was used today for ${pass.shift || shift} at ${usedTimeStr}. Daily QR codes work only once!`,
        qrPass: pass,
        timestamp: nowIso,
        errorType: 'already_used',
      };
    }

    const customer = await this.getCustomerById(pass.customerId);
    if (!customer) {
      return {
        success: false,
        message: 'Customer account not found.',
        timestamp: nowIso,
        errorType: 'not_found',
      };
    }

    if (customer.mealsRemaining <= 0) {
      const invalidRec: MealRecord = {
        id: `meal-invalid-${Date.now()}`,
        timestamp: nowIso,
        customerId: customer.id,
        customerName: customer.name,
        shift,
        type: pass.type,
        guestName: pass.guestName,
        mealCount: 0,
        amountRwf: 0,
        paymentMethod: 'balance',
        scannedBy: 'Staff Scanner',
        status: 'invalid',
        note: 'Blocked: Zero meal balance remaining.',
      };
      await this.recordMeal(invalidRec);

      return {
        success: false,
        message: `Not Valid: ${customer.name} has 0 meals left in prepaid balance. Please top up before ordering.`,
        customer,
        qrPass: pass,
        mealsRemaining: 0,
        timestamp: nowIso,
        errorType: 'exhausted',
      };
    }

    const newRemainingMeals = customer.mealsRemaining - 1;
    const totalAmount = settings.mealPriceRwf;
    const newBalanceRwf = Math.max(0, customer.balanceRwf - totalAmount);

    let newStatus: Customer['status'] = 'active';
    if (newRemainingMeals === 0) {
      newStatus = 'finished';
    } else if (newRemainingMeals <= settings.lowBalanceThreshold) {
      newStatus = 'low';
    }

    const updatedCustomer: Customer = {
      ...customer,
      mealsRemaining: newRemainingMeals,
      balanceRwf: newBalanceRwf,
      status: newStatus,
      lastMealAt: nowIso,
    };

    const updatedPass: QRCodePass = {
      ...pass,
      isUsed: true,
      usedAt: nowIso,
    };

    const newRecord: MealRecord = {
      id: `meal-${Date.now()}`,
      timestamp: nowIso,
      customerId: customer.id,
      customerName: customer.name,
      shift,
      type: pass.type,
      guestName: pass.guestName,
      mealCount: 1,
      amountRwf: totalAmount,
      paymentMethod: 'balance',
      scannedBy: 'Staff POS',
      status: 'valid',
      remainingMealsAfter: newRemainingMeals,
    };

    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      await pool.query(
        'UPDATE qr_passes SET is_used = TRUE, used_at = $1 WHERE code = $2',
        [nowIso, pass.code]
      );
      await pool.query(
        `UPDATE customers SET
          meals_remaining = $1,
          balance_rwf = $2,
          status = $3,
          last_meal_at = $4
        WHERE id = $5`,
        [newRemainingMeals, newBalanceRwf, newStatus, nowIso, customer.id]
      );
    }

    fallbackStore.qrPasses = fallbackStore.qrPasses.map(p => (p.code === pass!.code ? updatedPass : p));
    fallbackStore.customers = fallbackStore.customers.map(c => (c.id === customer.id ? updatedCustomer : c));

    await this.recordMeal(newRecord);

    return {
      success: true,
      message: `Valid: 1 ${shift} meal deducted for ${customer.name}. ${newRemainingMeals} meals remaining.`,
      customer: updatedCustomer,
      qrPass: updatedPass,
      mealsRemaining: newRemainingMeals,
      timestamp: nowIso,
    };
  },

  // MEAL RECORDS
  async getMealRecords(): Promise<MealRecord[]> {
    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      const res = await pool.query('SELECT * FROM meal_records ORDER BY timestamp DESC');
      return res.rows.map(r => ({
        id: r.id,
        timestamp: new Date(r.timestamp).toISOString(),
        customerId: r.customer_id,
        customerName: r.customer_name,
        shift: r.shift,
        type: r.type,
        guestName: r.guest_name || undefined,
        mealCount: Number(r.meal_count),
        amountRwf: Number(r.amount_rwf),
        paymentMethod: r.payment_method,
        momoReference: r.momo_reference || undefined,
        scannedBy: r.scanned_by,
        status: r.status,
        note: r.note || undefined,
        remainingMealsAfter: r.remaining_meals_after !== null ? Number(r.remaining_meals_after) : undefined,
      }));
    }
    return fallbackStore.mealRecords;
  },

  async recordMeal(record: MealRecord): Promise<MealRecord> {
    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      await pool.query(
        `INSERT INTO meal_records (
          id, timestamp, customer_id, customer_name, shift, type, guest_name, meal_count, amount_rwf, payment_method, momo_reference, scanned_by, status, note, remaining_meals_after
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          record.id,
          record.timestamp,
          record.customerId,
          record.customerName,
          record.shift || 'lunch',
          record.type,
          record.guestName || null,
          record.mealCount,
          record.amountRwf,
          record.paymentMethod,
          record.momoReference || null,
          record.scannedBy,
          record.status,
          record.note || null,
          record.remainingMealsAfter ?? null,
        ]
      );
    }
    fallbackStore.mealRecords.unshift(record);
    return record;
  },

  // PAYMENTS
  async getPayments(): Promise<PaymentRecord[]> {
    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      const res = await pool.query('SELECT * FROM payment_records ORDER BY timestamp DESC');
      return res.rows.map(r => ({
        id: r.id,
        timestamp: new Date(r.timestamp).toISOString(),
        customerId: r.customer_id,
        customerName: r.customer_name,
        amountRwf: Number(r.amount_rwf),
        mealsCredited: Number(r.meals_credited),
        method: r.method,
        referenceNo: r.reference_no,
        momoTransactionId: r.momo_transaction_id || undefined,
        reconciled: r.reconciled,
      }));
    }
    return fallbackStore.paymentRecords;
  },

  async reconcilePayment(id: string, reconciled: boolean): Promise<boolean> {
    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      await pool.query('UPDATE payment_records SET reconciled = $1 WHERE id = $2', [reconciled, id]);
    }
    fallbackStore.paymentRecords = fallbackStore.paymentRecords.map(p => (p.id === id ? { ...p, reconciled } : p));
    return true;
  },

  // SHIFT CLOSES
  async getShiftCloses(): Promise<ShiftCloseRecord[]> {
    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      const res = await pool.query('SELECT * FROM shift_close_records ORDER BY closed_at DESC');
      return res.rows.map(r => ({
        id: r.id,
        date: r.date,
        shift: r.shift,
        closedAt: new Date(r.closed_at).toISOString(),
        cashRecordedRwf: Number(r.cash_recorded_rwf),
        cashCountedRwf: Number(r.cash_counted_rwf),
        cashDiscrepancyRwf: Number(r.cash_discrepancy_rwf),
        momoRecordedRwf: Number(r.momo_recorded_rwf),
        momoCountedRwf: Number(r.momo_counted_rwf),
        momoDiscrepancyRwf: Number(r.momo_discrepancy_rwf),
        totalMealsServed: Number(r.total_meals_served),
        subscribersServed: Number(r.subscribers_served),
        guestsServed: Number(r.guests_served),
        walkinsServed: Number(r.walkins_served),
        notes: r.notes || undefined,
      }));
    }
    return fallbackStore.shiftCloseRecords;
  },

  async closeShift(
    date: string,
    shift: 'lunch' | 'dinner',
    countedCash: number,
    countedMomo: number,
    notes?: string
  ): Promise<ShiftCloseRecord> {
    const mealRecords = await this.getMealRecords();
    const shiftMeals = mealRecords.filter(
      r => r.timestamp.startsWith(date) && r.status === 'valid' && (r.shift === shift || !r.shift)
    );

    const cashRecorded = shiftMeals
      .filter(r => r.paymentMethod === 'cash')
      .reduce((sum, r) => sum + r.amountRwf, 0);

    const momoRecorded = shiftMeals
      .filter(r => r.paymentMethod === 'momo')
      .reduce((sum, r) => sum + r.amountRwf, 0);

    const totalMealsServed = shiftMeals.reduce((sum, r) => sum + r.mealCount, 0);
    const subscribersServed = shiftMeals.filter(r => r.type === 'regular').reduce((sum, r) => sum + r.mealCount, 0);
    const guestsServed = shiftMeals.filter(r => r.type === 'guest').reduce((sum, r) => sum + r.mealCount, 0);
    const walkinsServed = shiftMeals.filter(r => r.type === 'walk-in').reduce((sum, r) => sum + r.mealCount, 0);

    const report: ShiftCloseRecord = {
      id: `shift-close-${Date.now()}`,
      date,
      shift,
      closedAt: new Date().toISOString(),
      cashRecordedRwf: cashRecorded,
      cashCountedRwf: countedCash,
      cashDiscrepancyRwf: countedCash - cashRecorded,
      momoRecordedRwf: momoRecorded,
      momoCountedRwf: countedMomo,
      momoDiscrepancyRwf: countedMomo - momoRecorded,
      totalMealsServed,
      subscribersServed,
      guestsServed,
      walkinsServed,
      notes,
    };

    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      await pool.query(
        `INSERT INTO shift_close_records (
          id, date, shift, closed_at, cash_recorded_rwf, cash_counted_rwf, cash_discrepancy_rwf, momo_recorded_rwf, momo_counted_rwf, momo_discrepancy_rwf, total_meals_served, subscribers_served, guests_served, walkins_served, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          report.id,
          report.date,
          report.shift,
          report.closedAt,
          report.cashRecordedRwf,
          report.cashCountedRwf,
          report.cashDiscrepancyRwf,
          report.momoRecordedRwf,
          report.momoCountedRwf,
          report.momoDiscrepancyRwf,
          report.totalMealsServed,
          report.subscribersServed,
          report.guestsServed,
          report.walkinsServed,
          report.notes || null,
        ]
      );
    }

    fallbackStore.shiftCloseRecords.unshift(report);
    return report;
  },

  async resetData(): Promise<void> {
    const pool = getPool();
    if (pool && isDatabaseConnected()) {
      await pool.query('TRUNCATE qr_passes, meal_records, payment_records, shift_close_records CASCADE');
    }
    fallbackStore.qrPasses = [];
    fallbackStore.mealRecords = [];
    fallbackStore.paymentRecords = [];
    fallbackStore.shiftCloseRecords = [];
  },
};
