import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Wrench,
  Package,
  History,
  Smartphone,
  Laptop as LaptopIcon,
  Wifi,
  Battery,
  User,
  Users,
  Menu,
  Cpu,
  Lock,
  LogOut,
  Shield,
  Key,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Import local subcomponents
import DashboardView from './components/DashboardView';
import POSTerminal from './components/POSTerminal';
import RepairJobs from './components/RepairJobs';
import InventoryManager from './components/InventoryManager';
import SalesHistory from './components/SalesHistory';
import PCSimulator from './components/PCSimulator';
import DirectoryManager from './components/DirectoryManager';
import Logo from './components/Logo';
import LoginScreen from './components/LoginScreen';
import ChangePinModal from './components/ChangePinModal';
import ActivationGate from './components/ActivationGate';
import ClientGuideModal from './components/ClientGuideModal';

// Import secure offline licensing helper
import { generateLicenseFromId } from './utils';

// Import types & seeds
import { Product, RepairJob, Transaction, JobStatus, Customer, Supplier, UserRole, Staff } from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_REPAIR_JOBS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_CUSTOMERS, 
  INITIAL_SUPPLIERS,
  INITIAL_STAFFS
} from './data';

export default function App() {
  const [isInitialLoaded, setIsInitialLoaded] = useState<boolean>(false);

  const syncKeyToServer = (key: string, value: any) => {
    if (!isInitialLoaded) return;
    fetch(`/api/db/${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: value }),
    }).catch((e) => console.warn(`[Sync Push] Error pushing ${key}:`, e));
  };

  // Master Inventory, Jobs & Transactions sync-states
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('cs_pos_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  // Unique Installation Identifier for GitHub down-loads licensing control
  const [installationId, setInstallationId] = useState<string>(() => {
    let saved = localStorage.getItem('cs_pos_installation_id');
    if (!saved) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const genSegment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      saved = `YNTK-${genSegment()}-${genSegment()}-${genSegment()}`;
      localStorage.setItem('cs_pos_installation_id', saved);
    }
    return saved;
  });

  const [licensedKey, setLicensedKey] = useState<string>(() => {
    return localStorage.getItem('cs_pos_licensed_key') || '';
  });

  // Verify license validity dynamically based on repo owner rules (Yan Torky)
  const isLicenseKeyValid = (key: string): boolean => {
    const val = key.trim().toUpperCase();
    if (val === 'TORKY-POS-8822-APPROVED' || val === 'YANTORKY-LICENSE-2026-VALD') {
      return true;
    }
    if (val === generateLicenseFromId(installationId)) {
      return true;
    }
    return false;
  };

  const isActivated = isLicenseKeyValid(licensedKey);

  const [jobs, setJobs] = useState<RepairJob[]>(() => {
    const saved = localStorage.getItem('cs_pos_jobs');
    return saved ? JSON.parse(saved) : INITIAL_REPAIR_JOBS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('cs_pos_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // Persisted Customer & Supplier registry directory
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('cs_pos_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('cs_pos_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [staffs, setStaffs] = useState<Staff[]>(() => {
    const saved = localStorage.getItem('cs_pos_staffs');
    return saved ? JSON.parse(saved) : INITIAL_STAFFS;
  });

  useEffect(() => {
    localStorage.setItem('cs_pos_staffs', JSON.stringify(staffs));
    syncKeyToServer('cs_pos_staffs', staffs);
  }, [staffs]);

  // USD Global Currency Exchange Rate tracking
  const [usdRate, setUsdRate] = useState<number>(() => {
    const saved = localStorage.getItem('cs_pos_usd_rate');
    return saved ? parseFloat(saved) : 16200;
  });

  const [usdRateSyncTime, setUsdRateSyncTime] = useState<string>(() => {
    return localStorage.getItem('cs_pos_usd_rate_sync_time') || '';
  });

  const [isSyncingExchangeRate, setIsSyncingExchangeRate] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('cs_pos_usd_rate', usdRate.toString());
    syncKeyToServer('cs_pos_usd_rate', usdRate);
  }, [usdRate]);

  // Handle global currency conversion rate updater
  const handleUpdateUsdRate = (newRate: number) => {
    setUsdRate(newRate);
    setProducts((prev) =>
      prev.map((p) => {
        const hasUSD = p.priceUSD !== undefined || p.costUSD !== undefined;
        if (!hasUSD) return p;

        const updatedCost = p.costUSD ? Math.round(p.costUSD * newRate) : p.cost;
        const updatedPrice = p.priceUSD ? Math.round(p.priceUSD * newRate) : p.price;
        const updatedPriceRetail = p.priceUSD ? Math.round(p.priceUSD * newRate) : p.priceRetail;
        // Apply tiered ratios if priceUSD exists for dynamic sync
        const updatedPriceCorporate = p.priceUSD ? Math.round(p.priceUSD * 1.05 * newRate) : p.priceCorporate;
        const updatedPricePartner = p.priceUSD ? Math.round(p.priceUSD * 0.95 * newRate) : p.pricePartner;

        return {
          ...p,
          cost: updatedCost,
          price: updatedPrice,
          priceRetail: updatedPriceRetail,
          priceCorporate: updatedPriceCorporate,
          pricePartner: updatedPricePartner
        };
      })
    );
  };

  // Function to sync live exchange rates automatically from official records
  const handleSyncExchangeRate = async () => {
    setIsSyncingExchangeRate(true);
    try {
      // Try local Express help, fallback to direct public exchange rate API in the browser
      let rate: number | null = null;
      try {
        const localRes = await fetch('/api/currency/usd-idr');
        if (localRes.ok) {
          const localData = await localRes.json();
          if (localData && localData.rate) {
            rate = localData.rate;
          }
        }
      } catch (localErr) {
        console.warn('Local proxy rate unavailable, trying direct public source...', localErr);
      }

      if (!rate) {
        const publicRes = await fetch('https://open.er-api.com/v6/latest/USD');
        if (publicRes.ok) {
          const publicData = await publicRes.json();
          if (publicData?.rates?.IDR) {
            rate = Math.round(publicData.rates.IDR);
          }
        }
      }

      if (rate) {
        handleUpdateUsdRate(rate);
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WITA';
        setUsdRateSyncTime(timeStr);
        localStorage.setItem('cs_pos_usd_rate_sync_time', timeStr);
      }
    } catch (err) {
      console.error('Failed to sync live currency exchange rate:', err);
    } finally {
      setIsSyncingExchangeRate(false);
    }
  };

  useEffect(() => {
    // Automatically trigger official exchange rate sync on mount
    handleSyncExchangeRate();
  }, []);

  // Synchronize document favicon with custom uploaded logo URL (if any)
  useEffect(() => {
    const updateFavicon = () => {
      try {
        const customLogo = localStorage.getItem('torky_custom_logo');
        const iconElement = document.getElementById('app-favicon') as HTMLLinkElement;
        if (iconElement) {
          if (customLogo) {
            iconElement.href = customLogo;
            iconElement.removeAttribute('type');
          } else {
            iconElement.href = "data:image/svg+xml;utf8,%3Csvg viewBox='0 0 240 280' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='n' x1='30%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%230B2B9F'/%3E%3Cstop offset='50%25' stop-color='%231E5DCE'/%3E%3Cstop offset='100%25' stop-color='%233187F2'/%3E%3C/linearGradient%3E%3ClinearGradient id='b' x1='20%25' y1='10%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%231954C0'/%3E%3Cstop offset='60%25' stop-color='%232E9AE4'/%3E%3Cstop offset='100%25' stop-color='%2355C9F1'/%3E%3C/linearGradient%3E%3ClinearGradient id='t' x1='10%25' y1='20%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23289EE2'/%3E%3Cstop offset='60%25' stop-color='%2343CECE'/%3E%3Cstop offset='100%25' stop-color='%2381EADF'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M 113,18 C 111,55 116,110 160,158 C 182,182 208,185 210,155 C 212,125 192,85 174,68 C 152,47 125,25 113,18 Z' fill='url(%23n)'/%3E%3Cpath d='M 113,68 C 111,100 119,145 156,188 C 176,211 202,213 204,185 C 206,158 188,122 172,106 C 152,86 125,73 113,68 Z' fill='url(%23b)'/%3E%3Cpath d='M 118,120 C 117,144 122,180 152,212 C 168,229 192,231 194,208 C 196,186 182,156 168,143 C 151,127 128,124 118,120 Z' fill='url(%23t)'/%3E%3Cpath d='M 172,210 C 178,225 198,228 208,220 C 218,212 216,198 206,192' stroke='%234ECECD' stroke-width='12' stroke-linecap='round' fill='transparent'/%3E%3C/svg%3E";
            iconElement.setAttribute('type', 'image/svg+xml');
          }
        }
      } catch (err) {
        console.warn('Gagal merubah favicon:', err);
      }
    };

    updateFavicon();
    window.addEventListener('torky_logo_changed', updateFavicon);
    return () => window.removeEventListener('torky_logo_changed', updateFavicon);
  }, []);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'pcbuilder' | 'repairs' | 'inventory' | 'history' | 'directory'>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('Kasir');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [isLicenseGenOpen, setIsLicenseGenOpen] = useState<boolean>(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState<boolean>(false);
  const [isClientGuideOpen, setIsClientGuideOpen] = useState<boolean>(false);

  // Client-customizable live API Keys for Biteship & RajaOngkir
  const [clientBiteshipKey, setClientBiteshipKey] = useState<string>(() => localStorage.getItem('cs_pos_biteship_key') || '');
  const [clientRajaongkirKey, setClientRajaongkirKey] = useState<string>(() => localStorage.getItem('cs_pos_rajaongkir_key') || '');

  // Dynamic branding and operator name credentials
  const [operatorName, setOperatorName] = useState<string>('Yan Torky');

  const getRoleLabel = (role: string) => {
    const sector = storeConfig?.businessSector || 'Electronics';
    if (role === 'Teknisi') {
      if (sector === 'Services') return 'Teknisi / Mekanik';
      if (sector === 'Electronics') return 'Teknisi IT / Servis';
      return 'Teknisi / Mekanik';
    }
    return role;
  };

  const [storeConfig, setStoreConfig] = useState(() => {
    const saved = localStorage.getItem('cs_pos_store_config');
    return saved ? JSON.parse(saved) : {
      name: 'Torky Komputer',
      powerTitle: 'Anda Yang Utama',
      logoUrl: '',
      businessSector: 'Electronics',
      address: 'Jl. Ahmad Yani No. 88, Denpasar',
      phone: '0812-3456-7890',
    };
  });

  useEffect(() => {
    localStorage.setItem('cs_pos_store_config', JSON.stringify(storeConfig));
    syncKeyToServer('cs_pos_store_config', storeConfig);
    // Trigger live event for UI components to reload
    window.dispatchEvent(new Event('torky_store_changed'));
  }, [storeConfig]);

  // Dynamic role PIN configuration
  const [rolePins, setRolePins] = useState<Record<UserRole, string>>(() => {
    const saved = localStorage.getItem('cs_pos_role_pins');
    return saved ? JSON.parse(saved) : {
      'Super Admin': '9999',
      'Admin': '8888',
      'Kasir': '7777',
      'Teknisi': '6666'
    };
  });

  useEffect(() => {
    localStorage.setItem('cs_pos_role_pins', JSON.stringify(rolePins));
    syncKeyToServer('cs_pos_role_pins', rolePins);
  }, [rolePins]);

  // Interactive UI Simulation Settings
  const [simulateAndroid, setSimulateAndroid] = useState<boolean>(true); // default true to align beautifully with "for android" modifier
  const [currentTime, setCurrentTime] = useState(new Date());

  // Inter-tab Transfer Presets (Repair -> POS transfer)
  const [presetCustomer, setPresetCustomer] = useState<string>('');
  const [presetCustomerPhone, setPresetCustomerPhone] = useState<string>('');
  const [presetCartItems, setPresetCartItems] = useState<{ product: Product; quantity: number }[]>([]);


  // Periodically refresh header time in simulated android bar
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // One-time auto-migration to purge old fictional electronic repair data with clean IT catalog
  useEffect(() => {
    const hasCheckedMigration = localStorage.getItem('cs_pos_migrated_v3_clean_it');
    if (!hasCheckedMigration) {
      const oldKeys = ['televisi', 'tv ', 'kulkas', 'mesin cuci', 'refrigerator', 'polytron', 'sharp', 'kompresor', 'kipas'];
      const hasOldElectronics = products.some(p => 
        oldKeys.some(key => p.name.toLowerCase().includes(key)) ||
        (p.category === 'Lainnya' && p.price < 500000)
      );
      
      const isBlankAndShouldSeeded = products.length === 0 && INITIAL_PRODUCTS.length > 0;

      if (hasOldElectronics || isBlankAndShouldSeeded) {
        setProducts(INITIAL_PRODUCTS);
        setJobs(INITIAL_REPAIR_JOBS);
        setCustomers(INITIAL_CUSTOMERS);
        setSuppliers(INITIAL_SUPPLIERS);
        setTransactions([]);
        localStorage.setItem('cs_pos_transactions', '[]');
      }
      localStorage.setItem('cs_pos_migrated_v3_clean_it', 'true');
    }
  }, [products]);

  // Save changes to localStorage and replicate to the master POS database server
  useEffect(() => {
    localStorage.setItem('cs_pos_products', JSON.stringify(products));
    syncKeyToServer('cs_pos_products', products);
  }, [products]);

  useEffect(() => {
    localStorage.setItem('cs_pos_jobs', JSON.stringify(jobs));
    syncKeyToServer('cs_pos_jobs', jobs);
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('cs_pos_transactions', JSON.stringify(transactions));
    syncKeyToServer('cs_pos_transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('cs_pos_customers', JSON.stringify(customers));
    syncKeyToServer('cs_pos_customers', customers);
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('cs_pos_suppliers', JSON.stringify(suppliers));
    syncKeyToServer('cs_pos_suppliers', suppliers);
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('cs_pos_licensed_key', licensedKey);
    syncKeyToServer('cs_pos_licensed_key', licensedKey);
  }, [licensedKey]);

  useEffect(() => {
    localStorage.setItem('cs_pos_installation_id', installationId);
    syncKeyToServer('cs_pos_installation_id', installationId);
  }, [installationId]);

  // Unified State Synchronization Engine (Initial Load & Inter-Device Replication)
  useEffect(() => {
    const initSync = async () => {
      try {
        const res = await fetch('/api/db');
        if (res.ok) {
          const serverData = await res.json();
          const hasServerData = serverData && Object.keys(serverData).length > 0;

          if (hasServerData) {
            console.log('[Torky Sync] Centralized database loaded from server:', serverData);
            
            if (serverData.cs_pos_products) {
              setProducts(serverData.cs_pos_products);
              localStorage.setItem('cs_pos_products', JSON.stringify(serverData.cs_pos_products));
            }
            if (serverData.cs_pos_installation_id) {
              setInstallationId(serverData.cs_pos_installation_id);
              localStorage.setItem('cs_pos_installation_id', serverData.cs_pos_installation_id);
            }
            if (serverData.cs_pos_licensed_key !== undefined) {
              setLicensedKey(serverData.cs_pos_licensed_key);
              localStorage.setItem('cs_pos_licensed_key', serverData.cs_pos_licensed_key);
            }
            if (serverData.cs_pos_jobs) {
              setJobs(serverData.cs_pos_jobs);
              localStorage.setItem('cs_pos_jobs', JSON.stringify(serverData.cs_pos_jobs));
            }
            if (serverData.cs_pos_transactions) {
              setTransactions(serverData.cs_pos_transactions);
              localStorage.setItem('cs_pos_transactions', JSON.stringify(serverData.cs_pos_transactions));
            }
            if (serverData.cs_pos_customers) {
              setCustomers(serverData.cs_pos_customers);
              localStorage.setItem('cs_pos_customers', JSON.stringify(serverData.cs_pos_customers));
            }
            if (serverData.cs_pos_suppliers) {
              setSuppliers(serverData.cs_pos_suppliers);
              localStorage.setItem('cs_pos_suppliers', JSON.stringify(serverData.cs_pos_suppliers));
            }
            if (serverData.cs_pos_staffs) {
              setStaffs(serverData.cs_pos_staffs);
              localStorage.setItem('cs_pos_staffs', JSON.stringify(serverData.cs_pos_staffs));
            }
            if (serverData.cs_pos_store_config) {
              setStoreConfig(serverData.cs_pos_store_config);
              localStorage.setItem('cs_pos_store_config', JSON.stringify(serverData.cs_pos_store_config));
            }
            if (serverData.cs_pos_role_pins) {
              setRolePins(serverData.cs_pos_role_pins);
              localStorage.setItem('cs_pos_role_pins', JSON.stringify(serverData.cs_pos_role_pins));
            }
            if (serverData.cs_pos_usd_rate) {
              setUsdRate(Number(serverData.cs_pos_usd_rate));
              localStorage.setItem('cs_pos_usd_rate', serverData.cs_pos_usd_rate.toString());
            }
            if (serverData.cs_pos_usd_rate_sync_time) {
              setUsdRateSyncTime(serverData.cs_pos_usd_rate_sync_time);
              localStorage.setItem('cs_pos_usd_rate_sync_time', serverData.cs_pos_usd_rate_sync_time);
            }
            if (serverData.cs_pos_biteship_key !== undefined) {
              setClientBiteshipKey(serverData.cs_pos_biteship_key);
              localStorage.setItem('cs_pos_biteship_key', serverData.cs_pos_biteship_key);
            }
            if (serverData.cs_pos_rajaongkir_key !== undefined) {
              setClientRajaongkirKey(serverData.cs_pos_rajaongkir_key);
              localStorage.setItem('cs_pos_rajaongkir_key', serverData.cs_pos_rajaongkir_key);
            }
          } else {
            console.log('[Torky Sync] Central database empty, pushing current browser settings up as bootstrap state.');
            const bootstrapPayload = {
              cs_pos_products: products,
              cs_pos_installation_id: installationId,
              cs_pos_licensed_key: licensedKey,
              cs_pos_jobs: jobs,
              cs_pos_transactions: transactions,
              cs_pos_customers: customers,
              cs_pos_suppliers: suppliers,
              cs_pos_staffs: staffs,
              cs_pos_store_config: storeConfig,
              cs_pos_role_pins: rolePins,
              cs_pos_usd_rate: usdRate,
              cs_pos_usd_rate_sync_time: usdRateSyncTime,
              cs_pos_biteship_key: clientBiteshipKey,
              cs_pos_rajaongkir_key: clientRajaongkirKey,
            };

            await fetch('/api/db-bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: bootstrapPayload }),
            });
          }
        }
      } catch (err) {
        console.warn('[Torky Sync] Central database error - fallback to offline browser localstorage mode:', err);
      } finally {
        setIsInitialLoaded(true);
      }
    };
    initSync();
  }, []);

  // Periodic State Reconciliation Pulls from server db (makes multiclients updates synchronized automatically)
  useEffect(() => {
    if (!isInitialLoaded) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/db');
        if (res.ok) {
          const serverData = await res.json();
          if (serverData && Object.keys(serverData).length > 0) {
            if (serverData.cs_pos_products) {
              setProducts(serverData.cs_pos_products);
              localStorage.setItem('cs_pos_products', JSON.stringify(serverData.cs_pos_products));
            }
            if (serverData.cs_pos_jobs) {
              setJobs(serverData.cs_pos_jobs);
              localStorage.setItem('cs_pos_jobs', JSON.stringify(serverData.cs_pos_jobs));
            }
            if (serverData.cs_pos_transactions) {
              setTransactions(serverData.cs_pos_transactions);
              localStorage.setItem('cs_pos_transactions', JSON.stringify(serverData.cs_pos_transactions));
            }
            if (serverData.cs_pos_customers) {
              setCustomers(serverData.cs_pos_customers);
              localStorage.setItem('cs_pos_customers', JSON.stringify(serverData.cs_pos_customers));
            }
            if (serverData.cs_pos_suppliers) {
              setSuppliers(serverData.cs_pos_suppliers);
              localStorage.setItem('cs_pos_suppliers', JSON.stringify(serverData.cs_pos_suppliers));
            }
            if (serverData.cs_pos_staffs) {
              setStaffs(serverData.cs_pos_staffs);
              localStorage.setItem('cs_pos_staffs', JSON.stringify(serverData.cs_pos_staffs));
            }
            if (serverData.cs_pos_store_config) {
              setStoreConfig(serverData.cs_pos_store_config);
              localStorage.setItem('cs_pos_store_config', JSON.stringify(serverData.cs_pos_store_config));
            }
            if (serverData.cs_pos_role_pins) {
              setRolePins(serverData.cs_pos_role_pins);
              localStorage.setItem('cs_pos_role_pins', JSON.stringify(serverData.cs_pos_role_pins));
            }
            if (serverData.cs_pos_licensed_key !== undefined) {
              setLicensedKey(serverData.cs_pos_licensed_key);
              localStorage.setItem('cs_pos_licensed_key', serverData.cs_pos_licensed_key);
            }
            if (serverData.cs_pos_installation_id) {
              setInstallationId(serverData.cs_pos_installation_id);
              localStorage.setItem('cs_pos_installation_id', serverData.cs_pos_installation_id);
            }
          }
        }
      } catch (e) {
        console.warn('[Sync Pull] Background sync error:', e);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [isInitialLoaded]);

  // CLIENTS & PELANGGAN B2B OPERATIONS
  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const handleUpdateCustomer = (customerId: string, updatedCustomer: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? updatedCustomer : c))
    );
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  // SUPPLIERS OPERATIONS
  const handleAddSupplier = (newSupplier: Supplier) => {
    setSuppliers((prev) => [newSupplier, ...prev]);
  };

  const handleUpdateSupplier = (supplierId: string, updatedSupplier: Supplier) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? updatedSupplier : s))
    );
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
  };

  const handleResetDirectory = () => {
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setStaffs(INITIAL_STAFFS);
  };

  const handleResetStaffsOnly = () => {
    setStaffs([]);
    localStorage.setItem('cs_pos_staffs', '[]');
    setIsLoggedIn(false);
    setUserRole('Kasir');
    setOperatorName('');
    setActiveTab('dashboard');
    window.location.reload();
  };

  const handleResetCustomersOnly = () => {
    setCustomers([]);
  };

  const handleResetSuppliersOnly = () => {
    setSuppliers([]);
  };

  const handleResetProductsOnly = () => {
    setProducts([]);
  };

  // STAFFS OPERATIONS
  const handleAddStaff = (newStaff: Staff) => {
    setStaffs((prev) => [newStaff, ...prev]);
  };

  const handleUpdateStaff = (staffId: string, updatedStaff: Staff) => {
    setStaffs((prev) =>
      prev.map((s) => (s.id === staffId ? updatedStaff : s))
    );
  };

  const handleDeleteStaff = (staffId: string) => {
    setStaffs((prev) => prev.filter((s) => s.id !== staffId));
  };


  // INVENTORY OPERATIONS
  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleUpdateProduct = (productId: string, updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? updatedProduct : p))
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleUpdateStockDirect = (productId: string, newStock: number | null) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
  };

  const handleUpdatePrice = (productId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, price: newPrice } : p))
    );
  };

  // Dedicated function to deduct stock during sales/replacements
  const handleDeductStock = (productId: string, qty: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId && p.stock !== null) {
          const updated = Math.max(0, p.stock - qty);
          return { ...p, stock: updated };
        }
        return p;
      })
    );
  };

  // TRANSACTION OPERATIONS
  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleRefundTransaction = (txId: string) => {
    const originalTx = transactions.find((tx) => tx.id === txId);
    if (!originalTx) return;

    // Restore stock counts for returned parts
    originalTx.items.forEach((item) => {
      if (item.product.stock !== null) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === item.product.id && p.stock !== null
              ? { ...p, stock: p.stock + item.quantity }
              : p
          )
        );
      }
    });

    // Remove from archive list
    setTransactions((prev) => prev.filter((tx) => tx.id !== txId));
  };

  // SERVICE REPAIRS OPERATIONS
  const handleAddJob = (newJob: RepairJob) => {
    setJobs((prev) => [newJob, ...prev]);
  };

  const handleDeleteJob = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const handleResetJobs = () => {
    setJobs([]);
  };

  const handleResetTransactions = () => {
    setTransactions([]);
  };

  const handleResetAllData = () => {
    localStorage.removeItem('cs_pos_products');
    localStorage.removeItem('cs_pos_jobs');
    localStorage.removeItem('cs_pos_transactions');
    localStorage.removeItem('cs_pos_customers');
    localStorage.removeItem('cs_pos_suppliers');
    localStorage.removeItem('cs_pos_staffs');
    localStorage.removeItem('cs_pos_store_config');
    localStorage.removeItem('torky_custom_logo');
    setProducts(INITIAL_PRODUCTS);
    setJobs(INITIAL_REPAIR_JOBS);
    setTransactions([]);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setStaffs([]);
    // Reload to apply changes completely
    window.location.reload();
  };

  const handleUpdateJobStatus = (jobId: string, status: JobStatus) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status } : j))
    );
  };

  const handleUpdateJobParts = (jobId: string, parts: { name: string; price: number }[]) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          // If a new part was added, we can deduct 1 unit from our stock list automatically!
          const previousPartsNames = j.partsUsed.map((p) => p.name);
          const newlyAddedPartsFiles = parts.filter((p) => !previousPartsNames.includes(p.name));

          newlyAddedPartsFiles.forEach((newPart) => {
            const matchedProduct = products.find((prod) => prod.name === newPart.name);
            if (matchedProduct && matchedProduct.stock !== null) {
              handleDeductStock(matchedProduct.id, 1);
            }
          });

          const totalCost = j.laborCost + parts.reduce((acc, c) => acc + c.price, 0);
          return { ...j, partsUsed: parts, estimatedCost: totalCost };
        }
        return j;
      })
    );
  };

  // Core bridging function: Transfer repair orders into active POS ticket
  const handleTransferToPOS = (customerName: string, customerPhone: string, items: { product: Product; qty: number }[]) => {
    setPresetCustomer(customerName);
    setPresetCustomerPhone(customerPhone);
    setPresetCartItems(items);
    setActiveTab('pos');
  };

  const handleClearPresets = () => {
    setPresetCustomer('');
    setPresetCustomerPhone('');
    setPresetCartItems([]);
  };

  // Function to filter navigation tabs dynamically based on logged-in user role privileges (International POS Standard)
  const getRoleNavItems = (role: UserRole) => {
    const sector = storeConfig?.businessSector || 'Electronics';
    const type = storeConfig?.businessType || 'pos_services';

    // Rename repairs tab based on Business Sector
    let repairsLabel = 'Service Tickets';
    if (sector === 'Services') {
      repairsLabel = 'Service & Antrean';
    }

    let items = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'pos', label: 'POS Terminal', icon: Receipt },
      { id: 'pcbuilder', label: 'Simulasi PC', icon: Cpu },
      { id: 'repairs', label: repairsLabel, icon: Wrench },
      { id: 'inventory', label: 'Stock Manager', icon: Package },
      { id: 'history', label: 'Sales Records', icon: History },
      { id: 'directory', label: 'B2B & Contacts', icon: Users },
    ];

    // Filter based on Sector & Type
    if (sector === 'Electronics') {
      if (type === 'pos_only') {
        items = items.filter(item => item.id !== 'pcbuilder' && item.id !== 'repairs');
      }
    } else if (sector === 'Services') {
      // Services sector doesn't have PC builder
      items = items.filter(item => item.id !== 'pcbuilder');
      if (type === 'pos_only') {
        items = items.filter(item => item.id !== 'repairs');
      }
    } else {
      // Retail, Culinary, Apparel NEVER have PC builder or Repairs
      items = items.filter(item => item.id !== 'pcbuilder' && item.id !== 'repairs');
    }

    if (role === 'Teknisi') {
      // Technicians handle allowed tasks in current filter
      const allowedIds = ['dashboard', 'repairs', 'pcbuilder', 'inventory'];
      return items.filter(item => allowedIds.includes(item.id));
    }
    if (role === 'Kasir') {
      // Cashiers handle allowed tasks in current filter
      const allowedIds = ['dashboard', 'pos', 'pcbuilder', 'repairs', 'inventory'];
      return items.filter(item => allowedIds.includes(item.id));
    }
    // Admin and Super Admin have full tab view access with operational level action lockouts
    return items;
  };

  const isTabAllowedForRole = (tab: string, role: UserRole) => {
    const allowed = getRoleNavItems(role).map(item => item.id);
    return allowed.includes(tab as any);
  };

  // Render proper sub-views based on active user tab selection
  const renderTabContent = () => {
    if (!isActivated) {
      return (
        <ActivationGate
          installationId={installationId}
          onVerifyKey={(key) => {
            const isValid = isLicenseKeyValid(key);
            if (isValid) {
              localStorage.setItem('cs_pos_licensed_key', key.toUpperCase());
              setLicensedKey(key.toUpperCase());
            }
            return isValid;
          }}
          onBypassSandbox={() => {
            const bypassKey = 'TORKY-POS-8822-APPROVED';
            localStorage.setItem('cs_pos_licensed_key', bypassKey);
            setLicensedKey(bypassKey);
          }}
          storeConfig={storeConfig}
        />
      );
    }

    if (!isLoggedIn) {
      return (
        <LoginScreen
          onLoginSuccess={(role, name) => {
            setUserRole(role);
            setOperatorName(name);
            setIsLoggedIn(true);
            // Default safe starting tab per role
            if (role === 'Teknisi') {
              setActiveTab(storeConfig?.businessType === 'pos_only' ? 'inventory' : 'repairs');
            } else if (role === 'Kasir') {
              setActiveTab('pos');
            } else {
              setActiveTab('dashboard');
            }
          }}
          rolePins={rolePins}
          staffs={staffs}
          onRegisterFirstSuperAdmin={handleAddStaff}
          storeConfig={storeConfig}
          onUpdateStoreConfig={setStoreConfig}
        />
      );
    }

    if (!isTabAllowedForRole(activeTab, userRole)) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-white border border-rose-100 rounded-3xl shadow-sm text-center max-w-sm mx-auto my-8">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4 border border-rose-100">
            <Lock className="w-7 h-7 font-bold text-rose-600" />
          </div>
          <h3 className="font-bold text-slate-850 text-sm">Otoritas Sesi Terbatas</h3>
          <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
            Peran akun Anda saat ini (<strong className="text-rose-600 font-bold font-mono">{userRole}</strong>) tidak diizinkan membuka modul <strong className="text-slate-700 font-mono">"{activeTab}"</strong> berdasarkan standar operasional internal {storeConfig.name}.
          </p>
          <button 
            onClick={() => {
              if (userRole === 'Teknisi') {
                setActiveTab('repairs');
              } else if (userRole === 'Kasir') {
                setActiveTab('pos');
              } else {
                setActiveTab('dashboard');
              }
            }} 
            className="mt-5 px-4.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            Kembali ke Beranda
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            products={products}
            jobs={jobs}
            transactions={transactions}
            onNavigate={setActiveTab}
            userRole={userRole}
            operatorName={operatorName}
            storeConfig={storeConfig}
            onUpdateStoreConfig={setStoreConfig}
            onResetAllData={handleResetAllData}
          />
        );
      case 'pos':
        return (
          <POSTerminal
            products={products}
            customers={customers}
            onUpdateStock={handleDeductStock}
            onAddTransaction={handleAddTransaction}
            customerNamePreset={presetCustomer}
            customerPhonePreset={presetCustomerPhone}
            presetCartItemsPreset={presetCartItems}
            onClearPresetCustomer={handleClearPresets}
            userRole={userRole}
            storeConfig={storeConfig}
            onAddCustomer={handleAddCustomer}
            onResetCustomers={() => setCustomers(INITIAL_CUSTOMERS)}
          />
        );
      case 'repairs':
        return (
          <RepairJobs
            jobs={jobs}
            products={products}
            onAddJob={handleAddJob}
            onUpdateJobStatus={handleUpdateJobStatus}
            onUpdateJobParts={handleUpdateJobParts}
            onTransferToPOS={handleTransferToPOS}
            onDeleteJob={handleDeleteJob}
            onResetJobs={handleResetJobs}
            userRole={userRole}
            rolePins={rolePins}
            staffs={staffs}
            storeConfig={storeConfig}
          />
        );
      case 'pcbuilder':
        return (
          <PCSimulator
            products={products}
            onTransferToPOS={handleTransferToPOS}
          />
        );
      case 'inventory':
        return (
          <InventoryManager
            products={products}
            suppliers={suppliers}
            onAddProduct={handleAddProduct}
            onUpdateStockDirect={handleUpdateStockDirect}
            onUpdatePrice={handleUpdatePrice}
            onDeleteProduct={handleDeleteProduct}
            onUpdateProduct={handleUpdateProduct}
            userRole={userRole}
            usdRate={usdRate}
            onUpdateUsdRate={handleUpdateUsdRate}
            rolePins={rolePins}
            staffs={staffs}
            onResetProducts={handleResetProductsOnly}
            usdRateSyncTime={usdRateSyncTime}
            isSyncingExchangeRate={isSyncingExchangeRate}
            onSyncExchangeRate={handleSyncExchangeRate}
          />
        );
      case 'history':
        return (
          <SalesHistory
            transactions={transactions}
            onRefundTransaction={handleRefundTransaction}
            onResetTransactions={handleResetTransactions}
            userRole={userRole}
            rolePins={rolePins}
            storeConfig={storeConfig}
            suppliers={suppliers}
            staffs={staffs}
          />
        );
      case 'directory':
        return (
          <DirectoryManager
            customers={customers}
            suppliers={suppliers}
            staffs={staffs}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onAddStaff={handleAddStaff}
            onUpdateStaff={handleUpdateStaff}
            onDeleteStaff={handleDeleteStaff}
            onResetDirectory={handleResetDirectory}
            onResetStaffs={handleResetStaffsOnly}
            onResetCustomers={handleResetCustomersOnly}
            onResetSuppliers={handleResetSuppliersOnly}
            userRole={userRole}
            rolePins={rolePins}
            storeConfig={storeConfig}
          />
        );
      default:
        return null;
    }
  };

  // Static reference schema for master properties mapping
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Terminal', icon: Receipt },
    { id: 'pcbuilder', label: 'Simulasi PC', icon: Cpu },
    { id: 'repairs', label: 'Service Tickets', icon: Wrench },
    { id: 'inventory', label: 'Stock Manager', icon: Package },
    { id: 'history', label: 'Sales Records', icon: History },
    { id: 'directory', label: 'B2B & Contacts', icon: Users },
  ] as const;


  // The view can render either as a full widescreen responsive desktop app, or inside a beautiful phone frame overlay
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start text-slate-800 transition-colors duration-300">
      {/* Simulation Controller Header Bar */}
      <header className="w-full max-w-7xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 shrink-0 bg-white">
        <Logo size="md" variant="horizontal" />

        {/* View Mode & Operator Switcher */}
        <div className="flex bg-slate-50 border border-slate-150 rounded-xl p-0.5 shadow-inner items-center flex-wrap sm:flex-nowrap gap-1">
          {/* Active Operator Status & Logout Button */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2 pl-2.5 pr-1.5 border-r border-slate-200 py-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Active:</span>
              <span className="text-[11px] font-extrabold text-[#0d9488] bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-100 flex items-center">
                {userRole === 'Super Admin' && '👑 ' + userRole}
                {userRole === 'Admin' && '🛡️ ' + userRole}
                {userRole === 'Kasir' && '💼 ' + userRole}
                {userRole === 'Teknisi' && '🔧 ' + getRoleLabel(userRole)}
              </span>
              {userRole === 'Super Admin' && (
                <button
                  type="button"
                  onClick={() => setIsLicenseGenOpen(true)}
                  className="text-[9px] bg-teal-600 hover:bg-teal-500 text-white font-extrabold px-2 py-1 rounded-md transition-all shadow-xs border border-teal-700 font-mono tracking-wider cursor-pointer mr-1"
                  title="Buka Terminal Lisensi & Pembuatan Kode Aktivasi"
                >
                  🔑 LISENSI GEN
                </button>
              )}
              {(userRole === 'Super Admin' || userRole === 'Admin') && (
                <button
                  type="button"
                  onClick={() => setIsApiSettingsOpen(true)}
                  className="text-[9px] bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-2 py-1 rounded-md transition-all shadow-xs border border-indigo-700 font-mono tracking-wider cursor-pointer mr-1"
                  title="Buka Pengaturan API Biteship & Rajaongkir"
                >
                  🌐 SETUP API
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsClientGuideOpen(true)}
                className="text-[9px] bg-slate-900 hover:bg-slate-850 text-emerald-400 font-extrabold px-2 py-1 rounded-md transition-all shadow-xs border border-slate-950 font-mono tracking-wider cursor-pointer mr-1"
                title="Buka Dokumen Panduan & PDF Torky"
              >
                📄 PANDUAN KLIEN (PDF)
              </button>
              <button
                onClick={() => {
                  setIsChangePinOpen(true);
                }}
                className="text-[9px] bg-teal-50 hover:bg-teal-100 text-teal-800 font-extrabold px-2 py-1 rounded-md transition-all border border-teal-200"
                title="Ganti PIN Keamanan"
              >
                GANTI PIN
              </button>
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                }}
                className="text-[9px] bg-slate-100 hover:bg-slate-200 font-extrabold px-2 py-1 rounded-md text-slate-600 transition-all border border-slate-200"
                title="Log Out Terminal"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pl-3 pr-2.5 border-r border-[#cbd5e1]/45 text-[10px] font-extrabold text-rose-600 font-mono tracking-wide uppercase">
              🔒 STASIUN DESK TERKUNCI
            </div>
          )}

          {/* License Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold font-mono text-slate-500 border-r border-slate-200">
            {licensedKey && licensedKey.toUpperCase() !== 'TORKY-POS-8822-APPROVED' ? (
              <span className="text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <Shield className="w-3 h-3 text-teal-600 font-bold" />
                <span>ACTIVE LICENSE</span>
              </span>
            ) : (
              <button
                onClick={() => {
                  localStorage.removeItem('cs_pos_licensed_key');
                  window.location.reload();
                }}
                className="text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                title="Sesi Evaluasi Sandbox. Klik untuk mengunci ulang."
              >
                <Shield className="w-3 h-3 text-amber-600 animate-pulse" />
                <span>DEV BYPASS (LOCK)</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setSimulateAndroid(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              !simulateAndroid ? 'bg-teal-500 text-slate-50 shadow-md' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LaptopIcon className="w-3.5 h-3.5" /> Full Width
          </button>
          <button
            onClick={() => setSimulateAndroid(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              simulateAndroid ? 'bg-teal-500 text-slate-50 shadow-md' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Android Device
          </button>
        </div>
      </header>

      {/* Main Container Section */}
      <main className="w-full flex-1 flex items-center justify-center p-0 md:p-6 select-none bg-slate-50">
        <AnimatePresence mode="wait">
          {simulateAndroid ? (
            /* SLEEK SIMULATED ANDROID HANDHELD TERMINAL DEVICE WRAPPER - RESPONSIVE TO SCREEN HEIGHTS */
            <motion.div
              key="android-wrapper"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[420px] h-[calc(100vh-170px)] max-h-[800px] min-h-[580px] bg-[#040609] rounded-[48px] p-3 shadow-2xl relative border-4 border-[#1b1f30] flex flex-col overflow-hidden my-2"
              style={{ boxShadow: '0 25px 60px -15px rgba(0,0,0,0.9)' }}
            >
              {/* Android top physical speaker and camera notch grill */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#040609] rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-100/10 rounded-full" />
                <div className="w-2.5 h-2.5 bg-slate-100/20 rounded-full ml-1.5" />
              </div>

              {/* Dynamic device display content */}
              <div className="flex-1 rounded-[36px] bg-slate-50 overflow-hidden flex flex-col relative border border-slate-100">
                {/* Upper Status indicators bar */}
                <div className="h-7 bg-white text-slate-400 px-6 pt-1 text-[11px] font-bold font-mono tracking-tight flex justify-between items-center select-none border-b border-slate-100 z-10">
                  <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-semibold text-emerald-600">POS-ON</span>
                    <Wifi className="w-3 h-3 text-slate-600" />
                    <Battery className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                </div>

                {/* Simulated Android App Container and Screen */}
                <div className="flex-1 overflow-y-auto p-4 pb-24 scrollbar-thin relative flex flex-col justify-between">
                  {/* Subtle smartphone viewport watermark using the actual SVG Logo icon */}
                  <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-25 flex items-center justify-center opacity-[0.045]">
                    <div className="text-center transform -rotate-12 flex flex-col items-center">
                      <Logo variant="icon" className="w-24 h-24 mb-1" />
                      <p className="font-serif font-black text-xs tracking-wider text-slate-700">TORKY KOMPUTER</p>
                      <p className="font-sans font-black text-[8px] tracking-wider uppercase text-slate-500">
                        {licensedKey && licensedKey.toUpperCase() !== 'TORKY-POS-8822-APPROVED' ? 'ENTERPRISE LICENSED' : 'EVALUASI SANDBOX'}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 flex-1 flex flex-col">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="flex-1 flex flex-col"
                      >
                        {renderTabContent()}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
                       {/* Tactile Bottom Navigation Tray for Android Handheld Terminal */}
                <nav className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-2xl py-1 px-2 flex justify-between items-center z-35 shadow-xl border border-slate-100">
                  {/* Dynamic allowed priority tabs map (up to 4 items) */}
                  {getRoleNavItems(userRole).slice(0, 4).map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id && !isMoreMenuOpen;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setIsMoreMenuOpen(false);
                        }}
                        className="flex flex-col items-center flex-1 transition-all py-1 focus:outline-hidden"
                      >
                        <div
                          className={`p-1.5 rounded-xl transition-all ${
                            isActive ? 'bg-teal-500 text-slate-950 font-bold scale-105 shadow-sm' : 'text-slate-450 hover:text-slate-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-[8px] mt-0.5 tracking-tight font-black leading-none ${
                            isActive ? 'text-teal-605 font-extrabold' : 'text-slate-500'
                          }`}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}

                  {/* Item 5: Lainnya (Menu) */}
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(!isMoreMenuOpen);
                    }}
                    className="flex flex-col items-center flex-1 transition-all py-1 focus:outline-hidden"
                  >
                    <div
                      className={`p-1.5 rounded-xl transition-all ${
                        isMoreMenuOpen ? 'bg-amber-400 text-slate-950 font-bold scale-105 shadow-sm' : 'text-slate-455 hover:text-slate-700'
                      }`}
                    >
                      <Menu className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[8px] mt-0.5 tracking-tight font-black leading-none ${
                        isMoreMenuOpen ? 'text-amber-500 font-extrabold' : 'text-slate-550'
                      }`}
                    >
                      Lainnya
                    </span>
                  </button>
                </nav>

                {/* Slide-up "Lainnya" Drawer Bottom-Sheet for Android viewports */}
                <AnimatePresence>
                  {isMoreMenuOpen && (
                    <>
                      {/* Backdrop to close list */}
                      <div 
                        onClick={() => setIsMoreMenuOpen(false)}
                        className="absolute inset-0 bg-slate-950/50 z-40 backdrop-blur-xs" 
                      />
                      
                      {/* Springy sheet with scroll-safe responsiveness */}
                      <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 24, stiffness: 210 }}
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] p-5 pb-7 z-50 border-t border-slate-100 shadow-[0_-8px_32px_rgba(0,0,0,0.15)] flex flex-col font-sans max-h-[80vh] overflow-y-auto"
                      >
                        {/* Drag indicator shape */}
                        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3.5 shrink-0" />

                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3 shrink-0">
                          <h4 className="text-[10.5px] font-extrabold text-slate-900 uppercase font-mono tracking-wider">
                            Menu Tambahan ({userRole})
                          </h4>
                          <span className="text-[8px] font-mono text-slate-400 uppercase">
                            TORKY TERMINAL MOBILE
                          </span>
                        </div>

                        {/* List of sub menus inside Drawer */}
                        <div className="space-y-1.5 overflow-y-auto pr-1">
                          {/* Secondary Allowed Tabs for this active role */}
                          {getRoleNavItems(userRole).slice(4).map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setActiveTab(item.id as any);
                                  setIsMoreMenuOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-105 rounded-xl border text-xs text-left font-bold transition-all ${
                                  isActive ? 'bg-teal-50 border-teal-200 text-teal-900 font-extrabold' : 'border-slate-150 text-slate-705'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Icon className="w-3.5 h-3.5 text-teal-600" />
                                  <span>{item.label}</span>
                                </div>
                                <span className="text-[8px] bg-slate-200 text-slate-600 font-mono px-1 py-0.5 rounded">BUKA</span>
                              </button>
                            );
                          })}

                          <div className="h-[1px] bg-slate-100 my-1 shrink-0" />

                          {/* Security PIN change */}
                          {isLoggedIn && (
                            <button
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                setIsChangePinOpen(true);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-950 text-xs text-left font-extrabold transition-all border border-orange-150"
                            >
                              <Lock className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                              <span>Ganti PIN Peran ({userRole})</span>
                            </button>
                          )}

                          {/* Logout trigger */}
                          {isLoggedIn && (
                            <button
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                setIsLoggedIn(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-950 text-xs text-left font-extrabold transition-all border border-red-150"
                            >
                              <LogOut className="w-3.5 h-3.5 text-red-650 shrink-0" />
                              <span>Logout Sesi Operator ("Keluar")</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            /* LARGE FULL WINDOWSCREEN PC LAYOUT WITH RESPONSIVE LEFT BAR */
            <motion.div
              key="desktop-wrapper"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="w-full max-w-7xl bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 flex h-[calc(100vh-140px)]"
            >
              {/* Desktop Left navigation Sidebar panel */}
              <aside className="w-64 bg-white text-slate-800 flex flex-col justify-between p-6 shrink-0 border-r border-slate-100">
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4 flex flex-col gap-3">
                    <Logo size="sm" variant="horizontal" />
                    <div>
                      <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block font-mono">
                        Operator Desk
                      </span>
                      <p className="text-xs font-bold text-teal-600 truncate max-w-[190px]">{operatorName}</p>
                      <p className="text-[10px] text-slate-400 font-semibold font-mono">{userRole}</p>
                    </div>
                  </div>

                  <nav className="space-y-1">
                    {getRoleNavItems(userRole).map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-teal-600 text-white font-extrabold shadow-sm'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-4.5 h-4.5 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="text-[10px] text-slate-450 border-t border-slate-100 pt-4 font-mono">
                  <span>© 2026 {storeConfig.name} POS</span>
                </div>
              </aside>

              {/* Main content viewport */}
              <div className="flex-1 bg-slate-50 overflow-y-auto p-6 scrollbar-thin relative flex flex-col justify-between">
                {/* Subtle visual watermark branding using the actual SVG Logo icon */}
                <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-25 flex items-center justify-center opacity-[0.035]">
                  <div className="text-center transform -rotate-12 flex flex-col items-center select-none">
                    <Logo variant="icon" className="w-80 h-96 opacity-90 mb-4" />
                    <p className="font-serif font-black text-4xl tracking-widest uppercase text-slate-700">TORKY KOMPUTER</p>
                    <p className="font-sans font-black text-xl tracking-widest uppercase text-slate-500 mt-1">
                      {licensedKey && licensedKey.toUpperCase() !== 'TORKY-POS-8822-APPROVED' ? 'ENTERPRISE LICENSED' : 'EVALUASI SANDBOX COPY'}
                    </p>
                    <p className="font-sans text-sm font-bold text-slate-400 mt-1.5">"ANDA YANG UTAMA" • POS TERMINAL v4.1</p>
                  </div>
                </div>

                <div className="relative z-10 flex-1 flex flex-col justify-between">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.18 }}
                      className="flex-1 flex flex-col"
                    >
                      {renderTabContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Change PIN overlay modal */}
      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        currentRole={userRole}
        rolePins={rolePins}
        onUpdatePins={(updated) => setRolePins(updated)}
        storeConfig={storeConfig}
      />

      {/* Super Admin License Key Generator Terminal Modal */}
      {isLicenseGenOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm font-sans text-slate-800">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 p-6 flex flex-col gap-5 relative text-slate-800"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center font-bold text-lg">
                  🔑
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base text-left">Terminal Lisensi Owner</h3>
                  <p className="text-[11px] text-slate-400 font-semibold font-mono text-left">CRACK-PROOF ACTIVATION PORTAL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLicenseGenOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200/65 rounded-2xl p-4 text-xs font-semibold leading-relaxed text-amber-800 flex gap-2">
                <span className="text-base select-none">🛡️</span>
                <div className="text-left">
                  <strong className="text-amber-900 block font-bold mb-0.5">SOP Aktivasi Komersial:</strong>
                  Sebelum menyerahkan Kode Lisensi di bawah ini, pastikan klien telah melampirkan <strong className="text-teal-700">Bukti Transfer Administratif</strong> senilai nominal kontribusi yang Anda kehendaki untuk kelangsungan bisnis ini!
                </div>
              </div>

              {/* Generator input fields */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-mono text-left">
                  Input Signature ID (Installation ID) Klien:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="YNTK-XXXX-XXXX-XXXX"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-teal-500 font-mono tracking-widest uppercase transition-all shadow-inner"
                    id="client-install-id-input"
                    defaultValue=""
                    onChange={(e) => {
                      const val = e.target.value.trim().toUpperCase();
                      const resultInput = document.getElementById('gen-license-result') as HTMLInputElement;
                      if (!val) {
                        if (resultInput) resultInput.value = 'TULISKAN ID DI ATAS';
                        return;
                      }
                      const activeKey = generateLicenseFromId(val);
                      if (resultInput) resultInput.value = activeKey;
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('client-install-id-input') as HTMLInputElement;
                      const resultInput = document.getElementById('gen-license-result') as HTMLInputElement;
                      if (input && resultInput) {
                        input.value = installationId;
                        resultInput.value = generateLicenseFromId(installationId);
                      }
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-teal-600 text-[10px] font-bold px-3 py-2 rounded-xl border border-slate-200 transition-all font-mono cursor-pointer"
                    title="Gunakan ID Signature perangkat Anda sendiri untuk pengujian"
                  >
                    GUNAKAN ID SAYA
                  </button>
                </div>
              </div>

              {/* Output License key generated */}
              <div className="space-y-2 bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center relative">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold mb-1">
                  KODE LISENSI AKTIVASI DIHASILKAN
                </span>
                
                <input
                  type="text"
                  readOnly
                  id="gen-license-result"
                  value="TULISKAN ID DI ATAS"
                  className="w-full text-center bg-transparent text-teal-400 font-black text-sm sm:text-lg tracking-widest font-mono outline-none border-none py-1 selection:bg-teal-500 selection:text-slate-900"
                />

                <p className="text-[9px] text-slate-500 text-center font-semibold mt-1 font-mono">
                  Sandi aman satu arah non-reversibel. Hanya akan valid pada ID yang bersangkutan.
                </p>
              </div>

              {/* Interaction buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLicenseGenOpen(false)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-205 text-slate-600 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                >
                  Tutup Terminal
                </button>
                <button
                  type="button"
                  id="copy-gen-btn"
                  onClick={() => {
                    const resultInput = document.getElementById('gen-license-result') as HTMLInputElement;
                    if (resultInput && resultInput.value && resultInput.value !== 'TULISKAN ID DI ATAS') {
                      navigator.clipboard.writeText(resultInput.value);
                      const label = document.getElementById('copy-gen-btn-label');
                      if (label) {
                        label.innerText = 'SALIN BERHASIL!';
                        setTimeout(() => {
                          if (label) label.innerText = 'SALIN KUNCI LISENSI';
                        }, 2000);
                      }
                    }
                  }}
                  className="flex-1 py-2.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all text-center shadow-md font-mono cursor-pointer"
                >
                  <span id="copy-gen-btn-label">SALIN KUNCI LISENSI</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Client API Integration Settings Modal */}
      {isApiSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm text-slate-850 font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 p-6 flex flex-col gap-4 relative text-slate-800 text-left"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                  🌐
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base text-left">Integrasi API Ekspedisi</h3>
                  <p className="text-[10px] text-slate-400 font-bold font-mono text-left">REAL-TIME SHIPPING HARMONIZER</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApiSettingsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed -mt-1 text-left">
              Silakan miliki akun mandiri pada provider di bawah untuk mendapatkan API KEY gratis maupun berbayar agar tarif pengiriman kasir Anda sinkron secara riil akurat:
            </p>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Biteship section card */}
              <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-800 tracking-wider font-mono">1. PROVIDER BITESHIP (UTAMA)</span>
                  <a
                    href="https://biteship.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-0.5 transition-all"
                  >
                    Daftar di Biteship ↗
                  </a>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Mendukung cek ongkir GoSend, GrabExpress, J&T, JNE, Sicepat terakurat beserta integrasi kurir instan berbasis titik koordinat maps. Ambil Token di <strong>Developer Console</strong> Anda.
                </p>
                <div className="space-y-1">
                  <input
                    type="password"
                    placeholder="biteship_live_..."
                    value={clientBiteshipKey}
                    onChange={(e) => setClientBiteshipKey(e.target.value.trim())}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-indigo-500 transition-all password-toggle"
                  />
                </div>
              </div>

              {/* Rajaongkir section card */}
              <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-800 tracking-wider font-mono">2. PROVIDER RAJAONGKIR (CADANGAN)</span>
                  <a
                    href="https://rajaongkir.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-0.5 transition-all"
                  >
                    Daftar di RajaOngkir ↗
                  </a>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Sangat stabil untuk cek ongkir JNE, J&T, Pos Indonesia (Tingkat Kabupaten/Kota). Buat akun gratis dan salin token API Starter milik Anda.
                </p>
                <div className="space-y-1">
                  <input
                    type="password"
                    placeholder="rajaongkir_api_starter_key_..."
                    value={clientRajaongkirKey}
                    onChange={(e) => setClientRajaongkirKey(e.target.value.trim())}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-indigo-500 transition-all password-toggle"
                  />
                </div>
              </div>
            </div>

            {/* Actions panel */}
            <div className="flex gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsApiSettingsOpen(false)}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('cs_pos_biteship_key', clientBiteshipKey);
                  localStorage.setItem('cs_pos_rajaongkir_key', clientRajaongkirKey);
                  syncKeyToServer('cs_pos_biteship_key', clientBiteshipKey);
                  syncKeyToServer('cs_pos_rajaongkir_key', clientRajaongkirKey);
                  setIsApiSettingsOpen(false);
                  
                  // Display confirmation and trigger component refresh
                  const notification = document.createElement('div');
                  notification.className = 'fixed bottom-5 right-5 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl border border-indigo-700 font-bold text-xs z-50 flex items-center gap-2 animate-bounce';
                  notification.innerHTML = '<span>🌐 API Ekspedisi Berhasil Disimpan & Diperbarui!</span>';
                  document.body.appendChild(notification);
                  setTimeout(() => {
                    notification.remove();
                    window.location.reload();
                  }, 2500);
                }}
                className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all text-center shadow-md cursor-pointer"
              >
                Simpan API Key
              </button>
            </div>
            <p className="text-[9px] text-slate-400 text-center font-semibold font-mono">
              *Torky POS akan otomatis beralih menggunakan API KEY mandiri Anda untuk penghitungan kasir riil.
            </p>
          </motion.div>
        </div>
      )}

      {/* Client Help Guide / PDF Generator Modal Component */}
      <ClientGuideModal
        isOpen={isClientGuideOpen}
        onClose={() => setIsClientGuideOpen(false)}
      />
    </div>
  );
}
