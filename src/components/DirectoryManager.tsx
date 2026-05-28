import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Trash2, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  Mail, 
  CreditCard, 
  Building2, 
  Store, 
  User as UserIcon, 
  Edit3, 
  ShieldAlert, 
  KeyRound, 
  CheckCircle2, 
  Briefcase,
  Layers, 
  Tag
} from 'lucide-react';
import { Customer, Supplier, CustomerType, UserRole, Staff } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatIDR } from '../utils';

interface DirectoryManagerProps {
  customers: Customer[];
  suppliers: Supplier[];
  staffs?: Staff[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customerId: string, updatedCustomer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplierId: string, updatedSupplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
  onAddStaff?: (staff: Staff) => void;
  onUpdateStaff?: (staffId: string, updatedStaff: Staff) => void;
  onDeleteStaff?: (staffId: string) => void;
  onResetDirectory: () => void;
  onResetStaffs?: () => void;
  onResetCustomers?: () => void;
  onResetSuppliers?: () => void;
  userRole?: UserRole;
  rolePins?: Record<UserRole, string>;
  storeConfig?: any;
}

export default function DirectoryManager({
  customers,
  suppliers,
  staffs = [],
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onAddStaff = () => {},
  onUpdateStaff = () => {},
  onDeleteStaff = () => {},
  onResetDirectory,
  onResetStaffs,
  onResetCustomers,
  onResetSuppliers,
  userRole = 'Kasir',
  rolePins,
  storeConfig,
}: DirectoryManagerProps) {
  const [activeSegment, setActiveSegment] = useState<'customers' | 'suppliers' | 'staffs'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<CustomerType | 'All'>('All');

  const getRoleLabel = (role: string) => {
    const sector = storeConfig?.businessSector || 'Electronics';
    if (role === 'Teknisi') {
      if (sector === 'Services') return 'Teknisi / Mekanik';
      if (sector === 'Electronics') return 'Teknisi IT / Servis';
      return 'Teknisi / Mekanik';
    }
    return role;
  };

  // Customer Form Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('Pribadi');
  const [customerDiscount, setCustomerDiscount] = useState<number>(0);
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Supplier Form Modal State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierProductLine, setSupplierProductLine] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');

  // Staff Form Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('Kasir');
  const [staffStatus, setStaffStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');

  // Admin PIN verification
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete-customer' | 'delete-supplier' | 'delete-staff' | 'reset-all' | 'reset-staffs' | 'reset-customers' | 'reset-suppliers';
    id?: string;
  } | null>(null);

  // Auto set recommended discount percent when Customer Type changes in modal
  const handleTypeChange = (type: CustomerType) => {
    setCustomerType(type);
    if (type === 'Pribadi') {
      setCustomerDiscount(0);
    } else if (type === 'Perusahaan') {
      setCustomerDiscount(5); // Default Corporate B2B standard 5%
    } else if (type === 'Sesama Toko') {
      setCustomerDiscount(10); // Default Reseller Partner 10%
    }
  };

  // Open Add/Edit Customer modal
  const openCustomerModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone);
      setCustomerEmail(customer.email || '');
      setCustomerAddress(customer.address || '');
      setCustomerType(customer.type);
      setCustomerDiscount(customer.discountPercent);
      setCustomerCompany(customer.companyName || '');
      setCustomerNotes(customer.notes || '');
    } else {
      setEditingCustomer(null);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      setCustomerType('Pribadi');
      setCustomerDiscount(0);
      setCustomerCompany('');
      setCustomerNotes('');
    }
    setIsCustomerModalOpen(true);
  };

  // Open Add/Edit Supplier modal
  const openSupplierModal = (supplier?: Supplier) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
      alert("Akses Terbatas: Hanya Akun Owner/Admin yang disahkan untuk mengedit atau menambahkan data supplier!");
      return;
    }
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierName(supplier.name);
      setSupplierPhone(supplier.phone);
      setSupplierContact(supplier.contactPerson || '');
      setSupplierAddress(supplier.address || '');
      setSupplierProductLine(supplier.productLine || '');
      setSupplierEmail(supplier.email || '');
    } else {
      setEditingSupplier(null);
      setSupplierName('');
      setSupplierPhone('');
      setSupplierContact('');
      setSupplierAddress('');
      setSupplierProductLine('');
      setSupplierEmail('');
    }
    setIsSupplierModalOpen(true);
  };

  // Open Add/Edit Staff modal
  const openStaffModal = (staff?: Staff) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
      alert("Akses Terbatas: Hanya Akun Owner/Admin yang disahkan untuk mengelola database staff!");
      return;
    }
    if (staff) {
      setEditingStaff(staff);
      setStaffName(staff.name);
      setStaffPhone(staff.phone || '');
      setStaffPin(staff.pin);
      setStaffRole(staff.role);
      setStaffStatus(staff.status);
    } else {
      setEditingStaff(null);
      setStaffName('');
      setStaffPhone('');
      setStaffPin('');
      setStaffRole('Kasir');
      setStaffStatus('Aktif');
    }
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffPin) {
      alert("Semua kolom bertanda bintang wajib diisi!");
      return;
    }
    if (staffPin.length < 4) {
      alert("Format PIN harus berupa 4 digit angka!");
      return;
    }

    const payload: Staff = {
      id: editingStaff ? editingStaff.id : `staff-${Date.now()}`,
      name: staffName,
      phone: staffPhone,
      pin: staffPin,
      role: staffRole,
      status: staffStatus,
    };

    if (editingStaff) {
      onUpdateStaff(editingStaff.id, payload);
    } else {
      onAddStaff(payload);
    }
    setIsStaffModalOpen(false);
  };

  // Request Admin Action
  const requestAdminAction = (type: 'delete-customer' | 'delete-supplier' | 'delete-staff' | 'reset-all' | 'reset-staffs' | 'reset-customers' | 'reset-suppliers', id?: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
      alert(`Akses Ditolak: Hanya Akun Owner/Admin yang disahkan untuk melakukan penghapusan data atau reset database!`);
      return;
    }
    setPendingAction({ type, id });
    setPinInput('');
    setPinError('');
    setPinModalOpen(true);
  };

  const handleVerifyPIN = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate against registered active Admin / Super Admin PINs or basic overrides
    const activeAdminPins = staffs
      .filter((s) => (s.role === 'Super Admin' || s.role === 'Admin') && s.status === 'Aktif')
      .map((s) => s.pin);

    const adminPin = rolePins ? rolePins['Admin'] : '8888';
    const superAdminPin = rolePins ? rolePins['Super Admin'] : '9999';

    const isAuthorized = 
      pinInput === adminPin || 
      pinInput === superAdminPin ||
      pinInput === 'admin' || 
      pinInput === '1234' || 
      activeAdminPins.includes(pinInput);

    if (isAuthorized) {
      if (pendingAction) {
        if (pendingAction.type === 'delete-customer' && pendingAction.id) {
          onDeleteCustomer(pendingAction.id);
        } else if (pendingAction.type === 'delete-supplier' && pendingAction.id) {
          onDeleteSupplier(pendingAction.id);
        } else if (pendingAction.type === 'delete-staff' && pendingAction.id) {
          onDeleteStaff(pendingAction.id);
        } else if (pendingAction.type === 'reset-all') {
          onResetDirectory();
        } else if (pendingAction.type === 'reset-staffs') {
          onResetStaffs?.();
        } else if (pendingAction.type === 'reset-customers') {
          onResetCustomers?.();
        } else if (pendingAction.type === 'reset-suppliers') {
          onResetSuppliers?.();
        }
      }
      setPinModalOpen(false);
      setPendingAction(null);
      setPinInput('');
    } else {
      setPinError('PIN Otoritas salah! Sila gunakan PIN dari salah satu akun Admin/Super Admin Anda.');
    }
  };

  // Submit Customer Form
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;

    const payload: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      name: customerName,
      phone: customerPhone,
      email: customerEmail || undefined,
      address: customerAddress || undefined,
      type: customerType,
      discountPercent: customerDiscount,
      companyName: customerType === 'Perusahaan' ? customerCompany : undefined,
      notes: customerNotes || undefined,
    };

    if (editingCustomer) {
      onUpdateCustomer(editingCustomer.id, payload);
    } else {
      onAddCustomer(payload);
    }
    setIsCustomerModalOpen(false);
  };

  // Submit Supplier Form
  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !supplierPhone) return;

    const payload: Supplier = {
      id: editingSupplier ? editingSupplier.id : `sup-${Date.now()}`,
      name: supplierName,
      phone: supplierPhone,
      contactPerson: supplierContact || undefined,
      address: supplierAddress || undefined,
      productLine: supplierProductLine || undefined,
      email: supplierEmail || undefined,
    };

    if (editingSupplier) {
      onUpdateSupplier(editingSupplier.id, payload);
    } else {
      onAddSupplier(payload);
    }
    setIsSupplierModalOpen(false);
  };

  // Filter lists
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch = 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.companyName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchType = filterType === 'All' || c.type === filterType;
      return matchSearch && matchType;
    });
  }, [customers, searchQuery, filterType]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      return (
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.contactPerson?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (s.productLine?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      );
    });
  }, [suppliers, searchQuery]);

  const filteredStaffs = useMemo(() => {
    return staffs.filter((st) => {
      return (
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (st.phone && st.phone.includes(searchQuery)) ||
        st.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [staffs, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Directory Segments Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex flex-wrap bg-slate-55 border border-slate-150 rounded-xl p-0.5 shadow-inner">
          <button
            onClick={() => {
              setActiveSegment('customers');
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSegment === 'customers' 
                ? 'bg-teal-500 text-slate-950 shadow-md scale-102 font-extrabold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Klien & Pelanggan
          </button>
          <button
            onClick={() => {
              setActiveSegment('suppliers');
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSegment === 'suppliers' 
                ? 'bg-teal-500 text-slate-950 shadow-md scale-102 font-extrabold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Daftar Supplier (Pemasok)
          </button>
          {(userRole === 'Super Admin' || userRole === 'Admin') && (
            <button
              onClick={() => {
                setActiveSegment('staffs');
                setSearchQuery('');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSegment === 'staffs' 
                  ? 'bg-teal-500 text-slate-950 shadow-md scale-102 font-extrabold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              👥 Staff/Kasir & Otorisasi
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeSegment === 'customers' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => openCustomerModal()}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 text-center"
              >
                <Plus className="w-4 h-4" /> Tambah Klien
              </button>
              {userRole === 'Super Admin' && (
                <button
                  type="button"
                  onClick={() => requestAdminAction('reset-customers')}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  title="Hapus Masal Seluruh Kontak Pelanggan"
                >
                  ⚙️ Reset Masal Pelanggan
                </button>
              )}
            </div>
          )}
          {activeSegment === 'suppliers' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => openSupplierModal()}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 text-center"
              >
                <Plus className="w-4 h-4" /> Tambah Supplier
              </button>
              {userRole === 'Super Admin' && (
                <button
                  type="button"
                  onClick={() => requestAdminAction('reset-suppliers')}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  title="Hapus Masal Seluruh Kontak Supplier"
                >
                  ⚙️ Reset Masal Supplier
                </button>
              )}
            </div>
          )}
          {activeSegment === 'staffs' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => openStaffModal()}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Registrasi Akun Staff baru
              </button>
              {userRole === 'Super Admin' && (
                <button
                  type="button"
                  onClick={() => requestAdminAction('reset-staffs')}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  title="Mulai Setup Ulang & Bersihkan Database Staff"
                >
                  ⚙️ Reset Database Staff / Setup Awal
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Directory Search & Filters Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder={
              activeSegment === 'customers' 
                ? "Cari pelanggan berdasarkan nama, telepon, atau nama perusahaan..."
                : activeSegment === 'suppliers'
                ? "Cari supplier berdasarkan nama, kontak, atau merek produk..."
                : "Cari nomor HP, peran jabatan, atau nama lengkap staff..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl text-xs text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>

        {activeSegment === 'customers' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block sm:inline">Klasifikasi:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="All">Semua Kategori</option>
              <option value="Pribadi">Pribadi (Standard)</option>
              <option value="Perusahaan">Perusahaan (Diskon 5%)</option>
              <option value="Sesama Toko">Sesama Toko (Reseller 10%)</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Grid Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeSegment === 'customers' ? (
          filteredCustomers.map((cust) => (
            <motion.div
              key={cust.id}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-teal-500/30 transition-all flex flex-col justify-between"
              whileHover={{ y: -2 }}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-2">
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate flex items-center gap-1.5">
                      {cust.type === 'Perusahaan' ? (
                        <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
                      ) : cust.type === 'Sesama Toko' ? (
                        <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                      )}
                      <span>{cust.name}</span>
                    </h3>
                    {cust.companyName && (
                      <p className="text-[10px] text-slate-400 font-mono tracking-wide truncate">
                        🏢 {cust.companyName}
                      </p>
                    )}
                  </div>

                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    cust.type === 'Perusahaan' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                    cust.type === 'Sesama Toko' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    'bg-indigo-50 text-indigo-750 border-indigo-100'
                  }`}>
                    {cust.type === 'Pribadi' ? 'Pribadi' : cust.type === 'Sesama Toko' ? 'Reseller Partner' : 'Korporat'}
                  </span>
                </div>

                {/* Sub details */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {cust.phone}
                  </p>
                  {cust.email && (
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {cust.email}
                    </p>
                  )}
                  {cust.address && (
                    <p className="flex items-start gap-1.5 text-[11px] leading-snug">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{cust.address}</span>
                    </p>
                  )}
                  {cust.notes && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                      💡 {cust.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Tier discounts and control buttons */}
              <div className="border-t border-slate-50 pt-3 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-100 px-2 py-1 rounded-lg">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[9.5px] font-black font-mono">Auto Diskon: {cust.discountPercent}%</span>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => openCustomerModal(cust)}
                    className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Edit Klien"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => requestAdminAction('delete-customer', cust.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition-colors"
                    title="Hapus Klien"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : activeSegment === 'suppliers' ? (
          filteredSuppliers.map((sup) => (
            <motion.div
              key={sup.id}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-teal-500/30 transition-all flex flex-col justify-between"
              whileHover={{ y: -2 }}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-2">
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>{sup.name}</span>
                    </h3>
                    {sup.contactPerson && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                        PIC: {sup.contactPerson}
                      </p>
                    )}
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded">
                    SUPPLIER
                  </span>
                </div>

                {/* Sub details */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {sup.phone}
                  </p>
                  {sup.email && (
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {sup.email}
                    </p>
                  )}
                  {sup.address && (
                    <p className="flex items-start gap-1.5 text-[11px] leading-snug">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{sup.address}</span>
                    </p>
                  )}
                  {sup.productLine && (
                    <div className="bg-purple-50/20 text-purple-900 border border-purple-100/35 p-2 rounded-xl text-[11px] mt-2">
                      <h4 className="font-bold text-[9px] uppercase text-purple-700 tracking-wider mb-0.5">Lini Pasokan:</h4>
                      <p className="leading-tight font-medium">{sup.productLine}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="border-t border-slate-50 pt-2.5 mt-4 flex justify-end">
                <div className="flex gap-1">
                  <button
                    onClick={() => openSupplierModal(sup)}
                    className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Edit Supplier"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => requestAdminAction('delete-supplier', sup.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          filteredStaffs.map((st) => (
            <motion.div
              key={st.id}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-teal-500/30 transition-all flex flex-col justify-between"
              whileHover={{ y: -2 }}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-2">
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate flex items-center gap-1.5">
                      <UserIcon className="w-4 h-4 text-indigo-655 shrink-0" />
                      <span>{st.name}</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      💼 Jabatan: {getRoleLabel(st.role)}
                    </p>
                  </div>
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    st.status === 'Aktif' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {st.status === 'Aktif' ? '🟢 Aktif' : '🔴 Nonaktif'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {st.phone || '-'}
                  </p>
                  <div className="font-sans text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-150 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold font-mono flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-teal-600" /> PIN Personal:
                      </span>
                      <strong className="text-teal-650 text-xs font-mono tracking-widest bg-white outline-none border border-slate-200 px-2 py-0.5 rounded-md shadow-xs">{st.pin}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="border-t border-slate-50 pt-2.5 mt-4 flex justify-end">
                <div className="flex gap-1">
                  <button
                    onClick={() => openStaffModal(st)}
                    className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Edit Profil Staff"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => requestAdminAction('delete-staff', st.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition-colors"
                    title="Hapus Staff"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Empty state views */}
      {((activeSegment === 'customers' && filteredCustomers.length === 0) ||
        (activeSegment === 'suppliers' && filteredSuppliers.length === 0) ||
        (activeSegment === 'staffs' && filteredStaffs.length === 0)) && (
        <div className="col-span-full py-16 text-center bg-white border border-slate-100 rounded-2xl shadow-xs animate-fadeIn">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-bold text-sm">Belum ada data yang tersimpan.</p>
          <p className="text-xs text-slate-400 mt-1">Gunakan tombol Tambah / Registrasi di atas untuk melengkapi database.</p>
        </div>
      )}

      {/* OVERLAY 1: CUSTOMER CREATION / EDIT MODAL */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-40 flex items-center justify-center p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center bg-slate-100/50">
              <h3 className="font-bold text-slate-850 text-sm">
                {editingCustomer ? 'Edit Data Klien Pelanggan' : 'Daftar Klien Baru'}
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 w-6 h-6 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Nama Lengkap Klien *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Made Aryawan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">No. HP / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 0812345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Klasifikasi Klien</label>
                  <select
                    value={customerType}
                    onChange={(e) => handleTypeChange(e.target.value as CustomerType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  >
                    <option value="Pribadi">Pribadi (Standard)</option>
                    <option value="Perusahaan">Perusahaan (Korporat)</option>
                    <option value="Sesama Toko">Sesama Toko (Reseller B2B)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Auto Diskon Harga (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={customerDiscount}
                    onChange={(e) => setCustomerDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Email (Opsional)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. hello@domain.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              {customerType === 'Perusahaan' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Nama Perusahaan / Institusi *</label>
                  <input
                    type="text"
                    required={customerType === 'Perusahaan'}
                    value={customerCompany}
                    onChange={(e) => setCustomerCompany(e.target.value)}
                    placeholder="e.g. PT. Bali Solusindo Utama"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Alamat Lengkap</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="e.g. Jl. Teuku Umar Gg. IV, Denpasar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Catatan Internal / Keterangan</label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="e.g. Sering pesan borongan, pembayaran jatuh tempo 14 hari..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 bg-slate-50 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-teal-400 shadow-md font-extrabold"
                >
                  Simpan Klien
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* OVERLAY 2: SUPPLIER CREATION / EDIT MODAL */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-40 flex items-center justify-center p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center bg-slate-100/50">
              <h3 className="font-bold text-slate-850 text-sm">
                {editingSupplier ? 'Edit Data Supplier' : 'Daftar Supplier Baru'}
              </h3>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 w-6 h-6 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto pr-2 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Nama Supplier / Perusahaan B2B *</label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. PT. Synnex Metrodata Indonesia"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Kontak Telepon / Fax *</label>
                  <input
                    type="tel"
                    required
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    placeholder="e.g. 02129345800"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Nama PIC / Contact Person</label>
                  <input
                    type="text"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                    placeholder="e.g. Dewa Putu"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Email Supplier</label>
                  <input
                    type="email"
                    value={supplierEmail}
                    onChange={(e) => setSupplierEmail(e.target.value)}
                    placeholder="e.g. sales@synnex.co.id"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Fokus Lini Pasokan Barang / Brand</label>
                <input
                  type="text"
                  value={supplierProductLine}
                  onChange={(e) => setSupplierProductLine(e.target.value)}
                  placeholder="e.g. spareparts AMD, ASUS Motherboard, Redragon Keyboard..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Alamat Gudang / Hub Supplier</label>
                <input
                  type="text"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  placeholder="e.g. Kompleks Hub Bali, Sunset Road No. 10B, Badung"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 bg-slate-50 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-teal-400 shadow-md font-extrabold"
                >
                  Simpan Supplier
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* OVERLAY 3: STAFF CREATION / EDIT MODAL */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-40 flex items-center justify-center p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center bg-slate-100/50">
              <h3 className="font-bold text-slate-850 text-sm">
                {editingStaff ? 'Edit Profil Anggota Staff' : 'Registrasi Akun Staff Baru'}
              </h3>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 w-6 h-6 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Nama Lengkap Staff *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Budi Santoso"
                  className="w-full px-3 py-2 bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 outline-none focus:border-teal-500 focus:bg-white transition-all font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Nomor Telepon / WA (Aktif)</label>
                <input
                  type="tel"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="e.g. 08123456789"
                  className="w-full px-3 py-2 bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 outline-none focus:border-teal-500 focus:bg-white transition-all font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 font-sans">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Otorisasi Peran *</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-850 text-xs font-semibold rounded-xl border border-slate-200 outline-none focus:border-teal-500 focus:bg-white transition-all"
                  >
                    <option value="Super Admin">👑 Super Admin</option>
                    <option value="Admin">🛡️ Admin</option>
                    <option value="Kasir">💼 Kasir</option>
                    {(() => {
                      const sector = storeConfig?.businessSector || 'Electronics';
                      const type = storeConfig?.businessType || 'pos_services';
                      const hasRepair = sector === 'Electronics' ? (type !== 'pos_only') : (sector === 'Services' ? (type !== 'pos_only') : false);
                      if (hasRepair) {
                        return <option value="Teknisi">🔧 {getRoleLabel('Teknisi')}</option>;
                      }
                      return null;
                    })()}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Status Keaktifan *</label>
                  <select
                    value={staffStatus}
                    onChange={(e) => setStaffStatus(e.target.value as 'Aktif' | 'Nonaktif')}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-850 text-xs font-semibold rounded-xl border border-slate-200 outline-none focus:border-teal-500 focus:bg-white transition-all"
                  >
                    <option value="Aktif">🟢 Aktif (Bisa Login)</option>
                    <option value="Nonaktif">🔴 Dinonaktifkan</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 font-sans">
                <label className="text-[10px] font-bold uppercase text-slate-500">Sandi PIN Personal (4 Digit Angka) *</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  pattern="[0-9]{4}"
                  value={staffPin}
                  onChange={(e) => setStaffPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 1945"
                  className="w-full px-3 py-2 bg-slate-50 text-slate-800 text-xs font-black tracking-widest text-center rounded-xl border border-slate-200 outline-none focus:border-teal-500 focus:bg-white transition-all font-mono"
                />
                <p className="text-[9px] text-slate-400">PIN personal digunakan staff untuk otentikasi login masuk terminal POS.</p>
              </div>

              <div className="flex gap-3 pt-3 font-sans">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-md"
                >
                  {editingStaff ? 'Simpan Perubahan' : 'Registrasi Akun'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ADMIN PRIVILEGE verification OVERLAY */}
      <AnimatePresence>
        {pinModalOpen && (
          <div className="fixed inset-0 bg-slate-950/90 z-55 flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 text-slate-800"
            >
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 border border-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-850 text-base">Otoritas Privilege Admin</h3>
                <p className="text-slate-500 text-xs mt-1">
                  Fitur penghapusan dibatasi untuk Admin. Masukkan kode otentikasi.
                </p>
                <div className="bg-amber-50 rounded-lg p-2 mt-2 border border-amber-100">
                  <p className="text-[10px] text-amber-700 font-semibold font-mono">
                    💡 PIN Default: <strong className="underline">admin</strong> atau <strong className="underline">1234</strong>
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerifyPIN} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    PASSWORD / PIN ADMIN
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
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl text-center text-sm tracking-widest font-mono outline-none"
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
