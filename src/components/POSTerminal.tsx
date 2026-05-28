import React, { useState, useMemo, useRef } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, Tag, Printer, User, DollarSign, RefreshCw, Layers, CheckCircle, Truck, Phone, MessageSquare, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { Product, CartItem, PaymentMethod, Transaction, ItemCategory, Customer, UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import { 
  formatIDR, 
  DENPASAR_PAYMENT_METHODS, 
  DENPASAR_SHIPPING_METHODS, 
  getWhatsAppShareUrl, 
  generateWhatsAppInvoiceMessage 
} from '../utils';

export const TARGET_SHIP_LOCATIONS = [
  // Bali Area (Real distances from Celuk Panjer, Denpasar South)
  { id: 'denpasar_kota', name: 'Denpasar Kota (Celuk-Panjer-Renon, Kreneng)', tag: 'GoSend/Grab - Instant', category: 'bali_local' },
  { id: 'kuta_seminyak', name: 'Badung Selatan (Kuta, Seminyak, Legian, Kerobokan)', tag: 'GoSend/Grab - Instant', category: 'bali_local' },
  { id: 'canggu', name: 'Badung Utara (Canggu, Dalung, Tibubeneng)', tag: 'GoSend/Grab - Instant', category: 'bali_local' },
  { id: 'jimbaran_nusadua', name: 'Badung Bukit (Jimbaran, Nusa Dua, Uluwatu, Pecatu)', tag: 'GoSend/Grab - Instant', category: 'bali_local' },
  { id: 'gianyar_kota', name: 'Gianyar Kota / Sukawati / Batubulan', tag: 'GoSend/Grab / J&T Cargo', category: 'bali_regional' },
  { id: 'gianyar_ubud', name: 'Gianyar - Ubud Centro / Tegallalang', tag: 'GoSend/Grab / J&T Cargo', category: 'bali_regional' },
  { id: 'tabanan_kota', name: 'Tabanan Kota / Kediri / Tanah Lot', tag: 'GoSend/Grab / J&T Cargo', category: 'bali_regional' },
  { id: 'klungkung_kota', name: 'Klungkung Kota / Semarapura / Gelgel', tag: 'J&T / JNE Reguler', category: 'bali_regional' },
  { id: 'bangli_kota', name: 'Bangli Kota / Kintamani / Susut', tag: 'J&T / JNE Reguler', category: 'bali_regional' },
  { id: 'karangasem_amlapura', name: 'Karangasem - Amlapura / Candidasa / Padangbai', tag: 'J&T / JNE Reguler', category: 'bali_regional' },
  { id: 'buleleng_singaraja', name: 'Buleleng - Singaraja Kota / Lovina / Seririt', tag: 'J&T / JNE Reguler', category: 'bali_regional' },
  { id: 'jembrana_negara', name: 'Jembrana - Negara Kota / Gilimanuk / Pekutatan', tag: 'J&T / JNE Reguler', category: 'bali_regional' },
  
  // Jawa Regional Cargo
  { id: 'surabaya', name: 'Kota Surabaya (Jawa Timur)', tag: 'J&T/JNE Cargo', category: 'jawa' },
  { id: 'jakarta', name: 'DKI Jakarta (Jabodetabek)', tag: 'J&T/JNE Cargo', category: 'jawa' },
  { id: 'yogyakarta', name: 'Yogyakarta DIY', tag: 'J&T/JNE Cargo', category: 'jawa' },

  // Outer Islands Regional Cargo
  { id: 'makassar', name: 'Kota Makassar (Sulawesi Selatan)', tag: 'JNE / J&T Regular Air', category: 'luar_jawa' },
  { id: 'medan', name: 'Kota Medan (Sumatera Utara)', tag: 'JNE / J&T Regular Air', category: 'luar_jawa' },
  { id: 'balikpapan', name: 'Kota Balikpapan (Kalimantan Timur)', tag: 'JNE / J&T Regular Air', category: 'luar_jawa' }
];

interface POSTerminalProps {
  products: Product[];
  customers: Customer[];
  onUpdateStock: (productId: string, quantityToDeduct: number) => void;
  onAddTransaction: (transaction: Transaction) => void;
  customerNamePreset?: string; // Loaded automatically if POS opened from a repair ticket
  customerPhonePreset?: string;
  presetCartItemsPreset?: { product: Product; quantity: number }[];
  onClearPresetCustomer?: () => void;
  userRole?: UserRole;
  storeConfig?: {
    name: string;
    powerTitle: string;
    logoUrl: string;
    businessSector: string;
    address: string;
    phone: string;
  };
  onAddCustomer?: (newCustomer: Customer) => void;
  onResetCustomers?: () => void;
}

export default function POSTerminal({
  products,
  customers = [],
  onUpdateStock,
  onAddTransaction,
  customerNamePreset = '',
  customerPhonePreset = '',
  presetCartItemsPreset = [],
  onClearPresetCustomer,
  userRole = 'Kasir',
  storeConfig = {
    name: 'Torky Komputer',
    powerTitle: 'Anda Yang Utama',
    logoUrl: '',
    businessSector: 'Electronics',
    address: 'Jl. Ahmad Yani No. 88, Denpasar',
    phone: '0812-3456-7890',
  },
  onAddCustomer,
  onResetCustomers,
}: POSTerminalProps) {
  // Navigation & Search State
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Categories slider reference and scrolling assist
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesContainerRef.current) {
      const scrollAmount = 180;
      categoriesContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0); // manual absolute dollar discount
  const [customerName, setCustomerName] = useState(customerNamePreset);
  const [customerPhone, setCustomerPhone] = useState(customerPhonePreset);

  // Selected B2B Customer Integration State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Delivery State
  const [selectedCourierId, setSelectedCourierId] = useState<string>('pickup');
  const [shippingDistanceKm, setShippingDistanceKm] = useState<number>(3); // computed automatically based on chosen location
  const [shippingDestination, setShippingDestination] = useState<string>('denpasar_kota');

  const [apiShippingPrice, setApiShippingPrice] = useState<number>(0);
  const [apiCourierDescription, setApiCourierDescription] = useState<string>('');
  const [apiCourierSource, setApiCourierSource] = useState<string>('');
  const [isFetchShippingLoading, setIsFetchShippingLoading] = useState<boolean>(false);


  // Checkout Flow State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [latestCompletedTransaction, setLatestCompletedTransaction] = useState<Transaction | null>(null);
  const [taxRate, setTaxRate] = useState<number>(0.12); // Default to standard Indonesian PPN rate (12% as of 2025/2026)

  // Auto-sync preset customer name and cart if changes occur externally
  React.useEffect(() => {
    if (customerNamePreset) {
      setCustomerName(customerNamePreset);
    }
    if (customerPhonePreset) {
      setCustomerPhone(customerPhonePreset);
    }
  }, [customerNamePreset, customerPhonePreset]);

  // States for Quick Add Customer modal
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustType, setNewCustType] = useState<'Pribadi' | 'Perusahaan' | 'Sesama Toko'>('Pribadi');
  const [newCustDiscount, setNewCustDiscount] = useState<number>(0);

  const handleRegisterCustomerDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      name: newCustName.trim(),
      phone: newCustPhone.trim() || '0000',
      email: newCustEmail.trim() || undefined,
      address: newCustAddress.trim() || undefined,
      type: newCustType,
      discountPercent: newCustDiscount,
      companyName: newCustType === 'Perusahaan' ? newCustName.trim() : undefined,
    };

    onAddCustomer?.(newCust);
    
    // Auto-select this newly created customer!
    setSelectedCustomerId(newCust.id);
    setCustomerName(newCust.name);
    setCustomerPhone(newCust.phone);
    
    const calculatedSubtotal = cart.reduce((acc, item) => acc + (getItemPrice(item.product) + (item.ramPriceSurcharge || 0) + (item.storagePriceSurcharge || 0)) * item.quantity, 0);
    const autoDisc = Math.round(calculatedSubtotal * (newCust.discountPercent / 100));
    setDiscount(autoDisc);

    // Reset states and close modal
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setNewCustAddress('');
    setNewCustType('Pribadi');
    setNewCustDiscount(0);
    setIsAddCustModalOpen(false);
  };

  React.useEffect(() => {
    if (presetCartItemsPreset && presetCartItemsPreset.length > 0) {
      const initialCart: CartItem[] = presetCartItemsPreset.map(item => ({
        id: item.product.id,
        product: item.product,
        quantity: item.quantity
      }));
      setCart(initialCart);
    }
  }, [presetCartItemsPreset]);

  const [showPremium, setShowPremium] = useState<boolean>(false);

  // Categories
  const categories: (ItemCategory | 'All')[] = useMemo(() => {
    return showPremium
      ? [
          'All',
          'Hardware Parts',
          'Service & Repair',
          'Accessories',
          'Software',
          'LAPTOP',
          'BuildUp Komputer',
          'Server',
          'Gadget',
          'Lainnya'
        ]
      : ['All', 'Hardware Parts', 'Service & Repair', 'Accessories', 'Software'];
  }, [showPremium]);

  // Handle resetting premium categories if mode deactivated
  const handleTogglePremium = (val: boolean) => {
    setShowPremium(val);
    if (!val) {
      setSelectedCategory('All');
    }
  };

  // Filter products based on search & category selection
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Exclude premium groups from standard default POS browsing to keep cashier view clean
      const isExcluded = 
        !showPremium && (
          product.category === 'LAPTOP' || 
          product.category === 'BuildUp Komputer' || 
          product.category === 'Server' || 
          product.category === 'Gadget' || 
          product.category === 'Lainnya'
        );

      if (isExcluded) return false;

      const matchCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery, showPremium]);

  // Barcode integration system states
  const [barcodeAlert, setBarcodeAlert] = useState<{ message: string; sub: string; success: boolean } | null>(null);
  const barcodeBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  // High-fidelity synthesized custom POS audio indicator
  const triggerBarcodeBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      // Standard professional barcode beep: 1450Hz for 75ms
      osc.frequency.setValueAtTime(1450, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.075);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.075);
    } catch (err) {
      console.log("AudioContext blocked or unavailable:", err);
    }
  };

  const showBarcodeNotification = (product: Product) => {
    setBarcodeAlert({
      message: "BARCODE SCANNED",
      sub: `[${product.sku}] ${product.name}`,
      success: true
    });
  };

  const showNotificationError = (msg: string) => {
    setBarcodeAlert({
      message: "SCANNER ERROR",
      sub: msg,
      success: false
    });
  };

  // Auto-fading notifications
  React.useEffect(() => {
    if (barcodeAlert) {
      const timer = setTimeout(() => {
        setBarcodeAlert(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [barcodeAlert]);

  // Global Keyboard Wedging Listener for fast high-speed physical handheld USB or Bluetooth scanners
  React.useEffect(() => {
    const handleGlobalWedgeScan = (e: KeyboardEvent) => {
      // Avoid locking modifier buttons
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
        return;
      }

      const now = Date.now();
      const interval = now - lastKeyTime.current;
      lastKeyTime.current = now;

      // Real physical scanner hardware fires letters within < 40ms of each other
      if (interval > 80) {
        // Normal manual slow typing - clear previous cache to avoid mixing regular inputs
        barcodeBuffer.current = '';
      }

      const isInputFocused = document.activeElement && (
        document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA'
      );

      // Support common safe alphanumeric charcodes
      if (e.key.length === 1 && /[a-zA-Z0-9\-_]/.test(e.key)) {
        barcodeBuffer.current += e.key;
      } else if (e.key === 'Enter') {
        const finalCode = barcodeBuffer.current.trim();
        if (finalCode.length >= 2) {
          // Attempt to find product matching either SKU or unique item product ID
          const match = products.find(p => p.sku && p.sku.toUpperCase() === finalCode.toUpperCase());
          if (match) {
            e.preventDefault();
            e.stopPropagation();

            // Add the item to pos bag
            addToCart(match);
            triggerBarcodeBeep();
            showBarcodeNotification(match);

            // If user's keyboard was on the search query field, clear it so they can see items
            if (isInputFocused && document.activeElement instanceof HTMLInputElement) {
              if (document.activeElement.id === 'pos-search-input' || document.activeElement.placeholder.includes('Search')) {
                setSearchQuery('');
              }
            }

            // Flush buffer
            barcodeBuffer.current = '';
          }
        }
        // Flush buffer
        barcodeBuffer.current = '';
      }
    };

    window.addEventListener('keydown', handleGlobalWedgeScan, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalWedgeScan, true);
    };
  }, [products, showPremium]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        // Respect stock limit
        if (product.stock !== null && existingItem.quantity >= product.stock) {
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { id: product.id, product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === productId) {
            const nextQuantity = item.quantity + change;
            if (nextQuantity <= 0) return null;
            // Respect stock ceiling
            if (item.product.stock !== null && nextQuantity > item.product.stock) {
              return item;
            }
            return { ...item, quantity: nextQuantity };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateUpgradeOptions = (
    productId: string,
    ramUpgrade?: string,
    ramPriceSurcharge?: number,
    storageUpgrade?: string,
    storagePriceSurcharge?: number
  ) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === productId) {
          return {
            ...item,
            selectedRamUpgrade: ramUpgrade,
            ramPriceSurcharge: ramPriceSurcharge,
            selectedStorageUpgrade: storageUpgrade,
            storagePriceSurcharge: storagePriceSurcharge,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedCustomerId('');
    setSelectedCourierId('pickup');
    if (onClearPresetCustomer) onClearPresetCustomer();
  };

  // Helper for computing price tier per customized checkout customer type
  const getItemPrice = (product: Product): number => {
    if (!selectedCustomerId) return product.priceRetail || product.price;
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return product.priceRetail || product.price;

    if (customer.type === 'Perusahaan') {
      return product.priceCorporate || Math.round((product.priceRetail || product.price) * 0.95);
    } else if (customer.type === 'Sesama Toko') {
      return product.pricePartner || Math.round((product.priceRetail || product.price) * 0.90);
    }
    return product.priceRetail || product.price;
  };

  // Tax and Calculation Summaries
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const baseItemPrice = getItemPrice(item.product);
      const withUpgrades = baseItemPrice + (item.ramPriceSurcharge || 0) + (item.storagePriceSurcharge || 0);
      return acc + withUpgrades * item.quantity;
    }, 0);
  }, [cart, selectedCustomerId, customers]);

  // Reactive corporate & reseller partner auto price-tier discount modifier
  React.useEffect(() => {
    if (selectedCustomerId) {
      const found = customers.find(c => c.id === selectedCustomerId);
      if (found) {
        const autoDisc = Math.round(subtotal * (found.discountPercent / 100));
        setDiscount(autoDisc);
      }
    }
  }, [subtotal, selectedCustomerId, customers]);


  const selectedCourier = useMemo(() => {
    return DENPASAR_SHIPPING_METHODS.find(m => m.id === selectedCourierId) || DENPASAR_SHIPPING_METHODS[0];
  }, [selectedCourierId]);

  // Derived real product weight map (Kg)
  const derivedWeightKg = useMemo(() => {
    return cart.reduce((acc, item) => {
      const lowerName = item.product.name.toLowerCase();
      let itemWeight = 0.5; // default regular accessory weight
      if (item.product.category === 'Service & Repair') {
        itemWeight = 0; // Services carry no freight weight
      } else if (item.product.category === 'LAPTOP' || lowerName.includes('laptop')) {
        itemWeight = 2.5;
      } else if (lowerName.includes('server')) {
        itemWeight = 6.0;
      } else if (lowerName.includes('motherboard') || lowerName.includes('rtx') || lowerName.includes('rx ') || lowerName.includes('power supply') || lowerName.includes('psu')) {
        itemWeight = 1.5;
      } else if (lowerName.includes('processor') || lowerName.includes('ram') || lowerName.includes('ssd') || lowerName.includes('software')) {
        itemWeight = 0.1;
      }
      return acc + (itemWeight * item.quantity);
    }, 0);
  }, [cart]);

  // Calculated Real Carrier Prices - Bound entirely to API live synchronization
  const calculatedShippingPrice = useMemo(() => {
    return selectedCourierId === 'pickup' ? 0 : apiShippingPrice;
  }, [selectedCourierId, apiShippingPrice]);

  // Sync shippingCost via official proxy API
  React.useEffect(() => {
    if (selectedCourierId === 'pickup') {
      setApiShippingPrice(0);
      setApiCourierDescription('Ambil Sendiri di Gerai');
      setApiCourierSource('Lokal');
      return;
    }

    // Automatically align distance parameter if using Gojek/Grab in Bali
    const BALI_DISTANCES: Record<string, number> = {
      'denpasar_kota': 3,
      'kuta_seminyak': 9,
      'canggu': 14,
      'jimbaran_nusadua': 19,
      'gianyar_kota': 22,
      'gianyar_ubud': 26,
      'tabanan_kota': 28,
      'klungkung_kota': 41,
      'bangli_kota': 43,
      'karangasem_amlapura': 73,
      'buleleng_singaraja': 78,
      'jembrana_negara': 102,
    };
    const distance = BALI_DISTANCES[shippingDestination];
    if (distance) {
      setShippingDistanceKm(distance);
    }

    let isMounted = true;
    const fetchCost = async () => {
      setIsFetchShippingLoading(true);
      try {
        const response = await fetch('/api/shipping/cost', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            courier: selectedCourierId,
            weight: derivedWeightKg,
            destination: shippingDestination,
            biteshipApiKey: localStorage.getItem('cs_pos_biteship_key') || '',
            rajaongkirApiKey: localStorage.getItem('cs_pos_rajaongkir_key') || ''
          })
        });

        if (response.ok && isMounted) {
          const data = await response.json();
          if (data && typeof data.price === 'number') {
            setApiShippingPrice(data.price);
            setApiCourierDescription(data.description || '');
            setApiCourierSource(data.source || 'Sistem');
          }
        }
      } catch (err) {
        console.error('Failed to sync live courier rate:', err);
      } finally {
        if (isMounted) {
          setIsFetchShippingLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchCost();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedCourierId, derivedWeightKg, shippingDestination]);

  const tax = useMemo(() => {
    const taxableSubtotal = Math.max(0, subtotal - discount);
    return taxableSubtotal * taxRate;
  }, [subtotal, discount, taxRate]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount + tax + calculatedShippingPrice);
  }, [subtotal, discount, tax, calculatedShippingPrice]);

  // Handle Quick Cash Buttons (Optimized for Rupiah bills e.g. Rp 50k, 100k, etc.)
  const cashSuggestions = useMemo(() => {
    if (total <= 0) return [50000, 100000, 200000, 500000];
    
    // Round to nearest 1,000 Rp
    const roundedTotal = Math.ceil(total / 1000) * 1000;
    const suggestions: number[] = [roundedTotal];

    // Standard Indonesian bills setup
    const indonesianBills = [50000, 100000, 200000, 500500, 1000000];
    indonesianBills.forEach((bill) => {
      if (bill > roundedTotal && !suggestions.includes(bill) && suggestions.length < 4) {
        suggestions.push(bill);
      }
    });

    // Fallbacks if high total items
    while (suggestions.length < 4) {
      const maxVal = Math.max(...suggestions);
      suggestions.push(maxVal + 100000);
    }

    return suggestions.sort((a, b) => a - b).slice(0, 4);
  }, [total]);

  // Calculate change returned
  const changeAmount = useMemo(() => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - total);
  }, [amountReceived, total]);

  // Submit and lock Transaction
  const handleFulfillTransaction = () => {
    if (cart.length === 0) return;

    const receiptNo = `INV-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 8)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const received = paymentMethod === 'Cash' ? (parseFloat(amountReceived) || total) : total;

    // Adjust in-cart item prices to match the derived tier pricing for this customer type context
    const finalizedItems = cart.map((item) => ({
      ...item,
      product: {
        ...item.product,
        price: getItemPrice(item.product),
      },
    }));

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      invoiceNo: receiptNo,
      timestamp: new Date().toISOString(),
      items: finalizedItems,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      amountReceived: received,
      changeAmount: Math.max(0, received - total),
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      courierName: selectedCourierId !== 'pickup' ? (apiCourierDescription || selectedCourier.name) : undefined,
      courierPrice: selectedCourierId !== 'pickup' ? apiShippingPrice : 0,
    };

    // Deduct stock for hardware items inside parent state
    cart.forEach((item) => {
      onUpdateStock(item.product.id, item.quantity);
    });

    onAddTransaction(newTx);
    setLatestCompletedTransaction(newTx);
    setIsCheckoutOpen(false);
  };

  // Close thermal receipt printing modal
  const handleCloseReceiptView = () => {
    setLatestCompletedTransaction(null);
    clearCart();
    setAmountReceived('');
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 relative p-0 min-h-[calc(100vh-140px)]">
      {/* LEFT panel: Inventory Search and Grid (Item catalog) */}
      <div className="flex-1 space-y-4">
        {/* Dynamic Premium Category Bypass Filter Controller */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-gradient-to-r from-teal-500/10 via-amber-500/5 to-slate-100/50 p-2.5 rounded-2xl border border-slate-200/50 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-amber-800 text-[11px] font-bold uppercase tracking-tight">💎 POS Mode:</span>
            <p className="text-[10px] text-slate-550 leading-tight">
              {showPremium 
                ? 'Menampilkan seluruh produk (termasuk Laptop, Server, BuildUp, & Gadget)' 
                : 'Saringan Aktif: Produk Premium disembunyikan agar kasir tetap rapi'}
            </p>
          </div>
          
          <button
            onClick={() => handleTogglePremium(!showPremium)}
            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all tracking-wider border shrink-0 flex items-center gap-1 ${
              showPremium 
                ? 'bg-amber-500 hover:bg-amber-400 border-amber-600 text-slate-950 font-extrabold shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-300 text-teal-700'
            }`}
          >
            {showPremium ? '🔒 Sembunyikan Unit' : '⚡ Buka Laptop & Gadget'}
          </button>
        </div>

        {/* Top filter and Search Input */}
        <div className="flex flex-col gap-3.5 bg-white p-4 rounded-xl border border-slate-150 shadow-xs relative">
          {/* Absolute Toast Floating indicator for Barcode Scan Success/Failure */}
          <AnimatePresence>
            {barcodeAlert && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -10 }}
                className={`absolute left-4 right-4 -top-16 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${
                  barcodeAlert.success
                    ? 'bg-teal-900 border-teal-700 text-teal-100'
                    : 'bg-red-950 border-red-800 text-red-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm select-none shrink-0 ${
                  barcodeAlert.success ? 'bg-teal-500/20 text-teal-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {barcodeAlert.success ? '🔔' : '⚠️'}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[10px] font-mono tracking-widest font-black uppercase opacity-75">{barcodeAlert.message}</p>
                  <p className="text-xs font-bold truncate">{barcodeAlert.sub}</p>
                </div>
                <div className="text-[9px] font-mono font-black bg-white/10 px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                  {barcodeAlert.success ? '+1 Item' : 'Terlewat'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search box */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              id="pos-search-input"
              placeholder="Search by part name, brand, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-sm focus:outline-hidden focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 text-slate-800"
            />
          </div>

          {/* Barcode Scanner / Wegde Simulator Widget (International Standards) */}
          <div className="bg-slate-950 text-white rounded-2xl p-3 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-9 h-9 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-mono text-base border border-teal-500/20 font-bold select-none">
                  ||||
                </div>
                {/* Simulated pulsing laser red line */}
                <div className="absolute left-0.5 right-0.5 h-0.5 bg-red-500 shadow-sm shadow-red-500/80 animate-bounce"></div>
              </div>
              <div className="text-left">
                <h4 className="text-[11px] font-extrabold text-[#2dd4bf] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  WEDGED HW BARCODE SCANNER
                </h4>
                <p className="text-[9px] text-slate-400 font-bold leading-none">
                  Sistem otomatis mendeteksi scan laser kasir Anda atau ketik kode di samping:
                </p>
              </div>
            </div>

            {/* Quick Emulator Simulator Select so people can test on mobile/tablets immediately */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-end">
              <select
                className="bg-slate-900 border border-slate-800 rounded-xl py-1.5 px-2 text-[10px] font-mono font-bold text-teal-300 outline-none focus:border-teal-600 max-w-[155px] cursor-pointer shadow-inner"
                defaultValue=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const matched = products.find(p => p.sku === val);
                  if (matched) {
                    addToCart(matched);
                    triggerBarcodeBeep();
                    showBarcodeNotification(matched);
                  }
                  e.target.value = "";
                }}
              >
                <option value="">⚡ SIMULASIKAN SCAN</option>
                {products.filter(p => p.sku).map(p => (
                  <option key={p.id} value={p.sku}>
                    [{p.sku}] {p.name.substring(0, 20)}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="KODE SKU..."
                  className="bg-slate-900 hover:bg-slate-850 focus:bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-2.5 py-1.5 text-[10px] font-mono text-teal-400 font-bold outline-none placeholder:text-slate-600 max-w-[110px]"
                  id="manual-sku-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      const val = input.value.trim().toUpperCase();
                      if (val) {
                        const matched = products.find(p => p.sku && p.sku.toUpperCase() === val);
                        if (matched) {
                          addToCart(matched);
                          triggerBarcodeBeep();
                          showBarcodeNotification(matched);
                          input.value = "";
                        } else {
                          showNotificationError(`Barcode/SKU "${val}" Tidak Terdaftar!`);
                        }
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('manual-sku-input') as HTMLInputElement;
                    if (input) {
                      const val = input.value.trim().toUpperCase();
                      if (val) {
                        const matched = products.find(p => p.sku && p.sku.toUpperCase() === val);
                        if (matched) {
                          addToCart(matched);
                          triggerBarcodeBeep();
                          showBarcodeNotification(matched);
                          input.value = "";
                        } else {
                          showNotificationError(`Barcode/SKU "${val}" Tidak Terdaftar!`);
                        }
                      }
                    }
                  }}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-2 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-md active:scale-95 shrink-0"
                >
                  SCAN
                </button>
              </div>
            </div>
          </div>

          {/* Quick Categories Slider with Scroll Assist Buttons */}
          <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => scrollCategories('left')}
              className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-[#0d9488] active:scale-95 transition-all rounded-lg shrink-0 flex items-center justify-center"
              title="Scroll Kiri"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Custom styled scroll area for category buttons */}
            <div 
              ref={categoriesContainerRef}
              className="flex gap-1.5 overflow-x-auto pb-1.5 pt-0.5 max-w-full flex-1 custom-category-scroll"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors select-none ${
                    selectedCategory === cat
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollCategories('right')}
              className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-[#0d9488] active:scale-95 transition-all rounded-lg shrink-0 flex items-center justify-center"
              title="Scroll Kanan"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <style>{`
          .custom-category-scroll::-webkit-scrollbar {
            height: 6px !important;
            display: block !important;
          }
          .custom-category-scroll::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 4px !important;
          }
          .custom-category-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 4px !important;
          }
          .custom-category-scroll::-webkit-scrollbar-thumb:hover {
            background: #0d9488 !important;
          }
        `}</style>

        {/* Catalog list container */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((p) => {
              const inStock = p.stock === null || p.stock > 0;
              const isLowStock = p.stock !== null && p.stock <= 5 && p.stock > 0;
              const cartQty = cart.find((item) => item.id === p.id)?.quantity || 0;
              const reachLimit = p.stock !== null && cartQty >= p.stock;

              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => inStock && !reachLimit && addToCart(p)}
                  className={`relative p-4 rounded-2xl bg-white border transition-all cursor-pointer select-none group flex flex-col justify-between min-h-[145px] ${
                    !inStock
                      ? 'border-slate-100 opacity-55 cursor-not-allowed'
                      : reachLimit
                      ? 'border-amber-200 bg-amber-50/10'
                      : 'border-slate-100 hover:border-teal-500/50 hover:shadow-md'
                  }`}
                >
                  {/* Category Pill Tag */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[9px] font-semibold text-slate-400 font-mono tracking-wider uppercase">
                      {p.category}
                    </span>
                    {p.stock !== null ? (
                      <span
                        className={`text-[9.5px] font-bold font-mono px-2 py-0.5 rounded-full ${
                          !inStock
                            ? 'bg-rose-100 text-rose-800'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-900 animate-pulse'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p.stock === 0 ? 'Out of Stock' : `${p.stock} units`}
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-bold font-mono px-2 py-0.5 bg-sky-50 text-sky-800 rounded-full">
                        Service Task
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="mt-2.5">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-slate-950 transition-colors line-clamp-2 leading-tight">
                      {p.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{p.sku}</p>
                  </div>

                  {/* Cash Cost and quantity overlay indicator */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-950 font-mono">
                      {formatIDR(p.price)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {cartQty > 0 && (
                        <span className="text-[10px] font-extrabold bg-teal-500 text-slate-950 px-2 py-0.5 rounded-full">
                          {cartQty}x
                        </span>
                      )}
                      <div className="w-6.5 h-6.5 bg-slate-100 group-hover:bg-teal-500 group-hover:text-slate-950 rounded-lg flex items-center justify-center transition-all">
                        <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-950" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium text-sm">No inventory or service items found.</p>
            <p className="text-slate-400 text-xs mt-1">Try modifying your query or category filter</p>
          </div>
        )}
      </div>

      {/* RIGHT panel: Active Checkout Order Cart Side-bar */}
      <div className="w-full xl:w-96 shrink-0 bg-white border border-slate-100 rounded-2xl flex flex-col h-[calc(100vh-140px)] shadow-xl overflow-hidden sticky top-6">
        {/* Cart Title - DOCKED */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-teal-600" />
            <h2 className="font-bold text-slate-900 text-sm">Current Order</h2>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full">
            {cart.reduce((a, c) => a + c.quantity, 0)} Items
          </span>
        </div>

        {/* SCROLLABLE MIDDLE BODY containing Customer info, Cart items, and Custom Shipping inputs */}
        <div className="flex-1 overflow-y-auto custom-table-scroll divide-y divide-slate-100/60">
          {/* Section A: Customer Input Section */}
          <div className="p-3 flex flex-col gap-2 bg-slate-50/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Klien / Pelanggan *</span>
              {selectedCustomerId && (
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 border uppercase font-mono ${
                  customers.find(c => c.id === selectedCustomerId)?.type === 'Perusahaan' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                  customers.find(c => c.id === selectedCustomerId)?.type === 'Sesama Toko' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  'bg-indigo-50 text-indigo-750 border-indigo-100'
                }`}>
                  {customers.find(c => c.id === selectedCustomerId)?.type === 'Sesama Toko' ? 'Reseller' : customers.find(c => c.id === selectedCustomerId)?.type}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  const cid = e.target.value;
                  setSelectedCustomerId(cid);
                  if (cid) {
                    const found = customers.find(c => c.id === cid);
                    if (found) {
                      setCustomerName(found.name);
                      setCustomerPhone(found.phone);
                      const autoDisc = Math.round(subtotal * (found.discountPercent / 100));
                      setDiscount(autoDisc);
                    }
                  } else {
                    setCustomerName('');
                    setCustomerPhone('');
                    setDiscount(0);
                  }
                }}
                className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-teal-500 shadow-xs cursor-pointer"
              >
                <option value="">-- Pelanggan Walk-In / Umum --</option>
                {customers.map(c => {
                  if (c.id === 'cust-01') return null; // Avoid duplicate general guest option
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type === 'Pribadi' ? 'Pribadi' : c.type === 'Perusahaan' ? 'Korporat' : 'Toko Partner'} - Disc {c.discountPercent}%)
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={() => setIsAddCustModalOpen(true)}
                title="Registrasi Pelanggan Baru"
                className="p-2 shrink-0 bg-teal-50 hover:bg-teal-100/80 text-teal-600 hover:text-teal-700 border border-teal-200 rounded-xl transition-all shadow-xs flex items-center justify-center"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            {/* Empty Customers helper link */}
            {customers.filter(c => c.id !== 'cust-01').length === 0 && (
              <div className="flex flex-col items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 p-2 rounded-xl mt-1 text-center font-sans">
                <span className="text-[9.5px] font-semibold text-amber-800">Database Pelanggan Kosong</span>
                <button
                  type="button"
                  onClick={() => onResetCustomers?.()}
                  className="text-[9.5px] font-bold text-teal-600 hover:text-teal-700 underline flex items-center gap-1"
                >
                  📥 Pulihkan B2B Demo Contacts
                </button>
              </div>
            )}

            {/* Quick-type form fallback for walk-in guest */}
            {!selectedCustomerId && (
              <div className="space-y-1.5 pt-1 border-t border-slate-100/50">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Ketik Nama (Pelanggan Walk-in)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-700 border-none outline-none focus:ring-0 placeholder-slate-400 font-semibold"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100/50">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Ketik Telepon / WhatsApp (Opsional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-700 border-none outline-none focus:ring-0 placeholder-slate-400 font-mono"
                  />
                </div>
              </div>
            )}

            {(customerName || customerPhone || selectedCustomerId) && (
              <button
                onClick={() => {
                  setCustomerName('');
                  setCustomerPhone('');
                  setSelectedCustomerId('');
                  setDiscount(0);
                  if (onClearPresetCustomer) onClearPresetCustomer();
                }}
                className="text-[10px] text-rose-500 font-bold hover:underline self-end mt-1"
              >
                Reset Pelanggan
              </button>
            )}
          </div>

          {/* Section B: Cart Items List */}
          <div className="p-4 space-y-3.5">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-start justify-between gap-2.5 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-150/30"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">
                      {item.product.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[10.5px] text-slate-500 font-semibold font-mono">
                        {formatIDR(getItemPrice(item.product))} / {item.product.unit}
                      </p>
                      {getItemPrice(item.product) !== item.product.price && (
                        <span className="text-[8.5px] bg-teal-500 text-slate-950 font-extrabold px-1 rounded uppercase">
                          Tier Price
                        </span>
                      )}
                    </div>

                    {/* Direct Hardware Upgrades */}
                    {(item.product.category === 'LAPTOP' || 
                      item.product.category === 'BuildUp Komputer' || 
                      item.product.category === 'Server') && (
                      <div className="mt-2 bg-slate-100/85 p-2 rounded-lg border border-slate-200/50 space-y-1.5 text-[10px]">
                        <p className="font-extrabold text-[9.5px] text-slate-600 flex items-center gap-1">
                          🛠️ OPTION UPGRADE PREMIUM:
                        </p>
                        
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="space-y-0.5">
                            <label className="text-[8.5px] font-bold text-slate-500 block uppercase">Upgrade RAM:</label>
                            <select
                              value={item.selectedRamUpgrade || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                let surcharge = 0;
                                if (val === '+8GB Dual-Ch DDR4/DDR5') surcharge = 350000;
                                else if (val === '+16GB Dual-Ch DDR4/DDR5') surcharge = 650000;
                                else if (val === '+32GB Dual-Ch DDR4/DDR5') surcharge = 1300000;
                                
                                updateUpgradeOptions(
                                  item.id,
                                  val || undefined,
                                  surcharge || undefined,
                                  item.selectedStorageUpgrade,
                                  item.storagePriceSurcharge
                                );
                              }}
                              className="w-full bg-white border border-slate-200 py-0.5 px-1 rounded-md text-[9.5px] font-medium text-slate-700 focus:border-teal-400 outline-none"
                            >
                              <option value="">(Bawaan Pabrik)</option>
                              <option value="+8GB Dual-Ch DDR4/DDR5">+8GB (+Rp 350K)</option>
                              <option value="+16GB Dual-Ch DDR4/DDR5">+16GB (+Rp 650K)</option>
                              <option value="+32GB Dual-Ch DDR4/DDR5">+32GB (+Rp 1.3M)</option>
                            </select>
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[8.5px] font-bold text-slate-500 block uppercase">Upgrade Storage:</label>
                            <select
                              value={item.selectedStorageUpgrade || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                let surcharge = 0;
                                if (val === '+512GB M.2 NVMe SSD') surcharge = 450000;
                                else if (val === '+1TB M.2 NVMe SSD') surcharge = 850000;
                                else if (val === '+2TB M.2 NVMe SSD') surcharge = 1650000;
                                else if (val === '+1TB SATA HDD 2.5') surcharge = 600000;
                                else if (val === '+2TB SATA HDD 2.5') surcharge = 950000;

                                updateUpgradeOptions(
                                  item.id,
                                  item.selectedRamUpgrade,
                                  item.ramPriceSurcharge,
                                  val || undefined,
                                  surcharge || undefined
                                );
                              }}
                              className="w-full bg-white border border-slate-200 py-0.5 px-1 rounded-md text-[9.5px] font-medium text-slate-700 focus:border-teal-400 outline-none"
                            >
                              <option value="">(Bawaan Pabrik)</option>
                              <option value="+512GB M.2 NVMe SSD">+512GB SSD (+Rp 450K)</option>
                              <option value="+1TB M.2 NVMe SSD">+1TB SSD (+Rp 850K)</option>
                              <option value="+2TB M.2 NVMe SSD">+2TB SSD (+Rp 1.65M)</option>
                              <option value="+1TB SATA HDD 2.5">+1TB HDD (+Rp 600K)</option>
                              <option value="+2TB SATA HDD 2.5">+2TB HDD (+Rp 950K)</option>
                            </select>
                          </div>
                        </div>

                        {/* Display active upgrade descriptions */}
                        {(item.ramPriceSurcharge || item.storagePriceSurcharge) && (
                          <div className="pt-1 mt-1 border-t border-slate-200/50 flex flex-wrap gap-1 items-center justify-between text-[8px] sm:text-[9px]">
                            <span className="text-amber-700 font-bold uppercase tracking-tight">Surcharge Aktif:</span>
                            <span className="font-mono font-bold text-slate-700">
                              +{formatIDR((item.ramPriceSurcharge || 0) + (item.storagePriceSurcharge || 0))}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 font-sans">
                    {/* Cart operations and Quantity counter */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800 font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                        disabled={item.product.stock !== null && item.quantity >= item.product.stock}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-slate-800 font-mono">
                      {formatIDR(getItemPrice(item.product) * item.quantity)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {cart.length === 0 && (
              <div className="flex flex-col justify-center items-center text-center py-12">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <ShoppingCart className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Keranjang Kosong</p>
                <p className="text-slate-400 text-[11px] mt-1 px-4 leading-relaxed">
                  Pilih hardware komputer atau layanan perbaikan/servis untuk ditambahkan ke nota kasir.
                </p>
              </div>
            )}
          </div>

          {/* Section C: Intermediate Pricing & Shipping Configuration */}
          <div className="p-4 bg-slate-50/30 space-y-3.5">
            <div className="flex justify-between text-xs text-slate-500 font-medium font-sans">
              <span>Subtotal Belanja</span>
              <span className="font-mono text-slate-800">{formatIDR(subtotal)}</span>
            </div>

            {/* Discount selector input action */}
            <div className="flex justify-between items-center text-slate-500 font-medium py-0.5 text-xs">
              <span className="flex items-center gap-1.5 font-sans">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> Diskon Kasir (Rp)
              </span>
              <input
                type="number"
                min="0"
                step="5000"
                max={subtotal}
                value={discount || ''}
                onChange={(e) => setDiscount(Math.min(subtotal, Math.max(0, parseFloat(e.target.value) || 0)))}
                placeholder="0"
                className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-right font-mono text-xs focus:outline-hidden focus:border-teal-500 shadow-2xs"
              />
            </div>

            {/* Denpasar Bali Shipping list select */}
            <div className="flex justify-between items-center text-slate-500 font-medium py-0.5 border-t border-slate-100 pt-3 text-xs">
              <span className="flex items-center gap-1.5 font-sans">
                <Truck className="w-3.5 h-3.5 text-slate-400" /> Kurir / Jenis Kirim
              </span>
              <select
                value={selectedCourierId}
                onChange={(e) => setSelectedCourierId(e.target.value)}
                className="max-w-[180px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-teal-500 cursor-pointer shadow-2xs"
              >
                {DENPASAR_SHIPPING_METHODS.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Courier Properties Inputs */}
            {selectedCourierId !== 'pickup' && (
              <div className="bg-slate-100/90 p-3 rounded-xl space-y-2 border border-slate-200/60 mt-1 pb-2.5 font-sans">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>SINKRONISASI LOGISTIK RIIL</span>
                  <span className="text-teal-650 font-extrabold flex items-center gap-1 text-[9px]">
                    <span className="w-1.5 h-1.5 bg-teal-550 rounded-full animate-ping" />
                    {apiCourierSource || 'ONLINE'}
                  </span>
                </div>

                {/* Simulated weight info */}
                <div className="flex justify-between items-center text-xs border-b border-slate-200/50 pb-1">
                  <span className="text-slate-500 font-medium">Est. Berat Cargo:</span>
                  <span className="font-mono font-bold text-slate-700">{derivedWeightKg.toFixed(1)} Kg</span>
                </div>

                {/* Combined Target District Selector */}
                <div className="space-y-1">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wide block">Wilayah / Kota Tujuan:</span>
                  <select
                    value={shippingDestination}
                    onChange={(e) => setShippingDestination(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <optgroup label="Kabupaten / Area Bali (Lokal & Regional)">
                      {TARGET_SHIP_LOCATIONS.filter(l => l.category === 'bali_local' || l.category === 'bali_regional').map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Regional Jawa & Madura">
                      {TARGET_SHIP_LOCATIONS.filter(l => l.category === 'jawa').map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Regional Luar Jawa / Kalimantan / Sumatera">
                      {TARGET_SHIP_LOCATIONS.filter(l => l.category === 'luar_jawa').map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Distance display for info */}
                {(selectedCourierId === 'gojek' || selectedCourierId === 'grab') && (
                  <div className="flex justify-between items-center text-[11px] bg-white/70 px-2 py-1 rounded border border-slate-200/50">
                    <span className="text-slate-500 font-medium font-sans">Estimasi Jarak Antar:</span>
                    <span className="font-mono font-bold text-slate-800">{shippingDistanceKm} Km</span>
                  </div>
                )}

                {/* Live rate feedback/loading */}
                <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/55 text-xs">
                  <span className="text-slate-500 font-semibold text-[11px]">Tarif Ongkir Riil:</span>
                  {isFetchShippingLoading ? (
                    <span className="font-mono text-xs text-teal-650 font-bold flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin text-teal-500" />
                      Mencocokkan API...
                    </span>
                  ) : apiShippingPrice === 0 && (selectedCourierId === 'gojek' || selectedCourierId === 'grab') && !['denpasar_kota', 'kuta_seminyak', 'canggu', 'jimbaran_nusadua'].includes(shippingDestination) ? (
                    <span className="text-[10px] font-bold text-red-500 bg-red-55 px-1.5 py-0.5 rounded border border-red-200">
                      Luar Jangkauan Instan
                    </span>
                  ) : (
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-[#0d9488] text-xs block">{formatIDR(apiShippingPrice)}</span>
                      {apiCourierDescription && (
                        <span className="text-[9px] text-slate-400 block font-semibold">{apiCourierDescription}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Validation warnings */}
                {apiShippingPrice === 0 && (selectedCourierId === 'gojek' || selectedCourierId === 'grab') && !['denpasar_kota', 'kuta_seminyak', 'canggu', 'jimbaran_nusadua'].includes(shippingDestination) && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded-lg text-[10px] leading-relaxed font-semibold mt-1">
                    ⚠️ Tujuan di luar jangkauan kurir instan (Gojek/Grab). Silakan alihkan pilihan kurir ke J&T, JNE, atau SiCepat untuk pengiriman kargo antarkota.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM FIXED FOOTER containing Tax, Grand Total and Primary Interactive Buttons */}
        <div className="p-4 border-t border-slate-150 bg-white space-y-3 shrink-0">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-500 font-semibold font-sans">
              <span className="flex items-center gap-1.5">
                <span>PPN</span>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-700 outline-none focus:border-teal-500 cursor-pointer shadow-xs transition-colors"
                >
                  <option value="0.12">12% (Up-to-Date)</option>
                  <option value="0.11">11% (SOP 2022)</option>
                  <option value="0.10">10% (Historis)</option>
                  <option value="0">0% (Bebas Pajak)</option>
                </select>
              </span>
              <span className="font-mono text-slate-800">{formatIDR(tax)}</span>
            </div>

            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block font-sans">Total Tagihan</span>
              <span className="font-mono text-base font-black text-rose-500">{formatIDR(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="px-3 py-2.5 text-xs font-semibold text-rose-600 hover:text-rose-750 bg-rose-50 hover:bg-rose-100/50 rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 font-sans"
            >
              <Trash2 className="w-3.5 h-3.5" /> Reset Cart
            </button>
            <button
              onClick={() => setIsCheckoutOpen(true)}
              disabled={cart.length === 0}
              className="px-3 py-2.5 text-xs font-extrabold text-slate-950 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl shadow-xs transition-all active:scale-95 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 font-sans"
            >
              <ShoppingCart className="w-3.5 h-3.5" /> Fulfill Sale
            </button>
          </div>
        </div>
      </div>

      {/* OVERLAY 1: Payment Check & Received Amount Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Metode Pembayaran & Pelunasan</h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-slate-800 text-lg font-semibold truncate hover:bg-slate-100 px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Payment selection categories */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pilih Metode Bayar
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DENPASAR_PAYMENT_METHODS.map(
                    (method) => (
                      <button
                        key={method}
                        onClick={() => {
                          setPaymentMethod(method as any);
                          if (method !== 'Cash') {
                            setAmountReceived(total.toString());
                          } else {
                            setAmountReceived('');
                          }
                        }}
                        className={`p-2.5 rounded-xl text-left border text-[11px] font-bold transition-all relative leading-tight ${
                          paymentMethod === method
                            ? 'border-teal-500 bg-teal-500/5 text-slate-900 ring-1 ring-teal-500'
                            : 'border-slate-200 hover:border-slate-350 bg-white text-slate-650'
                        }`}
                      >
                        {method}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Received Cash inputs for cash processing */}
              {paymentMethod === 'Cash' && (
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Uang Tunai Diterima (Rp)
                    </label>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      Total Tagihan: {formatIDR(total)}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
                    <input
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      placeholder={total.toString()}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold font-mono text-slate-800"
                    />
                  </div>

                  {/* Cash Quick suggestions list */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {cashSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setAmountReceived(suggestion.toString())}
                        className="py-1 bg-white hover:bg-slate-200 border border-slate-250 font-mono rounded-md text-[10px] font-bold text-slate-700 transition-colors"
                      >
                        {formatIDR(suggestion)}
                      </button>
                    ))}
                  </div>

                  {/* Change returned calculation section */}
                  {parseFloat(amountReceived) > 0 && (
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/50 text-xs">
                      <span className="text-slate-500 font-semibold">Uang Kembali (Kembalian):</span>
                      <span className="font-mono text-base font-extrabold text-teal-600">
                        {formatIDR(changeAmount)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Show final receipt invoice recap and execute transaction button */}
              <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 bg-slate-50/40 p-3 rounded-xl border border-slate-200/50">
                <div className="flex justify-between text-slate-500">
                  <span>Nama Pelanggan:</span>
                  <span className="font-bold text-slate-800">
                    {customerName.trim() || 'Pelanggan Umum (Walk-in)'}
                  </span>
                </div>
                {customerPhone && (
                  <div className="flex justify-between text-slate-500">
                    <span>No WhatsApp:</span>
                    <span className="font-mono text-slate-705">
                      {customerPhone}
                    </span>
                  </div>
                )}
                {selectedCourierId !== 'pickup' && (
                  <div className="flex justify-between text-slate-500">
                    <span>Kurir Jasa Kirim:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedCourier.name} (+{formatIDR(selectedCourier.price)})
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 font-extrabold pt-1.5 border-t border-slate-100">
                  <span>TOTAL AKHIR:</span>
                  <span className="font-mono text-teal-800 text-sm">{formatIDR(total)}</span>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleFulfillTransaction}
                  disabled={
                    paymentMethod === 'Cash' &&
                    parseFloat(amountReceived || '0') < total - 1
                  }
                  className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-350 disabled:cursor-not-allowed"
                >
                  Selesaikan & Bayar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* OVERLAY 2: Professional Digital Thermal Receipt Generator Mode */}
      {latestCompletedTransaction && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm my-8 flex flex-col items-center"
          >
            {/* Success icon banner */}
            <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center shadow-lg -mb-6 z-10 text-slate-950 text-white">
              <CheckCircle className="w-6 h-6" />
            </div>

            {/* Simulated Thermal Ticket paper design */}
            <div className="w-full bg-white text-slate-900 px-6 pt-10 pb-6 rounded-t-lg shadow-2xl relative border-x border-t border-slate-200">
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                <Logo variant="icon" size="sm" className="mx-auto mb-1 opacity-80" />
                <h4 className="font-black text-base uppercase tracking-tight text-slate-800">
                  {storeConfig.name}
                </h4>
                {storeConfig.address && (
                  <p className="text-[10px] text-slate-500 font-medium leading-tight">{storeConfig.address}</p>
                )}
                {storeConfig.phone && (
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">
                    No HP / WA: {storeConfig.phone}
                  </p>
                )}
              </div>

              {/* Meta lines */}
              <div className="py-3 space-y-1 font-mono text-[10px] text-slate-600 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>WAKTU:</span>
                  <span>{new Date(latestCompletedTransaction.timestamp).toLocaleString('id-ID')} WITA</span>
                </div>
                <div className="flex justify-between">
                  <span>NO. NOTA:</span>
                  <span className="font-bold text-slate-800">
                    {latestCompletedTransaction.invoiceNo}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>PELANGGAN:</span>
                  <span className="truncate max-w-[150px] font-bold text-slate-800">
                    {latestCompletedTransaction.customerName || 'Pelanggan Umum'}
                  </span>
                </div>
                {latestCompletedTransaction.customerPhone && (
                  <div className="flex justify-between">
                    <span>TELP/WA:</span>
                    <span>{latestCompletedTransaction.customerPhone}</span>
                  </div>
                )}
              </div>

              {/* Items Table details */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
                <div className="flex justify-between font-mono text-[9px] text-slate-400 font-bold px-1">
                  <span>DESKRIPSI</span>
                  <span>QTY * HARGA = TOTAL</span>
                </div>

                <div className="space-y-1.5 px-1">
                  {latestCompletedTransaction.items.map((item) => {
                    const extraPrice = (item.ramPriceSurcharge || 0) + (item.storagePriceSurcharge || 0);
                    const unitPrice = item.product.price + extraPrice;
                    return (
                      <div key={item.id} className="space-y-0.5 border-b border-slate-150 pb-1.5 last:border-none">
                        <div className="text-[11px] font-mono text-slate-800 flex justify-between gap-4">
                          <span className="truncate max-w-[150px] font-bold">{item.product.name}</span>
                          <span className="shrink-0 font-semibold text-right">
                            {item.quantity} x {formatIDR(unitPrice)} = <br/>
                            {formatIDR(item.quantity * unitPrice)}
                          </span>
                        </div>
                        {/* Display custom configuration flags */}
                        {(item.selectedRamUpgrade || item.selectedStorageUpgrade) && (
                          <div className="text-[9.5px] italic text-slate-500 pl-1.5 border-l-2 border-teal-400">
                            {item.selectedRamUpgrade && <div>+ RAM: {item.selectedRamUpgrade}</div>}
                            {item.selectedStorageUpgrade && <div>+ Storage: {item.selectedStorageUpgrade}</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calculations Recaps */}
              <div className="py-3 space-y-1 font-mono text-[11px] text-slate-700">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatIDR(latestCompletedTransaction.subtotal)}</span>
                </div>
                {latestCompletedTransaction.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Diskon:</span>
                    <span>-{formatIDR(latestCompletedTransaction.discount)}</span>
                  </div>
                )}
                {latestCompletedTransaction.courierName && (
                  <div className="flex justify-between text-slate-700">
                    <span>Jasa Kirim ({latestCompletedTransaction.courierName}):</span>
                    <span>{formatIDR(latestCompletedTransaction.courierPrice || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>PPN ({Math.round((latestCompletedTransaction.tax / Math.max(1, latestCompletedTransaction.subtotal - latestCompletedTransaction.discount)) * 100)}%):</span>
                  <span>{formatIDR(latestCompletedTransaction.tax)}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-slate-100 bg-slate-900 px-2 py-1.5 rounded-md mt-1.5">
                  <span>TOTAL AKHIR:</span>
                  <span>{formatIDR(latestCompletedTransaction.total)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="py-3 border-t border-dashed border-slate-300 font-mono text-[10px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>METODE BAYAR:</span>
                  <span className="font-bold uppercase">{latestCompletedTransaction.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>NOMINAL DITERIMA:</span>
                  <span>{formatIDR(latestCompletedTransaction.amountReceived)}</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold border-t border-slate-150 pt-1 mt-1">
                  <span>UANG KEMBALIAN:</span>
                  <span>{formatIDR(latestCompletedTransaction.changeAmount)}</span>
                </div>
              </div>

              {/* Thank you note */}
              <div className="text-center pt-4 border-t border-slate-200">
                <p className="text-[9px] font-mono text-slate-500">Terima kasih atas kepercayaan Anda pada {storeConfig.name}!</p>
                <p className="text-[9px] font-mono text-slate-400 font-bold mt-1">{storeConfig.powerTitle}</p>
              </div>
            </div>

            {/* Wave zig-zag look bottom border */}
            <div className="w-full h-3 bg-[radial-gradient(circle_at_bottom,_transparent_3px,_white_4px)] bg-repeat-x bg-[length:8px_12px] -mt-1 drop-shadow-md relative" />

            {/* Thermal modal interaction buttons */}
            <div className="w-full flex flex-col gap-2 mt-4">
              <a
                href={getWhatsAppShareUrl(
                  latestCompletedTransaction.customerPhone || '', 
                  generateWhatsAppInvoiceMessage(latestCompletedTransaction)
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm focus:outline-hidden transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md"
              >
                <MessageSquare className="w-4 h-4" /> Kirim Nota via WhatsApp
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => window.print()}
                  className="py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-bold rounded-xl text-xs focus:outline-hidden transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Nota
                </button>
                <button
                  onClick={handleCloseReceiptView}
                  className="py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs focus:outline-hidden shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  Selesai <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* OVERLAY 3: Register New B2B / Personal Customer Modal */}
      {isAddCustModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-55 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-6 flex flex-col gap-4 relative"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Registrasi Klien Baru</h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Tambahkan profil ke database lokal POS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCustModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterCustomerDirect} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Tipe Klien *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Pribadi', 'Perusahaan', 'Sesama Toko'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setNewCustType(type);
                        if (type === 'Perusahaan') setNewCustDiscount(10);
                        else if (type === 'Sesama Toko') setNewCustDiscount(15);
                        else setNewCustDiscount(0);
                      }}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        newCustType === type 
                          ? 'border-teal-500 bg-teal-500 text-slate-950 shadow-xs' 
                          : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'Sesama Toko' ? 'Reseller / Partner' : type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Nama Lengkap / Instansi *</label>
                <input
                  type="text"
                  required
                  placeholder={newCustType === 'Perusahaan' ? 'Contoh: PT. Bali Dirgantara Komputer' : 'Contoh: Nyoman Budiarsa'}
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Nomor HP / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 081234..."
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500 focus:bg-white transition-all shadow-inner font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Diskon Default (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    placeholder="0"
                    value={newCustDiscount || ''}
                    onChange={(e) => setNewCustDiscount(Math.min(90, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 focus:bg-white transition-all shadow-inner font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Alamat / Email Resmi (Opsional)</label>
                <input
                  type="email"
                  placeholder="marketing@partner.com"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500 focus:bg-white transition-all shadow-inner mb-2 font-mono"
                />
                <textarea
                  placeholder="Ketik alamat lengkap pengiriman untuk logistik..."
                  rows={2}
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500 focus:bg-white transition-all shadow-inner resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustModalOpen(false)}
                  className="flex-1 py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg text-xs font-extrabold transition-all"
                >
                  Simpan & Pilih Klien
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
