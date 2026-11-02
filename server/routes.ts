/**
 * Express REST API Routes for NEXA MealPass
 */

import { Router, Request, Response } from 'express';
import { mealService } from './service';
import { initDatabase, getDatabaseUrl, isDatabaseConnected } from './db';

export const apiRouter = Router();

// DATABASE CONNECTION MANAGEMENT & HEALTH
apiRouter.get('/database/status', async (_req: Request, res: Response) => {
  const connected = isDatabaseConnected();
  const rawUrl = getDatabaseUrl();
  // Mask password in database url
  const maskedUrl = rawUrl ? rawUrl.replace(/:([^:@]+)@/, ':••••••@') : '';

  res.json({
    connected,
    databaseUrl: maskedUrl,
    hasUrl: !!rawUrl,
    provider: 'Neon Serverless PostgreSQL',
  });
});

apiRouter.post('/database/connect', async (req: Request, res: Response) => {
  const { databaseUrl } = req.body;
  if (!databaseUrl || typeof databaseUrl !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid database URL provided.' });
  }

  const result = await initDatabase(databaseUrl);
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

// SETTINGS
apiRouter.get('/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await mealService.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await mealService.updateSettings(req.body);
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CUSTOMERS
apiRouter.get('/customers', async (_req: Request, res: Response) => {
  try {
    const customers = await mealService.getCustomers();
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/customers', async (req: Request, res: Response) => {
  try {
    const { name, phone, initialDepositRwf, category } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required.' });
    }

    const settings = await mealService.getSettings();
    const deposit = Number(initialDepositRwf) || 0;
    const mealsCredited = Math.floor(deposit / settings.mealPriceRwf);
    const today = new Date().toISOString().split('T')[0];

    const customer = await mealService.createCustomer({
      name: name.trim(),
      phone: phone.trim(),
      mealsRemaining: mealsCredited,
      totalMealsPurchased: mealsCredited,
      balanceRwf: deposit,
      status: mealsCredited <= settings.lowBalanceThreshold ? 'low' : 'active',
      registeredDate: today,
      category: category || 'Student',
    });

    if (deposit > 0) {
      // Record initial payment
      await mealService.topUpCustomer(
        customer.id,
        deposit,
        'momo',
        `MOMO-INIT-${Math.floor(100000 + Math.random() * 900000)}`,
        `MP${today.replace(/-/g, '').slice(2)}.${Math.floor(1000 + Math.random() * 9000)}.RW`
      );
    }

    res.status(201).json(customer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/customers/:id/topup', async (req: Request, res: Response) => {
  try {
    const { amountRwf, method, referenceNo, momoTransactionId } = req.body;
    if (!amountRwf || amountRwf <= 0) {
      return res.status(400).json({ error: 'Valid amount is required.' });
    }

    const result = await mealService.topUpCustomer(
      req.params.id,
      Number(amountRwf),
      method || 'momo',
      referenceNo,
      momoTransactionId
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// QR PASSES
apiRouter.get('/passes', async (_req: Request, res: Response) => {
  try {
    const passes = await mealService.getQrPasses();
    res.json(passes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/passes', async (req: Request, res: Response) => {
  try {
    const pass = await mealService.createQrPass(req.body);
    res.status(201).json(pass);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/passes/:code', async (req: Request, res: Response) => {
  try {
    await mealService.deleteQrPass(req.params.code);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SCAN VERIFICATION & DEDUCTION
apiRouter.post('/scan', async (req: Request, res: Response) => {
  try {
    const { code, shift } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'QR Code string is required.' });
    }
    const result = await mealService.scanQRCode(code, shift);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// WALK-IN MEALS
apiRouter.post('/walkin', async (req: Request, res: Response) => {
  try {
    const { mealCount, paymentMethod, note, momoReference, shift } = req.body;
    const settings = await mealService.getSettings();
    const count = Number(mealCount) || 1;
    const amount = count * settings.mealPriceRwf;
    const activeShift = shift || settings.currentShift;
    const finalMomoRef = momoReference?.trim() || (paymentMethod === 'momo' ? `MOMO-${Math.floor(1000000 + Math.random() * 9000000)}` : undefined);

    const record = await mealService.recordMeal({
      id: `walkin-${Date.now()}`,
      timestamp: new Date().toISOString(),
      customerId: 'walk-in',
      customerName: `Walk-in Diner (#${Math.floor(100 + Math.random() * 900)})`,
      shift: activeShift,
      type: 'walk-in',
      mealCount: count,
      amountRwf: amount,
      paymentMethod: paymentMethod || 'cash',
      momoReference: finalMomoRef,
      scannedBy: 'Cashier',
      status: 'valid',
      note: note || undefined,
    });

    res.status(201).json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// MEAL RECORDS
apiRouter.get('/meals', async (_req: Request, res: Response) => {
  try {
    const records = await mealService.getMealRecords();
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PAYMENTS
apiRouter.get('/payments', async (_req: Request, res: Response) => {
  try {
    const payments = await mealService.getPayments();
    res.json(payments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/payments/:id/reconcile', async (req: Request, res: Response) => {
  try {
    const { reconciled } = req.body;
    await mealService.reconcilePayment(req.params.id, Boolean(reconciled));
    res.json({ success: true, reconciled });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SHIFT CLOSES
apiRouter.get('/shift-closes', async (_req: Request, res: Response) => {
  try {
    const records = await mealService.getShiftCloses();
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/shift-closes', async (req: Request, res: Response) => {
  try {
    const { date, shift, countedCash, countedMomo, notes } = req.body;
    const settings = await mealService.getSettings();
    const targetDate = date || new Date().toISOString().split('T')[0];
    const targetShift = shift || settings.currentShift;

    const record = await mealService.closeShift(
      targetDate,
      targetShift,
      Number(countedCash) || 0,
      Number(countedMomo) || 0,
      notes
    );
    res.status(201).json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// RESET DATA
apiRouter.post('/reset', async (_req: Request, res: Response) => {
  try {
    await mealService.resetData();
    res.json({ success: true, message: 'Data reset successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
