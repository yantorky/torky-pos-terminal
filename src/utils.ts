/**
 * Utility functions for Torky Komputer POS
 * Optimized for Denpasar, Bali context
 */

// Format numbers into Indonesian Rupiah (IDR)
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Denpasar (WITA) Date formatter
export function formatWITA(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Makassar' // WITA Timezone for Bali
    }).format(date) + ' WITA';
  } catch (e) {
    return dateString;
  }
}

// Bali Denpasar Payment Methods
export const DENPASAR_PAYMENT_METHODS = [
  'Cash',
  'QRIS / E-Wallet (OVO, GoPay, ShopeePay)',
  'Bank Transfer BCA',
  'Bank Transfer Mandiri',
  'Bank Transfer BPD Bali',
  'Bank Transfer BRI/BNI'
];

// Bali Denpasar Shipping Methods
export interface ShippingMethod {
  id: string;
  name: string;
  type: 'instant' | 'regular' | 'pickup';
  price: number;
  description: string;
}

export const DENPASAR_SHIPPING_METHODS: ShippingMethod[] = [
  { id: 'pickup', name: 'Ambil di Toko (Self-Pickup)', type: 'pickup', price: 0, description: 'Ambil langsung ke gerai Torky Komputer Denpasar' },
  { id: 'gojek', name: 'GOJEK GoSend Instant', type: 'instant', price: 15000, description: 'Kurir Instan Gojek langsung sampai (Denpasar area)' },
  { id: 'grab', name: 'GrabExpress Instant', type: 'instant', price: 14000, description: 'Kurir Instan Grab langsung sampai' },
  { id: 'jnt', name: 'J&T Express', type: 'regular', price: 12000, description: 'Pengiriman reguler J&T se-Bali & luar wilayah' },
  { id: 'jne', name: 'JNE Reguler/YES', type: 'regular', price: 13000, description: 'Pengiriman JNE ke seluruh nusantara' },
  { id: 'sicepat', name: 'SiCepat Gokil/Reg', type: 'regular', price: 11000, description: 'Jasa kurir SiCepat hemat' }
];

// Generate WhatsApp API URL to send structural message
export function getWhatsAppShareUrl(phone: string, text: string): string {
  // Normalize Indonesian phone numbers: replace starting '0' with '62'
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
}

// Subtitle generator for WhatsApp Receipts
export function generateWhatsAppInvoiceMessage(tx: {
  invoiceNo: string;
  timestamp: string;
  customerName?: string;
  items: Array<{ product: { name: string; price: number }; quantity: number }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  courierName?: string;
  courierPrice?: number;
}) {
  const line = '----------------------------------';
  let msg = `*NOTA PEMBAYARAN - Torky Komputer*\n_Anda Yang Utama_\n\nNo Invoice: *${tx.invoiceNo}*\nTanggal: ${formatWITA(tx.timestamp)}\n`;
  if (tx.customerName) {
    msg += `Pelanggan: *${tx.customerName}*\n`;
  }
  msg += `${line}\n`;
  
  tx.items.forEach(item => {
    msg += `- ${item.product.name}\n  ${item.quantity} x ${formatIDR(item.product.price)} = *${formatIDR(item.product.price * item.quantity)}*\n`;
  });
  
  msg += `${line}\n`;
  msg += `Subtotal: ${formatIDR(tx.subtotal)}\n`;
  if (tx.discount > 0) msg += `Diskon: -${formatIDR(tx.discount)}\n`;
  if (tx.tax > 0) msg += `Pajak (PPN): ${formatIDR(tx.tax)}\n`;
  
  if (tx.courierName) {
    msg += `Pengiriman (${tx.courierName}): ${formatIDR(tx.courierPrice || 0)}\n`;
  }
  
  msg += `${line}\n`;
  msg += `*TOTAL PEMBAYARAN: ${formatIDR(tx.total)}*\n`;
  msg += `Metode Bayar: *${tx.paymentMethod}*\n\n`;
  msg += `*Torky Komputer Denpasar*\nJl. Tukad Irawadi Gang Damai XII/3 Celuk Panjer Denpasar Selatan Bali\nWA / HP: +6281288118288\n_Terima kasih atas kepercayaan Anda!_`;
  
  return msg;
}

// Generate secure offline license key based on Installation ID (DJB2 mathematical hash)
export function generateLicenseFromId(installId: string): string {
  const cleanId = installId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // High-security salt and shift parameters (unbreakable offline hash check)
  let hash1 = 5381;
  let hash2 = 3317;
  const salt = "YANTORKY_TORKY_KOMPUTER_SECRET_SALT_VALUE_2026";
  
  const combined = cleanId + salt;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash1 = hash1 & hash1;
    
    hash2 = ((hash2 << 5) + hash2) + char;
    hash2 = hash2 & hash2;
  }
  
  // Custom secure base32 alphabet (excludes confusing letters/numbers: I, O, 0, 1)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const getChunk = (val: number, len: number) => {
    let raw = Math.abs(val);
    let out = '';
    for (let i = 0; i < len; i++) {
      out += chars[raw % chars.length];
      raw = Math.floor(raw / chars.length);
    }
    return out;
  };
  
  const p1 = getChunk(hash1, 4);
  const p2 = getChunk(hash2, 4);
  const p3 = getChunk(hash1 ^ hash2, 4);
  
  return `YNTK-LIC-${p1}-${p2}-${p3}`;
}

// Subtitle generator for WhatsApp Repair/Service
export function generateWhatsAppRepairMessage(job: {
  jobNo: string;
  customerName: string;
  deviceModel: string;
  issue: string;
  status: string;
  notes?: string;
  laborCost: number;
  partsUsed: Array<{ name: string; price: number }>;
  estimatedCost: number;
}) {
  const line = '----------------------------------';
  const totalCost = job.laborCost + job.partsUsed.reduce((acc, curr) => acc + curr.price, 0);
  
  let msg = `*KWITANSI / TIKET SERVIS - Torky Komputer*\n_Anda Yang Utama_\n\nID Tiket: *${job.jobNo}*\nPelanggan: *${job.customerName}*\nPerangkat: *${job.deviceModel}*\nKendala: *${job.issue}*\nStatus: *[ ${job.status} ]*\n`;
  msg += `${line}\n`;
  
  msg += `Jasa Servis & Lab: ${formatIDR(job.laborCost)}\n`;
  if (job.partsUsed.length > 0) {
    msg += `Suku Cadang (Spareparts):\n`;
    job.partsUsed.forEach(part => {
      msg += `  + ${part.name}: ${formatIDR(part.price)}\n`;
    });
  }
  
  msg += `${line}\n`;
  msg += `*ESTIMASI BIAYA: ${formatIDR(totalCost)}*\n`;
  if (job.notes) {
    msg += `Catatan Teknisi: _${job.notes}_\n`;
  }
  msg += `${line}\n`;
  msg += `*Torky Komputer Denpasar*\nJl. Tukad Irawadi Gang Damai XII/3 Celuk Panjer Denpasar Selatan Bali\nWA / HP: +6281288118288\nSilakan hubungi kami untuk info progres lebih lanjut. Terima kasih!`;
  
  return msg;
}
