import React, { useState, useMemo } from 'react';
import { Search, Calendar, FileText, User, CreditCard, ChevronRight, Printer, RotateCcw, ShieldAlert, Trash2, KeyRound, ShieldCheck, Clock, Tag, ExternalLink, Info } from 'lucide-react';
import { Transaction, UserRole, Supplier, Staff } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import { formatIDR, formatWITA } from '../utils';

interface SalesHistoryProps {
  transactions: Transaction[];
  onRefundTransaction: (transactionId: string) => void;
  onResetTransactions: () => void;
  userRole?: UserRole;
  rolePins?: Record<UserRole, string>;
  storeConfig?: {
    name: string;
    powerTitle: string;
    logoUrl: string;
    businessSector: string;
    address: string;
    phone: string;
  };
  suppliers?: Supplier[];
  staffs?: Staff[];
}

export default function SalesHistory({
  transactions,
  onRefundTransaction,
  onResetTransactions,
  userRole = 'Kasir',
  rolePins,
  storeConfig = {
    name: 'Torky Komputer',
    powerTitle: 'Anda Yang Utama',
    logoUrl: '',
    businessSector: 'Electronics',
    address: 'Jl. Ahmad Yani No. 88, Denpasar',
    phone: '0812-3456-7890',
  },
  suppliers = [],
  staffs = [],
}: SalesHistoryProps) {
  const [activeTab, setActiveTab] = useState<'transactions' | 'warranty'>('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTx, setActiveTx] = useState<Transaction | null>(null);

  // Warranty tab state variables
  const [warrantySearchQuery, setWarrantySearchQuery] = useState('');
  const [warrantySupplierFilter, setWarrantySupplierFilter] = useState('All');
  const [activeClaimItem, setActiveClaimItem] = useState<any | null>(null);
  const [claimProblemDescription, setClaimProblemDescription] = useState('Kerusakan hardware / Tidak mau menyala');

  // Admin PIN verification state
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    type: 'refund' | 'reset-all';
    txId?: string;
  } | null>(null);

  // Filtered transactions computed list
  const filteredTxs = useMemo(() => {
    return transactions.filter((tx) => {
      const matchInvoice = tx.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCustomer = tx.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      return matchInvoice || matchCustomer || searchQuery === '';
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, searchQuery]);

  // Aggregate stats calculations
  const stats = useMemo(() => {
    const totalSales = filteredTxs.reduce((acc, curr) => acc + curr.total, 0);
    const avgTicketValue = filteredTxs.length > 0 ? totalSales / filteredTxs.length : 0;
    const discountVolume = filteredTxs.reduce((acc, curr) => acc + curr.discount, 0);

    return {
      totalSales,
      avgTicketValue,
      discountVolume,
      count: filteredTxs.length
    };
  }, [filteredTxs]);

  // Extract all sold products history with associated transaction data
  const soldItems = useMemo(() => {
    const list: Array<{
      txId: string;
      invoiceNo: string;
      timestamp: string;
      customerName: string;
      customerPhone: string;
      productName: string;
      productBrand?: string;
      productSku: string;
      productCost: number;
      productPrice: number;
      supplierId?: string;
      supplierInvoiceNo?: string;
      serialNumbers?: string[];
      quantity: number;
    }> = [];

    transactions.forEach(tx => {
      tx.items.forEach(item => {
        list.push({
          txId: tx.id,
          invoiceNo: tx.invoiceNo,
          timestamp: tx.timestamp,
          customerName: tx.customerName || 'Walk-in Client',
          customerPhone: tx.customerPhone || '',
          productName: item.product.name,
          productBrand: item.product.brand,
          productSku: item.product.sku,
          productCost: item.product.cost || 0,
          productPrice: item.product.price,
          supplierId: item.product.supplierId,
          supplierInvoiceNo: item.product.supplierInvoiceNo,
          serialNumbers: item.product.serialNumbers,
          quantity: item.quantity,
        });
      });
    });

    return list;
  }, [transactions]);

  const filteredWarrantyItems = useMemo(() => {
    return soldItems.filter(item => {
      const matchSupplier = warrantySupplierFilter === 'All' || item.supplierId === warrantySupplierFilter;
      
      const query = warrantySearchQuery.toLowerCase();
      const matchQuery = 
        item.productName.toLowerCase().includes(query) ||
        item.invoiceNo.toLowerCase().includes(query) ||
        item.customerName.toLowerCase().includes(query) ||
        item.customerPhone.toLowerCase().includes(query) ||
        (item.productBrand || '').toLowerCase().includes(query) ||
        (item.productSku || '').toLowerCase().includes(query) ||
        (item.supplierInvoiceNo || '').toLowerCase().includes(query) ||
        (item.serialNumbers || []).some(sn => sn.toLowerCase().includes(query));

      return matchSupplier && matchQuery;
    }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [soldItems, warrantySearchQuery, warrantySupplierFilter]);

  const getWarrantyStatus = (timestamp: string) => {
    const purchaseDate = new Date(timestamp);
    const today = new Date();
    const diffTime = today.getTime() - purchaseDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Let's assume standard 365 days warranty
    const warrantyDuration = 365;
    const daysLeft = warrantyDuration - diffDays;

    if (daysLeft <= 0) {
      return { status: 'Expired', label: 'Garansi Habis', daysLeft: 0, color: 'text-rose-600 bg-rose-50 border-rose-150 border' };
    } else if (daysLeft <= 30) {
      return { status: 'Near Expiry', label: `${daysLeft} Hari Lagi`, daysLeft, color: 'text-amber-600 bg-amber-50 border-amber-150 border animate-pulse' };
    } else {
      return { status: 'Active', label: 'Garansi Aktif', daysLeft, color: 'text-teal-700 bg-teal-50/50 border-teal-150 border' };
    }
  };

  // Request admin PIN for action
  const requestAdminAction = (type: 'refund' | 'reset-all', txId?: string) => {
    setPendingAction({ type, txId });
    setPinInput('');
    setPinError('');
    setPinModalOpen(true);
  };

  const verifyAdminPIN = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPin = rolePins ? rolePins['Admin'] : '8888';
    const superAdminPin = rolePins ? rolePins['Super Admin'] : '9999';

    // Get active Admin and Super Admin PINs from staffs list
    const activeAdminPins = staffs
      .filter((s) => (s.role === 'Super Admin' || s.role === 'Admin') && s.status === 'Aktif')
      .map((s) => s.pin);

    const isAuthorized = 
      pinInput === adminPin || 
      pinInput === superAdminPin || 
      pinInput === 'admin' ||
      activeAdminPins.includes(pinInput);

    if (isAuthorized) {
      // Success
      if (pendingAction) {
        if (pendingAction.type === 'refund' && pendingAction.txId) {
          onRefundTransaction(pendingAction.txId);
          setActiveTx(null);
        } else if (pendingAction.type === 'reset-all') {
          onResetTransactions();
          setActiveTx(null);
        }
      }
      setPinModalOpen(false);
      setPendingAction(null);
      setPinInput('');
    } else {
      setPinError('PIN Otoritas Khusus salah! Harap gunakan PIN Admin atau Super Admin Anda.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial aggregate header row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Filtered Income</span>
          <span className="text-base sm:text-lg font-black text-slate-800 font-mono mt-1 block">
            {formatIDR(stats.totalSales)}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Invoice Count</span>
          <span className="text-base sm:text-lg font-black text-slate-800 font-mono mt-1 block">
            {stats.count} Bills
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Avg. Ticket Size</span>
          <span className="text-base sm:text-lg font-black text-slate-800 font-mono mt-1 block">
            {formatIDR(stats.avgTicketValue)}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Discounts Given</span>
          <span className="text-base sm:text-lg font-black text-rose-600 font-mono mt-1 block">
            {formatIDR(stats.discountVolume)}
          </span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 mt-2 bg-white rounded-t-2xl p-1 border-t border-x border-slate-100">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 sm:flex-none px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer ${
            activeTab === 'transactions'
              ? 'border-teal-500 text-teal-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📁 Log Transaksi Cabang
        </button>
        <button
          onClick={() => setActiveTab('warranty')}
          className={`flex-1 sm:flex-none px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'warranty'
              ? 'border-teal-500 text-teal-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🛡️ Pelacak Garansi & Klaim Supplier
          <span className="hidden sm:inline-block bg-teal-500/10 text-teal-700 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-black animate-pulse">
            NEW
          </span>
        </button>
      </div>

      {activeTab === 'transactions' ? (
        <>
          {/* Control Search Row & Action */}
          <div className="flex flex-col sm:flex-row bg-white p-4 rounded-b-2xl rounded-tr-none border-b border-x border-slate-100 shadow-xs items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari transaksi berdasarkan nomor invoice atau nama pelanggan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl text-xs placeholder:text-slate-400 text-slate-850 outline-none"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {transactions.length > 0 && (
                <button
                  onClick={() => {
                    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
                      alert("Akses Ditolak: Hanya Akun Owner/Admin yang disahkan untuk menghapus historis transaksi!");
                      return;
                    }
                    requestAdminAction('reset-all');
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Reset Data Sales
                </button>
              )}
            </div>
          </div>

          {/* List layout of Transactions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-850 text-sm">Archived Sales Records</h2>
              <span className="text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-100 font-bold px-2 py-0.5 rounded-full">
                REAL-TIME LOG
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredTxs.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setActiveTx(tx)}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex gap-3 items-start">
                    <div className="p-2.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100 mt-1">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-855">{tx.invoiceNo}</span>
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded-md font-mono">
                          {tx.paymentMethod}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Client: <span className="font-semibold text-slate-700">{tx.customerName || 'Walk-in Client'}</span> • {tx.items.reduce((a,c)=>a+c.quantity, 0)} items purchased
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-mono font-black text-slate-900 block">{formatIDR(tx.total)}</span>
                      <span className="text-[10px] text-slate-400 font-medium font-mono">{formatWITA(tx.timestamp)}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                </div>
              ))}

              {filteredTxs.length === 0 && (
                <div className="text-center py-16">
                  <FileText className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium text-sm">No transaction files matched your query.</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {/* Controls: Warranty search query and supplier filter */}
          <div className="flex flex-col md:flex-row bg-white p-4 rounded-2xl border border-slate-100 shadow-sm items-center gap-3">
            {/* Search items */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari garansi lewat Nama Barang, S/N (Serial Number), No. Invoice Pembeli, atau Invoice Supplier..."
                value={warrantySearchQuery}
                onChange={(e) => setWarrantySearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-150 focus:border-teal-500 rounded-xl text-xs placeholder:text-slate-400 text-slate-850 outline-none font-medium"
              />
            </div>
            
            {/* Supplier Filter */}
            <div className="w-full md:w-64">
              <select
                value={warrantySupplierFilter}
                onChange={(e) => setWarrantySupplierFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">🔍 Semua Supplier Asal</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>🏭 {s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table display of sold items with warranty */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/30">
              <div>
                <h2 className="font-bold text-slate-850 text-sm flex items-center gap-2">
                  🛡️ Rekam Garansi & Asal Supplier Barang Terjual
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-relaxed">
                  Menghubungkan item keluar langsung ke Invoice Supplier masing-masing untuk transparansi klaim garansi tanpa bocor data.
                </p>
              </div>
              <span className="text-[10px] font-mono bg-teal-500/10 text-teal-700 border border-teal-100/30 font-bold px-2 py-0.5 rounded-full uppercase self-start sm:self-center">
                {filteredWarrantyItems.length} Unit Terdeteksi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-450 uppercase tracking-wider select-none">
                    <th className="py-3 px-4">Informasi Barang Terjual</th>
                    <th className="py-3 px-4">Serial Number (S/N)</th>
                    <th className="py-3 px-4">Tanggal Jual & Pembeli</th>
                    <th className="py-3 px-4">Supplier Asal & Nota Kulakan</th>
                    <th className="py-3 px-4 text-center">Masa Garansi Toko</th>
                    <th className="py-3 px-4 text-right">Aksi Klaim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredWarrantyItems.map((item, idx) => {
                    const status = getWarrantyStatus(item.timestamp);
                    const sup = suppliers.find(s => s.id === item.supplierId);
                    
                    return (
                      <tr key={idx} className="hover:bg-slate-55/10 transition-colors">
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-800 leading-tight">{item.productName}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {item.productBrand && (
                              <span className="bg-slate-100 text-slate-650 border border-slate-150 rounded px-1 text-[9px] font-extrabold font-sans">
                                {item.productBrand}
                              </span>
                            )}
                            <span className="text-[9.5px] text-slate-400 font-mono">SKU: {item.productSku}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                          {item.serialNumbers && item.serialNumbers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.serialNumbers.map((sn, sIdx) => (
                                <span key={sIdx} className="bg-slate-50 text-slate-700 border border-slate-200 rounded px-1.5 py-0.5 text-[9.5px] tracking-wider">
                                  {sn}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[9.5px] text-slate-400 italic font-mono bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">- Tanpa S/N -</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {item.customerName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Nota: <strong className="text-teal-700 font-black">{item.invoiceNo}</strong>
                          </div>
                          <div className="text-[9px] text-slate-450 mt-0.5 font-semibold font-mono">
                            📅 {new Date(item.timestamp).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {sup ? (
                            <div className="space-y-0.5">
                              <div className="font-extrabold text-slate-750 flex items-center gap-1">
                                <Tag className="w-3 h-3 text-teal-600 shrink-0" />
                                {sup.name}
                              </div>
                              {item.supplierInvoiceNo ? (
                                <div className="text-[10px] font-mono text-slate-500">
                                  Nota Supplier: <strong className="text-teal-700 bg-teal-500/5 border border-teal-500/10 px-1 py-0.2 rounded font-bold">{item.supplierInvoiceNo}</strong>
                                </div>
                              ) : (
                                <div className="text-[9.5px] italic text-slate-350 font-medium">Tanpa Referensi Nota</div>
                              )}
                              {sup.phone && (
                                <div className="text-[9px] text-slate-450">Tlp: {sup.phone}</div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-slate-400 font-extrabold text-[10px] uppercase bg-slate-100 px-1 py-0.2 rounded">Umum / Tanpa Supplier</span>
                              {item.supplierInvoiceNo && (
                                <div className="text-[10px] font-mono text-slate-500">
                                  Nota Beli: <strong className="text-slate-800 font-semibold">{item.supplierInvoiceNo}</strong>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${status.color}`}>
                            {status.status === 'Active' ? (
                              <ShieldCheck className="w-3 h-3 shrink-0 text-teal-600" />
                            ) : (
                              <Clock className="w-3 h-3 shrink-0" />
                            )}
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setActiveClaimItem(item);
                            }}
                            className="bg-slate-900 border border-slate-750 text-white hover:bg-teal-500 hover:text-slate-950 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" /> Buat Klaim
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {filteredWarrantyItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-slate-500">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400 border border-slate-200">
                          <ShieldAlert className="w-6 h-6 text-slate-400 shrink-0" />
                        </div>
                        <p className="font-semibold text-sm">Tidak menemukan kecocokan rekam garansi.</p>
                        <p className="text-[10px] text-slate-400 mt-1">Gunakan kata kunci serial number atau nama laptop/barang.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: Detailed Invoice drawer sheet simulated paper receipt */}
      {activeTx && (
        <div className="fixed inset-0 bg-slate-950/80 z-40 flex items-center justify-center p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-150 overflow-hidden text-slate-800"
          >
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 font-mono">Invoice File: {activeTx.invoiceNo}</span>
              <button
                onClick={() => setActiveTx(null)}
                className="text-slate-450 hover:text-slate-800 text-sm font-bold bg-slate-200/50 hover:bg-slate-200 w-6 h-6 rounded-full flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-5 max-h-[65vh] overflow-y-auto">
              {/* Thermal container wrapper rendering receipt exactly same */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4 font-mono text-[11px] text-slate-700">
                <div className="text-center pb-3 border-b border-dashed border-slate-300">
                  <Logo variant="icon" size="sm" className="mx-auto mb-1 opacity-80" />
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-800">
                    {storeConfig.name}
                  </h4>
                  {storeConfig.address && (
                    <p className="text-[9px] text-slate-400 leading-tight">{storeConfig.address}</p>
                  )}
                  {storeConfig.phone && (
                    <p className="text-[9px] text-slate-400 leading-normal">WA: {storeConfig.phone}</p>
                  )}
                  <p className="text-[9.5px] font-bold mt-1 uppercase text-slate-650 font-mono">{activeTx.invoiceNo}</p>
                </div>

                <div className="space-y-1 py-1.5 border-b border-dashed border-slate-300">
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span>{formatWITA(activeTx.timestamp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLIENT:</span>
                    <span className="truncate max-w-[120px]">{activeTx.customerName || 'Walk-In'}</span>
                  </div>
                  {activeTx.customerPhone && (
                    <div className="flex justify-between">
                      <span>TELP:</span>
                      <span>{activeTx.customerPhone}</span>
                    </div>
                  )}
                </div>

                {/* Items row detailing */}
                <div className="space-y-1.5 border-b border-dashed border-slate-300 py-2.5">
                  {activeTx.items.map((item) => {
                    const extraPrice = (item.ramPriceSurcharge || 0) + (item.storagePriceSurcharge || 0);
                    const displayedUnitPrice = item.product.price + extraPrice;
                    return (
                      <div key={item.id} className="space-y-0.5 border-b border-slate-100 last:border-none pb-1.5 last:pb-0">
                        <div className="flex justify-between gap-4 text-xs">
                          <span className="truncate max-w-[155px] font-bold text-slate-800">{item.product.name}</span>
                          <span className="shrink-0 font-semibold font-mono">
                            {item.quantity} x {formatIDR(displayedUnitPrice)}
                          </span>
                        </div>
                        {(item.selectedRamUpgrade || item.selectedStorageUpgrade) && (
                          <div className="text-[9.5px] italic text-slate-550 pl-1.5 border-l border-teal-400 font-mono">
                            {item.selectedRamUpgrade && <div>+ Upgrade RAM: {item.selectedRamUpgrade}</div>}
                            {item.selectedStorageUpgrade && <div>+ Upgrade Storage: {item.selectedStorageUpgrade}</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Calculations info */}
                <div className="space-y-1 text-right text-xs">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatIDR(activeTx.subtotal)}</span>
                  </div>
                  {activeTx.discount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Discount:</span>
                      <span>-{formatIDR(activeTx.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Pajak (PPN {Math.round((activeTx.tax / Math.max(1, activeTx.subtotal - activeTx.discount)) * 100)}%):</span>
                    <span className="font-medium">{formatIDR(activeTx.tax)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black pt-1 border-t border-slate-200 mt-1 text-sm">
                    <span>Invoiced:</span>
                    <span>{formatIDR(activeTx.total)}</span>
                  </div>
                </div>

                {/* Return transaction info */}
                <div className="pt-2 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-450">
                  <span>Logged: {activeTx.paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* Print and Refund Trigger actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2.5">
              <button
                onClick={() => {
                  if (userRole !== 'Super Admin' && userRole !== 'Admin') {
                    alert("Akses Ditolak: Hanya Akun Owner/Admin yang disahkan untuk melakukan refund (pengembalian dana) pada invoice ini!");
                    return;
                  }
                  requestAdminAction('refund', activeTx.id);
                }}
                className="flex-1 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 border border-rose-200/50"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Refund Record
              </button>
              <button
                onClick={() => window.print()}
                className="flex-[1.5] py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-lg text-xs transition-all flex items-center justify-center gap-1 shadow-md"
              >
                <Printer className="w-3.5 h-3.5" /> Print Invoice
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* OVERLAY: Detailed Supplier Warranty Claim Form */}
      {activeClaimItem && (
        <div className="fixed inset-0 bg-slate-950/85 z-45 flex items-center justify-center p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-150 overflow-hidden text-slate-800 flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white border-b border-slate-850 flex justify-between items-center">
              <span className="text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 uppercase text-teal-300">
                🛡️ Dokumen Klaim Garansi Supplier
              </span>
              <button
                onClick={() => {
                  setActiveClaimItem(null);
                  setClaimProblemDescription('Kerusakan hardware / Tidak mau menyala');
                }}
                className="text-slate-400 hover:text-white text-sm font-bold bg-white/10 hover:bg-white/20 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal content (scrollable form & printable slip) */}
            <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
              
              {/* Edit Problem/Remark field */}
              <div className="bg-amber-50/50 border border-amber-500/10 p-3 rounded-xl space-y-1.5 text-xs">
                <label className="block text-[10px] font-black uppercase text-amber-800 tracking-wider font-sans">
                  Detail Kerusakan Barang (Untuk Dikirim Ke Supplier)
                </label>
                <textarea
                  rows={2}
                  value={claimProblemDescription}
                  onChange={(e) => setClaimProblemDescription(e.target.value)}
                  placeholder="Contoh: Lampu indikator berkedip merah terus, tidak mau mendeteksi RAM, layar bergaris..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-450 rounded-lg text-slate-800 outline-none font-sans"
                />
              </div>

              {/* Printable Document Box */}
              <div id="printable-warranty-slip" className="border border-slate-300 rounded-xl p-5 bg-stone-50 text-slate-900 font-serif leading-relaxed text-xs shadow-inner">
                {/* Header */}
                <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-950 font-sans">{storeConfig.name}</h3>
                  <p className="text-[9.5px] font-sans text-slate-500 font-medium tracking-tight mt-0.5">{storeConfig.address} • Tlp: {storeConfig.phone}</p>
                  <p className="text-[11px] font-bold uppercase underline font-mono tracking-widest mt-2 text-slate-900">
                    SURAT JALAN KLAIM GARANSI
                  </p>
                  <p className="text-[9px] font-mono text-slate-450 mt-1">Tanggal Buat: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                {/* Main Body Grid */}
                <table className="w-full border-collapse my-2 text-[10.5px]">
                  <tbody>
                    {/* Supplier info */}
                    <tr className="border-b border-stone-200">
                      <td className="py-2 font-bold font-sans w-1/3 uppercase text-slate-500 align-top">Tujuan Supplier</td>
                      <td className="py-2 font-sans text-stone-850">
                        {(() => {
                          const sup = suppliers.find(s => s.id === activeClaimItem.supplierId);
                          return (
                            <>
                              <strong className="text-stone-900 font-sans font-black">
                                {sup ? sup.name : 'UMUM / DISTRIBUTOR KETIGA'}
                              </strong>
                              {sup?.contactPerson && (
                                <div className="text-[9.5px] text-slate-500 font-medium font-sans">U.p. {sup.contactPerson}</div>
                              )}
                              {sup?.phone && (
                                <div className="text-[9.5px] text-slate-500 font-medium font-mono">Tlp: {sup.phone}</div>
                              )}
                              {sup?.address && (
                                <div className="text-[9px] text-slate-450 italic mt-0.5 max-w-[200px] font-sans">{sup.address}</div>
                              )}
                            </>
                          );
                        })()}
                      </td>
                    </tr>

                    {/* Referensi Nota Kulakan */}
                    <tr className="border-b border-stone-200">
                      <td className="py-2 font-bold font-sans uppercase text-slate-500">Nota Beli suplayer</td>
                      <td className="py-2 font-mono font-bold text-stone-900">
                        {activeClaimItem.supplierInvoiceNo ? (
                          <span className="bg-slate-200/50 px-1 py-0.5 rounded text-xs">{activeClaimItem.supplierInvoiceNo}</span>
                        ) : (
                          <span className="text-stone-400 font-mono italic font-normal">- Tanpa Referensi Excel / Nota -</span>
                        )}
                      </td>
                    </tr>

                    {/* Product Name */}
                    <tr className="border-b border-stone-200">
                      <td className="py-2 font-bold font-sans uppercase text-slate-500">Nama Barang</td>
                      <td className="py-2 font-sans font-extrabold text-slate-900 text-[11px]">
                        {activeClaimItem.productName}
                        {activeClaimItem.productBrand && ` (${activeClaimItem.productBrand})`}
                      </td>
                    </tr>

                    {/* Serial Numbers */}
                    <tr className="border-b border-stone-200">
                      <td className="py-2 font-bold font-sans uppercase text-slate-500">Serial Number (S/N)</td>
                      <td className="py-2 font-mono font-black text-stone-850 text-xs">
                        {activeClaimItem.serialNumbers && activeClaimItem.serialNumbers.length > 0 ? (
                          activeClaimItem.serialNumbers.join(', ')
                        ) : (
                          <span className="text-stone-400 italic font-mono font-normal">- Tanpa S/N -</span>
                        )}
                      </td>
                    </tr>

                    {/* Pembelian Client */}
                    <tr className="border-b border-stone-200">
                      <td className="py-2 font-bold font-sans uppercase text-slate-500">Tanggal Jual Toko</td>
                      <td className="py-2 font-mono text-stone-700">
                        {new Date(activeClaimItem.timestamp).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                        <span className="text-[9.5px] italic text-slate-450 ml-1.5 font-sans block mt-0.5">
                          (Invoice: {activeClaimItem.invoiceNo} • Pelanggan: {activeClaimItem.customerName})
                        </span>
                      </td>
                    </tr>

                    {/* Kerusakan Problem */}
                    <tr>
                      <td className="py-3 font-bold font-sans uppercase text-slate-500 valign-top align-top">Gejala Kerusakan</td>
                      <td className="py-3 font-sans font-bold text-rose-700 italic text-[11px] leading-relaxed bg-rose-50/40 p-2 rounded-lg border border-rose-100">
                        "{claimProblemDescription}"
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="grid grid-cols-2 text-center mt-8 pt-4 border-t border-dashed border-stone-300 text-[9.5px] font-sans text-stone-600 gap-4">
                  <div>
                    <p>Hormat kami,</p>
                    <p className="font-extrabold text-stone-900 mt-10">({userRole} / Teknisi)</p>
                    <p className="text-[8.5px] text-stone-400">{storeConfig.name}</p>
                  </div>
                  <div>
                    <p>Diterima oleh Supplier,</p>
                    <p className="font-semibold text-stone-400 mt-10">( ____________________ )</p>
                    <p className="text-[8.5px] text-stone-400">Tanda Tangan & Stempel</p>
                  </div>
                </div>

                {/* Print Warning notice */}
                <div className="mt-4 pt-2 border-t border-stone-200 text-center text-[8px] font-sans text-stone-400 italic leading-none">
                  Sistem Asosiasi Pricelist & Warranty Tracker terpadu oleh Torky POS.
                </div>
              </div>
            </div>

            {/* Print and Close Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2.5">
              <button
                onClick={() => {
                  setActiveClaimItem(null);
                  setClaimProblemDescription('Kerusakan hardware / Tidak mau menyala');
                }}
                className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
              >
                Tutup Sesi
              </button>
              <button
                onClick={() => window.print()}
                className="flex-[1.5] py-2 bg-slate-900 hover:bg-slate-800 text-teal-300 font-extrabold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer uppercase tracking-wider font-sans"
              >
                <Printer className="w-3.5 h-3.5 text-teal-300" /> Cetak Surat Klaim
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ADMIN PIN VERIFICATION DIALOG */}
      <AnimatePresence>
        {pinModalOpen && (
          <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 text-slate-800"
            >
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 border border-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-850 text-base">Otoritas Privilege Admin</h3>
                <p className="text-slate-500 text-xs mt-1">
                  Fitur ini dibatasi. Masukkan PIN Admin untuk melanjutkan otentikasi.
                </p>
                <div className="bg-amber-50 rounded-lg p-2 mt-2 border border-amber-100">
                  <p className="text-[10px] text-amber-700 font-semibold font-mono">
                    💡 PIN Default: <strong className="underline">admin</strong> atau <strong className="underline">1234</strong>
                  </p>
                </div>
              </div>

              <form onSubmit={verifyAdminPIN} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    PIN POS / PASSWORD ADMIN
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="password"
                      placeholder="Masukkan Kode Otoritas"
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        setPinError('');
                      }}
                      autoFocus
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl text-center text-sm tracking-widest font-mono select-none outline-none"
                    />
                  </div>
                  {pinError && (
                    <p className="text-rose-500 text-[10px] font-extrabold mt-1.5 text-center leading-tight">
                      ❌ {pinError}
                    </p>
                  )}
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPinModalOpen(false);
                      setPendingAction(null);
                    }}
                    className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs transition-colors shadow-md"
                  >
                    Otorisasi Admin
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
