import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Mail, Clipboard, CheckCircle2, LockKeyhole, HelpCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { copyToClipboard } from '../utils';

interface ActivationGateProps {
  installationId: string;
  onVerifyKey: (key: string) => boolean;
  onBypassSandbox: () => void;
  storeConfig?: any;
}

export default function ActivationGate({
  installationId,
  onVerifyKey,
  onBypassSandbox,
  storeConfig
}: ActivationGateProps) {
  const [keyInput, setKeyInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleCopyId = async () => {
    const ok = await copyToClipboard(installationId);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!keyInput.trim()) {
      setErrorMsg('Kode Lisensi tidak boleh kosong!');
      return;
    }

    const isValid = onVerifyKey(keyInput);
    if (isValid) {
      setSuccess(true);
      setTimeout(() => {
        // Parent state handles re-render
      }, 1000);
    } else {
      setErrorMsg('Aktivasi Gagal! Kode Lisensi salah atau tidak sesuai dengan Installation ID perangkat ini.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-teal-500 selection:text-slate-950 font-sans">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(20,184,166,0.12),rgba(255,255,255,0))]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-850 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden z-10"
      >
        {/* Glow Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600" />
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6 sm:mb-8">
          <div className="w-14 h-14 bg-teal-950/40 text-teal-400 border border-teal-850 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-950/20 mb-2">
            <LockKeyhole className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase font-mono">
            Torky POS <span className="text-teal-400">Enterprise Gate</span>
          </h2>
          <p className="text-slate-400 text-xs font-medium max-w-sm leading-relaxed">
            Sistem Point of Sale & Jasa Servis Terintegrasi. Mengunduh kode sumber diperbolehkan, namun penggunaan kasir produksi memerlukan otorisasi resmi pemilik.
          </p>
        </div>

        {/* Step 1: Copy signature key info */}
        <div className="space-y-4 mb-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-teal-400 tracking-wider flex items-center gap-1.5 font-mono">
              <span>STEP 1: SIKLUS INSTALASI PERANGKAT ANDA</span>
            </label>
            <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-inner">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">ID Signature Mesin (Installation ID)</span>
                <span className="text-xs sm:text-sm font-black text-slate-200 tracking-widest font-mono">
                  {installationId}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-teal-400 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-mono">COPIED</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>SALIN ID</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Developers contact directory card */}
          <div className="bg-slate-950/50 border border-slate-850/60 rounded-2xl p-4 space-y-2.5">
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Kirimkan <strong className="text-slate-200 font-semibold font-mono">ID Signature</strong> di atas beserta <strong className="text-teal-400 font-semibold">Bukti Transfer Administratif</strong> (nominal sesuai ketentuan / kesepakatan) ke email resmi pengembang untuk mendapatkan Kode Aktivasi Kasir Produksi permanen:
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <a
                href={`mailto:torkykomputer@gmail.com?subject=Permintaan%20Aktivasi%20Lisensi%20POS%20-${installationId}&body=Halo%20Yan%20Torky,%20Berikut%20adalah%20detail%20pengajuan%20saya:%0A%0A-%20Nama%20Toko:%20%0A-%20Installation%20ID:%20${installationId}%0A%0A*Mari%20lampirkan%20bukti%20transfer/donasi%20Anda.*`}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-[10.5px] font-bold px-3 py-2 rounded-xl transition-all w-fit"
              >
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>torkykomputer@gmail.com</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
              <span className="text-[10px] text-slate-500 font-mono">
                Operator Utama: Yan Torky (Owner of Torky Komputer)
              </span>
            </div>
          </div>
        </div>

        {/* Form Validation field input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-teal-400 tracking-wider flex items-center gap-1.5 font-mono">
              <span>STEP 2: MASUKKAN KUNCI LISENSI AKTIVASI</span>
            </label>
            <input
              type="text"
              required
              placeholder="TORKY-POS-XXXX-XXXX-XXXX"
              value={keyInput}
              onChange={(e) => {
                setErrorMsg('');
                setKeyInput(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-sm sm:text-base font-bold text-teal-300 tracking-widest outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
            />
          </div>

          {errorMsg && (
            <div className="bg-rose-950/40 text-rose-300 p-3 rounded-xl text-xs font-bold border border-rose-900/50 text-center leading-relaxed">
              ⚠️ {errorMsg}
            </div>
          )}

          {success && (
            <div className="bg-emerald-950/40 text-emerald-300 p-3 rounded-xl text-xs font-bold border border-emerald-900/50 text-center flex items-center justify-center gap-1.5 animate-pulse">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Aktivasi Komersial Sukses! Sesi Otentikasi Terverifikasi...</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1.5">
            {/* Direct Sandbox bypass button to let everyone test the application immediately without locks while highlighting the system is sandboxed */}
            <button
              type="button"
              onClick={onBypassSandbox}
              className="flex-1 py-2.5 px-4 bg-slate-950 hover:bg-slate-900 hover:text-white text-slate-450 border border-slate-850 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer select-none group"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500 group-hover:rotate-180 transition-transform duration-500" />
              <span>UJI COBA SANDBOX (BYPASS)</span>
            </button>
            
            <button
              type="submit"
              disabled={success}
              className="flex-1 py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition-all tracking-wider shadow-lg shadow-teal-950/40 cursor-pointer text-center"
            >
              VALIDASI & AKTIFKAN
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-850/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Stasiun: {storeConfig?.name || 'Torky Komputer'} POS</span>
          <span>Dual-License Open Source Sandbox v4.1</span>
        </div>
      </motion.div>
    </div>
  );
}
