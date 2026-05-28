import React, { useState, useMemo } from 'react';
import { Plus, Search, Calendar, Phone, Laptop, Wrench, ShieldAlert, ShoppingCart, User, Info, Check, Save, Trash2, KeyRound } from 'lucide-react';
import { RepairJob, Product, JobStatus, UserRole, Staff } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatIDR, formatWITA } from '../utils';

interface RepairJobsProps {
  jobs: RepairJob[];
  products: Product[];
  onAddJob: (job: RepairJob) => void;
  onUpdateJobStatus: (jobId: string, status: JobStatus) => void;
  onUpdateJobParts: (jobId: string, parts: { name: string; price: number }[]) => void;
  onTransferToPOS: (customerName: string, customerPhone: string, items: { product: Product; qty: number }[]) => void;
  onDeleteJob: (jobId: string) => void;
  onResetJobs: () => void;
  userRole?: UserRole;
  rolePins?: Record<UserRole, string>;
  staffs?: Staff[];
  storeConfig?: any;
}

export default function RepairJobs({
  jobs,
  products,
  onAddJob,
  onUpdateJobStatus,
  onUpdateJobParts,
  onTransferToPOS,
  onDeleteJob,
  onResetJobs,
  userRole = 'Kasir',
  rolePins,
  staffs = [],
  storeConfig,
}: RepairJobsProps) {
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | 'All'>('All');

  // Form State for creating a new repair job ticket
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [issue, setIssue] = useState('');
  const [laborCost, setLaborCost] = useState<string>('150000'); // Default professional IDR
  const [notes, setNotes] = useState('');

  // Selected repair for detailed preview / edit modal
  const [activeJob, setActiveJob] = useState<RepairJob | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  // Parts association flow
  const [selectedPartId, setSelectedPartId] = useState('');

  // Admin PIN verification state
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete-job' | 'reset-all';
    jobId?: string;
  } | null>(null);

  const isBengkel = storeConfig?.businessSector === 'Services';
  const labelDeviceModel = isBengkel ? 'Tipe Kendaraan / Nama Obyek Jasa' : 'Device Hardware / Model';
  const placeholderDeviceModel = isBengkel ? 'e.g. Honda Vario 160 ABS, Toyota Avanza G, Yamaha NMAX' : 'e.g. ASUS ROG G14, Cisco Router, HDD WD 2TB, Server Xeon';
  const labelSerialNumber = isBengkel ? 'Plat Nomor / No. Rangka' : 'Serial Number (S/N)';
  const placeholderSerialNumber = isBengkel ? 'e.g. DK 1234 AB, No Rangka...' : 'e.g. L7N0CV01...';

  // List of hardware parts for dropdown selection
  const hardwareParts = useMemo(() => {
    return products.filter(p => p.category === 'Hardware Parts' && (p.stock === null || p.stock > 0));
  }, [products]);

  // Filters
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchStatus = selectedStatus === 'All' || job.status === selectedStatus;
      const matchSearch =
        job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.jobNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.deviceModel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [jobs, selectedStatus, searchQuery]);

  // Request admin PIN for action
  const requestAdminAction = (type: 'delete-job' | 'reset-all', jobId?: string) => {
    setPendingAction({ type, jobId });
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
      pinInput === '1234' || 
      activeAdminPins.includes(pinInput);

    if (isAuthorized) {
      // Success
      if (pendingAction) {
        if (pendingAction.type === 'delete-job' && pendingAction.jobId) {
          onDeleteJob(pendingAction.jobId);
          setActiveJob(null);
        } else if (pendingAction.type === 'reset-all') {
          onResetJobs();
          setActiveJob(null);
        }
      }
      setPinModalOpen(false);
      setPendingAction(null);
      setPinInput('');
    } else {
      setPinError('PIN Otoritas Khusus salah! Harap gunakan PIN Admin atau Super Admin Anda.');
    }
  };

  // Submission handler
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !deviceModel || !issue) return;

    const labor = parseFloat(laborCost) || 0;
    const newJob: RepairJob = {
      id: `job-${Date.now()}`,
      jobNo: `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      customerPhone,
      deviceModel,
      serialNumber: serialNumber || undefined,
      issue,
      status: 'In Queue',
      estimatedCost: labor,
      partsUsed: [],
      laborCost: labor,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddJob(newJob);

    // Reset Form
    setCustomerName('');
    setCustomerPhone('');
    setDeviceModel('');
    setSerialNumber('');
    setIssue('');
    setLaborCost('150000');
    setNotes('');
    setIsFormOpen(false);
  };

  // Add parts to active job
  const handleAddPartToJob = () => {
    if (!activeJob || !selectedPartId) return;

    const part = products.find(p => p.id === selectedPartId);
    if (!part) return;

    const updatedParts = [...activeJob.partsUsed, { name: part.name, price: part.price }];
    onUpdateJobParts(activeJob.id, updatedParts);

    // Sync activeJob view state
    setActiveJob({
      ...activeJob,
      partsUsed: updatedParts,
      estimatedCost: activeJob.laborCost + updatedParts.reduce((acc, c) => acc + c.price, 0)
    });
    setSelectedPartId('');
  };

  // Save temporary notes edits
  const handleSaveNotes = () => {
    if (!activeJob) return;
    activeJob.notes = tempNotes;
    setTempNotes('');
  };

  // Transition to POS helper
  const handleCheckoutPickup = (job: RepairJob) => {
    // Generate virtual products for checkout mapping:
    // 1. Labor cost as custom service
    const laborProduct: Product = {
      id: `labor-${job.id}`,
      name: `Jasa Servis & Lab (${job.deviceModel})`,
      category: 'Service & Repair',
      price: job.laborCost,
      cost: 0,
      stock: null,
      sku: `SRV-LAB-${job.jobNo}`,
      unit: 'job'
    };

    const checkoutItems: { product: Product; qty: number }[] = [
      { product: laborProduct, qty: 1 }
    ];

    // 2. Loop and map parts used
    job.partsUsed.forEach((part, index) => {
      const matchedCatalogProduct = products.find(p => p.name === part.name);
      const partProduct: Product = matchedCatalogProduct || {
        id: `part-${job.id}-${index}`,
        name: part.name,
        category: 'Hardware Parts',
        price: part.price,
        cost: part.price * 0.7,
        stock: null,
        sku: `HW-PART-${job.jobNo}`,
        unit: 'pcs'
      };

      checkoutItems.push({ product: partProduct, qty: 1 });
    });

    onTransferToPOS(job.customerName, job.customerPhone, checkoutItems);
    onUpdateJobStatus(job.id, 'Completed');
    setActiveJob(null);
  };

  const statuses: JobStatus[] = ['In Queue', 'Diagnosing', 'Awaiting Parts', 'In Progress', 'Ready for Pickup', 'Completed'];

  return (
    <div className="space-y-6">
      {/* Search and control Header bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search cases by customer name, ticket #, or device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl text-xs placeholder:text-slate-400 text-slate-800 outline-none"
          />
        </div>

        <div className="flex gap-2 items-center overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="All">All Milestones</option>
            {statuses.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          {jobs.length > 0 && (
            <button
              onClick={() => requestAdminAction('reset-all')}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-bold rounded-xl text-xs flex items-center gap-1 shrink-0"
              title="Reset data tiket"
            >
              <Trash2 className="w-3.5 h-3.5" /> Reset Tiket
            </button>
          )}

          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" /> Open Ticket
          </button>
        </div>
      </div>

      {/* Grid view of Active Jobs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.map((job) => {
          const partsCost = job.partsUsed.reduce((acc, c) => acc + c.price, 0);
          const totalEstimate = job.laborCost + partsCost;

          return (
            <motion.div
              key={job.id}
              onClick={() => {
                setActiveJob(job);
                setTempNotes(job.notes || '');
              }}
              className="p-4 bg-white border border-slate-100 hover:border-teal-500/40 hover:shadow-md rounded-2xl cursor-pointer transition-all space-y-3.5 flex flex-col justify-between"
              whileHover={{ y: -2 }}
            >
              {/* Card Header stats */}
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-0.5">
                  <span className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-wider">{job.jobNo}</span>
                  <h3 className="text-sm font-bold text-slate-800 truncate">{job.customerName}</h3>
                </div>
                {/* Status custom display badges */}
                <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                  job.status === 'Completed' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                  job.status === 'Ready for Pickup' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                  job.status === 'In Progress' ? 'bg-teal-100 text-teal-800 border-teal-200' :
                  job.status === 'Awaiting Parts' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                  job.status === 'Diagnosing' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  'bg-indigo-50 text-indigo-700 border-indigo-100'
                }`}>
                  {job.status}
                </span>
              </div>

              {/* Hardware diagnostics info body */}
              <div className="space-y-1 text-xs">
                <p className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{job.deviceModel}</span>
                </p>
                <p className="font-normal text-slate-500 line-clamp-2 leading-relaxed">
                  {job.issue}
                </p>
              </div>

              {/* Cost estimates & checkout links */}
              <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Est. Biaya</span>
                  <span className="text-sm font-black text-slate-900 font-mono">{formatIDR(totalEstimate)}</span>
                </div>

                <div className="flex gap-2 items-center">
                  {job.status === 'Ready for Pickup' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheckoutPickup(job);
                      }}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Ambil & Kasir
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-teal-600 flex items-center gap-0.5">
                      Lihat Details
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredJobs.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white border border-slate-100 rounded-2xl">
            <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium text-sm">No ticket matches your filter options.</p>
          </div>
        )}
      </div>

      {/* OVERLAY 1: Create New Repair Job Ticket Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-40 flex items-center justify-center p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center bg-slate-100/50">
              <h3 className="font-bold text-slate-850 text-sm">Open Service Ticket Baru</h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-700 w-6 h-6 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Nama Pelanggan *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Wayan Graham"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">No. HP / WA Pelanggan</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 081288118288"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">{labelDeviceModel} *</label>
                  <input
                    type="text"
                    required
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    placeholder={placeholderDeviceModel}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">{labelSerialNumber}</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder={placeholderSerialNumber}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  {isBengkel ? 'Kendala / Keluhan Kerusakan *' : 'Kendala Jasa IT / Deskripsi Kasus *'}
                </label>
                <textarea
                  required
                  rows={2}
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder={
                    isBengkel 
                      ? 'e.g. Ganti Oli Mesin & Filter, Tune Up, Rem bunyi berdecit, Ganti Rantai & Overhaul'
                      : 'e.g. Recovery Data 1.5TB HDD, Ganti RAM/SSD, Konfigurasi VPN/VLAN, Audit Keamanan Jaringan'
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    {isBengkel ? 'Jasa Mekanik / Bengkel (Rp)' : 'Jasa Teknisi & Lab (Rp)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Catatan Tambahan</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Kotor berdebu, pengerjaan prioritas..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-50 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-teal-400 font-bold shadow-md transition-allStep"
                >
                  Simpan & Buat Tiket
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* OVERLAY 2: Interactive Ticket Workspace / Detailed Diagnosis and Parts Addition Modal */}
      {activeJob && (
        <div className="fixed inset-0 bg-slate-950/80 z-40 flex items-center justify-center p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden text-slate-850 flex flex-col md:flex-row h-auto max-h-[90vh]"
          >
            {/* Left Column: Ticket Specifications details */}
            <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-slate-150 overflow-y-auto space-y-4">
              <div className="flex justify-between items-start gap-4 pb-2 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">{activeJob.jobNo}</span>
                  <h3 className="text-base font-bold text-slate-850">{activeJob.customerName}</h3>
                  {activeJob.customerPhone && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" /> {activeJob.customerPhone}
                    </p>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400 font-mono text-xs">
                  {formatWITA(activeJob.createdAt)}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  {isBengkel ? 'Informasi Objek Jasa' : 'Informasi Perangkat'}
                </span>
                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
                  {isBengkel ? <Wrench className="w-4 h-4 text-[#0d9488]" /> : <Laptop className="w-4 h-4 text-slate-400" />} {activeJob.deviceModel}
                </p>
                {activeJob.serialNumber && (
                  <p className="text-[10px] text-slate-500 font-mono">
                    {isBengkel ? 'Plat Nomor / S/N:' : 'S/N:'} {activeJob.serialNumber}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-bold text-rose-600">
                  {isBengkel ? 'Kendala / Keluhan Kerusakan' : 'Kendala Perangkat'}
                </span>
                <p className="text-xs bg-rose-50/20 text-slate-700 p-3 rounded-xl border border-rose-100/35">
                  {activeJob.issue}
                </p>
              </div>

              {/* Status Milestone updater */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Progres Pengerjaan</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {statuses.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onUpdateJobStatus(activeJob.id, st)}
                      className={`py-1.5 px-2.5 rounded-lg text-left text-[11px] font-semibold flex items-center justify-between border ${
                        activeJob.status === st
                          ? 'border-teal-500 bg-teal-50 text-teal-900 font-bold shadow-xs'
                          : 'border-slate-100 hover:border-slate-300 bg-white text-slate-650'
                      }`}
                    >
                      <span>{st}</span>
                      {activeJob.status === st && <Check className="w-3.5 h-3.5 text-teal-600 font-bold" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Parts additions and checkout links */}
            <div className="w-full md:w-80 p-5 bg-slate-50 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-100/30 p-1 rounded-md">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Rincian & Biaya Servis</h4>
                  <button onClick={() => setActiveJob(null)} className="text-slate-400 text-lg hover:text-slate-800 w-5 h-5 bg-slate-200/50 hover:bg-slate-205 rounded-full flex items-center justify-center font-bold text-xs">
                    ✕
                  </button>
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto text-xs bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <div className="flex justify-between pb-1.5 border-b border-slate-50 text-[11px] text-slate-400 font-semibold font-mono">
                    <span>Part/Service</span>
                    <span>Cost</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Jasa Servis & Lab</span>
                    <span>{formatIDR(activeJob.laborCost)}</span>
                  </div>
                  {activeJob.partsUsed.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600 text-[11px]">
                      <span className="truncate max-w-[130px]">{p.name}</span>
                      <span>{formatIDR(p.price)}</span>
                    </div>
                  ))}
                  {activeJob.partsUsed.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic text-center py-2">Belum ada pergantian sparepart</p>
                  )}
                  <div className="flex justify-between text-bold text-teal-800 font-mono font-bold border-t border-slate-105 pt-1.5 mt-1">
                    <span>Estimasi Biaya</span>
                    <span>{formatIDR(activeJob.estimatedCost)}</span>
                  </div>
                </div>

                {/* Add hardware parts selector drops */}
                {activeJob.status !== 'Completed' && (
                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Pasang Suku Cadang (Hardware)
                    </label>
                    <div className="flex gap-1.5">
                      <select
                        value={selectedPartId}
                        onChange={(e) => setSelectedPartId(e.target.value)}
                        className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-1.5 max-w-[160px] outline-none"
                      >
                        <option value="">Pilih Part...</option>
                        {hardwareParts.map((hp) => (
                          <option key={hp.id} value={hp.id}>
                            {hp.name} ({formatIDR(hp.price)})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddPartToJob}
                        disabled={!selectedPartId}
                        className="px-2.5 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-100 disabled:text-slate-400 text-slate-950 rounded-lg text-xs font-semibold disabled:cursor-not-allowed transition-all"
                      >
                        Pasang
                      </button>
                    </div>
                  </div>
                )}

                {/* Internal notes board */}
                <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Catatan Teknisi</span>
                  <textarea
                    rows={2}
                    placeholder="Masukkan update servis..."
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-lg p-1.5 text-[11px] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="w-full py-1 text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-all flex items-center justify-center gap-1"
                  >
                    <Save className="w-3 h-3" /> Simpan Catatan
                  </button>
                </div>
              </div>

              {/* Fulfill actions container & Delete Job Trigger */}
              <div className="pt-4 border-t border-slate-200 mt-4 space-y-2">
                {activeJob.status === 'Ready for Pickup' ? (
                  <button
                    onClick={() => handleCheckoutPickup(activeJob)}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" /> Ambil & Selesaikan Pembayaran POS
                  </button>
                ) : (
                  <p className="text-[10px] text-slate-400 bg-slate-100/50 p-2.5 rounded-lg text-center leading-relaxed font-semibold">
                    Saat status berpindah ke <strong>"Ready for Pickup"</strong>, tombol Kasir akan muncul untuk pembayaran langsung ke POS.
                  </p>
                )}

                <button
                  onClick={() => requestAdminAction('delete-job', activeJob.id)}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Tiket Servis (Admin Only)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ADMIN PIN VERIFICATION DIALOG */}
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
                  Fitur ini dibatasi untuk akun Administrator. Masukkan kode otentikasi.
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
