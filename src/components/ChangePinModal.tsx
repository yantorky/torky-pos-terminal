import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, ShieldCheck, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  rolePins: Record<UserRole, string>;
  onUpdatePins: (updatedPins: Record<UserRole, string>) => void;
  storeConfig?: any;
}

export default function ChangePinModal({
  isOpen,
  onClose,
  currentRole,
  rolePins,
  onUpdatePins,
  storeConfig,
}: ChangePinModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!oldPin || !newPin || !confirmPin) {
      setErrorMsg('Semua kolom wajib diisi!');
      return;
    }

    // Check if current PIN matches
    const actualOldPin = rolePins[selectedRole];
    
    // Security restriction:
    // Regular users (Kasir, Teknisi, Admin) cannot change other roles' PINs.
    // Only "Super Admin" can change any role's PIN.
    if (currentRole !== 'Super Admin' && selectedRole !== currentRole) {
      setErrorMsg(`Mutasi Keamanan Ditolak: Peran "${currentRole}" hanya diperbolehkan mengubah PIN milik sendiri.`);
      return;
    }

    if (oldPin !== actualOldPin) {
      setErrorMsg('PIN Lama yang dimasukkan tidak cocok/salah!');
      return;
    }

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setErrorMsg('PIN Baru harus terdiri dari tepat 4 digit angka!');
      return;
    }

    if (newPin === oldPin) {
      setErrorMsg('PIN Baru tidak boleh sama dengan PIN Lama!');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg('Konfirmasi PIN Baru tidak cocok!');
      return;
    }

    // Success - update pins
    const updated = {
      ...rolePins,
      [selectedRole]: newPin,
    };

    onUpdatePins(updated);
    setSuccessMsg(`Berhasil! PIN keamanan untuk peran "${selectedRole}" telah diperbarui.`);
    setOldPin('');
    setNewPin('');
    setConfirmPin('');

    setTimeout(() => {
      onClose();
      setSuccessMsg('');
    }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 flex flex-col font-sans"
      >
        {/* Header bar */}
        <div className="bg-slate-950 p-4 text-white flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-500/10 rounded-lg text-teal-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs tracking-wider uppercase font-mono">Ubah PIN Keamanan</h3>
              <p className="text-[9px] text-slate-400 font-mono leading-none mt-0.5">UPDATE CREDENTIALS SYSTEM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form area */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
          
          {/* Target Role Selector */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">
              Pilih Akses Peran:
            </label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value as UserRole);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl px-3 py-2 text-xs outline-hidden font-bold"
            >
              {(() => {
                const sector = storeConfig?.businessSector || 'Electronics';
                const type = storeConfig?.businessType || 'pos_services';
                const hasRepair = sector === 'Electronics' ? (type !== 'pos_only') : (sector === 'Services' ? (type !== 'pos_only') : false);
                
                const list: UserRole[] = ['Super Admin', 'Admin', 'Kasir'];
                if (hasRepair) {
                  list.push('Teknisi');
                }
                
                const getRoleLabel = (role: string) => {
                  if (role === 'Teknisi') {
                    if (sector === 'Services') return 'Teknisi / Mekanik';
                    if (sector === 'Electronics') return 'Teknisi IT / Servis';
                    return 'Teknisi / Mekanik';
                  }
                  return role;
                };
                
                return list.map((role) => (
                  <option key={role} value={role}>
                    {role === 'Super Admin' && '👑 Super Admin'}
                    {role === 'Admin' && '🛡️ Admin'}
                    {role === 'Kasir' && '💼 Kasir'}
                    {role === 'Teknisi' && '🔧 ' + getRoleLabel(role)}
                  </option>
                ));
              })()}
            </select>
            {currentRole !== 'Super Admin' && selectedRole !== currentRole && (
              <p className="text-[8.5px] text-amber-600 font-medium leading-tight">
                *Hanya Super Admin yang dapat mengganti PIN peran lain. Anda hanya bisa mengubah PIN Anda sendiri.
              </p>
            )}
          </div>

          {/* Old PIN Input */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-455 tracking-wider">
              Masukkan PIN Lama Peran ini:
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="password"
                maxLength={4}
                required
                placeholder="PIN saat ini"
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans"
              />
            </div>
          </div>

          <div className="h-[1px] bg-slate-100" />

          {/* New PIN & Confirmation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-455 tracking-wider">
                PIN Baru (4 Digit):
              </label>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="PIN Baru"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-mono tracking-widest"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-455 tracking-wider">
                Konfirmasi PIN:
              </label>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="Ulangi PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-mono tracking-widest"
              />
            </div>
          </div>

          {/* Alerts Feedback */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 bg-red-50 text-red-700 border border-red-150 rounded-xl text-[10.5px] font-bold flex items-start gap-1.5"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-xl text-[10.5px] font-bold flex items-start gap-1.5 animate-pulse"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Action Block */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold rounded-xl text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Simpan PIN Baru
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
