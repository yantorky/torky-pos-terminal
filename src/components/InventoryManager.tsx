import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Plus, Edit2, AlertTriangle, Layers, CheckCircle, ArrowDown, 
  Package, Code, Trash2, Tag, ShieldCheck, FileText, ClipboardList, 
  ChevronLeft, ChevronRight, DollarSign, RefreshCw, Upload, Check, Loader2, Info,
  KeyRound, ShieldAlert
} from 'lucide-react';
import { Product, ItemCategory, Supplier, UserRole, Staff } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatIDR } from '../utils';
import * as XLSX from 'xlsx';

interface InventoryManagerProps {
  products: Product[];
  suppliers: Supplier[];
  onAddProduct: (product: Product) => void;
  onUpdateStockDirect: (productId: string, newStock: number | null) => void;
  onUpdatePrice: (productId: string, newPrice: number) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateProduct: (productId: string, updatedProduct: Product) => void;
  userRole?: UserRole;
  usdRate?: number;
  onUpdateUsdRate?: (rate: number) => void;
  rolePins?: Record<UserRole, string>;
  staffs?: Staff[];
  onResetProducts?: () => void;
  usdRateSyncTime?: string;
  isSyncingExchangeRate?: boolean;
  onSyncExchangeRate?: () => void;
}

export default function InventoryManager({
  products,
  suppliers = [],
  onAddProduct,
  onUpdateStockDirect,
  onUpdatePrice,
  onDeleteProduct,
  onUpdateProduct,
  userRole = 'Kasir',
  usdRate = 16200,
  onUpdateUsdRate,
  rolePins,
  staffs = [],
  onResetProducts,
  usdRateSyncTime = '',
  isSyncingExchangeRate = false,
  onSyncExchangeRate,
}: InventoryManagerProps) {
  // Navigation & filter inputs
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'All'>('All');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Table scrolling reference and helper methods
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const scrollTable = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const scrollAmount = 350; // pixels to scroll
      tableContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Creation of product drawer state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Hardware Parts');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('10');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('pcs');

  // New Specs, Brand, Supplier Information, Warranty and Price Tiers states
  const [brand, setBrand] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [serialNumbersText, setSerialNumbersText] = useState(''); // newline/comma separated
  const [priceRetail, setPriceRetail] = useState('');
  const [priceCorporate, setPriceCorporate] = useState('');
  const [pricePartner, setPricePartner] = useState('');

  // Admin PIN verification state for deleting and resetting
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete-product' | 'reset-products';
    id?: string;
  } | null>(null);

  // Verification request method
  const requestAdminAction = (type: 'delete-product' | 'reset-products', id?: string) => {
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
        if (pendingAction.type === 'delete-product' && pendingAction.id) {
          onDeleteProduct(pendingAction.id);
        } else if (pendingAction.type === 'reset-products') {
          onResetProducts?.();
        }
      }
      setPinModalOpen(false);
      setPendingAction(null);
      setPinInput('');
    } else {
      setPinError('PIN Otoritas salah! Sila gunakan PIN dari salah satu akun Admin/Super Admin Anda.');
    }
  };

  // Fast Edit states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingStockVal, setEditingStockVal] = useState<string>('');
  const [editingPriceVal, setEditingPriceVal] = useState<string>('');

  // USD Rate Base States
  const [priceUSD, setPriceUSD] = useState('');
  const [costUSD, setCostUSD] = useState('');
  const [inputGlobalUsdRate, setInputGlobalUsdRate] = useState(usdRate.toString());
  const [isUpdatingUsdRate, setIsUpdatingUsdRate] = useState(false);

  useEffect(() => {
    setInputGlobalUsdRate(usdRate.toString());
  }, [usdRate]);

  // Excel Importer Workflow state declarations
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelWorkbook, setExcelWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [excelSheets, setExcelSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [excelRawRows, setExcelRawRows] = useState<any[][]>([]);
  const [manualHeaderIndex, setManualHeaderIndex] = useState<number>(-1);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [mappedNameIndex, setMappedNameIndex] = useState<number>(-1);
  const [mappedPriceIndex, setMappedPriceIndex] = useState<number>(-1);
  const [mappedCostIndex, setMappedCostIndex] = useState<number>(-1);
  const [mappedSkuIndex, setMappedSkuIndex] = useState<number>(-1);
  const [mappedStockIndex, setMappedStockIndex] = useState<number>(-1);
  const [mappedBrandIndex, setMappedBrandIndex] = useState<number>(-1);
  const [mappedSpecIndex, setMappedSpecIndex] = useState<number>(-1);
  const [mappedPromoIndex, setMappedPromoIndex] = useState<number>(-1);
  const [treatPriceAsCost, setTreatPriceAsCost] = useState<boolean>(true); // Default true: perlakukan price dari supplier sebagai modal (Cost)
  const [importAllSheets, setImportAllSheets] = useState<boolean>(false); // Mode untuk impor seluruh tab sheet sekaligus
  const [isExcelUSDBased, setIsExcelUSDBased] = useState<boolean>(false); // excel pricing in USD vs IDR
  const [isMarkupEnabled, setIsMarkupEnabled] = useState<boolean>(true); // default true for automatic markup
  const [markupPercentage, setMarkupPercentage] = useState<string>('15'); // default 15% markup on top of Cost price
  const [importSupplierId, setImportSupplierId] = useState<string>(''); // Link excel import to selected supplier
  const [importSupplierInvoiceNo, setImportSupplierInvoiceNo] = useState<string>(''); // Supplier Invoice/Nota for warranty tracking
  const [defaultCategoryForImport, setDefaultCategoryForImport] = useState<ItemCategory>('Hardware Parts');
  const [parsedImportProducts, setParsedImportProducts] = useState<Partial<Product>[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  // Dynamically compute breakdown statistics of imported rows
  const importSummary = useMemo(() => {
    let newCount = 0;
    let updateCount = 0;
    parsedImportProducts.forEach(prod => {
      const alreadyHas = products.find(p => 
        (p.sku && prod.sku && p.sku.toLowerCase() === prod.sku.toLowerCase()) || 
        (p.name && prod.name && p.name.toLowerCase() === prod.name.toLowerCase())
      );
      if (alreadyHas) updateCount++;
      else newCount++;
    });
    return { newCount, updateCount, total: parsedImportProducts.length };
  }, [parsedImportProducts, products]);

  // Auto-sync input rate value with props changes
  useEffect(() => {
    setInputGlobalUsdRate(usdRate.toString());
  }, [usdRate]);

  // Barcode integration system states
  const [scannedBarcodeCode, setScannedBarcodeCode] = useState<string>('');
  const [scannedProductMatch, setScannedProductMatch] = useState<Product | null>(null);
  const [isBarcodeControlModalOpen, setIsBarcodeControlModalOpen] = useState<boolean>(false);
  const [addStockDirectValue, setAddStockDirectValue] = useState<string>('1');

  const triggerInventoryBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1450, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (err) {}
  };

  const handleGlobalInventoryScan = (code: string) => {
    const matched = products.find(p => p.sku && p.sku.toUpperCase() === code.toUpperCase());
    triggerInventoryBeep();
    setScannedBarcodeCode(code);
    if (matched) {
      setScannedProductMatch(matched);
      setAddStockDirectValue('1');
      setIsBarcodeControlModalOpen(true);
    } else {
      setScannedProductMatch(null);
      setIsBarcodeControlModalOpen(true);
    }
  };

  // Physical USB/Bluetooth keyboard wedge barcode scanner global listener
  useEffect(() => {
    let internalBuffer = '';
    let lastTime = 0;

    const handleWedge = (e: KeyboardEvent) => {
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
        return;
      }
      const now = Date.now();
      const diff = now - lastTime;
      lastTime = now;

      if (diff > 85) {
        internalBuffer = '';
      }

      if (e.key.length === 1 && /[a-zA-Z0-9\-_]/.test(e.key)) {
        internalBuffer += e.key;
      } else if (e.key === 'Enter') {
        const finalBuffer = internalBuffer.trim();
        if (finalBuffer.length >= 2) {
          e.preventDefault();
          e.stopPropagation();
          handleGlobalInventoryScan(finalBuffer);
          internalBuffer = '';
        }
        internalBuffer = '';
      }
    };

    window.addEventListener('keydown', handleWedge, true);
    return () => window.removeEventListener('keydown', handleWedge, true);
  }, [products]);

  const handleDirectStockAdd = (p: Product, quantityToAdd: number) => {
    const currentStock = p.stock !== null ? p.stock : 0;
    const nextStock = currentStock + quantityToAdd;
    onUpdateStockDirect(p.id, nextStock);

    const notification = document.createElement('div');
    notification.className = 'fixed bottom-5 right-5 bg-teal-500 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl border border-teal-600 font-extrabold text-xs z-50 flex items-center gap-2 animate-bounce';
    notification.innerHTML = `<span>🍀 Stok ${p.name} berhasil ditambah dari ${currentStock} ke ${nextStock}!</span>`;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 2500);

    setScannedProductMatch({
      ...p,
      stock: nextStock
    });
  };

  // Hook auto-calculates IDR counterparts if USD is keyed-in dynamically inside drawer
  useEffect(() => {
    if (priceUSD && !isNaN(parseFloat(priceUSD))) {
      const computed = Math.round(parseFloat(priceUSD) * usdRate);
      setPrice(computed.toString());
    }
  }, [priceUSD, usdRate]);

  useEffect(() => {
    if (costUSD && !isNaN(parseFloat(costUSD))) {
      const computed = Math.round(parseFloat(costUSD) * usdRate);
      setCost(computed.toString());
    }
  }, [costUSD, usdRate]);

  // Categories Slider Options
  const categories = useMemo(() => {
    const defaults = [
      'All',
      'Hardware Parts',
      'Service & Repair',
      'Accessories',
      'Software',
      'LAPTOP',
      'BuildUp Komputer',
      'Server'
    ];
    const uniqueFromProducts = Array.from(new Set(products.map(p => p.category))).filter((cat): cat is string => !!cat && !defaults.includes(cat));
    return [...defaults, ...uniqueFromProducts] as (ItemCategory | 'All')[];
  }, [products]);

  // Handle SKU suggestions from parts category
  const generateSKU = () => {
    const prefix = category.slice(0, 3).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${random}`);
  };

  // Submission details
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const retailPrice = parseFloat(price) || 0;
    const cogs = parseFloat(cost) || 0;
    const stockCountStr = category === 'Service & Repair' ? null : parseInt(stock);

    const parsedSNs = serialNumbersText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const pRetail = priceRetail ? (parseFloat(priceRetail) || 0) : retailPrice;
    const pCorp = priceCorporate ? (parseFloat(priceCorporate) || 0) : undefined;
    const pPart = pricePartner ? (parseFloat(pricePartner) || 0) : undefined;

    const parsedPriceUSD = priceUSD ? (parseFloat(priceUSD) || undefined) : undefined;
    const parsedCostUSD = costUSD ? (parseFloat(costUSD) || undefined) : undefined;

    if (editingProduct) {
      const updatedProduct: Product = {
        ...editingProduct,
        name,
        category,
        price: retailPrice,
        cost: cogs,
        stock: stockCountStr !== null && !isNaN(stockCountStr) ? stockCountStr : null,
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        unit: unit.trim() || 'pcs',
        brand: brand.trim() || undefined,
        specifications: specifications.trim() || undefined,
        supplierId: supplierId || undefined,
        supplierInvoiceNo: supplierInvoiceNo.trim() || undefined,
        serialNumbers: parsedSNs.length > 0 ? parsedSNs : undefined,
        priceRetail: pRetail,
        priceCorporate: pCorp,
        pricePartner: pPart,
        priceUSD: parsedPriceUSD,
        costUSD: parsedCostUSD
      };
      onUpdateProduct(editingProduct.id, updatedProduct);
    } else {
      const newProduct: Product = {
        id: `p-${Date.now()}`,
        name,
        category,
        price: retailPrice,
        cost: cogs,
        stock: stockCountStr !== null && !isNaN(stockCountStr) ? stockCountStr : null,
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        unit: unit.trim() || 'pcs',
        brand: brand.trim() || undefined,
        specifications: specifications.trim() || undefined,
        supplierId: supplierId || undefined,
        supplierInvoiceNo: supplierInvoiceNo.trim() || undefined,
        serialNumbers: parsedSNs.length > 0 ? parsedSNs : undefined,
        priceRetail: pRetail,
        priceCorporate: pCorp,
        pricePartner: pPart,
        priceUSD: parsedPriceUSD,
        costUSD: parsedCostUSD
      };
      onAddProduct(newProduct);
    }

    // Reset Creation form
    setName('');
    setCategory('Hardware Parts');
    setPrice('');
    setCost('');
    setStock('10');
    setSku('');
    setUnit('pcs');
    setBrand('');
    setSpecifications('');
    setSupplierId('');
    setSupplierInvoiceNo('');
    setSerialNumbersText('');
    setPriceRetail('');
    setPriceCorporate('');
    setPricePartner('');
    setPriceUSD('');
    setCostUSD('');
    setEditingProduct(null);
    setIsFormOpen(false);
  };

  // Perform quick state modifications
  const handleSaveQuickEdits = (productId: string) => {
    const isService = products.find(p => p.id === productId)?.category === 'Service & Repair';
    if (!isService && editingStockVal) {
      const computedStockVal = parseInt(editingStockVal);
      if (!isNaN(computedStockVal)) {
        onUpdateStockDirect(productId, computedStockVal);
      }
    }
    if (editingPriceVal) {
      const computedPriceVal = parseFloat(editingPriceVal);
      if (!isNaN(computedPriceVal) && computedPriceVal >= 0) {
        onUpdatePrice(productId, computedPriceVal);
      }
    }
    setEditingProductId(null);
  };

  // Excel Supplier Price List Reader Methods
  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFileName(file.name);
    setImportMessage('');
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        if (!bstr) return;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        // Simpan semua sheet name dan workbook object
        setExcelWorkbook(wb);
        setExcelSheets(wb.SheetNames);
        const firstSheet = wb.SheetNames[0];
        setSelectedSheet(firstSheet);
        
        // Ekstrak data
        extractSheetData(wb, firstSheet);
      } catch (err: any) {
        setImportMessage(`Error membaca excel: ${err.message || err}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Helper to find the actual header row index using keyword-matching weight scoring
  const findBestHeaderRowIndex = (rows: any[][]): number => {
    let bestIdx = 0;
    let maxScore = 0;
    const headerKeywords = [
      'nama', 'name', 'product', 'barang', 'item', 'deskripsi', 'description',
      'harga', 'price', 'pricelist', 'retail', 'user', 'dealer', 'partner', 'grosir', 'jual',
      'modal', 'cost', 'beli', 'suplayer', 'supplier', 'cogs',
      'sku', 'kode', 'code', 'stok', 'stock', 'qty', 'jumlah', 'quantity',
      'brand', 'merek', 'merk', 'vendor',
      'spec', 'spesifikasi', 'detail', 'keterangan'
    ];

    for (let i = 0; i < Math.min(45, rows.length); i++) {
      const row = rows[i];
      if (!row) continue;
      let score = 0;
      row.forEach((cell: any) => {
        if (cell !== null && cell !== undefined && cell !== '') {
          const cellStr = cell.toString().toLowerCase().trim();
          const matched = headerKeywords.some(kw => cellStr === kw || cellStr.includes(kw));
          if (matched) score += 3.0; // High score multiplier for header terms
          if (cellStr.length < 25) score += 0.5; // Typical headers are short labels
        }
      });
      const nonNullCount = row.filter(val => val !== null && val !== undefined && val !== '').length;
      if (nonNullCount >= 2 && score > maxScore) {
        maxScore = score;
        bestIdx = i;
      }
    }
    // Fallback if no keyword match but row has robust layout
    if (maxScore === 0) {
      for (let i = 0; i < Math.min(15, rows.length); i++) {
        const row = rows[i];
        if (!row) continue;
        const nonNullCount = row.filter(val => val !== null && val !== undefined && val !== '').length;
        if (nonNullCount >= 3) {
          return i;
        }
      }
    }
    return bestIdx;
  };

  const detectAndApplyColumnMappings = (rows: any[][], headerIdx: number) => {
    if (!rows || rows.length <= headerIdx || !rows[headerIdx]) return;
    const rawHeader = rows[headerIdx];
    const cleanedHeaders = rawHeader.map((h: any, idx: number) => h ? h.toString().trim() : `Kolom ${idx + 1}`);
    setExcelHeaders(cleanedHeaders);
    
    // Robust fuzzy mapping with priorities & localized dictionary
    let nameCol = -1;
    let priceCol = -1;
    let costCol = -1;
    let skuCol = -1;
    let stockCol = -1;
    let brandCol = -1;
    let specCol = -1;
    let promoCol = -1;
    
    cleanedHeaders.forEach((h, idx) => {
      const lowerH = h.toLowerCase().trim();
      
      // Exact / High specificity mappings
      if (lowerH === 'brand' || lowerH === 'merek' || lowerH === 'merk' || lowerH === 'vendor' || lowerH === 'pabrik') {
        brandCol = idx;
      }
      if (lowerH === 'sku' || lowerH === 'kode' || lowerH.includes('barcode') || lowerH === 'code' || lowerH.includes('part number') || lowerH.includes('part_number') || lowerH === 'pn' || lowerH === 'p/n') {
        skuCol = idx;
      }
      if (lowerH === 'stok' || lowerH === 'stock' || lowerH === 'qty' || lowerH === 'jumlah' || lowerH === 'quantity' || lowerH === 'sisa' || lowerH === 'tersedia') {
        stockCol = idx;
      }
      if (lowerH.includes('spec') || lowerH.includes('spesifikasi') || lowerH === 'detail' || lowerH.includes('keterangan')) {
        specCol = idx;
      }
      if (lowerH === 'promo' || lowerH === 'harga promo' || lowerH === 'discount' || lowerH.includes('promo')) {
        promoCol = idx;
      }
    });

    cleanedHeaders.forEach((h, idx) => {
      const lowerH = h.toLowerCase().trim();

      // 1. Name column mapping
      if (
        lowerH.includes('nama barang') || 
        lowerH.includes('nama_barang') || 
        lowerH.includes('item description') || 
        lowerH.includes('deskripsi') || 
        lowerH.includes('p_name') || 
        lowerH === 'barang' ||
        lowerH === 'nama' || 
        lowerH === 'name' || 
        lowerH === 'product' || 
        lowerH === 'model' || 
        lowerH === 'type' || 
        lowerH === 'tipe'
      ) {
        if (nameCol === -1) nameCol = idx;
      }

      // 2. Cost (harga beli / modal) column mapping
      if (
        lowerH.includes('modal') || 
        lowerH.includes('cost') || 
        lowerH.includes('beli') || 
        lowerH.includes('harga dealer') || 
        lowerH.includes('harga_dealer') || 
        lowerH.includes('dealer') || 
        lowerH.includes('harga kami') || 
        lowerH.includes('harga_kami') || 
        lowerH.includes('hargakami') || 
        lowerH.includes('suplayer') || 
        lowerH.includes('supplier') || 
        lowerH.includes('harga beli') || 
        lowerH === 'net' || 
        lowerH === 'distributor'
      ) {
        if (costCol === -1) costCol = idx;
      }

      // 3. Price (harga jual retail) column mapping (exclusive from Cost indexes)
      if (
        lowerH.includes('retail') || 
        lowerH.includes('retil') || 
        lowerH.includes('user') || 
        lowerH.includes('harga jual') || 
        lowerH.includes('harga_jual') || 
        lowerH.includes('hargajual') || 
        lowerH.includes('harga umum') || 
        lowerH.includes('harga_umum') || 
        lowerH.includes('grosir') ||
        lowerH.includes('pricelist') || 
        lowerH === 'price' || 
        lowerH === 'jual' || 
        lowerH === 'umum'
      ) {
        // Prevent overlap/collision with already assigned Cost column
        if (priceCol === -1 && idx !== costCol) {
          priceCol = idx;
        }
      }
    });
    
    setMappedNameIndex(nameCol);
    setMappedPriceIndex(priceCol);
    setMappedCostIndex(costCol);
    setMappedSkuIndex(skuCol);
    setMappedStockIndex(stockCol);
    setMappedBrandIndex(brandCol);
    setMappedSpecIndex(specCol);
    setMappedPromoIndex(promoCol);
  };

  const handleSelectManualHeader = (idx: number) => {
    setManualHeaderIndex(idx);
    if (idx !== -1) {
      detectAndApplyColumnMappings(excelRawRows, idx);
    } else {
      const autoIdx = findBestHeaderRowIndex(excelRawRows);
      detectAndApplyColumnMappings(excelRawRows, autoIdx);
    }
  };

  const extractSheetData = (workbook: XLSX.WorkBook, sheetName: string) => {
    try {
      const ws = workbook.Sheets[sheetName];
      // Ambil rows sebagai array of arrays
      const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
      if (rows.length === 0) {
        setImportMessage('Sheet terpilih kosong atau tidak valid.');
        return;
      }
      
      setExcelRawRows(rows);
      setManualHeaderIndex(-1); // Reset manual index on sheet reload/change
      
      // Determine best header row index
      const headerIdx = findBestHeaderRowIndex(rows);
      detectAndApplyColumnMappings(rows, headerIdx);
      
    } catch (err: any) {
      setImportMessage(`Gagal mengekstrak data sheet: ${err.message || err}`);
    }
  };

  // Auto-parse spreadsheet rows when headers/mappings/rules change
  useEffect(() => {
    if (excelRawRows.length === 0 || (!importAllSheets && mappedNameIndex === -1)) {
      setParsedImportProducts([]);
      return;
    }
    
    try {
      const parsed: Partial<Product>[] = [];
      
      // Highly precise Indonesian thousand/decimal parser
      const cleanNumeric = (val: any) => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') {
          return Math.round(val);
        }
        let s = val.toString().trim().replace(/Rp/gi, '').replace(/\s/g, '');
        if (!s) return 0;
        
        const hasDot = s.includes('.');
        const hasComma = s.includes(',');
        
        if (hasDot && hasComma) {
          const lastDotIdx = s.lastIndexOf('.');
          const lastCommaIdx = s.lastIndexOf(',');
          if (lastDotIdx < lastCommaIdx) {
            // Indonesian format: dots inside thousands, comma for decimal separator (e.g. 1.250.000,00)
            s = s.replace(/\./g, '').replace(/,/g, '.');
          } else {
            // US format: commas inside thousands, dot for decimal separator (e.g. 1,250,000.00)
            s = s.replace(/,/g, '');
          }
        } else if (hasComma) {
          // Check if comma behaves as thousand separator (comma followed by exactly 3 digits, e.g. "15,000")
          const parts = s.split(',');
          if (parts.length === 2 && parts[1].length === 3) {
            s = s.replace(/,/g, '');
          } else {
            s = s.replace(/,/g, '.');
          }
        } else if (hasDot) {
          // Check if dot behaves as thousand separator
          const parts = s.split('.');
          if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
            s = s.replace(/\./g, '');
          }
        }
        
        const n = parseFloat(s);
        return isNaN(n) ? 0 : Math.round(n);
      };

      const cleanUSDNumeric = (val: any) => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') {
          return val;
        }
        let s = val.toString().trim().replace(/\$/gi, '').replace(/,/g, '').replace(/\s/g, '');
        const n = parseFloat(s);
        return isNaN(n) ? 0 : n;
      };

      const sheetsToProcess = importAllSheets ? (excelWorkbook?.SheetNames || []) : [selectedSheet];
      let totalSkippedSheets = 0;

      sheetsToProcess.forEach((sheetName) => {
        const ws = excelWorkbook?.Sheets[sheetName];
        if (!ws) return;
        const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        if (rows.length === 0) return;

        // Auto determine header row index for this specific sheet
        const headerIdx = (manualHeaderIndex !== -1 && !importAllSheets) 
          ? manualHeaderIndex 
          : findBestHeaderRowIndex(rows);
        
        const rawHeader = rows[headerIdx] || [];
        const cleanedHeaders = rawHeader.map((h: any) => h ? h.toString().trim() : '');

        // Detect mapper column indexes for this sheet dynamically (extremely robust fuzzy mapping)
        let nameCol = -1;
        let priceCol = -1;
        let costCol = -1;
        let skuCol = -1;
        let stockCol = -1;
        let brandCol = -1;
        let specCol = -1;
        let promoCol = -1;

        cleanedHeaders.forEach((h, idx) => {
          const lowerH = h.toLowerCase().trim();
          if (lowerH === 'sku' || lowerH === 'kode' || lowerH.includes('barcode') || lowerH === 'code' || lowerH.includes('part number') || lowerH.includes('part_number') || lowerH === 'pn' || lowerH === 'p/n') {
            skuCol = idx;
          }
          if (lowerH === 'stok' || lowerH === 'stock' || lowerH === 'qty' || lowerH === 'jumlah' || lowerH === 'quantity' || lowerH === 'sisa' || lowerH === 'tersedia') {
            stockCol = idx;
          }
          if (lowerH.includes('spec') || lowerH.includes('spesifikasi') || lowerH === 'detail' || lowerH.includes('keterangan')) {
            specCol = idx;
          }
          if (lowerH === 'promo' || lowerH === 'harga promo' || lowerH === 'discount' || lowerH.includes('promo')) {
            promoCol = idx;
          }
          if (lowerH === 'brand' || lowerH === 'merek' || lowerH === 'merk' || lowerH === 'vendor') {
            brandCol = idx;
          }
        });

        cleanedHeaders.forEach((h, idx) => {
          const lowerH = h.toLowerCase().trim();
          if (
            lowerH.includes('nama barang') || 
            lowerH.includes('nama_barang') || 
            lowerH.includes('item description') || 
            lowerH.includes('deskripsi') || 
            lowerH === 'barang' ||
            lowerH === 'nama' || 
            lowerH === 'name' || 
            lowerH === 'product' || 
            lowerH === 'model' || 
            lowerH === 'type' || 
            lowerH === 'tipe'
          ) {
            if (nameCol === -1) nameCol = idx;
          }

          if (
            lowerH.includes('modal') || 
            lowerH.includes('cost') || 
            lowerH.includes('beli') || 
            lowerH.includes('harga dealer') || 
            lowerH.includes('harga_dealer') || 
            lowerH.includes('dealer') || 
            lowerH.includes('suplayer') || 
            lowerH.includes('supplier') || 
            lowerH.includes('harga beli') || 
            lowerH === 'net' || 
            lowerH === 'distributor'
          ) {
            if (costCol === -1) costCol = idx;
          }

          if (
            lowerH.includes('retail') || 
            lowerH.includes('retil') || 
            lowerH.includes('user') || 
            lowerH.includes('harga jual') || 
            lowerH.includes('harga_jual') || 
            lowerH.includes('hargajual') || 
            lowerH.includes('grosir') ||
            lowerH.includes('pricelist') || 
            lowerH === 'price' || 
            lowerH === 'jual' || 
            lowerH === 'umum'
          ) {
            if (priceCol === -1 && idx !== costCol) {
              priceCol = idx;
            }
          }
        });

        // single sheet override checks
        if (!importAllSheets) {
          if (mappedNameIndex !== -1) nameCol = mappedNameIndex;
          if (mappedPriceIndex !== -1) priceCol = mappedPriceIndex;
          if (mappedCostIndex !== -1) costCol = mappedCostIndex;
          if (mappedSkuIndex !== -1) skuCol = mappedSkuIndex;
          if (mappedStockIndex !== -1) stockCol = mappedStockIndex;
          if (mappedBrandIndex !== -1) brandCol = mappedBrandIndex;
          if (mappedSpecIndex !== -1) specCol = mappedSpecIndex;
          if (mappedPromoIndex !== -1) promoCol = mappedPromoIndex;
        } else {
          // Fallbacks for automatic bulk sheet parsing
          if (nameCol === -1) nameCol = 4; // Excel sheet column 5
          if (priceCol === -1) priceCol = 5; // Excel sheet column 6
          if (skuCol === -1) skuCol = 0; // Excel sheet column 1
        }

        const rowsToParse = rows.slice(headerIdx + 1);
        let lastParsedProd: Partial<Product> | null = null;

        for (let i = 0; i < rowsToParse.length; i++) {
          const row = rowsToParse[i];
          if (!row || row.length === 0) continue;
          
          const rawName = nameCol !== -1 ? row[nameCol] : null;
          const nameStr = rawName ? rawName.toString().trim() : "";
          const lowerName = nameStr.toLowerCase();
          
          // Noise filter blocks
          const isNoiseRow = nameStr === "" || 
            lowerName.includes('total') || 
            lowerName.includes('pricelist') || 
            lowerName.includes('harga') || 
            lowerName.includes('update') || 
            lowerName.includes('tanggal') || 
            lowerName.includes('buka hari') || 
            lowerName.includes('telp') || 
            lowerName.includes('wa:') || 
            lowerName.startsWith('===') || 
            lowerName.startsWith('---') ||
            lowerName.includes('catatan') ||
            lowerName.includes('nb:') ||
            lowerName.includes('perhatian');

          let rawPrice = priceCol !== -1 ? row[priceCol] : null;
          let rawCost = costCol !== -1 ? row[costCol] : null;
          let rawPromo = promoCol !== -1 ? row[promoCol] : null;
          let rawStock = stockCol !== -1 ? row[stockCol] : null;
          let rawSku = skuCol !== -1 ? row[skuCol] : null;
          let rawBrand = brandCol !== -1 ? row[brandCol] : null;
          let rawSpec = specCol !== -1 ? row[specCol] : null;

          const priceValClean = cleanNumeric(rawPrice);
          const costValClean = cleanNumeric(rawCost);
          const promoValClean = cleanNumeric(rawPromo);

          const hasPriceMetrics = (priceValClean > 0 || costValClean > 0 || promoValClean > 0);

          // Sub-row specification handling
          if (!isNoiseRow && nameStr === "" && !hasPriceMetrics && lastParsedProd) {
            const specCells = row
              .filter((cell: any) => cell !== null && cell !== undefined && typeof cell !== 'number')
              .map((cell: any) => cell.toString().trim())
              .filter((str: string) => str.length > 5 && !str.toLowerCase().includes('total') && !str.startsWith('===') && !str.startsWith('---'));
            
            if (specCells.length > 0) {
              const joinedSpecs = specCells.join(" | ");
              if (lastParsedProd.specifications) {
                lastParsedProd.specifications += "\n" + joinedSpecs;
              } else {
                lastParsedProd.specifications = joinedSpecs;
              }
            }
            continue;
          }

          if (isNoiseRow || !rawName) {
            continue;
          }
          
          let priceVal = 0;
          let costVal = 0;
          let priceUSDVal: number | undefined = undefined;
          let costUSDVal: number | undefined = undefined;

          if (isExcelUSDBased) {
            const usdUnitPrice = cleanUSDNumeric(rawPrice);
            const usdUnitCost = cleanUSDNumeric(rawCost);
            const usdUnitPromo = cleanUSDNumeric(rawPromo);

            let baseUSD = usdUnitCost;
            if (treatPriceAsCost) {
              baseUSD = usdUnitPromo > 0 ? usdUnitPromo : (usdUnitPrice > 0 ? usdUnitPrice : usdUnitCost);
            } else {
              baseUSD = usdUnitCost > 0 ? usdUnitCost : (usdUnitPromo > 0 ? usdUnitPromo : 0);
            }

            costUSDVal = baseUSD;
            priceUSDVal = usdUnitPrice > 0 && !treatPriceAsCost ? usdUnitPrice : baseUSD;

            costVal = Math.round(costUSDVal * usdRate);

            if (isMarkupEnabled && costUSDVal > 0) {
              const markupMultiplier = 1 + (parseFloat(markupPercentage) || 0) / 100;
              priceUSDVal = costUSDVal * markupMultiplier;
              priceVal = Math.round(priceUSDVal * usdRate);
            } else {
              priceVal = Math.round(priceUSDVal * usdRate);
            }
          } else {
            // IDR Based Pricing
            let baseIDR = costValClean;
            if (treatPriceAsCost) {
              baseIDR = promoValClean > 0 ? promoValClean : (priceValClean > 0 ? priceValClean : costValClean);
            } else {
              baseIDR = costValClean > 0 ? costValClean : (promoValClean > 0 ? promoValClean : 0);
            }

            costVal = baseIDR;

            if (treatPriceAsCost) {
              const markupMultiplier = 1 + (parseFloat(markupPercentage) || 10) / 100;
              priceVal = Math.round(costVal * markupMultiplier);
            } else {
              priceVal = priceValClean > 0 ? priceValClean : costVal;
              if (isMarkupEnabled && costVal > 0) {
                const markupMultiplier = 1 + (parseFloat(markupPercentage) || 0) / 100;
                priceVal = Math.round(costVal * markupMultiplier);
              }
            }
          }
          
          if (priceVal === 0 && costVal === 0) {
            continue;
          }
          
          let stockVal: number | null = 10;
          if (rawStock !== null && rawStock !== undefined) {
            const sVal = parseInt(rawStock.toString().replace(/\D/g, ''));
            stockVal = isNaN(sVal) ? 10 : sVal;
          }
          
          const skuStr = rawSku ? rawSku.toString().trim() : `IMP-${Date.now().toString().slice(-4)}-${i}`;
          const brandStr = rawBrand ? rawBrand.toString().trim() : undefined;
          let specStr = rawSpec ? rawSpec.toString().trim() : undefined;
          
          const newProductItem: Partial<Product> = {
            name: nameStr,
            category: importAllSheets ? (sheetName as any) : defaultCategoryForImport,
            price: priceVal,
            cost: costVal,
            stock: stockVal,
            sku: skuStr,
            unit: 'pcs',
            brand: brandStr,
            specifications: specStr,
            priceUSD: priceUSDVal,
            costUSD: costUSDVal,
            priceRetail: priceVal,
            priceCorporate: Math.round(priceVal * 1.05),
            pricePartner: Math.round(priceVal * 0.95),
          };

          parsed.push(newProductItem);
          lastParsedProd = newProductItem;
        }
      });
      
      setParsedImportProducts(parsed);
      setImportMessage(`Instan: Berhasil memparsing ${parsed.length} baris barang dari ${sheetsToProcess.length} sheet Excel!`);
    } catch (err: any) {
      setImportMessage(`Gagal mengekstrak baris spreadsheet: ${err.message || err}`);
    }
  }, [
    excelRawRows, 
    manualHeaderIndex,
    mappedNameIndex, 
    mappedPriceIndex, 
    mappedCostIndex, 
    mappedSkuIndex, 
    mappedStockIndex, 
    mappedBrandIndex, 
    mappedSpecIndex, 
    mappedPromoIndex,
    treatPriceAsCost,
    isExcelUSDBased, 
    isMarkupEnabled,
    markupPercentage,
    defaultCategoryForImport, 
    usdRate,
    importAllSheets,
    excelWorkbook,
    selectedSheet
  ]);

  const handleApplyImport = () => {
    setIsImporting(true);
    let updatedCount = 0;
    let addedCount = 0;

    parsedImportProducts.forEach((imp) => {
      const existing = products.find(p => 
        (p.sku.toLowerCase() === imp.sku?.toLowerCase()) || 
        (p.name.toLowerCase() === imp.name?.toLowerCase())
      );

      if (existing) {
        const updated: Product = {
          ...existing,
          price: imp.price ?? existing.price,
          cost: imp.cost ?? existing.cost,
          stock: imp.stock !== undefined ? imp.stock : existing.stock,
          priceRetail: imp.priceRetail ?? existing.priceRetail,
          priceCorporate: imp.priceCorporate ?? existing.priceCorporate,
          pricePartner: imp.pricePartner ?? existing.pricePartner,
          priceUSD: imp.priceUSD !== undefined ? imp.priceUSD : existing.priceUSD,
          costUSD: imp.costUSD !== undefined ? imp.costUSD : existing.costUSD,
          brand: imp.brand ?? existing.brand,
          specifications: imp.specifications ?? existing.specifications,
          supplierId: importSupplierId || existing.supplierId,
          supplierInvoiceNo: importSupplierInvoiceNo || existing.supplierInvoiceNo,
        };
        onUpdateProduct(existing.id, updated);
        updatedCount++;
      } else {
        const newProd: Product = {
          id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: imp.name!,
          category: imp.category ?? defaultCategoryForImport,
          price: imp.price ?? 0,
          cost: imp.cost ?? 0,
          stock: imp.stock ?? 10,
          sku: imp.sku || `SKU-${Date.now().toString().slice(-6)}`,
          unit: 'pcs',
          brand: imp.brand,
          specifications: imp.specifications,
          priceUSD: imp.priceUSD,
          costUSD: imp.costUSD,
          priceRetail: imp.priceRetail,
          priceCorporate: imp.priceCorporate,
          pricePartner: imp.pricePartner,
          supplierId: importSupplierId || undefined,
          supplierInvoiceNo: importSupplierInvoiceNo || undefined,
        };
        onAddProduct(newProd);
        addedCount++;
      }
    });

    setIsImporting(false);
    setIsExcelOpen(false);
    setExcelRawRows([]);
    setExcelHeaders([]);
    setParsedImportProducts([]);
    setImportSupplierId('');
    setImportSupplierInvoiceNo('');
    alert(`Proses impor selesai! Berhasil menambahkan ${addedCount} barang baru dan memperbarui harga/stok ${updatedCount} barang yang sudah ada.`);
  };

  // Filters computed
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchSupplier = selectedSupplierId === 'All' || product.supplierId === selectedSupplierId;
      const matchSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.specifications || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.supplierInvoiceNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.serialNumbers || []).some(sn => sn.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSupplier && matchSearch;
    });
  }, [products, selectedCategory, selectedSupplierId, searchQuery]);

  return (
    <div className="space-y-6">
      {/* SECTION: USD EXCHANGE RATE & EXCEL SUPLAYER PRICELIST PROCESSOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CARD 1: USD STANDARD RATE ADJUSTMENT */}
        <div className="lg:col-span-7 bg-linear-to-r from-emerald-950 to-slate-900 border border-emerald-500/10 rounded-2xl p-5 shadow-lg text-white flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-450 rounded-full animate-ping" />
                <h4 className="font-extrabold text-xs uppercase tracking-widest text-emerald-400">
                  Standardisasi Kurs USD ($US) Global
                </h4>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-black rounded-lg border border-emerald-500/30">
                  ✓ TERKONEKSI API RESMI (SINKRON OTOMATIS)
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed max-w-md">
                Hubungkan harga retail, partner, dan modal spareparts impor ke fluktuasi Dollar secara dinamis. Perubahan kurs memicu penyesuaian otomatis seketika pada Rupiah tanpa diisi manual.
              </p>
            </div>
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-800">
            <div className="space-y-1">
              <div className="flex justify-between items-center pr-1.5">
                <span className="text-[9.5px] font-bold text-slate-450 uppercase">KURS REAL-TIME (SINKRON)</span>
                {usdRateSyncTime && (
                  <span className="text-[9px] text-emerald-400 font-bold" title="Waktu update data resmi">
                    Pukul: {usdRateSyncTime}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5">
                <span className="bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-350 flex items-center border border-slate-700">
                  USD
                </span>
                <div className="flex-1 bg-slate-950/85 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-mono font-extrabold text-emerald-400 flex items-center justify-between shadow-inner">
                  <span>$1.00 USD</span>
                  <span>=</span>
                  <span className="text-emerald-300 font-black tracking-wider">{formatIDR(usdRate)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => {
                  if (onSyncExchangeRate) {
                    onSyncExchangeRate();
                  } else {
                    alert('Sistem auto-sync sedang berjalan di latar belakang.');
                  }
                }}
                disabled={isSyncingExchangeRate}
                className="w-full bg-emerald-555 hover:bg-emerald-450 disabled:bg-slate-800 text-slate-950 disabled:text-emerald-600 border border-emerald-500/20 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                title="Tarik data kurs terbaru dari server referensi global resmi"
              >
                {isSyncingExchangeRate ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    Menghubungi Bank Sentral...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-slate-950" />
                    Sinkronkan Kurs Sekarang
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-between gap-2 text-[10px] text-slate-450">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Saat ini terdapat <strong className="text-emerald-300 font-extrabold">{products.filter(p => p.priceUSD !== undefined || p.costUSD !== undefined).length} item</strong> impor yang disinkronkan secara langsung.
              </span>
            </div>
            <span className="text-emerald-500 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/40">
              API Live Active
            </span>
          </div>
        </div>

        {/* CARD 2: AUTOMATIC EXCEL SUPPLIER IMPORT PANEL */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg text-white flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-teal-400" />
              <h4 className="font-extrabold text-xs uppercase tracking-widest text-teal-400">
                Pricelist Supplier Auto-Reader
              </h4>
            </div>
            <p className="text-[11px] text-slate-350 leading-relaxed">
              Punya file pricelist dari suplayer? Unggah file excel (.xlsx/.xls/.csv) di sini, program pintar kami akan langsung mendeteksi tab sheet, nama alat, harga/stok otomatis.
            </p>
          </div>

          <div className="mt-6">
            <button
              onClick={() => {
                setImportMessage('');
                setIsExcelOpen(true);
              }}
              className="w-full border-2 border-dashed border-teal-500/20 hover:border-teal-500/40 bg-teal-500/5 hover:bg-teal-500/10 text-teal-300 font-extrabold text-xs py-4 px-4 rounded-xl transition-all flex flex-col items-center justify-center gap-2"
            >
              <FileText className="w-6 h-6 text-teal-400" />
              <span>Unggah & Ekstrak File Excel (.xlsx)</span>
              <span className="text-[9px] text-slate-400 font-medium normal-case">
                Mendukung auto-map nama alat, harga supplier, SKU & info stok
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Header controls layout bar */}
      <div className="flex flex-col gap-3.5 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        {/* Interactive Barcode Simulator Header Wrapper */}
        <div className="bg-slate-950 text-white rounded-2xl p-3 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-mono text-base border border-teal-500/20 font-bold select-none">
                ||||
              </div>
              <div className="absolute left-0.5 right-0.5 h-0.5 bg-red-400 shadow-sm shadow-red-500/80 animate-pulse"></div>
            </div>
            <div className="text-left">
              <h4 className="text-[11px] font-extrabold text-[#2dd4bf] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                STOK SCANNER EMULATION WEDGE
              </h4>
              <p className="text-[9px] text-slate-400 font-bold leading-none">
                Arahkan laser scanner fisik Anda atau simulasikan pemindaian barang di sini:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-end">
            <select
              className="bg-slate-900 border border-slate-800 rounded-xl py-1.5 px-2 text-[10px] font-mono font-bold text-teal-355 outline-none focus:border-teal-600 max-w-[170px] cursor-pointer shadow-inner"
              defaultValue=""
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                handleGlobalInventoryScan(val);
                e.target.value = "";
              }}
            >
              <option value="">⚡ PILIH BARANG BARCODE</option>
              {products.filter(p => p.sku).map(p => (
                <option key={p.id} value={p.sku}>
                  [{p.sku}] {p.name.substring(0, 20)}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="SKU KODE..."
                className="bg-slate-900 hover:bg-slate-850 focus:bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-2.5 py-1.5 text-[10px] font-mono text-teal-400 font-bold outline-none placeholder:text-slate-600 max-w-[110px]"
                id="inv-manual-sku-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.trim();
                    if (val) {
                      handleGlobalInventoryScan(val);
                      e.currentTarget.value = "";
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('inv-manual-sku-input') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    handleGlobalInventoryScan(input.value.trim());
                    input.value = "";
                  }
                }}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-md active:scale-95 shrink-0"
              >
                PINDAI
              </button>
            </div>
          </div>
        </div>

        {/* Filter controls and text search box */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pt-1">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari katalog berdasarkan nama, merek, atau nomor SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 focus:border-teal-500 rounded-xl text-xs placeholder:text-slate-400 text-slate-855"
            />
          </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'Semua Kategori' : cat}</option>
            ))}
          </select>

          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-700 outline-hidden max-w-[150px]"
            title="Filter berdasarkan Supplier"
          >
            <option value="All">Semua Supplier</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {userRole === 'Super Admin' || userRole === 'Admin' ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setName('');
                  setCategory('Hardware Parts');
                  setPrice('');
                  setCost('');
                  setStock('10');
                  setSku('');
                  setUnit('pcs');
                  setBrand('');
                  setSpecifications('');
                  setSupplierId('');
                  setSupplierInvoiceNo('');
                  setSerialNumbersText('');
                  setPriceRetail('');
                  setPriceCorporate('');
                  setPricePartner('');
                  setIsFormOpen(true);
                }}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" /> Tambah Item / Layanan
              </button>
              {userRole === 'Super Admin' && (
                <button
                  type="button"
                  onClick={() => requestAdminAction('reset-products')}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
                  title="Mulai Setup Ulang & Bersihkan Database Produk"
                >
                  ⚙️ Reset Masal Barang &amp; Stok
                </button>
              )}
            </div>
          ) : (
            <div className="text-slate-400 text-xs font-bold bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
              🔒 Khusus Pemilik (Hanya Baca)
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Main Grid detailing product details */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Scroll assistance and Style sheet injector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-teal-50 animate-pulse" />
            <span className="text-[10px] font-black text-slate-550 uppercase tracking-widest font-mono">
              Database Stok & Inventaris Toko
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 font-mono hidden md:inline">
              Petunjuk: Gunakan tombol melayang di sisi kiri-kanan tabel untuk geser cepat secara horizontal.
            </span>
          </div>
        </div>

        <style>{`
          .custom-table-scroll {
            scrollbar-width: auto !important;
            scrollbar-color: #0d9488 #e2e8f0 !important;
          }
          .custom-table-scroll::-webkit-scrollbar {
            height: 12px !important;
            width: 12px !important;
            display: block !important;
          }
          .custom-table-scroll::-webkit-scrollbar-track {
            background: #e2e8f0 !important;
            border-radius: 6px !important;
          }
          .custom-table-scroll::-webkit-scrollbar-thumb {
            background: #0d9488 !important;
            border-radius: 6px !important;
            border: 3px solid #e2e8f0 !important;
          }
          .custom-table-scroll::-webkit-scrollbar-thumb:hover {
            background: #0f766e !important;
          }
        `}</style>

        {/* Relative Container with Floating Scroll Buttons */}
        <div className="relative group/tablescroll">
          {/* Floating Left Button - visible on hover for desktop users */}
          <button
            type="button"
            onClick={() => scrollTable('left')}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-teal-500 hover:bg-teal-400 text-slate-950 p-3 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all outline-hidden border border-teal-300 pointer-events-auto hidden sm:flex items-center justify-center cursor-pointer opacity-0 group-hover/tablescroll:opacity-100 focus-visible:opacity-100 duration-200"
            title="Geser Kiri (Slide Left)"
          >
            <ChevronLeft className="w-5 h-5 stroke-[3]" />
          </button>

          {/* Floating Right Button - visible on hover for desktop users */}
          <button
            type="button"
            onClick={() => scrollTable('right')}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-teal-500 hover:bg-teal-400 text-slate-950 p-3 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all outline-hidden border border-teal-300 pointer-events-auto hidden sm:flex items-center justify-center cursor-pointer opacity-0 group-hover/tablescroll:opacity-100 focus-visible:opacity-100 duration-200"
            title="Geser Kanan (Slide Right)"
          >
            <ChevronRight className="w-5 h-5 stroke-[3]" />
          </button>

          <div 
            ref={tableContainerRef}
            className="w-full overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)] sm:max-h-[640px] text-[11px] custom-table-scroll"
          >
            <table className="w-full min-w-[1280px] text-left border-collapse relative">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="sticky top-0 bg-slate-50 py-3 px-4 z-10 border-b border-slate-150 shadow-[0_1px_0_rgba(226,232,240,1)] w-[280px] min-w-[280px]">Nama Barang / SKU</th>
                  <th className="sticky top-0 bg-slate-50 py-3 px-4 z-10 border-b border-slate-150 shadow-[0_1px_0_rgba(226,232,240,1)] w-[120px] min-w-[120px]">Kategori</th>
                  <th className="sticky top-0 bg-slate-50 py-3 px-4 z-10 border-b border-slate-150 text-right shadow-[0_1px_0_rgba(226,232,240,1)] w-[200px] min-w-[200px]">Harga & Tier Jual (IDR)</th>
                  <th className="sticky top-0 bg-slate-50 py-3 px-4 z-10 border-b border-slate-150 text-center shadow-[0_1px_0_rgba(226,232,240,1)] w-[110px] min-w-[110px]">Stok & Satuan</th>
                  <th className="sticky top-0 bg-slate-50 py-3 px-4 z-10 border-b border-slate-150 shadow-[0_1px_0_rgba(226,232,240,1)] w-[180px] min-w-[180px]">Pemasok & Bukti Nota</th>
                  <th className="sticky top-0 bg-slate-50 py-3 px-4 z-10 border-b border-slate-150 shadow-[0_1px_0_rgba(226,232,240,1)] w-[160px] min-w-[160px]">Nomor Seri / SN</th>
                  <th className="sticky top-0 bg-slate-50 py-3 px-4 z-10 border-b border-slate-150 text-center shadow-[0_1px_0_rgba(226,232,240,1)] w-[110px] min-w-[110px]">Status Stok</th>
                  <th className="sticky top-0 bg-slate-50 py-3 px-4 z-10 border-b border-slate-150 text-right shadow-[0_1px_0_rgba(226,232,240,1)] w-[120px] min-w-[120px]">Aksi</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isEditing = editingProductId === p.id;
                const lowStock = p.stock !== null && p.stock <= 5;
                const markupPercent = p.cost > 0 ? Math.round(((p.price - p.cost) / p.cost) * 100) : 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Identification */}
                    <td className="py-3.5 px-4 min-w-[240px]">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-800 text-xs sm:text-sm block leading-tight">{p.name}</span>
                        <div className="flex flex-wrap gap-1 items-center mt-0.5">
                          <span className="text-[10px] font-mono bg-slate-105 px-1 rounded text-slate-500">SKU: {p.sku}</span>
                          {p.brand && (
                            <span className="text-[10px] font-bold bg-teal-50 border border-teal-150 text-teal-700 px-1 rounded-md">
                              {p.brand}
                            </span>
                          )}
                        </div>
                        {p.specifications && (
                          <span className="text-[10px] text-slate-400 line-clamp-2 mt-1 italic leading-relaxed" title={p.specifications}>
                            {p.specifications}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category Column */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 font-bold text-[9.5px]/none text-slate-600 rounded-md font-mono uppercase">
                        {p.category}
                      </span>
                    </td>

                    {/* Costing calculation */}
                    <td className="py-3.5 px-4 text-right min-w-[170px]">
                      <div className="space-y-1">
                        <div className="flex justify-between gap-2.5 items-center">
                          <span className="text-slate-400 font-medium text-[9px] uppercase">Walk-in:</span>
                          <span className="font-mono font-bold text-slate-800">{formatIDR(p.price)}</span>
                        </div>
                        {p.priceUSD !== undefined && (
                          <div className="flex justify-end items-center mb-1">
                            <span className="text-[9.5px] bg-amber-500/10 text-amber-700 font-extrabold px-1.5 py-0.5 rounded-md border border-amber-500/20 uppercase font-mono tracking-wider flex items-center gap-0.5" title="Harga Retail Terikat Kurs USD Global">
                              <DollarSign className="w-2.5 h-2.5 text-amber-600" /> ${p.priceUSD}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between gap-2.5 items-center">
                          <span className="text-slate-400 font-medium text-[9px] uppercase">Kantor:</span>
                          <span className="font-mono font-bold text-sky-700">{formatIDR(p.priceCorporate || Math.round(p.price * 1.05))}</span>
                        </div>
                        <div className="flex justify-between gap-2.5 items-center">
                          <span className="text-slate-400 font-medium text-[9px] uppercase">Partner:</span>
                          <span className="font-mono font-bold text-emerald-700">{formatIDR(p.pricePartner || Math.round(p.price * 0.95))}</span>
                        </div>
                        {/* Cost price and margin detail rows */}
                        {userRole === 'Super Admin' && (
                          <>
                            <div className="border-t border-slate-100 pt-1 mt-1 flex justify-between gap-2.5 items-center text-[10px]">
                              <span className="text-slate-455">Beli (Modal):</span>
                              <span className="font-mono text-slate-500 font-medium">{p.cost > 0 ? formatIDR(p.cost) : 'Rp 0'}</span>
                            </div>
                            {p.costUSD !== undefined && (
                              <div className="flex justify-end items-center mt-0.5">
                                <span className="text-[9px] text-amber-700 font-bold font-mono bg-amber-50 border border-amber-100 px-1 rounded-md uppercase">
                                  $Beli: ${p.costUSD}
                                </span>
                              </div>
                            )}
                            {p.cost > 0 && (
                              <div className="text-[9.5px] font-black text-teal-605 uppercase tracking-tight text-right pt-0.5">
                                Markup: +{markupPercent}%
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    {/* Stock Counts column */}
                    <td className="py-3.5 px-4 text-center">
                      {p.stock === null ? (
                        <span className="text-slate-400 font-medium italic text-[11px]">No Stock Limit</span>
                      ) : (
                        <span className={`font-mono font-bold ${lowStock ? 'text-rose-650' : 'text-slate-800'}`}>
                          {p.stock} {p.unit}
                        </span>
                      )}
                    </td>

                    {/* Supplier Column */}
                    <td className="py-3.5 px-4 min-w-[160px]">
                      <div className="space-y-1">
                        {p.supplierId ? (
                          <div className="flex items-start gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-700 block line-clamp-1">
                                {suppliers.find(s => s.id === p.supplierId)?.name || 'Unknown Supplier'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[10px] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>Tanpa Supplier</span>
                          </div>
                        )}

                        {p.supplierInvoiceNo ? (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md w-fit">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono font-semibold text-[9.5px]">Nota: {p.supplierInvoiceNo}</span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-rose-500 font-semibold block bg-rose-50 border border-slate-150 px-1 py-0.5 rounded-md w-fit">
                            No Invoice Supplier
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Serial Numbers Column */}
                    <td className="py-3.5 px-4 min-w-[140px]">
                      {p.serialNumbers && p.serialNumbers.length > 0 ? (
                        <div className="max-h-[65px] overflow-y-auto space-y-1 scrollbar-thin pr-1">
                          {p.serialNumbers.map((sn, idx) => (
                            <span key={idx} className="block text-[9.5px] font-mono bg-sky-50 text-sky-850 font-bold px-1 py-0.5 rounded-md border border-sky-100 truncate" title={sn}>
                              {sn}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No S/N logged</span>
                      )}
                    </td>

                    {/* Badges and stock alarm displays */}
                    <td className="py-3.5 px-4 text-center">
                      {p.stock !== null ? (
                        p.stock === 0 ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold text-[9px] border border-rose-100 rounded-md uppercase">
                            Out of Stock
                          </span>
                        ) : lowStock ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold text-[9px] border border-amber-100 rounded-md uppercase flex items-center gap-1 justify-center max-w-[100px] mx-auto animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-amber-605" /> Re-stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[9px] border border-emerald-100 rounded-md uppercase">
                            Available
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-sky-700 font-bold uppercase">Infinite (Service)</span>
                      )}
                    </td>

                    {/* Actions tools */}
                    <td className="py-3.5 px-4 text-right">
                      {userRole === 'Super Admin' || userRole === 'Admin' ? (
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setName(p.name);
                              setCategory(p.category);
                              setPrice(p.price.toString());
                              setCost(p.cost.toString());
                              setStock(p.stock !== null ? p.stock.toString() : '');
                              setSku(p.sku);
                              setUnit(p.unit);
                              setBrand(p.brand || '');
                              setSpecifications(p.specifications || '');
                              setSupplierId(p.supplierId || '');
                              setSupplierInvoiceNo(p.supplierInvoiceNo || '');
                              setSerialNumbersText(p.serialNumbers ? p.serialNumbers.join('\n') : '');
                              setPriceRetail(p.priceRetail ? p.priceRetail.toString() : p.price.toString());
                              setPriceCorporate(p.priceCorporate ? p.priceCorporate.toString() : '');
                              setPricePartner(p.pricePartner ? p.pricePartner.toString() : '');
                              setPriceUSD(p.priceUSD ? p.priceUSD.toString() : '');
                              setCostUSD(p.costUSD ? p.costUSD.toString() : '');
                              setIsFormOpen(true);
                            }}
                            className="px-2.5 py-1 text-[10.5px] border border-slate-205 text-slate-755 bg-white hover:bg-slate-50 font-bold rounded-lg transition-colors flex items-center gap-0.5"
                          >
                            <Edit2 className="w-3 h-3 text-teal-600" /> Edit Info
                          </button>
                          <button
                            onClick={() => {
                              requestAdminAction('delete-product', p.id);
                            }}
                            className="p-1 px-[7px] text-[10.5px] border border-rose-150 hover:bg-rose-50 text-rose-600 font-bold rounded-lg transition-colors flex items-center gap-0.5"
                            title="Hapus barang"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold italic">
                          🔒 Terkunci
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium text-sm">Tidak ada barang yang cocok dengan kriteria pencarian Anda.</p>
          </div>
        )}
      </div>

      {/* OVERLAY: Add New Part/Service Panel Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col"
          >
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Package className="w-4 h-4 text-teal-600" />
                {editingProduct ? 'Perbarui Suku Cadang / Katalog Produk' : 'Daftarkan Suku Cadang / Produk Baru'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-800 text-lg font-semibold px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* LEFT COLUMN: GENERAL & SUPPLIER INFO */}
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-[11px] text-teal-600 uppercase tracking-wider flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5" /> Informasi Dasar & Brand
                    </h4>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Nama Produk / Part *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Laptop ASUS ROG Zephyrus G14"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Merek / Brand</label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Contoh: ASUS, Lenovo, AMD"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-855 placeholder:text-slate-400 font-medium focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Kategori *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ItemCategory)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
                      >
                        <option value="LAPTOP">LAPTOP</option>
                        <option value="Hardware Parts">Hardware Parts</option>
                        <option value="Service & Repair">Service & Repair</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Software">Software</option>
                        <option value="BuildUp Komputer">BuildUp Komputer</option>
                        <option value="Server">Server</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">SKU Unik Kode</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="SKU-XXX-..."
                        className="flex-1 w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 uppercase focus:border-teal-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={generateSKU}
                        className="px-3 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center border border-slate-200"
                        title="Auto generate SKU code"
                      >
                        <Code className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* ADVANCED SUPPLIER & WARRANTY TRACKING */}
                  <div className="border-b border-slate-100 pb-2 pt-2">
                    <h4 className="font-bold text-[11px] text-teal-600 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Pemasok (Supplier) & Garansi
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Asal Supplier</label>
                      <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
                      >
                        <option value="">-- Pilih Supplier --</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">No Nota Supplier</label>
                      <input
                        type="text"
                        value={supplierInvoiceNo}
                        onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                        placeholder="Bukti Faktur Beli"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {category !== 'Service & Repair' && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Serial Numbers (S/N)</label>
                        <span className="text-[9px] text-slate-400 italic">Pisahkan dengan koma atau baris baru</span>
                      </div>
                      <textarea
                        rows={3}
                        value={serialNumbersText}
                        onChange={(e) => setSerialNumbersText(e.target.value)}
                        placeholder="Contoh:&#10;SN-8822991100&#10;SN-8822991101"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:border-teal-500 focus:outline-none placeholder:text-slate-350"
                      />
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: COST, TIER PRICES, SPECS */}
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-[11px] text-teal-600 uppercase tracking-wider flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Harga Tiap Klien & Profit
                    </h4>
                  </div>

                  {userRole === 'Super Admin' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Harga Modal (Beli) Rp</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Koster / Supplier Cost"
                          value={cost}
                          onChange={(e) => setCost(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Harga Umum (Retail) Rp *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="Pelanggan Tidak Tetap"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Harga Umum (Retail) Rp *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="Pelanggan Tidak Tetap"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-505 flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-amber-609" /> Harga Perusahaan Rp
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Kosongkan = auto -5%"
                        value={priceCorporate}
                        onChange={(e) => setPriceCorporate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-550 flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-emerald-600" /> Harga Partner Rp
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Kosongkan = auto -10%"
                        value={pricePartner}
                        onChange={(e) => setPricePartner(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* USD GLOBAL RATE BASE INPUT */}
                  <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 space-y-2 mt-1">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-650" />
                      <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">
                        Harga Berbasis Kurs USD Global ($US)
                      </span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full uppercase">
                        Otomatis
                      </span>
                    </div>
                    <p className="text-[9.5px] text-slate-500 leading-normal">
                      Isi bagian ini jika harga barang berpatokan pada Dollar. Harga Rupiah di atas akan otomatis disesuaikan secara real-time mengikuti fluktuasi Kurs USD Global.
                    </p>
                    {userRole === 'Super Admin' ? (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-extrabold text-slate-550 block uppercase">Modal Dasar (Cost) $US</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Nilai USD"
                            value={costUSD}
                            onChange={(e) => setCostUSD(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-extrabold text-slate-550 block uppercase">Harga Jual (Retail) $US</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Nilai USD"
                            value={priceUSD}
                            onChange={(e) => setPriceUSD(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1">
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-extrabold text-slate-550 block uppercase">Harga Jual (Retail) $US</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Nilai USD"
                            value={priceUSD}
                            onChange={(e) => setPriceUSD(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {category !== 'Service & Repair' && (
                    <div className="grid grid-cols-2 gap-3 pb-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Initial Stock</label>
                        <input
                          type="number"
                          min="0"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Satuan (Unit Type)</label>
                        <input
                          type="text"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          placeholder="pcs"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-850 focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-[11px] text-teal-600 uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Spesifikasi Teknis Detail
                    </h4>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Spesifikasi Laptop / Part</label>
                    <textarea
                      rows={category === 'Service & Repair' ? 6 : 4}
                      value={specifications}
                      onChange={(e) => setSpecifications(e.target.value)}
                      placeholder="Contoh:&#10;CPU: Intel Core i5 13th Gen&#10;Memory: 16GB LPDDR5 RAM&#10;Graphics: Intel Iris Xe Graphics&#10;Storage: 512GB PCIe NVMe SSD"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-teal-500 focus:outline-none leading-relaxed placeholder:text-slate-350"
                    />
                  </div>
                </div>

              </div>

              <div className="pt-4 flex gap-2 justify-end border-t border-slate-100 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-500 text-slate-950 font-extrabold rounded-xl text-xs hover:bg-teal-400 transition-colors shadow-md"
                >
                  {editingProduct ? 'Perbarui Katalog Produk' : 'Daftarkan Entri Produk Baru'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* OVERLAY: Excel Supplier Price List Reader Panel */}
      {isExcelOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col"
          >
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-bold text-sm">Pricelist Supplier Auto-Reader</h3>
                  <p className="text-[10px] text-slate-400">Unggah dari file Excel, sesuaikan kolom secara instan.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsExcelOpen(false);
                  setExcelRawRows([]);
                  setExcelHeaders([]);
                  setParsedImportProducts([]);
                }}
                className="text-slate-400 hover:text-white text-lg font-semibold px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* STEP 1: UPLOAD FILE */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-500 block">Pilih File Price List / Catalog Supplier</label>
                <div className="flex gap-3">
                  <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-teal-500 bg-slate-50 hover:bg-teal-500/5 px-4 py-6 rounded-2xl transition-all cursor-pointer text-center">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleExcelFileChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-700">
                        {excelFileName ? excelFileName : "Click untuk telusuri file spreadsheet..."}
                      </span>
                      <span className="text-[10px] text-slate-450">Format didukung: Microsoft Excel (.xlsx/.xls) atau Comma Separated (.csv)</span>
                    </div>
                  </label>
                </div>
              </div>

              {excelRawRows.length > 0 && (
                <div className="space-y-6 animate-fadeIn">
                  {/* STEP 2: CHOOSE SHEET WORKBOOK */}
                  {excelSheets.length > 1 && (
                    <div className="space-y-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <label className="text-[10px] font-black uppercase text-slate-550 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-teal-600" /> Pilih Tab Sheet Excel
                      </label>
                      <p className="text-[10px] text-slate-500">File ini memiliki beberapa tab sheet. Pilih lembar data price list supplier yang ingin dibaca:</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {excelSheets.map((sh) => (
                          <button
                            key={sh}
                            type="button"
                            onClick={() => {
                              setSelectedSheet(sh);
                              if (excelWorkbook) {
                                extractSheetData(excelWorkbook, sh);
                              }
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                              selectedSheet === sh
                                ? "bg-teal-500 border-teal-500 text-slate-950"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {sh}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 2.5: SHEET ANATOMY ANALYSIS & INTERACTIVE HEADER ROW SELECTOR */}
                  <div className="p-5 bg-teal-500/5 border border-teal-500/15 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center border-b border-teal-500/10 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Search className="w-4 h-4 text-teal-650 animate-pulse" />
                        <span className="text-[11px] font-extrabold uppercase text-slate-700 tracking-wide font-sans">
                          DETEKSI STRUKTUR SPREADSHEET (PILIH BARIS HEADER)
                        </span>
                      </div>
                      <button 
                        type="button"
                        className="text-[9.5px] bg-teal-500/10 hover:bg-teal-500/20 text-teal-850 font-extrabold px-2.5 py-1 rounded-md transition-all active:scale-95" 
                        onClick={() => handleSelectManualHeader(-1)}
                      >
                        Reset Deteksi Otomatis
                      </button>
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed">
                      Daftar harga dari supplier WA seringkali memiliki baris iklan, tanggal update, atau judul toko di baris-baris awal. 
                      <strong> Silakan klik pada baris di bawah yang memuat label nama-nama kolom Anda (Header)</strong> agar kolom terpetakan secara presisi:
                    </p>
                    
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[190px] overflow-y-auto scrollbar-thin text-[10px]/relaxed divide-y divide-slate-150/40">
                      {excelRawRows.slice(0, 18).map((row, idx) => {
                        if (!row) return null;
                        const isCurrentHeader = idx === (manualHeaderIndex !== -1 ? manualHeaderIndex : findBestHeaderRowIndex(excelRawRows));
                        const hasContent = row.some(cell => cell !== null && cell !== undefined && cell !== '');
                        
                        return (
                          <div 
                            key={idx} 
                            onClick={() => handleSelectManualHeader(idx)}
                            className={`group flex items-center justify-between p-2.5 transition-all text-left cursor-pointer select-none ${
                              isCurrentHeader 
                                ? "bg-teal-500/10 hover:bg-teal-500/15 border-l-4 border-teal-500 pl-2 font-semibold" 
                                : hasContent 
                                  ? "hover:bg-slate-50 text-slate-600 pl-3" 
                                  : "bg-slate-50/50 text-slate-400 pl-3 line-through"
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] font-mono shrink-0 ${
                                isCurrentHeader ? "bg-teal-500 text-slate-950" : "bg-slate-150 text-slate-500"
                              }`}>
                                {idx + 1}
                              </span>
                              <div className="flex gap-1.5 overflow-hidden truncate">
                                {row.slice(0, 7).map((cell: any, cIdx: number) => {
                                  const cellStr = cell !== null && cell !== undefined ? cell.toString().trim() : '';
                                  if (!cellStr) return null;
                                  return (
                                    <span 
                                      key={cIdx} 
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono truncate max-w-[125px] border shrink-0 ${
                                        isCurrentHeader 
                                          ? "bg-white border-teal-300 text-teal-850 font-bold" 
                                          : "bg-slate-100 border-slate-200 text-slate-700"
                                      }`}
                                    >
                                      {cellStr}
                                    </span>
                                  );
                                })}
                                {row.length > 7 && <span className="text-slate-400 self-center text-[9px] font-mono">+{row.length - 7} kol...</span>}
                                {!hasContent && <span className="text-[9px] text-slate-400 italic">Baris Kosong</span>}
                              </div>
                            </div>
                            
                            <div className="shrink-0 pl-1">
                              {isCurrentHeader ? (
                                <span className="bg-teal-500 text-slate-950 font-black px-1.5 py-0.5 rounded text-[8.5px] tracking-wider flex items-center gap-0.5 shadow-xs">
                                  🎯 HEADER AKTIF
                                </span>
                              ) : hasContent ? (
                                <span className="opacity-0 group-hover:opacity-100 bg-slate-150 group-hover:bg-teal-500 group-hover:text-slate-950 text-slate-600 font-extrabold px-1.5 py-0.5 rounded text-[8.5px] transition-all">
                                  Tandai Header ✓
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* STEP 3: MAPPING COLS */}
                  <div className="p-5 bg-slate-500/5 border border-slate-200/60 rounded-2xl space-y-4">
                    <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                      <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <ClipboardList className="w-4 h-4 text-teal-650" />
                        Pemetaan Kolom Spreadsheet Supplier
                      </h4>
                      <span className="text-[9px] bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-md uppercase">
                        Auto-Matched
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-550 leading-relaxed">
                      Sistem kami mendeteksi kolom berikut secara otomatis. Jika pemetaan dirasa kurang pas dengan isi file dari supplier Anda, cocokkan kembali menggunakan pemilih di bawah ini:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1.5">
                      {/* Name Column Mapper */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1">
                          <span className="text-rose-500">*</span> Nama Barang / Alat
                        </label>
                        <select
                          value={mappedNameIndex}
                          onChange={(e) => setMappedNameIndex(parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-705 focus:border-teal-500"
                        >
                          <option value="-1">-- Pilih Kolom Nama --</option>
                          {excelHeaders.map((h, idx) => (
                            <option key={idx} value={idx}>{h}</option>
                          ))}
                        </select>
                      </div>

                      {/* Price Column Mapper */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1">
                          <span className="text-rose-500">*</span> Harga Jual (Retail)
                        </label>
                        <select
                          value={mappedPriceIndex}
                          onChange={(e) => setMappedPriceIndex(parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-705 focus:border-teal-500"
                        >
                          <option value="-1">-- Pilih Kolom Harga Jual --</option>
                          {excelHeaders.map((h, idx) => (
                            <option key={idx} value={idx}>{h}</option>
                          ))}
                        </select>
                      </div>

                      {/* Cost Column Mapper */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Modal (Cost Supplier)</label>
                        <select
                          value={mappedCostIndex}
                          onChange={(e) => setMappedCostIndex(parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-705 focus:border-teal-500"
                        >
                          <option value="-1">-- Pilih Kolom Modal --</option>
                          {excelHeaders.map((h, idx) => (
                            <option key={idx} value={idx}>{h}</option>
                          ))}
                        </select>
                      </div>

                      {/* Promo Column Mapper */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Harga Promo (Dealer)</label>
                        <select
                          value={mappedPromoIndex}
                          onChange={(e) => setMappedPromoIndex(parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-705 focus:border-teal-500"
                        >
                          <option value="-1">-- Pilih Kolom Promo --</option>
                          {excelHeaders.map((h, idx) => (
                            <option key={idx} value={idx}>{h}</option>
                          ))}
                        </select>
                      </div>

                      {/* SKU / Code Mapper */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Kode / SKU Alat</label>
                        <select
                          value={mappedSkuIndex}
                          onChange={(e) => setMappedSkuIndex(parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-705 focus:border-teal-500"
                        >
                          <option value="-1">-- Auto-Generate / Pilih Kolom --</option>
                          {excelHeaders.map((h, idx) => (
                            <option key={idx} value={idx}>{h}</option>
                          ))}
                        </select>
                      </div>

                      {/* Stock Column Mapper */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Jumlah Stock / Qty</label>
                        <select
                          value={mappedStockIndex}
                          onChange={(e) => setMappedStockIndex(parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-705 focus:border-teal-500"
                        >
                          <option value="-1">-- Set Default (10) / Pilih Kolom --</option>
                          {excelHeaders.map((h, idx) => (
                            <option key={idx} value={idx}>{h}</option>
                          ))}
                        </select>
                      </div>

                      {/* Brand Column Mapper */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Merek / Brand Manufacturer</label>
                        <select
                          value={mappedBrandIndex}
                          onChange={(e) => setMappedBrandIndex(parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-705 focus:border-teal-500"
                        >
                          <option value="-1">-- Kosongkan / Pilih Kolom --</option>
                          {excelHeaders.map((h, idx) => (
                            <option key={idx} value={idx}>{h}</option>
                          ))}
                        </select>
                      </div>

                    {/* SECTION: LINK TO SUPPLIER */}
                    <div className="bg-teal-500/5 border border-teal-500/25 p-4 rounded-xl space-y-3 mt-3">
                      <h5 className="text-[10.5px] font-extrabold text-teal-850 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        <span className="inline-block w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                        Asosiasikan Ke Supplier & Nota Garansi
                      </h5>
                      <p className="text-[9.5px] text-slate-550 leading-relaxed font-sans font-medium">
                        Jika Anda menautkan file price list ini dengan supplier tertentu, sistem akan secara otomatis mencatat asal-usul barang dan nomor nota supplier pada semua item baru atau yang diperbarui. Ini sangat krusial untuk mempermudah klaim garansi pembeli di masa depan!
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                        {/* Selector supplier */}
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-extrabold text-slate-500 uppercase block font-sans">Pilih Supplier Pemilik Excel</label>
                          <select
                            value={importSupplierId}
                            onChange={(e) => setImportSupplierId(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans"
                          >
                            <option value="">-- Tanpa Tautan (Umum) --</option>
                            {suppliers.map((sup) => (
                              <option key={sup.id} value={sup.id}>
                                {sup.name} {sup.productLine ? `(${sup.productLine})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Invoice supplier */}
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-extrabold text-slate-500 uppercase block font-sans">No. Nota / Invoice Pembelian Supplier</label>
                          <input
                            type="text"
                            placeholder="Contoh: INV-SUPPLY-2026/A"
                            value={importSupplierInvoiceNo}
                            onChange={(e) => setImportSupplierInvoiceNo(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-755 outline-none focus:ring-1 focus:ring-teal-500 placeholder-slate-400 font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-150 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-3">
                      {/* DEFAULT CATEGORY */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-550 block">Set Default Kategori Barang Baru</label>
                        <select
                          value={defaultCategoryForImport}
                          onChange={(e) => setDefaultCategoryForImport(e.target.value as ItemCategory)}
                          disabled={importAllSheets}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none font-semibold font-sans disabled:opacity-50"
                        >
                          <option value="LAPTOP">LAPTOP</option>
                          <option value="Hardware Parts">Hardware Parts</option>
                          <option value="Accessories">Accessories</option>
                          <option value="Software">Software</option>
                          <option value="BuildUp Komputer">BuildUp Komputer</option>
                          <option value="Server">Server</option>
                        </select>
                        {importAllSheets && (
                          <span className="text-[9px] text-cyan-600 block mt-1 font-semibold leading-tight animate-pulse">
                            Kategori diatur otomatis berdasarkan nama tiap tab sheet!
                          </span>
                        )}
                      </div>

                      {/* MULTI-SHEET ENTIRE WORKBOOK IMPORT TOGGLE */}
                      <div className="flex bg-cyan-500/5 p-2.5 rounded-xl border border-cyan-500/10 items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="import_all_sheets"
                          checked={importAllSheets}
                          onChange={(e) => setImportAllSheets(e.target.checked)}
                          className="w-4 h-4 text-cyan-600 border-cyan-350 rounded-md focus:ring-cyan-500 mt-0.5 cursor-pointer"
                        />
                        <label htmlFor="import_all_sheets" className="space-y-0.5 whitespace-normal cursor-pointer select-none">
                          <span className="text-[10.5px] font-bold text-cyan-850 block">Impor Semua Tab Sheet Sekaligus</span>
                          <span className="text-[9px] text-slate-505 block leading-tight">Otomatis membaca ke-49 tab sheet laptop & komponen, memetakan kategori, dan mengimpor semuanya sekaligus secara hands-free!</span>
                        </label>
                      </div>

                      {/* PRICING TREATMENT TOGGLE (TREAT PRICE AS COST) */}
                      <div className="flex bg-teal-500/5 p-2.5 rounded-xl border border-teal-500/10 items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="treat_price_as_cost"
                          checked={treatPriceAsCost}
                          onChange={(e) => setTreatPriceAsCost(e.target.checked)}
                          className="w-4 h-4 text-teal-600 border-teal-350 rounded-md focus:ring-teal-500 mt-0.5 cursor-pointer"
                        />
                        <label htmlFor="treat_price_as_cost" className="space-y-0.5 whitespace-normal cursor-pointer select-none">
                          <span className="text-[10.5px] font-bold text-slate-800 block">Atur Kolom Harga Excel sebagai Modal (Cost)</span>
                          <span className="text-[9px] text-slate-505 block leading-tight">Direkomendasikan! Otomatis atur harga supplier sebagai modal beli, dan pakai Markup % di samping untuk menghitung Harga Jual.</span>
                        </label>
                      </div>

                      {/* USD TOGGLE CHECKBOX */}
                      <div className="flex bg-slate-50 p-2.5 rounded-xl border border-slate-100 items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="excel_usd_base"
                          checked={isExcelUSDBased}
                          onChange={(e) => setIsExcelUSDBased(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 border-slate-200 rounded-md focus:ring-emerald-500 mt-0.5 cursor-pointer"
                        />
                        <label htmlFor="excel_usd_base" className="space-y-0.5 whitespace-normal cursor-pointer select-none">
                          <span className="text-[10.5px] font-black text-slate-800 block">Harga di File dalam Dollar ($US)</span>
                          <span className="text-[9px] text-slate-455 block leading-tight">Memicu auto-convert rupiah (dikali {formatIDR(usdRate)}) dan mengikat patokan Kurs global.</span>
                        </label>
                      </div>

                      {/* AUTO-MARKUP PRICING CONFIG */}
                      <div className="bg-teal-500/5 p-2.5 rounded-xl border border-teal-500/15 flex flex-col justify-between">
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            id="is_markup_enabled"
                            checked={isMarkupEnabled}
                            onChange={(e) => setIsMarkupEnabled(e.target.checked)}
                            className="w-4 h-4 text-teal-600 border-teal-300 rounded-md focus:ring-teal-500 mt-0.5 cursor-pointer"
                          />
                          <label htmlFor="is_markup_enabled" className="space-y-0.5 cursor-pointer select-none">
                            <span className="text-[10.5px] font-black text-slate-800 block">Auto-Markup Persen (%)</span>
                            <span className="text-[9px] text-slate-500 block leading-tight">Ubah harga modal supplier + persentase profit sebagai harga jual retail otomatis.</span>
                          </label>
                        </div>
                        {isMarkupEnabled && (
                          <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-teal-500/10 justify-between">
                            <span className="text-[9.5px] font-bold text-slate-550 uppercase">Input Selisih Margin:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="1000"
                                value={markupPercentage}
                                onChange={(e) => setMarkupPercentage(e.target.value)}
                                className="w-16 px-2 py-0.5 text-center bg-white border border-teal-200 rounded-md text-xs font-mono font-bold text-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                              />
                              <span className="text-xs font-extrabold text-teal-600">%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>    </div>

                    <div className="pt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2 text-slate-550">
                      <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                      <span className="text-[10px] font-semibold leading-tight text-slate-600">
                        Hasil pratinjau dikonfigurasi & diperbarui otomatis secara real-time berdasarkan pilihan pemetaan kolom di atas.
                      </span>
                    </div>
                  </div>

                  {/* PARSED PRODUCTS PREVIEW BOARD */}
                  {parsedImportProducts.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-slate-150">
                      {/* SUMMARY STATS GRID */}
                      <div className="grid grid-cols-3 gap-2.5 bg-teal-500/5 p-3 rounded-xl border border-teal-500/15 text-center animate-fadeIn">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wide">Total Terbaca</span>
                          <span className="text-sm font-extrabold text-slate-800 font-mono mt-0.5">{importSummary.total} item</span>
                        </div>
                        <div className="flex flex-col border-x border-slate-200">
                          <span className="text-[9px] uppercase font-bold text-emerald-600 tracking-wide">➕ Baru (Add)</span>
                          <span className="text-sm font-extrabold text-emerald-700 font-mono mt-0.5">{importSummary.newCount} item</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase font-bold text-amber-600 tracking-wide">🔄 Update</span>
                          <span className="text-sm font-extrabold text-amber-700 font-mono mt-0.5">{importSummary.updateCount} item</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10.5px] font-extrabold text-slate-800 uppercase flex items-center gap-1.5 font-mono">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          Hasil Pembacaan Spreadsheet Lengkap:
                        </span>
                        <span className="text-[9px] text-teal-600 font-bold bg-teal-500/10 px-2 py-0.5 rounded-md">Geser/Scroll ke bawah untuk melihat semua</span>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-[10px] max-h-[280px] overflow-y-auto overflow-x-auto custom-table-scroll">
                        <table className="w-full min-w-[680px] text-left relative border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-extrabold text-[8.5px] sticky top-0 z-10 shadow-[0_1px_0_rgba(226,232,240,1)]">
                              <th className="py-2 px-3 bg-slate-50">Nama Alat / Brand</th>
                              <th className="py-2 px-3 text-right bg-slate-50">Harga Jual (Retail)</th>
                              {userRole === 'Super Admin' && (
                                <th className="py-2 px-3 text-right bg-slate-50">Modal Beli</th>
                              )}
                              <th className="py-2 px-3 text-center bg-slate-50">Stok</th>
                              <th className="py-2 px-3 bg-slate-50">Status Impor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {parsedImportProducts.map((prod, idx) => {
                              // Tentukan apakah barang ini sudah ada di inventaris aktif
                              const alreadyHas = products.find(p => 
                                (p.sku && prod.sku && p.sku.toLowerCase() === prod.sku.toLowerCase()) || 
                                (p.name && prod.name && p.name.toLowerCase() === prod.name.toLowerCase())
                              );

                              return (
                                <tr key={idx} className="hover:bg-slate-50/70 transition-all">
                                  <td className="py-2 px-3 max-w-[200px] truncate">
                                    <span className="font-bold text-slate-800 block text-xs truncate">{prod.name}</span>
                                    <span className="text-[9.5px] text-slate-455 font-mono">SKU: {prod.sku} | Brand: {prod.brand || "--"}</span>
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                                    {prod.priceUSD !== undefined ? `$${prod.priceUSD} USD` : ""}
                                    <span className="block text-[9.5px] text-slate-500 font-medium">
                                      {formatIDR(prod.price || 0)}
                                      {isMarkupEnabled && (prod.cost || 0) > 0 && (
                                        <span className="inline-block text-[8px] bg-teal-500/10 text-teal-700 px-1 py-0.2 rounded font-sans font-bold ml-1">
                                          +{markupPercentage}%
                                        </span>
                                      )}
                                    </span>
                                  </td>
                                  {userRole === 'Super Admin' && (
                                    <td className="py-2 px-3 text-right font-mono text-slate-600">
                                      {prod.costUSD !== undefined ? `$${prod.costUSD} USD` : ""}
                                      <span className="block text-[9.5px] text-slate-400 font-medium">{formatIDR(prod.cost || 0)}</span>
                                    </td>
                                  )}
                                  <td className="py-2 px-3 text-center font-bold text-slate-700 font-mono">
                                    {prod.stock} pcs
                                  </td>
                                  <td className="py-2 px-3">
                                    {alreadyHas ? (
                                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-bold text-[8.5px] uppercase">
                                        ⚡ Update Harga/Stok
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-bold text-[8.5px] uppercase">
                                        + Baru (Add Item)
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {importMessage && (
                <div className="p-3.5 bg-sky-50 text-sky-850 rounded-xl text-xs border border-sky-150 leading-relaxed font-semibold">
                  {importMessage}
                </div>
              )}

              <div className="pt-4 flex gap-2 justify-end border-t border-slate-100 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setIsExcelOpen(false);
                    setExcelRawRows([]);
                    setExcelHeaders([]);
                    setParsedImportProducts([]);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-650 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={parsedImportProducts.length === 0 || isImporting}
                  onClick={handleApplyImport}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-md flex items-center gap-1.5"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memasukkan data...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Simpan ke Inventory
                    </>
                  )}
                </button>
              </div>
            </div>
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
              className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 text-slate-800 text-left"
            >
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 border border-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-850 text-base">Otoritas Privilege Admin</h3>
                <p className="text-slate-500 text-xs mt-1">
                  Fitur ini dibatasi untuk Admin/Super Admin. Masukkan kode otentikasi.
                </p>
                <div className="bg-amber-50 rounded-lg p-2 mt-2 border border-amber-100">
                  <p className="text-[10px] text-amber-700 font-semibold font-mono">
                    💡 PIN Default: <strong className="underline font-bold text-emerald-800">admin</strong> atau <strong className="underline font-bold text-emerald-800">1234</strong>
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerifyPIN} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-sans">
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
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl text-center text-sm tracking-widest font-mono outline-none text-slate-850"
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

        {/* OVERLAY: Real-time Barcode Actions Modal (For existing / new scanned codes) */}
        {isBarcodeControlModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-md text-slate-800">
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.93 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-6 relative overflow-hidden text-left"
            >
              {/* Pulsing red laser decorative line inside scanned popup */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-red-500 to-teal-500 opacity-80"></div>

              <div className="flex items-center justify-between border-b pb-3 border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📷</span>
                  <div>
                    <h3 className="font-extrabold text-[#0f172a] text-sm sm:text-base leading-tight">PINDAI DETEKSI INTEL</h3>
                    <p className="text-[10px] text-slate-400 font-bold font-mono tracking-widest uppercase">REAL-TIME INVENTORY HARMONIZER</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBarcodeControlModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {scannedProductMatch ? (
                // EXISTING PRODUCT ACTIONS PANEL
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                    <span className="text-[9px] font-black font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase tracking-widest">
                      BARCODE DIKENALI
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1.5 leading-snug">
                      [{scannedProductMatch.sku}] {scannedProductMatch.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200/50 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">KATEGORI:</span>
                        <p className="font-semibold text-slate-700">{scannedProductMatch.category}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">HARGA JUAL:</span>
                        <p className="font-extrabold text-[#0D9488]">{formatIDR(scannedProductMatch.price)}</p>
                      </div>
                      <div className="col-span-2 pt-1">
                        <span className="text-[10px] text-slate-400 font-bold block">STOK SEKARANG:</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-lg ${
                            scannedProductMatch.stock === null 
                              ? 'bg-sky-50 text-sky-700 border border-sky-100 font-mono text-xs uppercase'
                              : (scannedProductMatch.stock || 0) <= 3 
                              ? 'bg-rose-50 text-rose-700 border border-rose-100 font-mono'
                              : 'bg-teal-50 text-teal-800 border border-teal-100 font-mono'
                          }`}>
                            {scannedProductMatch.stock === null ? 'INFINITE (Layanan)' : `${scannedProductMatch.stock} ${scannedProductMatch.unit}`}
                          </span>
                          {(scannedProductMatch.stock !== null && scannedProductMatch.stock <= 3) && (
                            <span className="text-[10px] text-rose-500 font-black animate-pulse flex items-center gap-0.5">
                              ⚠️ STOK MENIPIS!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {scannedProductMatch.category !== 'Service & Repair' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        ⚙️ AKTIVITAS STOK INSTAN:
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 flex gap-1 items-stretch">
                          <input
                            type="number"
                            min="1"
                            value={addStockDirectValue}
                            onChange={(e) => setAddStockDirectValue(e.target.value)}
                            className="bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 rounded-xl px-2.5 text-center text-xs font-bold font-mono text-slate-800 focus:bg-white outline-none w-14"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const qty = parseInt(addStockDirectValue) || 1;
                              handleDirectStockAdd(scannedProductMatch, qty);
                            }}
                            className="flex-1 py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                          >
                            ➕ TAMBAH STOK
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={scannedProductMatch.stock === null || (scannedProductMatch.stock || 0) <= 0}
                          onClick={() => {
                            const qty = parseInt(addStockDirectValue) || 1;
                            const decVal = -qty;
                            handleDirectStockAdd(scannedProductMatch, decVal);
                          }}
                          className="py-2 px-3 border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 disabled:opacity-40 disabled:hover:bg-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          ➖ KURANGI
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsBarcodeControlModalOpen(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs text-center transition-all cursor-pointer"
                    >
                      Selesai
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBarcodeControlModalOpen(false);
                        // Open main form and prefill data
                        setEditingProduct(scannedProductMatch);
                        setName(scannedProductMatch.name);
                        setCategory(scannedProductMatch.category);
                        setPrice(scannedProductMatch.price.toString());
                        setCost(scannedProductMatch.cost.toString());
                        setStock(scannedProductMatch.stock !== null ? scannedProductMatch.stock.toString() : '');
                        setSku(scannedProductMatch.sku);
                        setUnit(scannedProductMatch.unit);
                        setBrand(scannedProductMatch.brand || '');
                        setSpecifications(scannedProductMatch.specifications || '');
                        setSupplierId(scannedProductMatch.supplierId || '');
                        setSupplierInvoiceNo(scannedProductMatch.supplierInvoiceNo || '');
                        setSerialNumbersText(scannedProductMatch.serialNumbers ? scannedProductMatch.serialNumbers.join('\n') : '');
                        setPriceRetail(scannedProductMatch.priceRetail ? scannedProductMatch.priceRetail.toString() : scannedProductMatch.price.toString());
                        setPriceCorporate(scannedProductMatch.priceCorporate ? scannedProductMatch.priceCorporate.toString() : '');
                        setPricePartner(scannedProductMatch.pricePartner ? scannedProductMatch.pricePartner.toString() : '');
                        setPriceUSD(scannedProductMatch.priceUSD ? scannedProductMatch.priceUSD.toString() : '');
                        setCostUSD(scannedProductMatch.costUSD ? scannedProductMatch.costUSD.toString() : '');
                        setIsFormOpen(true);
                      }}
                      className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs text-center transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                    >
                      ✏️ EDIT KATALOG PENUH
                    </button>
                  </div>
                </div>
              ) : (
                // NEW UNREGISTERED BARCODE ACTIONS PANEL
                <div className="space-y-4">
                  <div className="bg-rose-50 border border-rose-150 p-4 rounded-2xl flex flex-col items-center text-center">
                    <span className="text-[10px] font-black font-mono text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded border border-rose-200 uppercase tracking-widest animate-pulse">
                      BARCODE BARU UNKNOWN
                    </span>
                    <h4 className="font-extrabold text-rose-900 text-base mt-2.5 tracking-wider font-mono">
                      "{scannedBarcodeCode}"
                    </h4>
                    <p className="text-xs text-rose-650 mt-1.5 leading-snug">
                      Informasi alat-alat dengan nomor barcode ini belum terdaftar di database sistem Torky Komputer!
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsBarcodeControlModalOpen(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs text-center transition-all cursor-pointer"
                    >
                      Abaikan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBarcodeControlModalOpen(false);
                        // Open form and prefill SKU
                        setEditingProduct(null);
                        setName('');
                        setCategory('Hardware Parts');
                        setPrice('');
                        setCost('');
                        setStock('10');
                        setSku(scannedBarcodeCode); // PREFILL THE SCANNED CODE!
                        setUnit('pcs');
                        setBrand('');
                        setSpecifications('');
                        setSupplierId('');
                        setSupplierInvoiceNo('');
                        setSerialNumbersText('');
                        setPriceRetail('');
                        setPriceCorporate('');
                        setPricePartner('');
                        setPriceUSD('');
                        setCostUSD('');
                        setIsFormOpen(true);
                      }}
                      className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs text-center transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer animate-pulse"
                    >
                      ➕ REGISTER BARU
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
