import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.prompt.toLowerCase();

    // 1. DATA DEFAULT (Jika prompt tidak spesifik)
    let responseData = {
      hero_title: 'Transformasi Digital Bisnis Anda',
      hero_subtitle: 'Tingkatkan efisiensi dan jangkauan pasar dengan platform modern yang dirancang khusus untuk pertumbuhan bisnis Anda.',
      cta_text: 'Mulai Sekarang',
      theme_color: 'from-blue-600 to-cyan-400',
      layout_style: 'modern-centered', // Pilihan: modern-centered, split-left
      nav_links: ['Home', 'Features', 'Pricing', 'Contact'],
      features_data: [
        { title: 'Performa Cepat', desc: 'Website dioptimalkan untuk kecepatan.' },
        { title: 'Desain Responsif', desc: 'Tampil sempurna di semua perangkat mobile.' },
        { title: 'Keamanan Data', desc: 'Infrastruktur dengan enkripsi tingkat tinggi.' }
      ]
    };

    // 2. HEURISTIC ENGINE: DETEKSI NIAT (INTENT)
    
    // --- SKENARIO: UMKM / MAKANAN (Contoh Mochi) ---
    if (prompt.includes('makanan') || prompt.includes('mochi') || prompt.includes('kue') || prompt.includes('kuliner') || prompt.includes('jual')) {
      const isMochi = prompt.includes('mochi');
      responseData = {
        hero_title: isMochi ? 'Mochi Premium Lembut & Manis' : 'Sajian Kuliner Terbaik untuk Anda',
        hero_subtitle: isMochi ? 'Dibuat setiap hari dengan bahan pilihan. Rasakan sensasi lumer di mulut pada gigitan pertama. Pesan sekarang untuk dikirim hari ini!' : 'Nikmati hidangan lezat yang dibuat dengan bahan berkualitas dan resep rahasia keluarga.',
        cta_text: 'Lihat Menu & Pesan',
        theme_color: 'from-rose-400 to-orange-400', // Warna hangat untuk makanan
        layout_style: 'split-left', // Layout e-commerce (teks kiri, gambar/fokus kanan)
        nav_links: ['Beranda', 'Menu Kami', 'Testimoni', 'Pesan'],
        features_data: [
          { title: '100% Fresh', desc: 'Dibuat baru setiap hari tanpa pengawet.' },
          { title: 'Pengiriman Cepat', desc: 'Sampai di depan pintu Anda dalam hitungan jam.' },
          { title: 'Banyak Varian', desc: 'Tersedia puluhan rasa yang siap memanjakan lidah.' }
        ]
      };
    } 
    // --- SKENARIO: KEUANGAN / KASIR ---
    else if (prompt.includes('kasir') || prompt.includes('uang') || prompt.includes('finansial') || prompt.includes('pos')) {
      responseData = {
        hero_title: 'Sistem Kasir Pintar untuk Bisnis',
        hero_subtitle: 'Pantau penjualan, kelola stok barang, dan buat laporan keuangan otomatis hanya dari satu dashboard cerdas.',
        cta_text: 'Coba Gratis 14 Hari',
        theme_color: 'from-emerald-400 to-teal-500', 
        layout_style: 'modern-centered',
        nav_links: ['Fitur POS', 'Integrasi', 'Harga', 'Login'],
        features_data: [
          { title: 'Laporan Real-time', desc: 'Pantau omset harian langsung dari HP.' },
          { title: 'Manajemen Stok', desc: 'Notifikasi otomatis jika barang menipis.' },
          { title: 'Support Multi-Cabang', desc: 'Kelola puluhan toko dalam satu klik.' }
        ]
      };
    }
    // --- SKENARIO: PORTFOLIO / CREATIVE ---
    else if (prompt.includes('portfolio') || prompt.includes('kreatif') || prompt.includes('desain') || prompt.includes('agency')) {
      responseData = {
        hero_title: 'Mewujudkan Ide Menjadi Karya',
        hero_subtitle: 'Kami adalah studio kreatif yang fokus pada pembuatan identitas visual dan pengalaman digital yang tak terlupakan.',
        cta_text: 'Lihat Karya Kami',
        theme_color: 'from-purple-500 to-indigo-500', 
        layout_style: 'split-left',
        nav_links: ['Work', 'Services', 'About', 'Let\'s Talk'],
        features_data: [
          { title: 'UI/UX Design', desc: 'Desain antarmuka yang intuitif.' },
          { title: 'Brand Identity', desc: 'Membangun karakter merk yang kuat.' },
          { title: 'Web Development', desc: 'Koding bersih, cepat, dan modern.' }
        ]
      };
    }

    // Simulasi Delay AI Processing
    await new Promise((resolve) => setTimeout(resolve, 3500));

    return NextResponse.json({ success: true, data: responseData });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}