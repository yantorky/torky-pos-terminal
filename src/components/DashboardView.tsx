import React, { useState, useRef, useEffect } from 'react';
import { 
  TrendingUp, 
  PenTool as Tool, 
  AlertTriangle, 
  Receipt, 
  ArrowRight, 
  DollarSign, 
  Laptop, 
  CheckCircle2, 
  Download, 
  ShieldCheck, 
  HelpCircle,
  Upload,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import { Product, RepairJob, Transaction, UserRole } from '../types';
import { motion } from 'motion/react';
import Logo from './Logo';
import { formatIDR } from '../utils';

interface DashboardViewProps {
  products: Product[];
  jobs: RepairJob[];
  transactions: Transaction[];
  onNavigate: (tab: 'pos' | 'repairs' | 'inventory' | 'history' | 'dashboard') => void;
  userRole?: UserRole;
  operatorName?: string;
  storeConfig: {
    name: string;
    powerTitle: string;
    logoUrl: string;
    businessSector: string;
    address: string;
    phone: string;
    businessType?: string;
  };
  onUpdateStoreConfig: (config: any) => void;
  onResetAllData?: () => void;
  licensedKey?: string;
  heartbeatStatus?: any;
  onUpgradeLicense?: (key: string) => void;
}

export default function DashboardView({ 
  products, 
  jobs, 
  transactions, 
  onNavigate, 
  userRole = 'Kasir',
  operatorName = 'Yan Torky',
  storeConfig,
  onUpdateStoreConfig,
  onResetAllData,
  licensedKey = '',
  heartbeatStatus = null,
  onUpgradeLicense
}: DashboardViewProps) {
  const [hasCustomLogo, setHasCustomLogo] = useState<boolean>(() => {
    return !!localStorage.getItem('torky_custom_logo');
  });

  useEffect(() => {
    const handleLogoSync = () => {
      setHasCustomLogo(!!localStorage.getItem('torky_custom_logo'));
    };
    window.addEventListener('torky_logo_changed', handleLogoSync);
    return () => window.removeEventListener('torky_logo_changed', handleLogoSync);
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetAllConfirm, setShowResetAllConfirm] = useState<boolean>(false);
  const [showResetSuccessAlert, setShowResetSuccessAlert] = useState<boolean>(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        localStorage.setItem('torky_custom_logo', result);
        setHasCustomLogo(true);
        window.dispatchEvent(new Event('torky_logo_changed'));
        
        // Sync to central database
        fetch('/api/db/torky_custom_logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: result })
        }).catch(err => console.warn('[Logo Sync] Failed uploading logo to server:', err));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoReset = () => {
    localStorage.removeItem('torky_custom_logo');
    setHasCustomLogo(false);
    window.dispatchEvent(new Event('torky_logo_changed'));
    
    // Sync to central database
    fetch('/api/db/torky_custom_logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: null })
    }).catch(err => console.warn('[Logo Sync] Failed resetting logo on server:', err));
  };

  // Method to download all database states as json file for offline persistence backup
  const handleDownloadBackup = () => {
    const dataToBackup = {
      storeName: storeConfig?.name || "Torky Komputer",
      slogan: storeConfig?.powerTitle || "Anda Yang Utama",
      exportedAt: new Date().toISOString(),
      inventory: products,
      repairJobs: jobs,
      salesTransactions: transactions,
    };
    
    const dbFilename = `${(storeConfig?.name || 'UMKM').toLowerCase().replace(/\s+/g, '_')}_database_pos_${new Date().toISOString().split('T')[0]}.json`;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", dbFilename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Segmented specialization cards based on store Config Business Sector
  const getSectorSpecialization = () => {
    const sector = storeConfig.businessSector || 'Electronics';
    
    switch (sector) {
      case 'Retail':
        return {
          icon: <Receipt className="w-5 h-5 text-teal-400" />,
          title: storeConfig.name || "Minimarket Retail",
          sub: "EFFICIENT RETAIL & MINIMARKET",
          desc: "Terminal Kasir cepat teroptimalisasi untuk swalayan, toko kelontong, sembako, harian, dan retail produk dalam jumlah besar dengan pencatatan stok real-time.",
          items: [
            { emoji: "🛍️", title: "Kasir Super Cepat", sub: "Dukungan barcode scanner USB/Bluetooth dan pencarian produk kilat pada terminal kasir" },
            { emoji: "📦", title: "Manajemen Stok Kasir", sub: "Pengingat stok batas aman otomatis dan pelacakan barang kedaluwarsa atau kosong" },
            { emoji: "🏷️", title: "Sistem Grosir & Ecer", sub: "Konfigurasi harga fleksibel untuk pelanggan setia, agen grosir, atau toko cabang" },
            { emoji: "📄", title: "Nota Struk Thermal", sub: "Formasi struk kasir pas 58mm/80mm instan untuk memuaskan pembeli" }
          ],
          footer: "⚡ KEMUDAHAN KASIR SWALAYAN MANDIRI/STAF"
        };
      case 'Apparel':
        return {
          icon: <TrendingUp className="w-5 h-5 text-teal-400" />,
          title: storeConfig.name || "Butik & Fashion",
          sub: "FASHION, BOUTIQUE & APPAREL SYSTEM",
          desc: "Sistem POS butik, toko pakaian, distro, dan aksesori modern untuk pengalaman kelola variasi produk mode yang elegan dan pencatatan komisi penjualan.",
          items: [
            { emoji: "👕", title: "Katalog Busana Trendi", sub: "Penjualan pakaian, hijab, tas, atau sepatu dengan navigasi visual berestetika tinggi" },
            { emoji: "🎨", title: "Manajemen Varian Produk", sub: "Patenkan jumlah stok berdasarkan spesifikasi ukuran (S, M, L, XL) dan variasi warna" },
            { emoji: "📈", title: "Analisis Produk Terlaris", sub: "Pantau jenis pakaian terpopuler tiap bulan guna memastikan persiapan modal kembali" },
            { emoji: "🤝", title: "Kontak Agen & B2B", sub: "Bumbu relasi erat dengan reseller, agen dropship, pelanggan setia, dan data supplier" }
          ],
          footer: "✨ GAYA HIDUP & EXCELLENCE BRANDING FASHION"
        };
      case 'Culinary':
        return {
          icon: <Receipt className="w-5 h-5 text-teal-400" />,
          title: storeConfig.name || "Kuliner & Cafe",
          sub: "DYNAMIC FOOD & BEVERAGE COMPANION",
          desc: "Terminal kasir kuliner efisien untuk warung makan, kedai kopi, kafe, depot, maupun katering guna memajukan efisiensi operasional harian.",
          items: [
            { emoji: "🍛", title: "Pesanan Kasir & Meja", sub: "Pencatatan nomor meja pelanggan, take-away, serta detail catatan kustom rasa" },
            { emoji: "🍹", title: "Paket Menu Fleksibel", sub: "Kelola variasi harga camilan, paket hemat keluarga, dan minuman pendamping segar" },
            { emoji: "🧾", title: "Cetak Tiket Dapur", sub: "Kirim pesanan cetak thermal ke barista atau koki dapur untuk meminimalkan salah kirim" },
            { emoji: "🧊", title: "Pemantauan Keuntungan", sub: "Atur margin katering dengan kalkulator laba bersih otomatis dari menu kasir" }
          ],
          footer: "🍽️ KULINER NIKMAT, KASIR MELAYANI KILAT"
        };
      case 'Services':
        return {
          icon: <Tool className="w-5 h-5 text-teal-400" />,
          title: storeConfig.name || "Bengkel & Jasa Servis",
          sub: "PROFESSIONAL SERVICE & WORKSHOP STATION",
          desc: "Sistem operasional diagnosis kendaraan (bengkel motor/mobil), reparasi elektronik rumah tangga, salon, laundry, atau penyedia jasa terstruktur.",
          items: [
            { emoji: "⚙️", title: "Antrean Servis Jasa", sub: "Uban nomor pengerjaan unit masuk, tanggal estimasi, penugasan teknisi, dan keluhan" },
            { emoji: "🛠️", title: "Rekam Riwayat Kasus", sub: "Lacak riwayat masalah pelanggan, tindakan reparasi teknis, serta garansi resmi" },
            { emoji: "🏍️", title: "Suku Cadang & Jasa", sub: "Gabungan biaya sewa jasa montir/teknisi dengan komponen fisik yang diganti secara presisi" },
            { emoji: "📞", title: "Nota Tandaterima Fisik", sub: "Cetak nota masuk berukuran kompak sebagai bukti serah terima unit yang sah" }
          ],
          footer: "🔧 TEKNISI HANDAL, REPUTASI TINGGI"
        };
      case 'Electronics':
      default:
        return {
          icon: <Laptop className="w-5 h-5 text-teal-400" />,
          title: storeConfig.name || "Torky Komputer",
          sub: "DEDICATED COMPUTER & IT INFRASTRUCTURE",
          desc: "Terminal POS & Ticket Servis terkonfigurasi khusus untuk sektor IT profesional. Terfragmentasi murni dari jasa service alat elektronik rumah tangga umum.",
          items: [
            { emoji: "💻", title: "Penjualan & Service IT", sub: "PC Desktop, Upgrade Laptop, & Suku Cadang Hardware premium" },
            { emoji: "📡", title: "Networking Equipment", sub: "Penyediaan router, switch manageable, access point enterprise" },
            { emoji: "💾", title: "Recovery Data", sub: "Pemulihan partisi hilang/terhapus, HDD bad sector, NAND flash drive" },
            { emoji: "🔒", title: "Build Infrastruktur & Security", sub: "Instalasi server klien, desain jaringan, audit keamanan siber" }
          ],
          footer: "🛡️ BEBAS DARI SERVIS ELEKTRONIK NON-IT"
        };
    }
  };

  const spec = getSectorSpecialization();

  // Calculate stats
  const totalSales = transactions.reduce((acc, curr) => acc + curr.total, 0);
  const totalCost = transactions.reduce((acc, curr) => {
    const txCost = curr.items.reduce((itemAcc, item) => itemAcc + ((item.product.cost || 0) * item.quantity), 0);
    return acc + txCost;
  }, 0);
  const totalProfit = totalSales - totalCost;

  const lowStockProducts = products.filter(p => p.stock !== null && p.stock <= 5);
  const activeJobs = jobs.filter(j => j.status !== 'Completed');
  const readyJobs = jobs.filter(j => j.status === 'Ready for Pickup');

  // Simple daily trend (mocking based on transactions data)
  const salesByMethod = transactions.reduce((acc, curr) => {
    acc[curr.paymentMethod] = (acc[curr.paymentMethod] || 0) + curr.total;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-lg border border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="bg-white/10 p-2.5 rounded-2xl border border-white/5 backdrop-blur-xs shadow-inner flex items-center justify-center shrink-0 w-16 h-16 self-start sm:self-center">
            <Logo variant="icon" className="w-full h-full" />
          </div>
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight">{storeConfig.name}</h1>
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-widest">{storeConfig.powerTitle}</span>
            </div>
            <p className="text-slate-300 text-xs mt-1">
              Halo, <span className="font-extrabold text-teal-400">{operatorName}</span>. Selamat datang di stasiun operasional <span className="font-semibold text-white">{storeConfig.name}</span> ({userRole}).
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('pos')}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Receipt className="w-4 h-4" /> New Sale
          </button>
          <button
            onClick={() => onNavigate('repairs')}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-xs sm:text-sm border border-slate-600 shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Tool className="w-4 h-4" /> Repair Ticket
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs sm:text-sm font-medium text-slate-500">Gross Sales</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900">{formatIDR(totalSales)}</h3>
            {userRole === 'Super Admin' ? (
              <span className="text-[11px] font-mono text-teal-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> Profit margin ~{totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0}%
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                🔒 Margin Terkunci (Owner Only)
              </span>
            )}
          </div>
        </div>

        {/* Repair Jobs */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs sm:text-sm font-medium text-slate-500">Active Repairs</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900">{activeJobs.length} Tickets</h3>
            <span className="text-[11px] text-amber-600 flex items-center gap-1 mt-1">
              {readyJobs.length} ready for customer pick-up
            </span>
          </div>
        </div>

        {/* Stock Alert */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs sm:text-sm font-medium text-slate-500">Stock Warnings</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900">{lowStockProducts.length} Items</h3>
            <span className="text-[11px] text-rose-500 mt-1 block font-medium">
              Requires immediate purchase
            </span>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs sm:text-sm font-medium text-slate-500">Total Orders</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900">{transactions.length} Sales</h3>
            <span className="text-[11px] text-blue-500 mt-1 block">
              Invoices logged securely
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Middle Left: Recent Sales & Repair Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Repairs Highlights */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tool className="w-4 h-4 text-slate-600" /> Active Service Tickets
              </h2>
              <button
                onClick={() => onNavigate('repairs')}
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-0.5"
              >
                Manage Repairs <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeJobs.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-6">All repair orders processed and delivered!</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {activeJobs.map((job) => (
                  <div key={job.id} className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl transition-colors flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-md">{job.jobNo}</span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{job.customerName}</h4>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-1">
                        Device: <span className="font-semibold text-slate-700">{job.deviceModel}</span> • {job.issue}
                      </p>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        job.status === 'Ready for Pickup' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        job.status === 'In Progress' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                        job.status === 'Diagnosing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {job.status}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-700 mt-1">{formatIDR(job.laborCost + (job.partsUsed.reduce((a,c)=>a+c.price, 0)))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Payment Allocation Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Payment Breakdown</h2>
            <div className="space-y-3">
              {Object.entries(salesByMethod).map(([method, total]) => {
                const ratio = totalSales > 0 ? (total / totalSales) * 100 : 0;
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-600">{method}</span>
                      <span className="font-mono font-bold text-slate-800">{formatIDR(total)} ({Math.round(ratio)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {Object.keys(salesByMethod).length === 0 && (
                <p className="text-slate-400 text-xs text-center py-4">No completed transactions logged yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Low Stock Alerts & Fast actions */}
        <div className="space-y-6">
          {/* Low Stock Watchlist */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" /> Low Stock Alerts
              </h2>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-0.5"
              >
                Inspect <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70 mb-2" />
                <p className="text-slate-400 text-xs">All inventory elements well stocked!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-xs p-2 hover:bg-slate-50 rounded-lg">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold border border-rose-100 rounded-md text-[10px] shrink-0 font-mono">
                      {p.stock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Store Specialization Card based on selected Business Sector */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 rounded-2xl p-5 space-y-4 shadow-lg border border-slate-800">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              {spec.icon}
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-black tracking-widest text-[#2dd4bf] uppercase truncate font-mono">{spec.title}</h3>
                <p className="text-[9px] text-teal-400/80 font-mono truncate">{spec.sub}</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-normal font-sans">
              {spec.desc}
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-1 gap-2 text-[10px] font-sans">
                {spec.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 p-2 bg-slate-850/60 rounded-xl border border-slate-800/50">
                    <span className="text-[#2dd4bf] text-sm shrink-0">{item.emoji}</span>
                    <div>
                      <strong className="text-slate-200 block text-[11px] font-bold">{item.title}</strong>
                      <span className="text-slate-400 text-[10.5px] leading-relaxed block">{item.sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[9.5px] text-[#2dd4bf] font-bold font-mono tracking-tight bg-teal-950/40 border border-teal-900/40 p-2 rounded-xl text-center flex items-center justify-center gap-1">
                {spec.footer}
              </div>
            </div>
          </div>
          {/* Pengaturan Logo Toko Kustom */}
          {userRole === 'Super Admin' || userRole === 'Admin' ? (
            <div className="space-y-6">
              {/* BRAND PROFILE SETTINGS */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Tool className="w-5 h-5 text-[#14b8a6]" />
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest text-[#0d9488]">Profil Toko / UMKM</h4>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                  Ubah konfigurasi di bawah untuk menyesuaikan nama usaha, tagline, sektor, alamat, dan kontak telepon pada nota struk cetak & seluruh header (Sistem universal siap pakai).
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block mb-1">Nama Toko / Usaha:</label>
                    <input
                      type="text"
                      value={storeConfig.name}
                      onChange={(e) => onUpdateStoreConfig({ ...storeConfig, name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 text-slate-800 text-xs rounded-lg border border-slate-200 outline-none focus:border-teal-500 focus:bg-white font-sans font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block mb-1">Tagline / Slogan:</label>
                    <input
                      type="text"
                      value={storeConfig.powerTitle}
                      onChange={(e) => onUpdateStoreConfig({ ...storeConfig, powerTitle: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 text-slate-800 text-xs rounded-lg border border-slate-200 outline-none focus:border-teal-500 focus:bg-white font-sans font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block mb-1">Sektor Bisnis UMKM:</label>
                    <select
                      value={storeConfig.businessSector || 'Electronics'}
                      onChange={(e) => {
                        const newSector = e.target.value;
                        let defaultType = 'pos_only';
                        if (newSector === 'Electronics') defaultType = 'pos_services';
                        if (newSector === 'Services') defaultType = 'pos_services_repair';
                        onUpdateStoreConfig({ 
                          ...storeConfig, 
                          businessSector: newSector, 
                          businessType: defaultType 
                        });
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 text-slate-800 text-xs rounded-lg border border-slate-200 outline-none focus:border-teal-500 focus:bg-white font-sans font-semibold"
                    >
                      <option value="Electronics">💻 Torky Komputer &amp; IT Service Dedikasi</option>
                      <option value="Retail">🛍️ Swalayan Minimarket &amp; Retail Umum</option>
                      <option value="Apparel">👕 Butik Mode, Pakaian &amp; Aksesori</option>
                      <option value="Culinary">🍛 Kuliner, Warung, Kedai &amp; Cafe</option>
                      <option value="Services">🚀 Jasa Konsultasi / Layanan UMKM</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block mb-1">Model Kebutuhan Menu:</label>
                    <select
                      value={storeConfig.businessType || 'pos_services'}
                      onChange={(e) => onUpdateStoreConfig({ ...storeConfig, businessType: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 text-slate-800 text-xs rounded-lg border border-slate-200 outline-none focus:border-teal-500 focus:bg-white font-sans font-semibold"
                    >
                      {(() => {
                        const sector = storeConfig.businessSector || 'Electronics';
                        if (sector === 'Retail') {
                          return (
                            <>
                              <option value="pos_only">🏪 Swalayan &amp; Retail (POS + Manajemen Stok Barang)</option>
                              <option value="pos_retail_delivery">📦 Swalayan &amp; Delivery (POS + Pengiriman Kurir Biteship)</option>
                            </>
                          );
                        }
                        if (sector === 'Apparel') {
                          return (
                            <>
                              <option value="pos_only">👗 Butik Fashion (POS + Pembagian Stok Ukuran &amp; Warna)</option>
                              <option value="pos_apparel_simple">🛍️ Toko Pakaian Grosir (POS Penjualan Sederhana)</option>
                            </>
                          );
                        }
                        if (sector === 'Culinary') {
                          return (
                            <>
                              <option value="pos_only">🥤 Cafe &amp; Kedai Take-Away (POS Penjualan Cepat)</option>
                              <option value="pos_culinary_dine">🍽️ Resto / Warung Makan (Daftar Meja + Tiket Pesanan Dapur)</option>
                            </>
                          );
                        }
                        if (sector === 'Services') {
                          return (
                            <>
                              <option value="pos_services_repair">🔧 Bengkel &amp; Servis (Pencatatan Pekerjaan Jasa/Montir)</option>
                              <option value="pos_only">🛍️ Penjualan Sparepart Saja (Sembunyikan Pekerjaan Servis)</option>
                            </>
                          );
                        }
                        // Default to Electronics
                        return (
                          <>
                            <option value="pos_services">👑 Penjualan &amp; Jasa IT Lengkap (Lengkap dengan Tiket Servis + Simulasi PC)</option>
                            <option value="pos_only">🛍️ Hanya Penjualan Barang Saja (Sembunyikan Menu Pekerjaan Servis &amp; Simulasi PC)</option>
                          </>
                        );
                      })()}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block mb-1">Alamat Toko (Nota):</label>
                    <input
                      type="text"
                      value={storeConfig.address}
                      onChange={(e) => onUpdateStoreConfig({ ...storeConfig, address: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 text-slate-800 text-xs rounded-lg border border-slate-200 outline-none focus:border-teal-500 focus:bg-white font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block mb-1">Nomor Telepon WA:</label>
                    <input
                      type="text"
                      value={storeConfig.phone}
                      onChange={(e) => onUpdateStoreConfig({ ...storeConfig, phone: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 text-slate-800 text-xs rounded-lg border border-slate-200 outline-none focus:border-teal-500 focus:bg-white font-sans font-semibold font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* LOGO SETTINGS */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <ImageIcon className="w-5 h-5 text-slate-500" />
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Logo Toko Kustom</h4>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Unggah file logo asli Anda di sini. Logo akan terpasang otomatis di seluruh aplikasi (Simulasi Layar, Invoice Thermal Struk, Cetakan Servis, dan Dashboard).
                </p>

                <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center p-2 shadow-xs border border-slate-150 overflow-hidden">
                    <Logo variant="icon" className="w-full h-full" />
                  </div>
                  
                  <div className="flex flex-wrap gap-2 w-full justify-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer select-none"
                    >
                      <Upload className="w-3.5 h-3.5" /> Unggah .PNG / .JPG
                    </button>
                    
                    {hasCustomLogo && (
                      <button
                        type="button"
                        onClick={handleLogoReset}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs border border-rose-200 transition-colors cursor-pointer select-none"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Reset
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 border border-slate-200/60 p-4 rounded-2xl space-y-2 text-slate-400 select-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                🔒 Logo &amp; Brand Setting Locked
              </span>
              <p className="text-[10.5px] leading-relaxed font-sans">Unggah logo kustom dan pengaturan profil visual dinonaktifkan untuk staf {userRole}. Hubungi Admin / Owner.</p>
            </div>
          )}

          {/* Outsourcing detail cards / low stock header */}
          {/* Pusat Unduh & Cadangan Data */}
          {userRole === 'Super Admin' || userRole === 'Admin' ? (
            <div className="bg-gradient-to-br from-teal-550/10 to-teal-500/5 border border-teal-100/50 p-5 rounded-2xl space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 pb-2 border-b border-teal-100/30">
                <Download className="w-5 h-5 text-teal-600" />
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Pusat Unduh & Cadangan</h4>
              </div>
              
              <p className="text-xs text-slate-600 leading-relaxed">
                Semua transaksi, servis, dan produk {storeConfig.name} disimpan langsung di memori komputer Anda. Amankan data Anda secara berkala!
              </p>

              <button
                onClick={handleDownloadBackup}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 text-center cursor-pointer font-sans uppercase tracking-wider"
              >
                <Download className="w-4 h-4" /> Unduh Cadangan Data (.json)
              </button>

              {onResetAllData && userRole === 'Super Admin' && (
                <button
                  type="button"
                  onClick={() => setShowResetAllConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-xl text-xs border border-rose-200 transition-all text-center cursor-pointer mt-2 font-sans uppercase tracking-wider font-semibold"
                >
                  ⚠️ Reset Total Data (Purge Data Demo)
                </button>
              )}

              {/* CUSTOM CORE DATABASE RESET DIALOGS */}
              {showResetAllConfirm && (
                <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
                  <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden font-sans">
                    <div className="p-5 text-center space-y-4">
                      <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold animate-pulse">
                        ⚠️
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-tight">KONTROL RESENT DATABASE TOTAL</h3>
                        <p className="text-xs text-rose-700 font-semibold bg-rose-50/50 p-2 rounded-xl border border-rose-100 leading-normal">
                          🔴 TINDAKAN INI BERDAYA RUSAK TINGGI & TIDAK BISA DIBATALKAN!
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed pt-1">
                          Apakah Anda yakin ingin menghapus seluruh database saat ini (produk/inventaris, transaksi penjualan, pelanggan directory, tiket servis, dan data supplier) untuk memulai kembali dari awal bersih? Semua data demo lama akan disapu bersih dari browser Anda!
                        </p>
                      </div>
                      
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowResetAllConfirm(false)}
                          className="flex-1 py-2 px-3 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onResetAllData?.();
                            setShowResetAllConfirm(false);
                            setShowResetSuccessAlert(true);
                          }}
                          className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs transition-colors shadow-md cursor-pointer uppercase tracking-wider"
                        >
                          Ya, Reset Bersih!
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showResetSuccessAlert && (
                <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
                  <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden font-sans">
                    <div className="p-5 text-center space-y-3">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                        ✓
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-tight">Reset Berhasil!</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Seluruh database cache local telah dibersihkan! Mulai lembar baru pengoperasian toko yang fresh dan bertenaga.
                        </p>
                      </div>
                      
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowResetSuccessAlert(false);
                            window.location.reload();
                          }}
                          className="w-full py-2 bg-emerald-550 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-md cursor-pointer uppercase tracking-wider"
                        >
                          Mulai Ulang Sesi
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Application Installation / Download Guidance */}
              <div className="space-y-2 pt-2 border-t border-slate-200/50 text-[11px] text-slate-600">
                <span className="font-bold text-slate-700 block uppercase tracking-tight text-[10px]">Cara Unduh & Jalankan Standalone:</span>
                
                <div className="space-y-2 font-sans leading-relaxed">
                  <div className="flex gap-2 items-start">
                    <span className="w-4 h-4 rounded-full bg-teal-105 text-teal-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <p><strong>Download Kode Sumber (ZIP)</strong>: Klik menu pengaturan ekspor di pojok kanan atas dan pilih <strong>"Download ZIP"</strong> atau melalui repositori GitHub Anda jika terhubung.</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="w-4 h-4 rounded-full bg-teal-105 text-teal-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <p><strong>Jalankan di Laptop Toko</strong>: Ekstrak berkas ZIP, buka aplikasi Terminal/Command Prompt di folder tersebut, ketik <code>npm install</code> lalu jalankan <code>npm run dev</code>.</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="w-4 h-4 rounded-full bg-teal-105 text-teal-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <p><strong>PWA / Standalone Mandiri</strong>: Sistem ini berjalan 100% aman tanpa tergantung server luar, sempurna untuk mengelola transaksi kasir dan servis harian!</p>
                  </div>
                </div>
              </div>

              {/* STATUS LISENSI & PERANGKAT TERHUBUNG */}
              <div className="bg-gradient-to-br from-indigo-50/40 to-blue-50/10 border border-indigo-100 p-5 rounded-2xl space-y-4 shadow-2xs mt-4">
                <div className="flex items-center gap-2 pb-2 border-b border-indigo-100/30">
                  <Laptop className="w-5 h-5 text-indigo-600" />
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Status Multi-Client & Lisensi</h4>
                </div>
                
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kunci Lisensi:</span>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{licensedKey || 'Belum Diaktifkan'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paket Lisensi:</span>
                    <span className="font-bold text-slate-800">{heartbeatStatus?.packageName || 'Stand-Alone Solo Package'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Batas Kuota Alat:</span>
                    <span className="font-bold font-mono text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded">{heartbeatStatus?.limit || 1} Perangkat</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Terhubung Saat Ini:</span>
                    <span className="font-extrabold text-emerald-600 font-mono">{heartbeatStatus?.activeCount || 1} Perangkat</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block font-mono mb-2">Daftar Terminal Terhubung (Live WITA):</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {(heartbeatStatus?.activeClients || [
                      { clientId: 'local', name: `${storeConfig.name} (${userRole || "Admin"})`, ip: '127.0.0.1', lastSeen: Date.now() }
                    ]).map((client: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-xl text-[11px] leading-tight">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-bold text-slate-700">{client.name}</span>
                        </div>
                        <span className="font-mono text-[9px] text-slate-400 bg-slate-50 px-1 py-0.5 rounded">{client.ip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-sans leading-relaxed">
                  💡 <strong>Info Jenis Paket Lisensi (Multi-Client)</strong>:<br />
                  - <strong>Stand-Alone Solo</strong>: 1 Perangkat kasir utama lepas (stand-alone)<br />
                  - <strong>Lite Team Package</strong>: Maksimal 3 perangkat tersambung serentak (akhiran key <code className="bg-slate-100 px-1 rounded">-LITE3</code>)<br />
                  - <strong>Standard Store Package</strong>: Maksimal 5 perangkat tersambung serentak (akhiran key <code className="bg-slate-100 px-1 rounded">-STORE5</code>)<br />
                  - <strong>Enterprise Ultimate Package</strong>: Maksimal 50 perangkat tersambung serentak (akhiran key <code className="bg-slate-100 px-1 rounded">-UNLIMITED</code>)<br />
                  <span className="text-[9px] text-indigo-600 block mt-1 font-mono">Hubungi email resmi torkykomputer@gmail.com atau kunjungi website kami untuk melakukan upgrade lisensi!</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 border border-slate-200/60 p-4 rounded-2xl space-y-2 text-slate-400 select-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                🔒 Data Backup Locked
              </span>
              <p className="text-[10.5px] leading-relaxed">Pengunduhan repositori database aman, master data cadangan, dan petunjuk ekspor hanya diizinkan untuk peran Owner.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
