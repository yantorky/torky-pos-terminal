import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Monitor,
  Layers,
  ShoppingCart,
  RefreshCw,
  Trash2,
  Printer,
  Plus,
  Minus,
  AlertCircle,
  Check,
  Search,
  Share2,
  MessageSquare,
  FileText,
  Keyboard,
  Mouse,
  Zap
} from 'lucide-react';
import { Product, CartItem } from '../types';
import { formatIDR } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

interface PCSimulatorProps {
  products: Product[];
  onTransferToPOS: (customerName: string, customerPhone: string, items: { product: Product; qty: number }[]) => void;
}

interface SpecSlot {
  id: string;
  name: string;
  icon: any;
  estWatts: number;
  filter: (p: Product) => boolean;
}

export default function PCSimulator({ products, onTransferToPOS }: PCSimulatorProps) {
  // Define custom PC assembly slots for Torky Komputer
  const SLOTS: SpecSlot[] = [
    {
      id: 'processor',
      name: 'Processor (CPU)',
      icon: Cpu,
      estWatts: 125,
      filter: (p) => p.category === 'Hardware Parts' && (p.subCategory === 'Processor' || p.name.toLowerCase().includes('core i') || p.name.toLowerCase().includes('ryzen')),
    },
    {
      id: 'motherboard',
      name: 'Motherboard (Mainboard)',
      icon: Layers,
      estWatts: 45,
      filter: (p) => p.category === 'Hardware Parts' && (p.subCategory === 'Motherboard' || p.name.toLowerCase().includes('motherboard') || p.name.toLowerCase().includes('board') || p.name.toLowerCase().includes('lga') || p.name.toLowerCase().includes('b760') || p.name.toLowerCase().includes('b650') || p.name.toLowerCase().includes('h610')),
    },
    {
      id: 'ram',
      name: 'Memory (RAM)',
      icon: Layers,
      estWatts: 10,
      filter: (p) => p.category === 'Hardware Parts' && (p.subCategory === 'RAM' || p.name.toLowerCase().includes('ram') || p.name.toLowerCase().includes('ddr4') || p.name.toLowerCase().includes('ddr5') || p.name.toLowerCase().includes('sodimm')),
    },
    {
      id: 'storage',
      name: 'Storage (SSD / M.2 / HDD)',
      icon: Layers,
      estWatts: 10,
      filter: (p) => p.category === 'Hardware Parts' && (p.subCategory === 'Storage' || p.name.toLowerCase().includes('ssd') || p.name.toLowerCase().includes('nvme') || p.name.toLowerCase().includes('sata') || p.name.toLowerCase().includes('hdd') || p.name.toLowerCase().includes('barracuda') || p.name.toLowerCase().includes('seagate') || p.name.toLowerCase().includes('wd ')),
    },
    {
      id: 'graphics',
      name: 'Graphics Card (GPU)',
      icon: Layers,
      estWatts: 250,
      filter: (p) => p.category === 'Hardware Parts' && (p.subCategory === 'Graphics Card' || p.name.toLowerCase().includes('rtx') || p.name.toLowerCase().includes('gtx') || p.name.toLowerCase().includes('radeon') || p.name.toLowerCase().includes('gpu') || p.name.toLowerCase().includes('graphics') || p.name.toLowerCase().includes('rx ')),
    },
    {
      id: 'psu',
      name: 'Power Supply (PSU)',
      icon: Cpu,
      estWatts: 0, // PSU supplies power, doesn't consume it
      filter: (p) => p.category === 'Hardware Parts' && (p.subCategory === 'Power Supply' || p.name.toLowerCase().includes('psu') || p.name.toLowerCase().includes('power supply') || p.name.toLowerCase().includes('watt') || p.name.toLowerCase().includes('80+') || p.name.toLowerCase().includes('bronze') || p.name.toLowerCase().includes('gold fully')),
    },
    {
      id: 'casing',
      name: 'Case / Casing (Chassis)',
      icon: Layers,
      estWatts: 5,
      filter: (p) => p.category === 'Hardware Parts' && (p.subCategory === 'Casing' || p.name.toLowerCase().includes('case') || p.name.toLowerCase().includes('casing') || p.name.toLowerCase().includes('chassis') || p.name.toLowerCase().includes('paradox') || p.name.toLowerCase().includes('montech')),
    },
    {
      id: 'cooler',
      name: 'CPU Cooler / Fan',
      icon: Cpu,
      estWatts: 15,
      filter: (p) => p.category === 'Hardware Parts' && (p.subCategory === 'Cooler' || p.name.toLowerCase().includes('cooler') || p.name.toLowerCase().includes('fan') || p.name.toLowerCase().includes('liquid') || p.name.toLowerCase().includes('heatsink') || p.name.toLowerCase().includes('deepcool')),
    },
    {
      id: 'monitor',
      name: 'Monitor Display',
      icon: Monitor,
      estWatts: 35,
      filter: (p) => p.category === 'Accessories' && (p.subCategory === 'Monitor' || p.name.toLowerCase().includes('monitor') || p.name.toLowerCase().includes('display') || p.name.toLowerCase().includes('inch') || p.name.toLowerCase().includes('samsung') || p.name.toLowerCase().includes('asus')),
    },
    {
      id: 'ups',
      name: 'UPS (Power Saver Backup)',
      icon: Zap,
      estWatts: 0, // UPS bridges lines, doesn't add power burden
      filter: (p) => p.category === 'Accessories' && (p.subCategory === 'UPS' || p.name.toLowerCase().includes('ups') || p.name.toLowerCase().includes('apc') || p.name.toLowerCase().includes('ica')),
    },
    {
      id: 'keyboard',
      name: 'Keyboard',
      icon: Keyboard,
      estWatts: 2,
      filter: (p) => p.category === 'Accessories' && (p.subCategory === 'Keyboard' || p.name.toLowerCase().includes('keyboard') || p.name.toLowerCase().includes('k120') || p.name.toLowerCase().includes('redragon')),
    },
    {
      id: 'mouse',
      name: 'Mouse',
      icon: Mouse,
      estWatts: 2,
      filter: (p) => p.category === 'Accessories' && (p.subCategory === 'Mouse' || p.name.toLowerCase().includes('mouse') || p.name.toLowerCase().includes('g305') || p.name.toLowerCase().includes('deathadder')),
    },
    {
      id: 'accessories',
      name: 'Aksesoris / Lain-lain',
      icon: Layers,
      estWatts: 5,
      filter: (p) => p.category === 'Accessories' && !['Monitor', 'UPS', 'Keyboard', 'Mouse'].includes(p.subCategory || ''),
    },
    {
      id: 'software',
      name: 'Sistem Operasi / Software',
      icon: FileText,
      estWatts: 0,
      filter: (p) => p.category === 'Software',
    }
  ];

  // User-configured simulation selections
  // format: { [slotId]: { product: Product, quantity: number } }
  const [selections, setSelections] = useState<{ [key: string]: { product: Product; quantity: number } }>({});

  // Dynamic custom slots state for custom peripherals
  const [customSlots, setCustomSlots] = useState<SpecSlot[]>([]);
  const [customSlotNameInput, setCustomSlotNameInput] = useState('');

  // Ad-hoc manual item inputs
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemPrice, setManualItemPrice] = useState('');
  const [manualItemWatts, setManualItemWatts] = useState('5');

  // Combine default standard slots with custom user-added accessory slots
  const allSlots = useMemo(() => {
    return [...SLOTS, ...customSlots];
  }, [customSlots]);

  const handleCreateCustomSlot = () => {
    if (!customSlotNameInput.trim()) return;
    const newSlotId = `custom_${Date.now()}`;
    const newSlot: SpecSlot = {
      id: newSlotId,
      name: customSlotNameInput.trim(),
      icon: Layers,
      estWatts: 5,
      filter: (p) => true, // custom slots allow searching anything in the catalog! Highly flexible.
    };
    setCustomSlots((prev) => [...prev, newSlot]);
    setCustomSlotNameInput('');
  };

  const handleDeleteCustomSlot = (slotId: string) => {
    setCustomSlots((prev) => prev.filter((s) => s.id !== slotId));
    setSelections((prev) => {
      const safe = { ...prev };
      delete safe[slotId];
      return safe;
    });
  };

  const handleCreateManualItem = () => {
    if (!manualItemName.trim() || !manualItemPrice) return;
    const newSlotId = `custom_${Date.now()}`;
    const priceNum = parseFloat(manualItemPrice) || 0;
    const wattNum = parseInt(manualItemWatts) || 0;

    // Create an ad-hoc custom product description
    const dummyProduct: Product = {
      id: `manual_${Date.now()}`,
      name: manualItemName.trim(),
      sku: 'CUSTOM-ITEM',
      category: 'Accessories',
      price: priceNum,
      cost: Math.round(priceNum * 0.8), // general cost estimation
      stock: 99,
      unit: 'pcs',
    };

    const newSlot: SpecSlot = {
      id: newSlotId,
      name: `Kustom: ${manualItemName.trim()}`,
      icon: Layers,
      estWatts: wattNum,
      filter: (p) => true,
    };

    setCustomSlots((prev) => [...prev, newSlot]);
    setSelections((prev) => ({
      ...prev,
      [newSlotId]: { product: dummyProduct, quantity: 1 }
    }));

    setManualItemName('');
    setManualItemPrice('');
    setManualItemWatts('5');
  };

  // Active slot being searched inside the overlay modal popup
  const [activeSearchSlot, setActiveSearchSlot] = useState<SpecSlot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Customer options
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Receipt quote printed overlay modal popup
  const [showQuote, setShowQuote] = useState(false);

  // Filter products matching current search modal selection
  const searchedProducts = useMemo(() => {
    if (!activeSearchSlot) return [];
    return products.filter((p) => {
      const matchesSlot = activeSearchSlot.filter(p);
      const matchesQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSlot && matchesQuery;
    });
  }, [products, activeSearchSlot, searchQuery]);

  const handleSelectProduct = (slotId: string, product: Product) => {
    setSelections((prev) => ({
      ...prev,
      [slotId]: { product, quantity: 1 }
    }));
    setActiveSearchSlot(null);
    setSearchQuery('');
  };

  const handleClearSlot = (slotId: string) => {
    setSelections((prev) => {
      const safe = { ...prev };
      delete safe[slotId];
      return safe;
    });
  };

  const handleUpdateQty = (slotId: string, adjustment: number) => {
    setSelections((prev) => {
      const match = prev[slotId];
      if (!match) return prev;
      const newQty = Math.max(1, match.quantity + adjustment);
      return {
        ...prev,
        [slotId]: { ...match, quantity: newQty }
      };
    });
  };

  // Calculations
  const totalPrice = useMemo(() => {
    return (Object.values(selections) as { product: Product; quantity: number }[]).reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }, [selections]);

  const estTotalWatts = useMemo(() => {
    return (Object.entries(selections) as [string, { product: Product; quantity: number }][]).reduce((sum, [slotId, item]) => {
      const baseSlot = allSlots.find((s) => s.id === slotId);
      if (!baseSlot) return sum;
      return sum + baseSlot.estWatts * item.quantity;
    }, 0);
  }, [selections, allSlots]);

  // Compatibility checking: scan selected PSU and compare against estTotalWatts
  const psuCapacity = useMemo(() => {
    const selectedPsu = selections['psu']?.product;
    if (!selectedPsu) return null;
    // Extract capacity using typical numbers in name, e.g. "650W", "850W"
    const match = selectedPsu.name.match(/(\d+)W/i) || selectedPsu.name.match(/(\d+)\s*Watt/i);
    return match ? parseInt(match[1]) : null;
  }, [selections]);

  const isPsuWarning = useMemo(() => {
    if (!psuCapacity) return false;
    // PSU should have at least 25% overhead above estTotalWatts for system safety/peak loads
    return psuCapacity < estTotalWatts * 1.25;
  }, [psuCapacity, estTotalWatts]);

  // Finalize: load custom PC build items into main active POS cashier ticket
  const handleLoadToPOS = () => {
    if (Object.keys(selections).length === 0) return;

    // Build items list
    const checkoutItems = (Object.entries(selections) as [string, { product: Product; quantity: number }][]).map(([_, item]) => ({
      product: item.product,
      qty: item.quantity
    }));

    // Transfer and change tab dynamically
    onTransferToPOS(
      customerName.trim() || 'Pelanggan Custom PC Assembly',
      customerPhone.trim(),
      checkoutItems
    );
  };

  // WhatsApp Specifications Export Content String
  const generateSpecsText = () => {
    let text = `*SIMULASI PC RAKITAN - TORKY KOMPUTER DENPASAR*\n`;
    text += `==================================\n`;
    if (customerName.trim()) {
      text += `📅 Pelanggan: ${customerName.trim()}\n`;
    }
    text += `WITA: ${new Date().toLocaleString('id-ID')} WITA\n\n`;
    text += `*SPESIFIKASI RAKITAN JASA SERVIS:*\n`;

    allSlots.forEach((slot) => {
      const item = selections[slot.id];
      if (item) {
        text += `• *${slot.name}*: ${item.product.name} (${item.quantity}x)\n`;
      } else {
        text += `• *${slot.name}*: [belum dipilih]\n`;
      }
    });

    text += `\n----------------------------------\n`;
    text += `⚡ Est. Konsumsi Daya: ~${estTotalWatts} Watt\n`;
    if (psuCapacity) {
      text += `🔌 Kapasitas Daya PSU: ${psuCapacity}W\n`;
    }
    text += `💵 *TOTAL ESTIMASI HARGA:* Rp ${totalPrice.toLocaleString('id-ID')}\n`;
    text += `==================================\n`;
    text += `✓ Layanan Suku Cadang & Garansi Resmi Bali\n`;
    text += `Hubungi/WA Admin: +6281288118288\n`;
    return encodeURIComponent(text);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-800 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-teal-600" /> Simulasi PC Rakitan (Torky Komputer)
          </h2>
          <p className="text-[11.5px] text-slate-400 mt-0.5 font-medium leading-relaxed">
            Rakit PC kustom Anda dengan mencocokkan suku cadang di toko Torky Komputer, lengkap dengan penaksir watt dan kirim langsung ke kasir POS untuk pembayaran transaksi.
          </p>
        </div>

        {/* Action controllers */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => {
              setSelections({});
              setCustomSlots([]);
            }}
            disabled={Object.keys(selections).length === 0 && customSlots.length === 0}
            className="px-3 py-1.5 border border-rose-200 text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-rose-50 rounded-xl text-xs font-bold transition-all"
          >
            Reset Semua Rakitan
          </button>
          <button
            onClick={() => setShowQuote(true)}
            disabled={Object.keys(selections).length === 0}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-250 text-slate-705 disabled:opacity-40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak Penawaran
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* SLOTS LIST PANEL - Custom layout */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden p-4 sm:p-5 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-teal-600" /> Daftar Komponen Rakitan PC
          </h3>

          <div className="divide-y divide-slate-100">
            {allSlots.map((slot) => {
              const selectedItem = selections[slot.id];
              const SlotIcon = slot.icon;
              const isCustom = slot.id.startsWith('custom_');

              return (
                <div key={slot.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {/* Slot Label block */}
                  <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-56">
                    <div className="w-7.5 h-7.5 bg-slate-50 border border-slate-150/55 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                      <SlotIcon className="w-4 h-4 text-teal-605" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-extrabold text-slate-750 block truncate leading-tight">{slot.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9.5px] font-mono font-medium text-slate-400">⚡ Est: ~{slot.estWatts}W</span>
                        {isCustom && (
                          <button
                            onClick={() => handleDeleteCustomSlot(slot.id)}
                            className="text-[9.5px] text-rose-500 font-bold hover:underline"
                            title="Hapus slot kustom"
                          >
                            • Hapus Slot
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Component state display element */}
                  <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                    {selectedItem ? (
                      /* POPULATED SLOT VIEW */
                      <div className="flex items-center justify-between w-full gap-4 bg-slate-50/50 hover:bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div className="min-w-0 pr-1">
                          <span className="font-semibold text-slate-800 line-clamp-1 text-xs">
                            {selectedItem.product.name}
                          </span>
                          <p className="text-[10px] font-mono font-bold text-slate-500 mt-0.5">
                            {formatIDR(selectedItem.product.price)} / {selectedItem.product.unit} (Stock: {selectedItem.product.stock})
                          </p>
                        </div>

                        {/* Qty and action controls inside item slot */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="flex items-center gap-1 bg-white border border-slate-250 rounded-lg p-0.5">
                            <button
                              onClick={() => handleUpdateQty(slot.id, -1)}
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center font-bold text-slate-800 font-mono text-[11px]">
                              {selectedItem.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQty(slot.id, 1)}
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-bold text-slate-800 font-mono text-[11px] min-w-[70px] text-right shrink-0">
                            {formatIDR(selectedItem.product.price * selectedItem.quantity)}
                          </span>

                          <button
                            onClick={() => handleClearSlot(slot.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0 transition-colors"
                            title="Hapus komponen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* EMPTY SLOT VIEW */
                      <button
                        onClick={() => setActiveSearchSlot(slot)}
                        className="w-full text-left py-2.5 px-3 border border-dashed border-slate-200 hover:border-teal-400 hover:bg-teal-500/[0.01] rounded-xl text-slate-400 hover:text-teal-600 font-bold text-[11px] transition-all flex items-center justify-between"
                      >
                        <span>Pilih {slot.name}...</span>
                        <Plus className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DYNAMIC PERIPHERALS & ACCESSORIES MANIPULATORS */}
          <div className="pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Add Custom Slot Input/Button */}
            <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-dashed border-slate-200 text-xs">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-550 mb-2 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-teal-600" /> Tambah Slot Perangkat Kustom
              </h4>
              <p className="text-[10px] text-slate-400 mb-2.5">
                Buat slot kustom baru (seperti Wifi Adapter, Jasa Kalibrasi, Speaker, Headset) untuk dicari dari katalog.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nama slot, e.g. Soundbar/Kabel..."
                  value={customSlotNameInput}
                  onChange={(e) => setCustomSlotNameInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 focus:border-teal-500 outline-none rounded-xl text-xs"
                />
                <button
                  onClick={handleCreateCustomSlot}
                  className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition-colors shrink-0"
                >
                  + Slot
                </button>
              </div>
            </div>

            {/* Ad-hoc Custom Item Addition */}
            <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-dashed border-slate-200 text-xs">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-550 mb-2 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-emerald-600" /> Tambah Item Bebas (Kustom Manual)
              </h4>
              <p className="text-[10px] text-slate-400 mb-2">
                Pasang item apa saja dengan nama & harga bebas tanpa terikat katalog produk (e.g. Jasa Rakit Ekstra, Kabel Roll).
              </p>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nama item kustom..."
                    value={manualItemName}
                    onChange={(e) => setManualItemName(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 focus:border-emerald-500 outline-none rounded-xl text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Harga Rp..."
                    value={manualItemPrice}
                    onChange={(e) => setManualItemPrice(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 focus:border-emerald-500 outline-none rounded-xl text-xs font-mono font-semibold"
                  />
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-medium">
                    Estimasi Watt: 
                    <input 
                      type="number" 
                      value={manualItemWatts} 
                      onChange={(e) => setManualItemWatts(e.target.value)} 
                      className="w-12 bg-white border border-slate-200 text-center rounded-lg py-0.5 ml-1 inline text-slate-705 font-bold font-mono" 
                    /> W
                  </span>
                  <button
                    onClick={handleCreateManualItem}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    + Pasang Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR SUMMARY & COMPATIBILITY CHECKER */}
        <div className="space-y-4">
          {/* Customer Identifications Panel */}
          <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-555 flex items-center gap-1">
              Data Konsumen
            </h4>
            <div className="space-y-2 text-xs">
              <input
                type="text"
                placeholder="Nama Pelanggan (Contoh: Budi Prasetya)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 outline-none rounded-xl"
              />
              <input
                type="text"
                placeholder="No WhatsApp HP (Contoh: 0821xxxx)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 outline-none rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-550 border-b border-slate-100 pb-2">
              Kalkulator Specs & Daya
            </h4>

            {/* Calculations specs list */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Total Komponen:</span>
                <span className="font-bold text-slate-800">{Object.keys(selections).length} Item</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Estimasi Beban Daya:</span>
                <span className="font-bold font-mono text-slate-800 flex items-center gap-1 text-sm bg-amber-500/10 text-amber-900 border border-amber-500/15 p-1 rounded-md">
                  ~ {estTotalWatts} Watt
                </span>
              </div>

              {/* PSU status indicator */}
              <div className="flex justify-between text-slate-500 pt-0.5">
                <span>Kapasitas PSU Terpilih:</span>
                {psuCapacity ? (
                  <span className="font-bold font-mono text-emerald-700">{psuCapacity}W</span>
                ) : (
                  <span className="italic text-slate-400">Belum dipilih</span>
                )}
              </div>

              {/* Dynamic Compatibility warnings panel */}
              {isPsuWarning && (
                <div className="flex items-start gap-1.5 p-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 font-medium text-[10.5px]">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>
                    <strong>Peringatan Daya!</strong> Daya minimum PSU yang dianjurkan adalah <strong>{(estTotalWatts * 1.25).toFixed(0)}W</strong>. Silakan tingkatkan kapasitas PSU Anda.
                  </span>
                </div>
              )}

              {Object.keys(selections).length > 0 && !selections['psu'] && estTotalWatts > 150 && (
                <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 font-medium text-[10.5px]">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>
                    Anda membutuhkan PSU kustom untuk mengalirkan daya {estTotalWatts} Watt ke rakitan ini.
                  </span>
                </div>
              )}
            </div>

            {/* Price recap */}
            <div className="border-t border-slate-150 pt-3 text-xs space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="font-extrabold text-slate-800">Total Harga Estimasi:</span>
                <span className="font-mono text-base font-extrabold text-teal-850">
                  {formatIDR(totalPrice)}
                </span>
              </div>
            </div>

            {/* Execute trigger actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleLoadToPOS}
                disabled={Object.keys(selections).length === 0}
                className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <ShoppingCart className="w-4 h-4" /> Load ke Kasir POS
              </button>

              <a
                href={customerPhone ? `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${generateSpecsText()}` : `https://wa.me/?text=${generateSpecsText()}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 ${Object.keys(selections).length === 0 ? 'pointer-events-none opacity-40' : ''}`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Kirim Spek ke WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* OVERLAY SEARCH DIALOG MODAL: Browse Component Parts */}
      <AnimatePresence>
        {activeSearchSlot && (
          <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-105 overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Modal header */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Pilih {activeSearchSlot.name}</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Cari dari stok fisik toko Torky Komputer</p>
                </div>
                <button
                  onClick={() => {
                    setActiveSearchSlot(null);
                    setSearchQuery('');
                  }}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal search bar */}
              <div className="p-3 border-b border-slate-100 bg-slate-50/50 relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Cari dari catalog ${activeSearchSlot.name}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 text-slate-800"
                />
              </div>

              {/* Modal content body listing parts item details */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[50vh]">
                {searchedProducts.length > 0 ? (
                  searchedProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(activeSearchSlot.id, product)}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-all group"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-800 group-hover:text-teal-600 block transition-colors leading-tight">
                          {product.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-medium">
                          <span className="font-mono">SKU: {product.sku}</span>
                          <span>•</span>
                          <span className={`${product.stock === null || product.stock > 0 ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}`}>
                            {product.stock === null ? 'Stock Aman' : `Stock: ${product.stock} ${product.unit}`}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="font-mono font-extrabold text-slate-900 block group-hover:scale-105 transition-transform">
                          {formatIDR(product.price)}
                        </span>
                        <button className="mt-1 text-[9.5px] font-bold text-teal-605 group-hover:underline">
                          Select Item
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-xs font-semibold">Komponen tidak tersedia dalam stok / database.</p>
                    <p className="text-[10px] mt-1">Gunakan tab <strong>Stock Manager</strong> untuk mendaftarkan barang baru.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY PRINT PREVIEW QUOTE SHEET */}
      <AnimatePresence>
        {showQuote && (
          <div className="fixed inset-0 bg-slate-950/75 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden text-xs flex flex-col max-h-[90vh]"
            >
              {/* Actions header bar */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between z-10">
                <h3 className="font-bold text-slate-900 text-sm">Lembar Penawaran Harga PC</h3>
                <button
                  onClick={() => setShowQuote(false)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Printable sheet content area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white max-h-[65vh]" id="print-sheet">
                <div className="text-center pb-4 border-b border-dashed border-slate-205">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Torky Komputer</h2>
                  <p className="text-[10px] text-slate-500">Jl. Tukad Irawadi Gang Damai XII/3 Celuk Panjer Denpasar Selatan Bali</p>
                  <p className="text-[10px] text-slate-500 font-bold">No HP / WA Admin: +6281288118288</p>
                  <p className="text-[11.5px] font-bold tracking-widest text-slate-800 bg-slate-100/70 inline-block px-3 py-1 rounded-md mt-2 uppercase">
                    SIMULASI PC RAKITAN
                  </p>
                </div>

                <div className="space-y-1 text-[10px] text-slate-600 border-b border-dashed border-slate-200 pb-3">
                  <div className="flex justify-between">
                    <span>Tanggal Penawaran:</span>
                    <span className="font-semibold text-slate-800">{new Date().toLocaleString('id-ID')} WITA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Konsumen:</span>
                    <span className="font-bold text-slate-800">{customerName.trim() || 'Pelanggan Umum (Walk-in)'}</span>
                  </div>
                  {customerPhone && (
                    <div className="flex justify-between">
                      <span>No Telp/WA:</span>
                      <span className="font-mono">{customerPhone}</span>
                    </div>
                  )}
                </div>

                {/* Parts quotation details */}
                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-[9.5px] text-slate-400 uppercase tracking-wider px-1">
                    <span>Komponen / Deskripsi</span>
                    <span className="text-right">Qty * Harga = Total</span>
                  </div>

                  <div className="space-y-1.5 divide-y divide-slate-100">
                    {allSlots.map((slot) => {
                      const item = selections[slot.id];
                      if (!item) return null;
                      return (
                        <div key={slot.id} className="pt-2 flex justify-between gap-4 font-mono text-[11px] text-slate-800">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold block text-slate-750 font-sans text-[10px] uppercase text-teal-700">
                              {slot.name}
                            </span>
                            <span className="line-clamp-2 pr-2">{item.product.name}</span>
                          </div>
                          <span className="shrink-0 text-right font-medium">
                            {item.quantity} x {formatIDR(item.product.price)} = <br/>
                            <strong className="text-slate-900 font-extrabold">{formatIDR(item.product.price * item.quantity)}</strong>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sub Total specs */}
                <div className="py-3 border-t border-dashed border-slate-250 mt-4 space-y-1.5 font-mono">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Est. Kebutuhan Daya:</span>
                    <span className="font-bold">~ {estTotalWatts} Watt</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-white bg-slate-900 px-3 py-2 rounded-xl mt-2">
                    <span>TOTAL ESTIMASI:</span>
                    <span>{formatIDR(totalPrice)}</span>
                  </div>
                </div>

                <div className="text-center pt-3 border-t border-slate-100 text-[10.5px] text-slate-400 italic">
                  <span>"Kepuasan Anda adalah Komitmen Kami. Terima Kasih!"</span>
                </div>
              </div>

              {/* Bottom modal printers action */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Cetak Lembar / Simpan PDF
                </button>
                <button
                  onClick={() => setShowQuote(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
