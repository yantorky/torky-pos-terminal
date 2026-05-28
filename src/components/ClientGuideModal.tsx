import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CheckCircle, Smartphone, Keyboard, Barcode, Printer, Download, BookOpen, Layers, Terminal } from 'lucide-react';

interface ClientGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientGuideModal({ isOpen, onClose }: ClientGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'requirements' | 'barcode' | 'api' | 'features'>('all');

  const printManual = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Popup blocker terdeteksi! Silakan izinkan popup untuk mencetak PDF Panduan.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Torky_Komputer_User_Manual_v4.1.pdf</title>
          <link id="pdf-favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml;utf8,%3Csvg viewBox='0 0 240 280' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='n' x1='30%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%230B2B9F'/%3E%3Cstop offset='50%25' stop-color='%231E5DCE'/%3E%3Cstop offset='100%25' stop-color='%233187F2'/%3E%3C/linearGradient%3E%3ClinearGradient id='b' x1='20%25' y1='10%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%231954C0'/%3E%3Cstop offset='60%25' stop-color='%232E9AE4'/%3E%3Cstop offset='100%25' stop-color='%2355C9F1'/%3E%3C/linearGradient%3E%3ClinearGradient id='t' x1='10%25' y1='20%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23289EE2'/%3E%3Cstop offset='60%25' stop-color='%2343CECE'/%3E%3Cstop offset='100%25' stop-color='%2381EADF'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M 113,18 C 111,55 116,110 160,158 C 182,182 208,185 210,155 C 212,125 192,85 174,68 C 152,47 125,25 113,18 Z' fill='url(%23n)'/%3E%3Cpath d='M 113,68 C 111,100 119,145 156,188 C 176,211 202,213 204,185 C 206,158 188,122 172,106 C 152,86 125,73 113,68 Z' fill='url(%23b)'/%3E%3Cpath d='M 118,120 C 117,144 122,180 152,212 C 168,229 192,231 194,208 C 196,186 182,156 168,143 C 151,127 128,124 118,120 Z' fill='url(%23t)'/%3E%3Cpath d='M 172,210 C 178,225 198,228 208,220 C 218,212 216,198 206,192' stroke='%234ECECD' stroke-width='12' stroke-linecap='round' fill='transparent'/%3E%3C/svg%3E" />
          <script>
            try {
              var logo = localStorage.getItem('torky_custom_logo');
              if (logo) {
                var link = document.getElementById('pdf-favicon');
                if (link) {
                  link.href = logo;
                  link.removeAttribute('type');
                }
              }
            } catch(e) {}
          </script>
          <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  fontFamily: {
                    sans: ['Inter', 'sans-serif'],
                    display: ['Space Grotesk', 'sans-serif'],
                    mono: ['JetBrains Mono', 'monospace'],
                  }
                }
              }
            }
          </script>
          <style>
            @media print {
              body {
                background-color: white !important;
                color: black !important;
              }
              .page-break {
                page-break-after: always;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body class="bg-white text-slate-900 font-sans p-8 md:p-16 max-w-4xl mx-auto border border-slate-200 shadow-lg my-8 rounded-3xl relative">
          
          <div class="no-print mb-8 p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
            <div class="text-left">
              <span class="text-[10px] font-black font-mono text-teal-700 bg-teal-100 px-2 py-0.5 rounded uppercase tracking-wider">PDF PRINT EMULATOR</span>
              <p class="text-xs text-teal-850 font-bold mt-1">Gunakan opsi "Save as PDF" di dialog browser untuk mengunduh dokumen resmi berkualitas tinggi.</p>
            </div>
            <button onclick="window.print()" class="bg-teal-600 hover:bg-teal-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5">
              🖨️ CETAK / SAVE AS PDF
            </button>
          </div>

          <!-- DOCUMENT STARTS HERE -->

          <!-- PAGE 1: COVER -->
          <div class="page-break flex flex-col justify-between min-h-[90vh] pb-12">
            <div class="border-b-4 border-slate-900 pb-8 pt-10 text-left">
              <p class="text-[12px] font-mono tracking-widest font-black text-slate-500 uppercase">OFFICIAL DEVICE DOCUMENTATION • v4.1</p>
              <h1 class="text-4xl md:text-5xl font-extrabold font-display text-slate-950 mt-3 tracking-tight uppercase leading-none">
                TORKY KOMPUTER
              </h1>
              <p class="text-xl font-bold font-mono tracking-wider text-teal-600 mt-1 uppercase">POS Terminal & Service Engine</p>
            </div>

            <div class="my-16 space-y-4 text-left">
              <span class="text-xs bg-slate-100 border border-slate-300 font-extrabold px-3 py-1 rounded-full text-slate-700 uppercase tracking-widest">
                Dokumen Panduan Klien & Manual Instalasi
              </span>
              <h2 class="text-2xl md:text-3xl font-extrabold font-sans text-slate-900 leading-tight">
                Standard Operasional Prosedur (SOP) Barcode Scanner, Manajemen Stok Gudang, Integrasi API Ekspedisi & Administrasi Servis
              </h2>
              <p class="text-sm text-slate-500 leading-relaxed max-w-xl">
                Arsitektur komersial kelas dunia yang didesain tangguh, cepat, responsif, dan siap dioperasikan dalam ekosistem retail modern multi-layout.
              </p>
            </div>

            <div class="border-t border-slate-200 pt-8 flex justify-between items-end text-left">
              <div class="space-y-1">
                <p class="text-[10px] text-slate-400 font-black tracking-wider uppercase font-mono">DITERBITKAN OLEH:</p>
                <p class="text-xs font-black text-slate-800 font-sans">Yan Torky - Super Admin & Owner</p>
                <p class="text-[10px] text-slate-400 font-black tracking-wider uppercase font-mono">SLOGAN KAIDAH: "ANDA YANG UTAMA"</p>
              </div>
              <div class="text-right">
                <p class="text-xs font-bold text-slate-500 font-mono">Tanggal Rilis: Mei 2026</p>
                <p class="text-xs font-extrabold text-[#0D9488] font-mono">STATUS: VALID & LICENSED</p>
              </div>
            </div>
          </div>

          <!-- PAGE 2: BAB 1 -->
          <div class="page-break py-12 text-left">
            <span class="text-xs font-black font-display text-[#0D9488] tracking-widest uppercase block mb-1">BAB 1</span>
            <h3 class="text-2xl font-black font-display text-slate-900 border-b border-slate-200 pb-3 mb-6">
              PERSYARATAN SISTEM & INSTALASI TERPADU
            </h3>
            
            <p class="text-xs text-slate-650 leading-relaxed mb-6">
              Sistem Torky POS Terminal dirancang menggunakan arsitektur modular interaktif berbasis web (React 18 + Vite) & backend server mini yang ultra efisien sehingga mampu dijalankan di segala macam gadget modern dari desktop hingga perangkat handheld Android terintegrasi.
            </p>

            <div class="space-y-6">
              <div class="space-y-2">
                <h4 class="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 font-sans">
                  <span>🖥️</span> 1. ALKULTASI HARDWARE (REKOMENDASI PERANGKAT)
                </h4>
                <ul class="text-xs text-slate-600 pl-6 list-disc space-y-1.5 leading-relaxed">
                  <li><strong>Handheld Terminal Android</strong> (e.g. Sunmi V2, Sunmi V2 Pro) – Sangat direkomendasikan dengan layar responsif serta printer thermal internal.</li>
                  <li><strong>Layanan Desktop/Laptop Kasir</strong> (Minimal RAM 4GB, Resolusi Layar 1080p) – Untuk pengalaman visual multi-panel paling presisi.</li>
                  <li><strong>Barcode Scanner</strong> – Semua model laser scanner (baik port USB fisik maupun koneksi Bluetooth nirkabel) dapat bekerja secara instan tanpa perlu driver tambahan (Plug & Play / Keyboard Wedge Protocol).</li>
                  <li><strong>Kertas Printer Receipt</strong> – Mendukung penuh format kertas kasir standard internasional ukuran 58mm maupun 80mm.</li>
                </ul>
              </div>

              <div class="space-y-2">
                <h4 class="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 font-sans">
                  <span>🛡️</span> 2. LISENSI AKTIVASI & BYPASS KEAMANAN (ANTI-CRACK)
                </h4>
                <p class="text-xs text-slate-600 leading-relaxed pl-6">
                  Sistem ini dilengkapi skema verifikasi lisensi offline-first berdasarkan signature perangkat klien. Saat pertama kali diinstal, aplikasi menampilkan installation signature khas. Klien harus mengirimkan ID ini ke Super Admin untuk diterbitkan kode aktivasi format <code>YNTK-XXXX-XXXX-XXXX</code> berbasis <em>salt key</em> terenskripsi.
                </p>
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 ml-6">
                  <span class="text-[9px] font-extrabold font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-widest block w-max mb-1">MASTER BYPASS KEY (DEVELOPER EVALUATION)</span>
                  <p class="text-xs text-slate-650 leading-snug">Untuk keperluan review internal, developer dapat menggunakan kode master aktivasi universal berikut untuk mem-bypass aktivasi:</p>
                  <ul class="text-xs text-slate-700 font-mono mt-2 space-y-1 pl-4 list-decimal">
                    <li><strong>KUNCI UTAMA:</strong> <span class="bg-slate-150 px-1.5 py-0.5 rounded font-bold">TORKY-POS-8822-APPROVED</span></li>
                    <li><strong>KUNCI CADANGAN:</strong> <span class="bg-slate-150 px-1.5 py-0.5 rounded font-bold">YANTORKY-LICENSE-2026-VALD</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- PAGE 3: BAB 2 -->
          <div class="page-break py-12 text-left">
            <span class="text-xs font-black font-display text-[#0D9488] tracking-widest uppercase block mb-1">BAB 2</span>
            <h3 class="text-2xl font-black font-display text-slate-900 border-b border-slate-200 pb-3 mb-6">
              SOP BARCODE SCANNER INTERNASIONAL (FAST WEDGING)
            </h3>

            <p class="text-xs text-slate-650 leading-relaxed mb-6">
              Sistem deteksi barcode Torky Komputer mendukung <strong>Global Keyboard Wedging Protocol</strong> yang mendeteksi masukan laser scanner fisik berkecepatan tinggi secara real-time dari halaman manapun tanpa mewajibkan kasir mengeklik input box terlebih dahulu.
            </p>

            <div class="space-y-6">
              <div class="border-l-4 border-slate-900 pl-4 space-y-1.5">
                <h4 class="text-sm font-black text-slate-900 uppercase tracking-tight">⭐ SKENARIO KASIR PENJUALAN (FAST POS TRANS)</h4>
                <p class="text-xs text-slate-650 leading-relaxed">
                  Saat kasir melayani transaksi pembayaran pelanggan:
                </p>
                <ol class="text-xs text-slate-600 pl-5 list-decimal space-y-1.5 mt-1">
                  <li>Cukup arahkan barcode scanner laser ke produk (misal: kode <code>SKU-SSD-512</code> atau barcode kustom lainnya).</li>
                  <li>Sistem POS mendeteksi kecepatan input keyboard tiruan dari laser dalam milidetik, menterjemahkannya, serta memutar <strong>High-Fidelity synthesized barcode beep (1450Hz, 75ms)</strong> secara instan.</li>
                  <li>Katalog nama barang, harga, jenis langsung tampil di bag belanja. Nilai pajak PPN (12% standard regulasi nasional terbaru) dan diskon progresif langsung terhitung otomatis demi efisiensi tinggi layaknya ritel raksasa.</li>
                  <li><em>Notes simulator:</em> Jika perangkat Anda tidak terpasang laser scanner fisik (misal saat review di Tablet / HP), gunakan menu widget <strong class="text-teal-600">"WEDGED HW BARCODE SCANNER"</strong> di bagian atas menu kasir untuk mensimulasikan scan produk atau mengetik SKU langsung.</li>
                </ol>
              </div>

              <div class="border-l-4 border-[#0D9488] pl-4 space-y-1.5">
                <h4 class="text-sm font-black text-[#0D9488] uppercase tracking-tight">⚡ SKENARIO MANAGEMEN STOK GUDANG (FAST INVENTORY)</h4>
                <p class="text-xs text-slate-650 leading-relaxed">
                  Saat menyortir barang masuk dalam jumlah melimpah untuk stok pergudangan:
                </p>
                <ol class="text-xs text-slate-600 pl-5 list-decimal space-y-1.5 mt-1">
                  <li>Buka tab <strong class="text-slate-800">📦 MANAGEMENT STOCK</strong>, lalu scan barcode barang tersebut.</li>
                  <li>Sistem otomatis menampilkan overlay pop-up <strong class="text-slate-900">"PINDAI DETEKSI INTEL"</strong> dengan <strong>Smart AI Identification</strong>:
                    <ul class="list-disc pl-5 mt-1 space-y-1 opacity-90">
                      <li><strong>Jika Barang Terdaftar:</strong> Menampilkan info stok terkini, kategori, serta opsi penambahan/pengurangan stok instan serta tombol edit katalog penuh dalam satu kali sentuh.</li>
                      <li><strong>Jika Barang Belum Terdaftar:</strong> Sistem menyala merah, berbunyi peringatan, dan menyajikan opsi <strong class="text-rose-600 uppercase">"REGISTER BARU"</strong> yang otomatis mengisi kolom SKU dengan kode yang di-scan, menghindari kesalahan ketik manual dari petugas gudang.</li>
                    </ul>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          <!-- PAGE 4: BAB 3 -->
          <div class="page-break py-12 text-left">
            <span class="text-xs font-black font-display text-[#0D9488] tracking-widest uppercase block mb-1">BAB 3</span>
            <h3 class="text-2xl font-black font-display text-slate-900 border-b border-slate-200 pb-3 mb-6">
              INTEGRASI SISTEM API LOGISTIK & LOGISTIK BALI FALLBACK
            </h3>

            <p class="text-xs text-slate-650 leading-relaxed mb-6">
              Sistem kasir Torky Komputer memiliki interkoneksi logistik terakurat berbasis proxy backend terenkripsi aman guna mengkalkulasi jarak real-time dari Denpasar ke wilayah destinasi di Bali.
            </p>

            <div class="space-y-5">
              <div class="space-y-2">
                <h4 class="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 font-sans">
                  <span>🌐</span> 1. PENDAFTARAN API KEY MANDIRI (SETUP MENU)
                </h4>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Super Admin / Admin dapat mendaftarkan token API mereka tersendiri melalui tombol <strong class="text-indigo-600">🌐 SETUP API</strong> di pojok kanan atas aplikasi. Token disimpan secara lokal di memory handphone/laptop kasir Anda (Local Storage) dan diproksikan aman melalui server backend kami agar tidak terekspos ke publik internet:
                </p>
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 ml-4 text-xs space-y-2">
                  <p><strong>A. Biteship API (Layanan Utama):</strong> Mendukung cek tarif instant instan lokal Bali (GoSend & GrabExpress) berbasis integrasi titik GPS Google Maps serta ekspedisi J&T, JNE, SiCepat.</p>
                  <p><strong>B. RajaOngkir API (Layanan Cadangan):</strong> Backup cek ongkos kirim paket logistik reguler skala nasional (JNE, J&T, POS Indonesia).</p>
                </div>
              </div>

              <div class="space-y-2">
                <h4 class="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 font-sans">
                  <span>🌴</span> 2. LOGIKA FALLBACK TERINTEGRASI (TANPA INTERNET)
                </h4>
                <p class="text-xs text-slate-600 leading-relaxed">
                  Apabila server internet terputus, mati lampu di Bali, atau kunci API dikosongkan klien, sistem kasir secara otomatis mengaktifkan database geografis terintegrasi berdasarkan tabel pemetaan jarak Denpasar ke seluruh Kabupaten di Bali:
                </p>
                
                <table class="w-full text-xs text-slate-700 border border-collapse border-slate-200 mt-2.5 rounded-lg overflow-hidden">
                  <thead>
                    <tr class="bg-slate-100 text-[#0f172a] font-bold text-left">
                      <th class="p-2 border border-slate-200">Kawasan Jarak</th>
                      <th class="p-2 border border-slate-200">Destinasi Terjangkau</th>
                      <th class="p-2 border border-slate-200">Estimasi Jarak</th>
                      <th class="p-2 border border-slate-200">Tarif GoSend Fallback</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="p-2 border border-slate-200">Denpasar Raya</td>
                      <td class="p-2 border border-slate-200">Denpasar Kota, Renon, Sanur, Panjer</td>
                      <td class="p-2 border border-slate-200">~ 3 s.d 5 Km</td>
                      <td class="p-2 border border-slate-200 font-extrabold text-teal-600">Rp 18.500</td>
                    </tr>
                    <tr class="bg-slate-50/50">
                      <td class="p-2 border border-slate-200">Kuta Selatan</td>
                      <td class="p-2 border border-slate-200">Kuta, Seminyak, Canggu, Jimbaran</td>
                      <td class="p-2 border border-slate-200">~ 9 s.d 14 Km</td>
                      <td class="p-2 border border-slate-200 font-extrabold text-teal-600">Rp 24.000</td>
                    </tr>
                    <tr>
                      <td class="p-2 border border-slate-200">Bali Selatan Raya</td>
                      <td class="p-2 border border-slate-200">Nusa Dua, Pecatu, Uluwatu, Tabanan</td>
                      <td class="p-2 border border-slate-200">~ 19 s.d 26 Km</td>
                      <td class="p-2 border border-slate-200 font-extrabold text-teal-600">Rp 48.000</td>
                    </tr>
                    <tr class="bg-slate-50/50">
                      <td class="p-2 border border-slate-200">Bali Utara & Barat</td>
                      <td class="p-2 border border-slate-200">Gianyar, Klungkung, Singaraja, Jembrana</td>
                      <td class="p-2 border border-slate-200">~ 45 s.d 90 Km</td>
                      <td class="p-2 border border-slate-200 font-extrabold text-teal-600">Mulai Rp 95.000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- PAGE 5: BAB 4 -->
          <div class="py-12 text-left">
            <span class="text-xs font-black font-display text-[#0D9488] tracking-widest uppercase block mb-1">BAB 4</span>
            <h3 class="text-2xl font-black font-display text-slate-900 border-b border-slate-200 pb-3 mb-6">
              KOMPREHENSIF RINGKASAN FITUR PENUNJANG
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <h5 class="font-extrabold text-[#0D9488] text-xs uppercase font-mono">🖥️ 3D PC COMPONENT SIMULATOR</h5>
                <p class="text-[11px] text-slate-650 leading-relaxed">
                  Modul visualisasi perakitan PC kustom interaktif 3D yang hemat kuota data internet, memandu kasir dan pelanggan menentukan rakitan berspesifikasi tinggi (CPU, GPU, RAM, Stroage) yang bebas konflik kompatibilitas serta instan terintegrasi dengan kalkulator kasir utama.
                </p>
              </div>

              <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <h5 class="font-extrabold text-[#0D9488] text-xs uppercase font-mono">🔧 REPAIR DIAGNOSTIC CONTROLLER</h5>
                <p class="text-[11px] text-slate-650 leading-relaxed">
                  Sistem tracking administrasi servis laptop/PC mumpuni. Dilengkapi status pengerjaan, estimasi biaya suku cadang tambahan, diagnosa teknisi detail, pencatatan nomor seri perangkat, serta cetakan struk/tanda terima serah-terima fisik yang sah secara hukum niaga.
                </p>
              </div>

              <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <h5 class="font-extrabold text-[#0D9488] text-xs uppercase font-mono">👥 MULTI-ROLE SECURITY PIN</h5>
                <p class="text-[11px] text-slate-650 leading-relaxed">
                  Sistem dilindungi kunci PIN akses personal multi tingkat: Kasir (jual kas cepat), Teknisi (servis & diagnostik), Admin (gudang & stok), dan Super Admin (Keuangan ledger, mutasi kasir, pembuatan kunci lisensi, pengaturan API).
                </p>
              </div>

              <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <h5 class="font-extrabold text-[#0D9488] text-xs uppercase font-mono">📝 FINANCIAL RECONCILIATION</h5>
                <p class="text-[11px] text-slate-650 leading-relaxed">
                  Mengawasi riwayat keuangan secara saksama. Diperkuat grafik trend penjualan dinamis, rekapitulasi PPN terkumpul, persentase diskon kumulatif, serta kalkulasi estimasi keuntungan bersih bulanan demi kemajuan bisnis Torky Komputer Bali.
                </p>
              </div>
            </div>

            <div class="mt-12 pt-8 border-t border-slate-200 flex flex-col items-center gap-3 text-center">
              <span class="text-2xl">🏆</span>
              <p class="font-display font-extrabold text-slate-900 text-sm">Torky POS Terminal & Service Engine — Profesional, Cepat, Berkelas Dunia</p>
              <p class="text-[10px] text-slate-400 font-mono italic">Bali, Indonesia • Slogan Operasional Resmi: "Anda Yang Utama"</p>
            </div>
          </div>

        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm text-slate-800 font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-slate-100 p-6 flex flex-col gap-4 relative text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center font-bold text-lg select-none">
                  📄
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg text-left uppercase tracking-tight">PANDUAN OPERASIONAL & KEBUTUHAN KLIEN</h3>
                  <p className="text-[10px] text-slate-400 font-bold font-mono text-left tracking-widest">OFFICIAL CLIENT USER MANUAL SYSTEM v4.1</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={printManual}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  title="Cetak Panduan Resmi sebagai PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CETAK PDF</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick tabs bar inside Modal desktop view */}
            <div className="flex gap-1.5 border-b border-slate-100 pb-2.5 overflow-x-auto shrink-0 select-none">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-655'
                }`}
              >
                📖 Ringkasan SOP
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('requirements')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'requirements' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-655'
                }`}
              >
                🖥️ Persyaratan & Instalasi
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('barcode')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'barcode' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-655'
                }`}
              >
                |||| Barcode Scanner SOP
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('api')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'api' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-655'
                }`}
              >
                🌐 Integrasi API
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('features')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'features' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-655'
                }`}
              >
                🌟 Fitur Unggulan
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto pr-1 text-slate-700 leading-relaxed text-xs space-y-5">
              
              {/* Tab: Overview or ALL */}
              {(activeTab === 'all' || activeTab === 'barcode') && (
                <div className="space-y-3.5">
                  <h4 className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-[#0D9488]" />
                    <span>CARA MENGGUNAKAN FITUR BARCODE SCANNER (INTERNATIONAL STANDARD)</span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sistem deteksi barcode Torky Komputer sudah memenuhi standar operasional retail internasional. Kami mengimplementasikan <strong>Global Keyboard Wedging</strong> yang mendeteksi masukan physical laser scanner secara real-time dari halaman manapun tanpa mewajibkan Anda mengklik kotak teks masukan (input box).
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                      <span className="text-[9px] font-black font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase tracking-widest w-max block">Transaksional Kasir POS</span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Cukup arahkan barcode scanner laser ke produk di halaman POS. Sistem secara otomatis menterjemahkan kode masukan dalam milidetik, memicu <strong>Barcode Beep (1450Hz, 75ms)</strong>, menampilkan toast sukses, lalu menambahkan ke bag belanja lengkap dengan pajak PPN 12% dan diskon progresif yang sesuai secara instan.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                      <span className="text-[9px] font-black font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-widest w-max block">Manajemen Gudang Stok</span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Di tab Management Stock, scan barcode barang Anda. Layar secara otomatis mendeteksi kode pindaian:
                      </p>
                      <ul className="text-[10px] text-slate-500 font-semibold space-y-1 list-disc pl-4">
                        <li><strong>Terdaftar:</strong> Membuka laci stock management cepat (bisa tambah/kurang stock instan dalam 1 click).</li>
                        <li><strong>Belum Terdaftar:</strong> Membuka laci register baru dengan nomor SKU barcode otomatis terisi tanpa ketik manual.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Hardware & Requirements */}
              {(activeTab === 'all' || activeTab === 'requirements') && (
                <div className="space-y-3.5 border-t border-slate-100 pt-4 first:border-0 first:pt-0">
                  <h4 className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#0D9488]" />
                    <span>PERSYARATAN HARDWARE, SISTEM & VALIDASI LISENSI</span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Aplikasi ini dapat dijalankan secara optimal untuk multi-layout responsif: dari HP terminal kasir, tablet, hingga komputer desktop.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-[11px]">
                    <div className="border border-slate-200 rounded-2xl p-3.5 space-y-1 bg-white">
                      <h5 className="font-extrabold text-slate-800 uppercase">🖥️ KOMPUTER & HP</h5>
                      <p className="text-slate-500 leading-tight">Mendukung Sunmi Android Terminal Kasir, Laptop Windows/macOS, Tablet iPad, dengan resolusi optimal, responsif penuh.</p>
                    </div>
                    <div className="border border-slate-200 rounded-2xl p-3.5 space-y-1 bg-white">
                      <h5 className="font-extrabold text-slate-800 uppercase">🖨️ PRINTER STRUK</h5>
                      <p className="text-slate-500 leading-tight">Mendukung penuh format kertas receipt struk kasir standard internasional ukuran 58mm maupun 80mm kertas thermal.</p>
                    </div>
                    <div className="border border-slate-200 rounded-2xl p-3.5 space-y-1 bg-white">
                      <h5 className="font-extrabold text-slate-800 uppercase">🔑 AKTIVASI LISENSI</h5>
                      <p className="text-slate-500 leading-tight">Menggunakan validasi UUID Klien offline-first. Gunakan master bypass dev key jika diperlukan pengujian.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: API */}
              {(activeTab === 'all' || activeTab === 'api') && (
                <div className="space-y-3.5 border-t border-slate-100 pt-4 first:border-0 first:pt-0">
                  <h4 className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#0D9488]" />
                    <span>INTEGRASI LOGISTIK LIVE DAN BALI REGIONAL FALLBACK</span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sistem dapat mendeteksi ongkos kirim real-time jika Anda mensetup key Biteship / RajaOngkir mandiri via menu <strong>🌐 SETUP API</strong>. Jika kosong atau koneksi internet mati, Torky POS akan otomatis beralih menggunakan algoritma fallback pemetaan jarak Bali terpadu:
                  </p>

                  <div className="overflow-hidden border border-slate-200 rounded-2xl bg-slate-50">
                    <table className="w-full text-left border-collapse text-[10px] sm:text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 font-extrabold text-[#0f172a] border-b border-slate-200">
                          <th className="p-2 sm:p-2.5">Wilayah Destinasi</th>
                          <th className="p-2 sm:p-2.5">Perkiraan Jarak</th>
                          <th className="p-2 sm:p-2.5 text-teal-700">Tarif GoSend Fallback</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        <tr>
                          <td className="p-2 sm:p-2.5 font-bold">Denpasar Kota (Sanur, Renon, Panjer)</td>
                          <td className="p-2 sm:p-2.5">~3 Km</td>
                          <td className="p-2 sm:p-2.5 font-bold text-teal-600">Rp 18.500</td>
                        </tr>
                        <tr>
                          <td className="p-2 sm:p-2.5 font-bold">Kuta, Seminyak, Canggu, Jimbaran</td>
                          <td className="p-2 sm:p-2.5">~9 s.d 14 Km</td>
                          <td className="p-2 sm:p-2.5 font-bold text-teal-600">Rp 24.000</td>
                        </tr>
                        <tr>
                          <td className="p-2 sm:p-2.5 font-bold">Nusa Dua, Pecatu, Ubud, Gianyar</td>
                          <td className="p-2 sm:p-2.5">~19 s.d 26 Km</td>
                          <td className="p-2 sm:p-2.5 font-bold text-teal-600">Rp 48.000</td>
                        </tr>
                        <tr>
                          <td className="p-2 sm:p-2.5 font-bold">Kawasan Jauh (Lovina, Singaraja, Negara)</td>
                          <td className="p-2 sm:p-2.5">&gt; 45 Km</td>
                          <td className="p-2 sm:p-2.5 font-bold text-teal-600">Rp 95.000 - Rp 150.000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab: Features */}
              {(activeTab === 'all' || activeTab === 'features') && (
                <div className="space-y-3.5 border-t border-slate-100 pt-4 first:border-0 first:pt-0">
                  <h4 className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#0D9488]" />
                    <span>KEMAMPUAN UTAMA & CAPABILITIES PEMROGRAMAN LAINNYA</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex gap-2">
                      <span className="text-base select-none">🖥️</span>
                      <div>
                        <h6 className="font-extrabold text-slate-800 uppercase">3D PC Custom Kit Simulator</h6>
                        <p className="text-slate-500 leading-tight">Visualisasi rakit PC 3D interaktif hemat kuota yang memandu pelanggan memilih casing, RAM, VGA, CPU secara presisi.</p>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex gap-2">
                      <span className="text-base select-none">🔧</span>
                      <div>
                        <h6 className="font-extrabold text-slate-800 uppercase">Repair Diagnostics Log</h6>
                        <p className="text-slate-500 leading-tight">Pencatatan reparasi laptop/PC lengkap dengan pelacakan nomor seri, memo teknisi, estimasi tanggal selesai, dan cetak tanda serah terima.</p>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex gap-2">
                      <span className="text-base select-none">👥</span>
                      <div>
                        <h6 className="font-extrabold text-slate-800 uppercase">Multi-user PIN & Roles</h6>
                        <p className="text-slate-500 leading-tight">Empat peran terstruktur (Super Admin, Admin, Kasir, Teknisi) dilindungi PIN rahasia untuk audit operasional penuh.</p>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex gap-2">
                      <span className="text-base select-none">🧾</span>
                      <div>
                        <h6 className="font-extrabold text-slate-800 uppercase">Diskon Progresif & Pajak</h6>
                        <p className="text-slate-500 leading-tight">Standard kasir supermarket besar, menghitung otomatis PPN 12% regulasi RI terbaru secara aman dan tanpa kekeliruan aritmatika.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-t pt-4 border-slate-100 shrink-0 gap-3 text-center sm:text-left select-none">
              <span className="text-[10px] text-slate-400 font-semibold font-mono flex items-center gap-1.5 uppercase">
                <Terminal className="w-3.5 h-3.5 text-teal-600" />
                <span>Dokumentasi Resmi Torky Komputer Bali • v4.1</span>
              </span>
              <button
                type="button"
                onClick={printManual}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                UNDUH PDF PANDUAN
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
