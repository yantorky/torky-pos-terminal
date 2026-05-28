import { Product, RepairJob, Transaction, Customer, Supplier, Staff } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  // === LAPTOPS ===
  {
    id: 'prod-lap-01',
    name: 'ASUS ROG Zephyrus G14 OLED GA403',
    category: 'LAPTOP',
    price: 32500000,
    cost: 29800000,
    stock: 5,
    sku: 'TRK-LAP-ROG-G14',
    unit: 'unit',
    brand: 'ASUS ROG',
    specifications: 'AMD Ryzen 9 8945HS, 32GB LPDDR5X, 1TB NVMe PCIe 4.0 SSD, NVIDIA RTX 4070 8GB, 14" ROG Nebula Display 3K OLED 120Hz',
    subCategory: 'Laptop',
    priceRetail: 32500000,
    priceCorporate: 32000000,
    pricePartner: 31500000
  },
  {
    id: 'prod-lap-02',
    name: 'Lenovo ThinkPad X1 Carbon Gen 12',
    category: 'LAPTOP',
    price: 34900000,
    cost: 32000000,
    stock: 3,
    sku: 'TRK-LAP-TP-X1C',
    unit: 'unit',
    brand: 'Lenovo',
    specifications: 'Intel Core Ultra 7 155H, 32GB RAM LPDDR5, 1TB SSD NVMe, Intel Arc Graphics, 14" WUXGA Anti-Glare Touchscreen, Win 11 Pro',
    subCategory: 'Laptop',
    priceRetail: 34900000,
    priceCorporate: 34000000,
    pricePartner: 33500500
  },

  // === SERVERS & BUILDUP ===
  {
    id: 'prod-srv-01',
    name: 'Dell PowerEdge R760 Rack Server',
    category: 'Server',
    price: 115000000,
    cost: 98000000,
    stock: 2,
    sku: 'TRK-SRV-DELL-R760',
    unit: 'unit',
    brand: 'Dell Technologies',
    specifications: '2x Intel Xeon Gold 5415+ (2.9G, 8C/16T), 128GB RDIMM DDR5, 4x 1.2TB SAS 12Gbps Hot-plug, PERC H755 Controller, Dual PSU 800W',
    subCategory: 'Server',
    priceRetail: 115000000,
    priceCorporate: 110000000,
    pricePartner: 108000000
  },

  // === HARDWARE PARTS (PC ASSEMBLING) ===
  {
    id: 'prod-hw-proc-01',
    name: 'Intel Core i7-14700K 5.6GHz Socket LGA1700',
    category: 'Hardware Parts',
    price: 7250000,
    cost: 6750000,
    stock: 12,
    sku: 'TRK-HW-INTEL-I7',
    unit: 'pcs',
    brand: 'Intel',
    specifications: '20 Cores (8 P-cores + 12 E-cores), Thread Count 28, Max Turbo Frequency 5.6 GHz, Raptor Lake Refresh',
    subCategory: 'Processor',
    priceRetail: 7250000,
    priceCorporate: 7150000,
    pricePartner: 6990000
  },
  {
    id: 'prod-hw-proc-02',
    name: 'AMD Ryzen 7 7800X3D 5.0GHz Socket AM5',
    category: 'Hardware Parts',
    price: 6850000,
    cost: 6300000,
    stock: 10,
    sku: 'TRK-HW-AMD-R7',
    unit: 'pcs',
    brand: 'AMD',
    specifications: '8 Cores, 16 Threads, Base Clock 4.2GHz, Boost 5.0GHz, 96MB L3 V-Cache, Zen 4',
    subCategory: 'Processor',
    priceRetail: 6850000,
    priceCorporate: 6700000,
    pricePartner: 6550000
  },
  {
    id: 'prod-hw-mobo-01',
    name: 'ASUS ROG STRIX B760-I Gaming Wifi DDR5',
    category: 'Hardware Parts',
    price: 3850000,
    cost: 3500000,
    stock: 8,
    sku: 'TRK-HW-ROG-B760I',
    unit: 'pcs',
    brand: 'ASUS',
    specifications: 'Intel LGA1700 Mini-ITX Motherboard, PCIe 5.0, 8+1 Power Stages, WiFi 6E, Bluetooth 5.3',
    subCategory: 'Motherboard',
    priceRetail: 3850000,
    priceCorporate: 3800000,
    pricePartner: 3670000
  },
  {
    id: 'prod-hw-ram-01',
    name: 'Corsair Vengeance RGB DDR5 32GB (2x16GB) 6000MHz CL30',
    category: 'Hardware Parts',
    price: 2150000,
    cost: 1850000,
    stock: 20,
    sku: 'TRK-HW-CORSAIR-V5',
    unit: 'pcs',
    brand: 'Corsair',
    specifications: 'High-performance DDR5 memory, Optimized for Intel/AMD, Ten-zone dynamic RGB lighting',
    subCategory: 'RAM',
    priceRetail: 2150000,
    priceCorporate: 2100000,
    pricePartner: 1990000
  },
  {
    id: 'prod-hw-ssd-01',
    name: 'Samsung 990 PRO NVMe PCIe Gen 4.0 M.2 SSD 2TB',
    category: 'Hardware Parts',
    price: 3100000,
    cost: 2750000,
    stock: 25,
    sku: 'TRK-HW-SAMSUNG-990P',
    unit: 'pcs',
    brand: 'Samsung',
    specifications: 'Read Speed up to 7450 MB/s, Write Speed up to 6900 MB/s, V-NAND Technology, Smart Thermal Control',
    subCategory: 'Storage',
    priceRetail: 3100000,
    priceCorporate: 3000000,
    pricePartner: 2890000
  },
  {
    id: 'prod-hw-gpu-01',
    name: 'ASUS TUF Gaming GeForce RTX 4070 Ti Super OC 16GB GDDR6X',
    category: 'Hardware Parts',
    price: 18900000,
    cost: 17200000,
    stock: 6,
    sku: 'TRK-HW-ASUS-RTX4070TIS',
    unit: 'pcs',
    brand: 'ASUS',
    specifications: 'DLSS 3, Axial-tech fans scaled up, Dual ball fan bearings, Military-grade capacitors, Auto-Extreme manufacturing',
    subCategory: 'Graphics Card',
    priceRetail: 18900000,
    priceCorporate: 18500000,
    pricePartner: 17900000
  },
  {
    id: 'prod-hw-psu-01',
    name: 'Corsair RM850x Shift 850W 80 Plus Gold ATX 3.0',
    category: 'Hardware Parts',
    price: 2450000,
    cost: 2120000,
    stock: 10,
    sku: 'TRK-HW-CORSAIR-RM850X',
    unit: 'pcs',
    brand: 'Corsair',
    specifications: 'Fully modular power supply, Side interface connectors, ATX 3.0 compliant, PCIe 5.0 ready, Fluid Dynamic Bearing fan',
    subCategory: 'Power Supply',
    priceRetail: 2450000,
    priceCorporate: 2400000,
    pricePartner: 2250000
  },
  {
    id: 'prod-hw-case-01',
    name: 'NZXT H6 Flow Compact Dual-Chamber Mid-Tower',
    category: 'Hardware Parts',
    price: 1850000,
    cost: 1600000,
    stock: 12,
    sku: 'TRK-HW-NZXT-H6F',
    unit: 'pcs',
    brand: 'NZXT',
    specifications: 'Dual-chamber panoramic glass design, optimal high-airflow performance, 3 Pre-installed 120mm fans',
    subCategory: 'Casing',
    priceRetail: 1850000,
    priceCorporate: 1800000,
    pricePartner: 1680000
  },
  {
    id: 'prod-hw-cool-01',
    name: 'DeepCool AK620 Digital Dual-Tower Air Cooler',
    category: 'Hardware Parts',
    price: 1150000,
    cost: 950000,
    stock: 14,
    sku: 'TRK-HW-DEEPCOOL-AK620',
    unit: 'pcs',
    brand: 'DeepCool',
    specifications: 'Dual-tower CPU cooler with status screen displaying real-time temp and usage, 6 copper heatpipes, 2 FK120 PWM silence fans',
    subCategory: 'Cooler',
    priceRetail: 1150000,
    priceCorporate: 1100000,
    pricePartner: 1020000
  },

  // === NETWORKING EQUIPMENT (INFRASTRUCTURE BUILD) ===
  {
    id: 'prod-net-rt-01',
    name: 'MikroTik RB5009UG+S++IN Layer 3 Heavy Router',
    category: 'Accessories',
    price: 4950000,
    cost: 4150000,
    stock: 15,
    sku: 'TRK-NET-MT-RB5009',
    unit: 'unit',
    brand: 'MikroTik',
    specifications: '7x Gigabit Ethernet ports, 1x 2.5G port, 1x 10G SFP+ slot, Quad-core CPU, RouterOS v7 License 5',
    subCategory: 'Router',
    priceRetail: 4950000,
    priceCorporate: 4850000,
    pricePartner: 4500000
  },
  {
    id: 'prod-net-sw-01',
    name: 'Cisco Catalyst C9200L-24P-4G-E PoE Switch',
    category: 'Accessories',
    price: 41500000,
    cost: 36800000,
    stock: 4,
    sku: 'TRK-NET-CSCO-9200L',
    unit: 'unit',
    brand: 'Cisco Systems',
    specifications: '24 ports full PoE+ 370W, 4x 1G SFP fixed uplinks, Stackable Catalyst Network Essentials',
    subCategory: 'Switch',
    priceRetail: 41500000,
    priceCorporate: 39500000,
    pricePartner: 38800000
  },
  {
    id: 'prod-net-ap-01',
    name: 'Ubiquiti UniFi U6-Pro Enterprise Access Point',
    category: 'Accessories',
    price: 3650000,
    cost: 3100000,
    stock: 20,
    sku: 'TRK-NET-UQT-U6PRO',
    unit: 'unit',
    brand: 'Ubiquiti Networks',
    specifications: 'WiFi 6 dual-band AP, 5.3 Gbps aggregate throughput, IP54 ceiling-mount, powered by PoE (adaptor NOT included)',
    subCategory: 'Access Point',
    priceRetail: 3650000,
    priceCorporate: 3500000,
    pricePartner: 3350000
  },

  // === ACCESSORIES ===
  {
    id: 'prod-acc-mon-01',
    name: 'ASUS ROG Swift OLED PG27AQDM Gaming Monitor',
    category: 'Accessories',
    price: 17200000,
    cost: 15500000,
    stock: 4,
    sku: 'TRK-ACC-ROG-PG27',
    unit: 'pcs',
    brand: 'ASUS ROG',
    specifications: '26.5" High Contrast OLED, WQHD (2560 x 1440), 240Hz, 0.03ms response time, G-SYNC compatible, custom heatsink',
    subCategory: 'Monitor',
    priceRetail: 17200000,
    priceCorporate: 16900000,
    pricePartner: 16400000
  },
  {
    id: 'prod-acc-ups-01',
    name: 'APC Easy UPS SMV 1000VA / 700W 230V Line-Interactive',
    category: 'Accessories',
    price: 3250000,
    cost: 2850000,
    stock: 8,
    sku: 'TRK-ACC-APC-1000',
    unit: 'pcs',
    brand: 'APC',
    specifications: 'Automatic Voltage Regulation (AVR), LCD status interface, 4 universal backup outlets, Intelligent battery management',
    subCategory: 'UPS',
    priceRetail: 3250000,
    priceCorporate: 3150000,
    pricePartner: 2950000
  },
  {
    id: 'prod-acc-kb-01',
    name: 'Logitech G PRO X mechanical TKL Keyboard',
    category: 'Accessories',
    price: 1850000,
    cost: 1550000,
    stock: 15,
    sku: 'TRK-ACC-LOGI-GPROKB',
    unit: 'pcs',
    brand: 'Logitech G',
    specifications: 'Tenkeyless compact layout, GX Clicky Blue switches (hotswappable), RGB Lightsync key profiles, detachable cable',
    subCategory: 'Keyboard',
    priceRetail: 1850000,
    priceCorporate: 1800050,
    pricePartner: 1690000
  },
  {
    id: 'prod-acc-ms-01',
    name: 'Logitech G502 LIGHTSPEED Wireless Gaming Mouse',
    category: 'Accessories',
    price: 1650000,
    cost: 1380000,
    stock: 18,
    sku: 'TRK-ACC-LOGI-G502W',
    unit: 'pcs',
    brand: 'Logitech G',
    specifications: 'Hero 25K Sensor, high-speed lightspeed connection, 11 programmable buttons, adjustable weight system',
    subCategory: 'Mouse',
    priceRetail: 1650000,
    priceCorporate: 1600000,
    pricePartner: 1490000
  },

  // === SOFTWARE CORES ===
  {
    id: 'prod-sw-win-11',
    name: 'Windows 11 Professional 64-Bit FPP Retail USB Box',
    category: 'Software',
    price: 2950000,
    cost: 2605000,
    stock: 30,
    sku: 'TRK-SW-WIN11-PRO',
    unit: 'box',
    brand: 'Microsoft',
    specifications: 'Official FPP Retail Box with Installation USB Flashdrive and Lifetime Activation Product Key Card',
    subCategory: 'OS',
    priceRetail: 2950000,
    priceCorporate: 2850000,
    pricePartner: 2750000
  },

  // === EXCLUSIVE PROFESSIONAL SERVICE IT (STRICTLY NON-ELECTRONIC) ===
  {
    id: 'prod-srv-rec-01',
    name: 'Jasa Recovery Data Professional - Advanced Lab (Bad Sector / Firmware Swap)',
    category: 'Service & Repair',
    price: 1850000,
    cost: 300000,
    stock: null,
    sku: 'SRV-RECOVERY',
    unit: 'job',
    brand: 'Torky Lab',
    specifications: 'Pemulihan data partisi hancur, NAND controller corrupt, board logic transplant, donor platter di dust-free clean bench',
    subCategory: 'Data Recovery Service',
    priceRetail: 1850000,
    priceCorporate: 1850000,
    pricePartner: 1500000
  },
  {
    id: 'prod-srv-inf-01',
    name: 'Setup Jaringan Corporate / Build Infrastruktur Cloud & LAN Office (Level 2)',
    category: 'Service & Repair',
    price: 3500000,
    cost: 500000,
    stock: null,
    sku: 'SRV-NET-BUILD',
    unit: 'project',
    brand: 'Torky Net',
    specifications: 'Pemasangan & konfigurasi VLAN, static/dynamic routing, QoS bandwidth management, switch management, PoE AP mapping',
    subCategory: 'Networking Build',
    priceRetail: 3500000,
    priceCorporate: 3200000,
    pricePartner: 3000000
  },
  {
    id: 'prod-srv-sec-01',
    name: 'Audit Keamanan & Security Management Jaringan (Firewall / IPS IDS Set)',
    category: 'Service & Repair',
    price: 4500000,
    cost: 1000000,
    stock: null,
    sku: 'SRV-SEC-AUDIT',
    unit: 'job',
    brand: 'Torky CyberSec',
    specifications: 'Penerapan firewall rules ketat, monitoring serangan, intrusion prevention, DMZ setup, security assessment & penetration testing',
    subCategory: 'Security Management',
    priceRetail: 4500000,
    priceCorporate: 4000000,
    pricePartner: 3800000
  },
  {
    id: 'prod-srv-upg-01',
    name: 'Jasa Servis Fisik / General Hardware Upgrade Lab (Cleaning & Thermal Paste)',
    category: 'Service & Repair',
    price: 250000,
    cost: 20000,
    stock: null,
    sku: 'SRV-PC-UPGRADE',
    unit: 'pcs',
    brand: 'Torky Lab',
    specifications: 'Pemasangan SSD NVMe/SATA, upgrade RAM laptop ddr4/ddr5, dust clean, re-pasting premium Honeywell PTM7950 pad',
    subCategory: 'PC Repair Upgrade',
    priceRetail: 250000,
    priceCorporate: 250000,
    pricePartner: 200000
  }
];

export const INITIAL_REPAIR_JOBS: RepairJob[] = [
  {
    id: 'job-01',
    jobNo: 'TRK-TCK-001',
    customerName: 'CV Bali Digital Mandiri',
    customerPhone: '081234567890',
    deviceModel: 'ASUS ROG G14 GA401',
    serialNumber: 'RGN14-2022-771',
    issue: 'Laptop Blue Screen (BSOD) terus menerus saat running beban rendering 3D',
    status: 'In Progress',
    estimatedCost: 1250000,
    partsUsed: [
      { name: 'SSD Samsung 990 PRO NVMe PCIe Gen 4.0 M.2 SSD 2TB', price: 3100000 }
    ],
    laborCost: 250000,
    notes: 'Sudah di test menggunakan SSD unit uji coba. Hasil stabil. Menunggu persetujuan client untuk pemindahan lisensi Windows.',
    createdAt: '2026-05-22T08:30:00Z'
  },
  {
    id: 'job-02',
    jobNo: 'TRK-TCK-002',
    customerName: 'Yande Wahyu',
    customerPhone: '081999222333',
    deviceModel: 'Harddisk WD Blue 2TB Internal 3.5"',
    serialNumber: 'WD-WCC7K49931',
    issue: 'Minta Jasa Recovery Data Professional - Harddisk bunyil click keras dan tidak terdeteksi di BIOS',
    status: 'Diagnosing',
    estimatedCost: 1850000,
    partsUsed: [],
    laborCost: 1850000,
    notes: 'Disk platter diinspeksi di clean bench. Perlu board swap chipset identik untuk pembacaan firmware.',
    createdAt: '2026-05-23T04:15:00Z'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-01',
    name: 'Pelanggan Umum Walk-In',
    phone: '0000',
    type: 'Pribadi',
    discountPercent: 0
  },
  {
    id: 'cust-02',
    name: 'PT Jasa Bali Mandiri IT',
    phone: '081987654321',
    email: 'procurement@balimandiri.co.id',
    address: 'Kawasan Renon, Jl. Raya Puputan No. 22X, Denpasar',
    type: 'Perusahaan',
    discountPercent: 5,
    companyName: 'PT Jasa Bali Mandiri IT'
  },
  {
    id: 'cust-03',
    name: 'Dewa Putu Reseller Partner',
    phone: '087865213098',
    email: 'dewaputu@partnerit.com',
    address: 'Jl. Diponegoro Gang VIII, Denpasar',
    type: 'Sesama Toko',
    discountPercent: 10
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-01',
    name: 'PT Synnex Metrodata Indonesia (SMI)',
    contactPerson: 'Andi Wijaya (Distribution Lead)',
    phone: '021-29345800',
    email: 'cs.smi@metrodata.co.id',
    address: 'APL Tower Lt. 37, Jl. Letjen S. Parman, Jakarta Barat'
  },
  {
    id: 'sup-02',
    name: 'PT Digital Karunia Indonesia (Access Point Unifi / Mikrotik)',
    contactPerson: 'Eka Saputra',
    phone: '021-53664421',
    email: 'sales@digital-karunia.co.id',
    address: 'Komp. Ruko Roxy Mas Blok E2 No. 12, Jakarta Pusat'
  }
];

export const INITIAL_STAFFS: Staff[] = [];
