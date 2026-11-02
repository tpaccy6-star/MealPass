/**
 * Neon Database Connection & Sync Modal
 * Allows restaurant owners / admins to directly enter, test, and save their Neon PostgreSQL connection string.
 */

import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, Key, Shield, ExternalLink } from 'lucide-react';
import { useMealApp } from '../../context/MealAppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const NeonDatabaseModal: React.FC<Props> = ({ isOpen, onClose, isDark }) => {
  const { databaseStatus, connectNeonDatabase, refreshDatabaseStatus, isSyncing } = useMealApp();
  const [connectionString, setConnectionString] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionString.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await connectNeonDatabase(connectionString.trim());
      setFeedback(res);
      if (res.success) {
        setConnectionString('');
      }
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Connection failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-4 ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Neon PostgreSQL Connection</h3>
              <p className="text-[10px] text-slate-400">Serverless cloud database storage for NEXA MealPass</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Current Connection Status Indicator */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
          databaseStatus?.connected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            {databaseStatus?.connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <div>
              <div className="font-semibold">
                {databaseStatus?.connected
                  ? 'Connected to Neon PostgreSQL'
                  : 'Running in Local / In-Memory Mode'}
              </div>
              <div className="text-[10px] opacity-80 font-mono mt-0.5">
                {databaseStatus?.databaseUrl
                  ? `URL: ${databaseStatus.databaseUrl}`
                  : 'No active connection string configured yet.'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={refreshDatabaseStatus}
            title="Refresh status"
            className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Instructions */}
        <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${
          isDark ? 'bg-slate-800/40 border-slate-700/50 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div className="font-semibold flex items-center gap-1 text-emerald-500">
            <Key className="w-3 h-3" />
            <span>How to get your Neon connection string:</span>
          </div>
          <p className="leading-relaxed">
            1. Create a project at <strong>neon.tech</strong> (free serverless PostgreSQL).<br />
            2. Copy your connection URI (e.g. <code>postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require</code>).<br />
            3. Paste it below and click <strong>"Connect & Sync Database"</strong>.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleConnect} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Neon Connection String (URI)
            </label>
            <input
              type="password"
              placeholder="postgresql://neondb_owner:password@ep-....neon.tech/neondb?sslmode=require"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              required
              className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {feedback && (
            <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
              feedback.success
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-red-500/15 border-red-500/40 text-red-400'
            }`}>
              {feedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <a
              href="https://console.neon.tech"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-emerald-500 hover:underline flex items-center gap-1"
            >
              <span>Open Neon Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-3 py-2 rounded-xl text-xs font-medium ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !connectionString.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Connect & Sync</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
