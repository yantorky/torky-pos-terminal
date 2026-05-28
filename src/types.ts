export type ItemCategory = 'Hardware Parts' | 'Service & Repair' | 'Accessories' | 'Software' | 'LAPTOP' | 'BuildUp Komputer' | 'Server' | 'Gadget' | 'Lainnya' | (string & {});

export type UserRole = 'Super Admin' | 'Admin' | 'Kasir' | 'Teknisi';

export interface Product {
  id: string;
  name: string;
  category: ItemCategory;
  price: number; // default price
  cost: number; // For calculations of profit margin (Supplier base purchase price)
  stock: number | null; // null represents infinite (like Services)
  sku: string;
  unit: string; // e.g., 'pcs', 'hour', 'job'
  barcode?: string;
  subCategory?: string; // e.g. 'Processor', 'Motherboard', 'RAM', 'Storage', 'Graphics Card', 'Power Supply', 'Casing', 'Cooler', 'Laptop', 'UPS', 'Keyboard', 'Mouse', etc.
  
  // Advanced warranty and supplier tracking
  brand?: string;
  specifications?: string;
  supplierId?: string; // Linked supplier id from Suppliers
  supplierInvoiceNo?: string; // Invoice/Nota from supplier for warranty claim
  serialNumbers?: string[]; // Serial Numbers representing individual units in stock

  // Tiered Pricing
  priceRetail?: number;     // Walk-in / Pelanggan Tidak Tetap (usually defaults to price)
  priceCorporate?: number;  // Kantor / Corporate Client
  pricePartner?: number;    // Pelanggan Tetap / Reseller / Partner (Toko Sesama)

  // USD Rate Options
  priceUSD?: number;        // Base retail price in USD for currency adjustment
  costUSD?: number;         // Base cost price in USD from supplier
}

export interface CartItem {
  id: string; // matches product id
  product: Product;
  quantity: number;
  selectedRamUpgrade?: string; // e.g., '+8GB SODIMM DDR4'
  ramPriceSurcharge?: number; // e.g. 450000
  selectedStorageUpgrade?: string; // e.g. '+512GB M.2 NVMe SSD'
  storagePriceSurcharge?: number; // e.g. 550000
}

export type PaymentMethod = 
  | 'Cash' 
  | 'QRIS / E-Wallet (OVO, GoPay, ShopeePay)' 
  | 'Bank Transfer BCA' 
  | 'Bank Transfer Mandiri' 
  | 'Bank Transfer BPD Bali' 
  | 'Bank Transfer BRI/BNI'
  | 'Credit/Debit Card';

export interface Transaction {
  id: string;
  invoiceNo: string;
  timestamp: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  changeAmount: number;
  customerName?: string;
  customerPhone?: string;
  courierName?: string;
  courierPrice?: number;
}

export type JobStatus = 'In Queue' | 'Diagnosing' | 'Awaiting Parts' | 'In Progress' | 'Ready for Pickup' | 'Completed';

export interface RepairJob {
  id: string;
  jobNo: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  serialNumber?: string;
  issue: string;
  status: JobStatus;
  estimatedCost: number;
  partsUsed: { name: string; price: number }[];
  laborCost: number;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export type CustomerType = 'Pribadi' | 'Perusahaan' | 'Sesama Toko';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  type: CustomerType;
  discountPercent: number; // e.g., 0 for Pribadi, 5 for Perusahaan, 10 for Sesama Toko (reseller/dealer discount)
  companyName?: string; // used if type is Perusahaan
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  contactPerson?: string;
  address?: string;
  productLine?: string; // e.g. 'Processor & Motherboard', 'SSD & RAM', 'Casing & PSU'
  email?: string;
}

export interface Staff {
  id: string;
  name: string;
  phone: string;
  pin: string;
  role: UserRole;
  status: 'Aktif' | 'Nonaktif';
}

