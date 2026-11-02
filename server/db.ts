/**
 * Database schema and connection manager for Neon PostgreSQL.
 * Supports dynamic configuration via DATABASE_URL or in-app UI input.
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let pool: Pool | null = null;
let currentConnectionString: string = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';

// If stored in a local config file (persisted from in-app settings), load it
const CONFIG_FILE = path.resolve(process.cwd(), '.neon-config.json');
if (!currentConnectionString && fs.existsSync(CONFIG_FILE)) {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.databaseUrl) {
      currentConnectionString = parsed.databaseUrl;
    }
  } catch (err) {
    console.error('Failed reading .neon-config.json', err);
  }
}

export function getDatabaseUrl(): string {
  return currentConnectionString;
}

export function isDatabaseConnected(): boolean {
  return !!pool;
}

export function getPool(): Pool | null {
  return pool;
}

export async function initDatabase(connectionString?: string): Promise<{ success: boolean; message: string }> {
  if (connectionString) {
    currentConnectionString = connectionString.trim();
  }

  if (!currentConnectionString) {
    return {
      success: false,
      message: 'No Neon database connection string provided. Running in memory/local mode.',
    };
  }

  try {
    // Close existing pool if any
    if (pool) {
      await pool.end().catch(() => {});
      pool = null;
    }

    pool = new Pool({ connectionString: currentConnectionString });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    // Run schema migrations
    await runMigrations(pool);

    // Persist configuration for app reloads if not present in env
    try {
      fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify({ databaseUrl: currentConnectionString, updatedAt: new Date().toISOString() }, null, 2),
        'utf-8'
      );
    } catch {
      // Non-blocking
    }

    console.log('✅ Successfully connected to Neon PostgreSQL and synchronized schema.');
    return { success: true, message: 'Successfully connected to Neon PostgreSQL database.' };
  } catch (error: any) {
    console.error('❌ Neon database connection failed:', error?.message || error);
    pool = null;
    return {
      success: false,
      message: `Failed to connect to Neon database: ${error?.message || error}`,
    };
  }
}

async function runMigrations(dbPool: Pool) {
  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');

    // 1. Settings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurant_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
        restaurant_name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        phone VARCHAR(100) NOT NULL,
        momo_merchant_code VARCHAR(100) NOT NULL,
        meal_price_rwf INTEGER NOT NULL,
        max_guest_qr_per_day INTEGER NOT NULL DEFAULT 3,
        low_balance_threshold INTEGER NOT NULL DEFAULT 5,
        currency VARCHAR(20) NOT NULL DEFAULT 'RWF',
        current_shift VARCHAR(20) NOT NULL DEFAULT 'lunch',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Customers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        avatar_url TEXT,
        meals_remaining INTEGER NOT NULL DEFAULT 0,
        total_meals_purchased INTEGER NOT NULL DEFAULT 0,
        balance_rwf INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        registered_date VARCHAR(50) NOT NULL,
        last_meal_at TIMESTAMP WITH TIME ZONE,
        category VARCHAR(50) NOT NULL DEFAULT 'Regular',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. QR Passes Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS qr_passes (
        code VARCHAR(255) PRIMARY KEY,
        type VARCHAR(50) NOT NULL DEFAULT 'regular',
        shift VARCHAR(50) NOT NULL DEFAULT 'lunch',
        customer_id VARCHAR(100) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        customer_name VARCHAR(255) NOT NULL,
        date_valid VARCHAR(50) NOT NULL,
        is_used BOOLEAN NOT NULL DEFAULT FALSE,
        used_at TIMESTAMP WITH TIME ZONE,
        guest_name VARCHAR(255),
        created_time VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Meal Records Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS meal_records (
        id VARCHAR(100) PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        customer_id VARCHAR(100) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        shift VARCHAR(50) NOT NULL DEFAULT 'lunch',
        type VARCHAR(50) NOT NULL DEFAULT 'regular',
        guest_name VARCHAR(255),
        meal_count INTEGER NOT NULL DEFAULT 1,
        amount_rwf INTEGER NOT NULL DEFAULT 0,
        payment_method VARCHAR(50) NOT NULL DEFAULT 'balance',
        momo_reference VARCHAR(150),
        scanned_by VARCHAR(150) NOT NULL DEFAULT 'Staff',
        status VARCHAR(50) NOT NULL DEFAULT 'valid',
        note TEXT,
        remaining_meals_after INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Payment Records Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_records (
        id VARCHAR(100) PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        customer_id VARCHAR(100) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        amount_rwf INTEGER NOT NULL,
        meals_credited INTEGER NOT NULL,
        method VARCHAR(50) NOT NULL DEFAULT 'momo',
        reference_no VARCHAR(150) NOT NULL,
        momo_transaction_id VARCHAR(150),
        reconciled BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Shift Close Records Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS shift_close_records (
        id VARCHAR(100) PRIMARY KEY,
        date VARCHAR(50) NOT NULL,
        shift VARCHAR(50) NOT NULL,
        closed_at TIMESTAMP WITH TIME ZONE NOT NULL,
        cash_recorded_rwf INTEGER NOT NULL DEFAULT 0,
        cash_counted_rwf INTEGER NOT NULL DEFAULT 0,
        cash_discrepancy_rwf INTEGER NOT NULL DEFAULT 0,
        momo_recorded_rwf INTEGER NOT NULL DEFAULT 0,
        momo_counted_rwf INTEGER NOT NULL DEFAULT 0,
        momo_discrepancy_rwf INTEGER NOT NULL DEFAULT 0,
        total_meals_served INTEGER NOT NULL DEFAULT 0,
        subscribers_served INTEGER NOT NULL DEFAULT 0,
        guests_served INTEGER NOT NULL DEFAULT 0,
        walkins_served INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default settings if table empty
    const settingsCheck = await client.query('SELECT COUNT(*) FROM restaurant_settings');
    if (parseInt(settingsCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO restaurant_settings (
          id, restaurant_name, location, phone, momo_merchant_code, meal_price_rwf, max_guest_qr_per_day, low_balance_threshold, currency, current_shift
        ) VALUES (
          'default', 'Kigali Garden Bistro', 'Kanombe, Kigali, Rwanda', '0788 768 148', '602145', 2000, 3, 5, 'RWF', 'lunch'
        )
      `);
    }

    // Seed default customers if empty
    const customersCheck = await client.query('SELECT COUNT(*) FROM customers');
    if (parseInt(customersCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO customers (id, name, phone, email, avatar_url, meals_remaining, total_meals_purchased, balance_rwf, status, registered_date, category, notes)
        VALUES
        ('cust-1', 'Tuyiringire Pacifique', '0781 343 621', 'tuyiringire@nexastack.net', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', 4, 25, 8000, 'low', '2026-10-01', 'Student', 'Engineering Lead @ NEXA STACK, daily student lunch subscriber.'),
        ('cust-2', 'Aline Uwase', '0788 452 190', 'aline.uwase@kigalibank.rw', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80', 18, 30, 36000, 'active', '2026-10-10', 'Worker', 'Office worker, daily lunchtime subscriber.'),
        ('cust-3', 'Diane Keza', '0783 910 203', NULL, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', 0, 20, 0, 'finished', '2026-09-20', 'Student', 'Meal pass expired yesterday. Needs replenishment.'),
        ('cust-4', 'Christian Kwizera', '0785 889 012', NULL, NULL, 27, 30, 54000, 'active', '2026-10-22', 'Regular', 'Monthly lunch plan subscriber.'),
        ('cust-5', 'Jean-Luc Mugisha', '0782 344 556', NULL, NULL, 5, 20, 10000, 'low', '2026-10-05', 'Worker', 'Right at 5 meals alert threshold.');
      `);
    }

    await client.query('COMMIT');
    console.log('Database tables verified and seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
