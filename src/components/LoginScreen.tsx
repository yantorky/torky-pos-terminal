import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Users, ShieldAlert, CheckCircle2, RefreshCcw, User, UserPlus, ShoppingBag, Cpu, Wrench, ChevronRight, Settings2 } from 'lucide-react';
import { UserRole, Staff } from '../types';
import Logo from './Logo';

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole, operatorName: string) => void;
  rolePins: Record<UserRole, string>;
  staffs: Staff[];
  onRegisterFirstSuperAdmin: (staff: Staff) => void;
  storeConfig?: any;
  onUpdateStoreConfig?: (config: any) => void;
}

export default function LoginScreen({ 
  onLoginSuccess, 
  rolePins, 
  staffs = [], 
  onRegisterFirstSuperAdmin,
  storeConfig,
  onUpdateStoreConfig
}: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('Super Admin');
  
  const getRoleLabel = (role: string) => {
    const sector = storeConfig?.businessSector || 'Electronics';
    if (role === 'Teknisi') {
      if (sector === 'Services') return 'Teknisi / Mekanik';
      if (sector === 'Electronics') return 'Teknisi IT / Servis';
      return 'Teknisi / Mekanik';
    }
    return role;
  };

  // Filter active staff for selected role
  const getActiveStaffs = (role: UserRole) => {
    return staffs.filter(s => s.role === role && s.status === 'Aktif');
  };

  const superAdminExists = staffs.some(s => s.role === 'Super Admin' && s.status === 'Aktif');

  // Initial state for selected staff based on active staffs
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    const roleStaffs = staffs.filter(s => s.role === 'Super Admin' && s.status === 'Aktif');
    return roleStaffs.length > 0 ? roleStaffs[0].id : '';
  });

  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  // States for First-Time Setup Wizard (Step 1 and Step 2)
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [setupBusinessType, setSetupBusinessType] = useState<'pos_only' | 'pos_services' | 'pos_services_repair'>('pos_services');
  const [setupName, setSetupName] = useState('');
  const [setupPhone, setSetupPhone] = useState('');
  const [setupPin, setSetupPin] = useState('');
  const [setupError, setSetupError] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg('');
    setPin('');
    const roleStaffs = getActiveStaffs(role);
    if (roleStaffs.length > 0) {
      setSelectedStaffId(roleStaffs[0].id);
    } else {
      setSelectedStaffId('');
    }
  };

  const handleStaffSelect = (staffId: string) => {
    setSelectedStaffId(staffId);
    setErrorMsg('');
    setPin('');
  };

  const handleKeyPress = (num: string) => {
    setErrorMsg('');
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setErrorMsg('');
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setErrorMsg('');
    setPin('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Check active staff list for this selected role
    const roleStaffs = getActiveStaffs(selectedRole);
    if (roleStaffs.length > 0) {
      const staffObj = staffs.find(s => s.id === selectedStaffId);
      if (!staffObj) {
        setErrorMsg('Silakan pilih salah satu anggota staff terdaftar!');
        return;
      }
      
      if (pin === staffObj.pin) {
        setSuccess(true);
        setErrorMsg('');
        setTimeout(() => {
          onLoginSuccess(selectedRole, staffObj.name);
        }, 700);
      } else {
        setErrorMsg(`PIN salah untuk ${staffObj.name}! Gagal otentikasi.`);
        setPin('');
      }
    } else {
      setErrorMsg(`Akses Terbatas: Peran ${selectedRole} belum didaftarkan di sistem.`);
      setPin('');
    }
  };

  const handleRegisterSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    if (!setupName.trim() || setupName.trim().length < 3) {
      setSetupError('Nama lengkap Owner minimal harus 3 karakter!');
      return;
    }
    if (setupPin.length !== 4) {
      setSetupError('Sandi PIN Personal harus berupa 4 digit angka!');
      return;
    }

    // Configure store settings based on business sector setup
    if (onUpdateStoreConfig && storeConfig) {
      let finalName = 'Torky Komputer & Jasa Servis';
      let sectorName = 'Electronics';
      if (setupBusinessType === 'pos_only') {
        finalName = 'Torky Retail & Supply';
        sectorName = 'Retail';
      } else if (setupBusinessType === 'pos_services_repair') {
        finalName = 'Torky Bengkel & Servis';
        sectorName = 'Services';
      }
      onUpdateStoreConfig({
        ...storeConfig,
        businessType: setupBusinessType,
        businessSector: sectorName,
        name: finalName,
      });
    }

    const newSA: Staff = {
      id: `staff-${Date.now()}`,
      name: setupName.trim(),
      phone: setupPhone.trim() || '-',
      pin: setupPin,
      role: 'Super Admin',
      status: 'Aktif'
    };

    onRegisterFirstSuperAdmin(newSA);
    // Log in immediately as the new Super Admin
    setSuccess(true);
    setTimeout(() => {
      onLoginSuccess('Super Admin', newSA.name);
    }, 700);
  };

  // If no Super Admin exists, display the clean 2-Step First-Time Setup Wizard
  if (!superAdminExists) {
    return (
      <div className="w-full max-w-md mx-auto bg-slate-50 rounded-3xl overflow-hidden flex flex-col justify-start border border-slate-200 shadow-xl animate-fadeIn">
        <div className="p-5 text-center bg-slate-900 text-slate-100 flex flex-col items-center justify-center gap-2 border-b border-white/10">
          <Logo variant="icon" className="w-12 h-12 animate-pulse" />
          <div>
            <h2 className="text-sm font-black tracking-widest text-[#2dd4bf] uppercase font-mono">Setup Awal Torky POS</h2>
            <p className="text-[10px] text-teal-400 font-mono mt-0.5">WIZARD KONFIGURASI OPERASIONAL</p>
          </div>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setSetupStep(1)}
            className={`py-3 text-center text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              setupStep === 1 
                ? 'bg-white text-teal-600 border-b-2 border-teal-500' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            STEP 1: FOKUS USAHA
          </button>
          <button
            type="button"
            disabled={!setupBusinessType}
            onClick={() => setSetupStep(2)}
            className={`py-3 text-center text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              setupStep === 2 
                ? 'bg-white text-teal-600 border-b-2 border-teal-500' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            STEP 2: AKUN OWNER
          </button>
        </div>

        <div className="p-6 space-y-4">
          <AnimatePresence mode="wait">
            {setupStep === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-tight text-slate-800 font-sans">
                    PILIH JENIS DAN KEBUTUHAN MENU USAHA:
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-normal font-sans">
                    Pilih tipe model operasional toko Anda di bawah ini untuk mengonfigurasi modul menu secara presisi dan terintegrasi standar internasional.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Card 1: Retail Only */}
                  <button
                    type="button"
                    onClick={() => setSetupBusinessType('pos_only')}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 cursor-pointer ${
                      setupBusinessType === 'pos_only'
                        ? 'bg-teal-50/50 border-teal-550 shadow-md ring-2 ring-teal-500/10'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className={`p-3 rounded-xl shrink-0 ${
                      setupBusinessType === 'pos_only' ? 'bg-teal-500 text-slate-950' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 font-sans">
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-tight">
                        🏪 Swalayan &amp; Retail Umum (Hanya Barang)
                      </h4>
                      <p className="text-[10px] text-slate-550 leading-normal">
                        Didesain presisi tinggi untuk penjualan barang fisik tanpa jasa perbaikan: Kasir POS Cepat, Manajemen Stok/Kategori, Riwayat Transaksi, Laporan profitabilitas, & B2B Contacts.
                      </p>
                      <p className="text-[9px] text-[#0d9488] font-bold mt-1">
                        ✓ Modul Jasa Servis &amp; Simulasi PC disembunyikan agar visual bersih dan efisien.
                      </p>
                    </div>
                  </button>

                  {/* Card 2: Retail + Services (IT) */}
                  <button
                    type="button"
                    onClick={() => setSetupBusinessType('pos_services')}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 cursor-pointer ${
                      setupBusinessType === 'pos_services'
                        ? 'bg-teal-50/50 border-teal-550 shadow-md ring-2 ring-teal-500/10'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className={`p-3 rounded-xl shrink-0 ${
                      setupBusinessType === 'pos_services' ? 'bg-teal-500 text-slate-950' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 font-sans">
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-tight">
                        💻 Toko Elektro &amp; Jasa IT (Lengkap Servis)
                      </h4>
                      <p className="text-[10px] text-slate-550 leading-normal">
                        Seluruh modul operasional lengkap: Kasir POS, Laboratorium Pekerjaan Servis (Service Tickets), Simulasi Rakit PC, Stok Suku Cadang, Laporan Ledger, &amp; B2B Partner.
                      </p>
                      <p className="text-[9px] text-[#0d9488] font-bold mt-1">
                        ✓ Menggunakan peran Teknisi IT / Servis untuk mendiagnosa kerusakan komputer/gadget.
                      </p>
                    </div>
                  </button>

                  {/* Card 3: Bengkel Otomotif + Spareparts */}
                  <button
                    type="button"
                    onClick={() => setSetupBusinessType('pos_services_repair')}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 cursor-pointer ${
                      setupBusinessType === 'pos_services_repair'
                        ? 'bg-teal-50/50 border-teal-550 shadow-md ring-2 ring-teal-500/10'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className={`p-3 rounded-xl shrink-0 ${
                      setupBusinessType === 'pos_services_repair' ? 'bg-teal-500 text-slate-950' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 font-sans">
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-tight">
                        🔧 Bengkel Otomotif, Suku Cadang &amp; Jasa Mekanik
                      </h4>
                      <p className="text-[10px] text-slate-550 leading-normal">
                        Disesuaikan khusus untuk Usaha Bengkel Mobil/Motor, Toko Spareparts/Onderdil, dan Jasa Servis: Antrean Servis Terintegrasi, Pendataan Mekanik, Estimasi Kerusakan, Stok Suku Cadang, &amp; Kasir POS.
                      </p>
                      <p className="text-[9px] text-[#0d9488] font-bold mt-1">
                        ✓ Menggunakan peran Teknisi / Mekanik untuk pengerjaan perbaikan mesin dan spareparts.
                      </p>
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSetupStep(2)}
                  className="w-full mt-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 uppercase tracking-wider font-sans cursor-pointer animate-pulse"
                >
                  Lanjut ke Registrasi Owner <ChevronRight className="w-4 h-4 text-teal-400" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-br from-teal-50 to-teal-100/30 border border-teal-150 rounded-2xl p-4 text-xs text-slate-650 leading-normal font-sans space-y-1.5 shadow-sm">
                  <h4 className="font-extrabold flex items-center gap-1.5 text-teal-850 uppercase tracking-tight text-[11px]">
                    🛡️ DETAIL REGISTRASI AKUN OWNER
                  </h4>
                  <p>
                    Menyimpan setup usaha sebagai <strong className="text-slate-800">
                      {setupBusinessType === 'pos_only' ? 'Hanya Ritel/Penjualan' : 'Ritel & Jasa Servis Lengkap'}
                    </strong>. Silakan isi kredensial Admin Utama di bawah ini:
                  </p>
                </div>

                <form onSubmit={handleRegisterSetup} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1 font-mono">
                      👤 Nama Lengkap Owner / Super Admin *
                    </label>
                    <input
                      type="text"
                      required
                      value={setupName}
                      onChange={(e) => setSetupName(e.target.value)}
                      placeholder="Misal: Bapak Gede"
                      className="w-full px-3.5 py-2.5 bg-white text-slate-800 text-xs font-bold rounded-xl border border-slate-250 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1 font-mono">
                      📞 Nomor Telepon Aktif
                    </label>
                    <input
                      type="tel"
                      value={setupPhone}
                      onChange={(e) => setSetupPhone(e.target.value)}
                      placeholder="Misal: 0812-3988-1234"
                      className="w-full px-3.5 py-2.5 bg-white text-slate-800 text-xs font-semibold rounded-xl border border-slate-250 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1 font-mono">
                      🔑 Buat PIN Keamanan Super Admin-mu (4-Digit Angka) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      pattern="[0-9]{4}"
                      value={setupPin}
                      onChange={(e) => setSetupPin(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Contoh: 1234"
                      className="w-full px-3.5 py-2.5 bg-white text-center text-slate-900 text-sm font-black tracking-widest rounded-xl border border-slate-250 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
                    />
                    <p className="text-[9.5px] text-slate-400 mt-1 leading-normal font-sans text-center">
                      PIN personal Anda tidak dapat diakses staff lain. Catat dengan aman.
                    </p>
                  </div>

                  {setupError && (
                    <div className="bg-rose-50 text-rose-700 p-2.5 rounded-xl text-[10px] font-bold border border-rose-150 text-center">
                      ❌ {setupError}
                    </div>
                  )}

                  {success && (
                    <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl text-[10px] font-bold border border-emerald-150 text-center animate-pulse">
                      🎉 Setup Selesai! Mengonfigurasi modul & memulai aplikasi...
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setSetupStep(1)}
                      className="py-3 px-4 bg-slate-200 hover:bg-slate-250 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      KEMBALI
                    </button>
                    <button
                      type="submit"
                      disabled={success}
                      className="flex-1 py-3 bg-teal-555 hover:bg-teal-500 text-slate-950 font-black rounded-xl text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 uppercase tracking-wider font-sans cursor-pointer text-center"
                    >
                      <UserPlus className="w-4 h-4" /> Simpan & Mulai Aplikasi
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  const activeStaffsForRole = getActiveStaffs(selectedRole);

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 rounded-3xl overflow-hidden flex flex-col justify-start border border-slate-200 shadow-xl animate-fadeIn">
      <div className="p-5 text-center bg-slate-900 text-slate-100 flex flex-col items-center justify-center gap-2 border-b border-slate-800">
        <Logo variant="icon" className="w-12 h-12" />
        <div>
          <h2 className="text-sm font-black tracking-widest text-[#2dd4bf] uppercase font-mono">Torky Terminal Login</h2>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">SECURE KEYPAD AUTHENTICATION SYSTEM</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Role Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black tracking-wider text-slate-550 uppercase flex items-center gap-1 font-mono">
            <Users className="w-3 h-3 text-teal-500" /> 1. PILIH PERAN OPERATOR:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(() => {
              const sector = storeConfig?.businessSector || 'Electronics';
              const type = storeConfig?.businessType || 'pos_services';
              const hasRepair = sector === 'Electronics' ? (type !== 'pos_only') : (sector === 'Services' ? (type !== 'pos_only') : false);
              
              const rolesList: UserRole[] = ['Super Admin', 'Admin', 'Kasir'];
              if (hasRepair) {
                rolesList.push('Teknisi');
              }
              
              return rolesList.map((role) => {
                const isSel = selectedRole === role;
                return (
                  <button
                    type="button"
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center ${
                      isSel
                        ? 'bg-[#14b8a6] border-[#0d9488] text-slate-950 font-black shadow-md scale-[1.03]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[11px] leading-tight font-sans">
                      {role === 'Super Admin' && '👑 ' + role}
                      {role === 'Admin' && '🛡️ ' + role}
                      {role === 'Kasir' && '💼 ' + role}
                      {role === 'Teknisi' && '🔧 ' + getRoleLabel(role)}
                    </span>
                  </button>
                );
              });
            })()}
          </div>
        </div>

        {/* Dynamic Operator Persona Name Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black tracking-wider text-slate-550 uppercase flex items-center gap-1 font-mono">
            <User className="w-3 h-3 text-teal-500" /> 2. PILIH PROFIL STAFF AKTIF:
          </label>
          
          {activeStaffsForRole.length > 0 ? (
            <select
              value={selectedStaffId}
              onChange={(e) => handleStaffSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white text-slate-800 text-xs font-bold rounded-xl border border-slate-250 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-sans cursor-pointer"
            >
              {activeStaffsForRole.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  👤 {staff.name} {staff.phone ? `(${staff.phone})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs border border-rose-100 font-sans leading-normal">
              ⚠️ Tidak ada staff <strong>{selectedRole}</strong> aktif terdaftar.
              <p className="text-[10px] text-slate-500 mt-1">
                Silakan login sebagai Super Admin / Admin terlebih dahulu untuk mendaftarkan akun {selectedRole} melalui menu <strong>Directory</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Security PIN code input display */}
        {activeStaffsForRole.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-wider text-slate-550 uppercase flex items-center gap-1 font-mono">
                <Lock className="w-3 h-3 text-teal-500" /> 3. MASUKKAN 4-DIGIT PIN:
              </label>
              
              <div className="flex flex-col items-center justify-center space-y-2">
                {/* Visual Indicators of coded dots */}
                <div className="flex justify-center gap-5 my-2">
                  {[0, 1, 2, 3].map((idx) => {
                    const filled = pin.length > idx;
                    return (
                      <motion.div
                        key={idx}
                        animate={filled ? { scale: [1, 1.2, 1] } : {}}
                        className={`w-4 h-4 rounded-full border-2 transition-all ${
                          success
                            ? 'bg-emerald-500 border-emerald-600'
                            : errorMsg
                            ? 'bg-rose-500 border-rose-600 animate-bounce'
                            : filled
                            ? 'bg-teal-500 border-teal-600'
                            : 'bg-white border-slate-350'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-rose-50 text-rose-700 p-2 rounded-xl text-[10px] font-bold border border-rose-150 text-center flex items-center gap-1"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success Animation overlay */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-emerald-700 text-center flex items-center gap-1.5 py-1 text-xs font-bold animate-pulse"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Otentikasi Berhasil! Menyambungkan sesi...</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Tactile Keypad Controls */}
            <div className="bg-slate-200/60 p-3 rounded-2xl border border-slate-300/40 grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => handleKeyPress(num)}
                  className="py-2.5 bg-white hover:bg-slate-100 border border-slate-200 font-extrabold text-sm text-slate-800 rounded-xl shadow-xs transition-transform active:scale-95 font-mono cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-150 font-bold text-xs text-rose-700 rounded-xl active:scale-95 font-sans cursor-pointer"
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="py-2.5 bg-white hover:bg-slate-100 border border-slate-200 font-extrabold text-sm text-slate-800 rounded-xl active:scale-95 font-mono cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => pin.length === 4 ? handleSubmit() : handleDelete()}
                className={`py-2.5 font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center font-sans cursor-pointer ${
                  pin.length === 4
                    ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold shadow-sm border border-teal-600'
                    : 'bg-slate-300 hover:bg-slate-350 text-slate-600 border border-slate-300'
                }`}
              >
                {pin.length === 4 ? 'ENTER' : 'DEL'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

