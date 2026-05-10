'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
  Terminal, Sparkles, Zap, Send, Database, 
  LayoutTemplate, Globe, Cpu, ChevronRight, 
  CheckCircle2, Menu, X, ArrowUpRight, GitBranch, Mail, LogOut, LayoutDashboard, Loader2
} from 'lucide-react';
import { supabase } from './lib/supabase'; // <-- WAJIB IMPORT SUPABASE

// --- Types ---
type Notification = { id: number; text: string; type: 'info' | 'success' | 'ai' | 'warning' };
type CMSHero = { badge_text: string; title_line1: string; title_line2: string; description: string };
type Portfolio = { id: number; title: string; type: string; color: string; status: string };

export default function HariDevLanding() {
  const router = useRouter(); 
  
  // --- States UI & AI ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [buildSteps, setBuildSteps] = useState<number>(0);

  // --- States Authentication ---
  const [userSession, setUserSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- States DATABASE (CMS) ---
  const [heroContent, setHeroContent] = useState<CMSHero | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isCMSLoading, setIsCMSLoading] = useState(true);
  
  // --- Scroll Progress ---
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const opacity = useTransform(scrollYProgress, [0, 0.05], [0, 1]);

  const addNotification = (text: string, type: 'info' | 'success' | 'ai' | 'warning' = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 4000);
  };

  const handleDummyClick = (featureName: string) => {
    addNotification(`Mengarahkan ke ${featureName}...`, 'warning');
  };

  // --- FETCH DATA DARI SUPABASE SAAT HALAMAN DIBUKA ---
  useEffect(() => {
    const fetchCMSData = async () => {
      // 1. Ambil Data Hero Section
      const { data: heroData } = await supabase.from('landing_page_content').select('*').eq('id', 1).single();
      if (heroData) setHeroContent(heroData);

      // 2. Ambil Data Portofolio yang "Published" saja
      const { data: portData } = await supabase.from('portfolios').select('*').eq('status', 'Published').order('id', { ascending: false });
      if (portData) setPortfolios(portData);

      setIsCMSLoading(false);
    };

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserSession(session);

      if (session?.user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (data && data.role === 'admin') setIsAdmin(true);
      }
      setIsAuthLoading(false);
    };

    fetchCMSData();
    checkSession();

    // Notifikasi selamat datang opsional (dihilangkan agar fokus ke fetch data)
  }, []);

  // --- Logika Simulasi Typing AI ---
  const handleBuild = () => {
    if (!prompt) return addNotification("Masukkan instruksi website impianmu terlebih dahulu!", "warning");
    
    setIsBuilding(true); setBuildSteps(0);
    addNotification("AI sedang menganalisis arsitektur...", "ai");
    
    setTimeout(() => setBuildSteps(1), 800);
    setTimeout(() => setBuildSteps(2), 2200);
    setTimeout(() => setBuildSteps(3), 3800);
    setTimeout(() => setBuildSteps(4), 5000);
    setTimeout(() => {
      setIsBuilding(false); setPrompt('');
      
      if (userSession) {
        addNotification("Selesai! Membuka Dashboard Workspace Anda...", "success");
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        addNotification("Selesai! Silakan Login/Daftar untuk menyimpan Workspace Anda.", "success");
        setTimeout(() => router.push('/login'), 2000);
      }
    }, 6500);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) { element.scrollIntoView({ behavior: 'smooth' }); setIsMenuOpen(false); }
  };

  if (isCMSLoading) {
    return <div className="min-h-screen bg-[#020202] flex items-center justify-center"><Loader2 className="animate-spin text-cyan-400" size={40}/></div>;
  }

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-cyan-500/30 scroll-smooth">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-400 z-[100] origin-left" style={{ scaleX }} />

      {/* Floating Notifications */}
      <div className="fixed bottom-6 right-6 z-[90] space-y-3 w-72 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div key={n.id} initial={{ opacity: 0, x: 50, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
              className={`p-4 rounded-xl border backdrop-blur-xl flex items-start gap-3 shadow-2xl ${
                n.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 
                n.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                n.type === 'ai' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}
            >
              <div>{n.type === 'success' ? <CheckCircle2 size={18} /> : <Sparkles size={18} />}</div>
              <p className="text-xs font-mono text-white">{n.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <motion.nav style={{ opacity }} className="fixed top-0 left-0 right-0 z-[80] border-b border-white/5 bg-black/40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <motion.div whileHover={{ scale: 1.05 }} onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex items-center cursor-pointer">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-400 px-3 py-1 text-lg font-black tracking-tighter uppercase">HARI</span>
              <span className="bg-white text-black px-3 py-1 text-lg font-black tracking-tighter">Dev.I</span>
            </motion.div>
            <div className="hidden lg:flex gap-6 text-sm text-gray-400">
              <button onClick={() => scrollToSection('showcase')} className="hover:text-cyan-400 transition-colors">Showcase</button>
              <button onClick={() => scrollToSection('tech')} className="hover:text-cyan-400 transition-colors">Tech</button>
              <button onClick={() => scrollToSection('pricing')} className="hover:text-cyan-400 transition-colors">Pricing</button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {!isAuthLoading && (
              <>
                {isAdmin && <button onClick={() => router.push('/admin')} className="text-sm font-mono text-cyan-400 hover:text-cyan-300 transition-colors border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 rounded-full mr-2">Admin Panel</button>}
                {userSession ? (
                  <>
                    <button onClick={() => router.push('/dashboard')} className="text-sm font-bold flex items-center gap-2 hover:text-cyan-400 transition-colors"><LayoutDashboard size={16}/> My Workspace</button>
                    <button onClick={handleLogout} className="bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2"><LogOut size={16}/> Keluar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => router.push('/login')} className="text-sm font-medium hover:text-cyan-400 transition-colors">Sign In</button>
                    <button onClick={() => router.push('/login')} className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-blue-900/20 transition-all text-white">Sign Up Free</button>
                  </>
                )}
              </>
            )}
          </div>
          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X /> : <Menu />}</button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="fixed top-[68px] left-0 right-0 z-[75] bg-black border-b border-white/10 md:hidden overflow-hidden">
            <div className="p-6 flex flex-col gap-6 font-mono text-lg">
              <button onClick={() => scrollToSection('showcase')} className="text-left">Showcase</button>
              <button onClick={() => scrollToSection('tech')} className="text-left">Tech Stack</button>
              <button onClick={() => scrollToSection('pricing')} className="text-left">Pricing</button>
              <div className="border-t border-white/10 pt-4 flex flex-col gap-4">
                {!isAuthLoading && (
                  <>
                    {isAdmin && <button onClick={() => router.push('/admin')} className="text-left text-cyan-400 font-bold flex items-center gap-2"><Terminal size={18}/> Admin Panel</button>}
                    {userSession ? (
                      <>
                        <button onClick={() => router.push('/dashboard')} className="bg-cyan-500 text-black p-4 font-bold rounded-lg text-center shadow-lg shadow-cyan-500/20">Open Workspace</button>
                        <button onClick={handleLogout} className="text-left text-red-400 font-bold flex items-center gap-2"><LogOut size={18}/> Logout</button>
                      </>
                    ) : (
                      <button onClick={() => router.push('/login')} className="bg-cyan-500 text-black p-4 font-bold rounded-lg text-center shadow-lg shadow-cyan-500/20">Sign In / Register</button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION (DYNAMIC DARI SUPABASE CMS) */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 px-6">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="z-10 text-center max-w-5xl">
          <div className="mb-6 flex justify-center">
             <span className="px-4 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] uppercase tracking-[0.2em] font-bold">
               {heroContent?.badge_text || 'System Loading...'}
             </span>
          </div>
          <h1 className="text-6xl md:text-[110px] font-black tracking-tighter leading-[0.9] mb-8">
            {heroContent?.title_line1} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-500">
              {heroContent?.title_line2}
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-2xl max-w-3xl mx-auto mb-12 font-light leading-relaxed">
            {heroContent?.description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={() => scrollToSection('builder-workspace')} className="w-full sm:w-auto px-10 py-5 bg-white text-black font-black rounded-full flex items-center justify-center gap-3 hover:bg-cyan-400 transition-all group">
              BUILD NOW <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
            <button onClick={() => handleDummyClick('Github Repo')} className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 rounded-full flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
              <GitBranch size={20} /> VIEW REPOSITORY
            </button>
          </div>
        </motion.div>

        {/* Hero Illustration - INTERACTIVE Browser Window */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }} id="builder-workspace"
          className="mt-20 w-full max-w-6xl rounded-t-3xl border-t border-x border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4 pb-0 relative scroll-mt-24"
        >
          <div className="bg-[#050505] rounded-t-2xl border-t border-x border-white/10 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                <div className="w-3 h-3 rounded-full bg-green-500/20" />
              </div>
              <div className="px-4 py-1 rounded bg-white/5 text-[10px] font-mono text-gray-500">https://builder.haridev.ai</div>
              <div className="w-4" />
            </div>
            
            <div className="h-[450px] md:h-[600px] flex">
              <div className="hidden md:block w-64 border-r border-white/5 p-6 space-y-8 bg-black/20">
                <div className="text-xs font-bold text-gray-500 mb-4 tracking-widest">UI COMPONENTS</div>
                <div className="space-y-4">
                   <div onClick={() => handleDummyClick('Component Header')} className="h-10 w-full bg-white/5 border border-white/10 rounded cursor-pointer hover:bg-cyan-500/20 transition-all" />
                   <div onClick={() => handleDummyClick('Component Features')} className="h-24 w-full bg-white/5 border border-white/10 rounded cursor-pointer hover:bg-cyan-500/20 transition-all" />
                   <div onClick={() => handleDummyClick('Component Footer')} className="h-10 w-full bg-white/5 border border-white/10 rounded cursor-pointer hover:bg-cyan-500/20 transition-all" />
                </div>
              </div>

              <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px]" />
                 
                 {isBuilding ? (
                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="z-10 w-full max-w-3xl text-left bg-black/80 border border-white/10 p-6 rounded-xl font-mono text-sm md:text-base shadow-2xl h-80 overflow-y-auto">
                      <div className="flex items-center gap-3 text-cyan-400 mb-6 border-b border-white/5 pb-4"><Terminal size={20} /> <span className="tracking-widest font-bold">HARI_DEV_EXECUTION_LOG</span></div>
                      <div className="space-y-4 text-gray-400">
                        <p className="text-white">&gt; Instruksi diterima: "{prompt}"</p>
                        {buildSteps >= 1 && <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>&gt; Membangun koneksi ke Local Inference Engine... [OK]</motion.p>}
                        {buildSteps >= 2 && <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>&gt; Melakukan query semantic ke PostgreSQL pgvector... [MATCH FOUND]</motion.p>}
                        {buildSteps >= 3 && <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>&gt; Merakit struktur React Functional Components & Tailwind classes...</motion.p>}
                        {buildSteps >= 4 && <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-green-400 font-bold mt-4 border border-green-500/30 bg-green-500/10 p-3 rounded">&gt; SUKSES! Website siap untuk di-deploy ke Virtual DOM.</motion.p>}
                        <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-3 h-5 bg-cyan-400 inline-block mt-2" />
                      </div>
                   </motion.div>
                 ) : (
                   <motion.div className="z-10 w-full max-w-2xl mx-auto space-y-6">
                     <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 4 }}>
                       <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto border border-cyan-500/30 mb-6 shadow-[0_0_30px_rgba(6,182,212,0.2)]"><Cpu className="text-cyan-400" size={40} /></div>
                     </motion.div>
                     <h3 className="text-3xl font-bold tracking-tight mb-2">AI Workspace Ready</h3>
                     <p className="text-gray-500 mb-8">Ketik instruksi di bawah untuk mulai men-generate komponen langsung dari database mandirimu.</p>
                     
                     <div className="relative group">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleBuild()} placeholder="Contoh: Buat landing page SaaS untuk platform edukasi..." className="w-full bg-black/80 border border-white/20 p-5 rounded-xl outline-none focus:border-cyan-400 text-white relative z-10 transition-colors shadow-2xl" />
                     </div>
                     <button onClick={handleBuild} className="bg-cyan-500 text-black px-8 py-4 font-black rounded-xl hover:bg-cyan-400 w-full transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]">GENERATE WEBSITE <Zap size={18} className="inline ml-2" /></button>
                   </motion.div>
                 )}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* STATS SECTION */}
      <section className="py-32 border-y border-white/5 bg-[#030303]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {[
            { label: 'Generation Speed', val: '0.4s', detail: 'Local Inference' },
            { label: 'Security Standard', val: '100%', detail: 'Zero External API' },
            { label: 'Export Quality', val: 'A+', detail: 'Production Ready' },
            { label: 'Monthly Users', val: '12K+', detail: 'Active Developers' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center md:text-left">
              <p className="text-xs font-mono text-cyan-500 mb-2 uppercase tracking-widest">{s.label}</p>
              <h4 className="text-5xl font-black mb-1">{s.val}</h4>
              <p className="text-gray-600 text-sm font-sans">{s.detail}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PORTFOLIO SHOWCASE (DYNAMIC DARI SUPABASE CMS) */}
      <section id="showcase" className="py-32 px-6 max-w-7xl mx-auto scroll-mt-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-black mb-6">BUILT WITH <br /> <span className="text-cyan-400">HARI DEV CORE</span></h2>
            <p className="text-gray-400 text-lg">Inilah contoh hasil website yang dihasilkan oleh AI kami menggunakan arsitektur lokal. Cepat, unik, dan sepenuhnya milik Anda.</p>
          </div>
          <button onClick={() => handleDummyClick('Semua Portfolio')} className="text-cyan-400 font-bold flex items-center gap-2 hover:underline">
            VIEW ALL SHOWCASE <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portfolios.length === 0 ? (
             <div className="col-span-1 md:col-span-3 h-32 flex items-center justify-center border border-white/10 rounded-2xl text-gray-500 font-mono">Belum ada portofolio yang di-publish dari Admin.</div>
          ) : (
            portfolios.map((item) => (
              <motion.div 
                key={item.id}
                whileHover={{ y: -10 }}
                onClick={() => handleDummyClick(`Portfolio: ${item.title}`)}
                className={`group relative aspect-[4/5] bg-gradient-to-b ${item.color} to-transparent border border-white/10 rounded-3xl p-8 overflow-hidden flex flex-col justify-end cursor-pointer`}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <p className="text-xs font-mono text-white/50 mb-2">{item.type}</p>
                  <h4 className="text-3xl font-bold mb-4">{item.title}</h4>
                  <div className="flex gap-4 translate-y-10 group-hover:translate-y-0 transition-transform">
                     <button className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform"><LayoutTemplate size={20}/></button>
                     <button className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20 hover:scale-110 transition-transform"><Globe size={20}/></button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* TECH DEEP DIVE */}
      <section id="tech" className="py-32 bg-white/5 backdrop-blur-3xl relative overflow-hidden scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="order-2 lg:order-1">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4 pt-12">
                       <div onClick={() => handleDummyClick('Docs pgvector')} className="cursor-pointer hover:bg-cyan-500/30 transition-colors h-64 bg-cyan-500/20 rounded-3xl border border-cyan-500/30 flex items-center justify-center flex-col gap-4 p-8 text-center shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                          <Database className="text-cyan-400" size={40} />
                          <h5 className="font-bold">pgvector</h5>
                          <p className="text-[10px] opacity-50">Local semantic memory storage</p>
                       </div>
                       <div className="h-48 bg-white/5 rounded-3xl border border-white/10" />
                    </div>
                    <div className="space-y-4">
                       <div className="h-48 bg-white/5 rounded-3xl border border-white/10" />
                       <div onClick={() => handleDummyClick('Docs Ollama')} className="cursor-pointer hover:bg-blue-500/30 transition-colors h-64 bg-blue-500/20 rounded-3xl border border-blue-500/30 flex items-center justify-center flex-col gap-4 p-8 text-center shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                          <Cpu className="text-blue-400" size={40} />
                          <h5 className="font-bold">Ollama LLM</h5>
                          <p className="text-[10px] opacity-50">Private inference engine</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="order-1 lg:order-2">
                 <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">PRIVACY BY <span className="text-cyan-400">DESIGN.</span></h2>
                 <p className="text-gray-400 text-lg mb-10 leading-relaxed font-sans font-light">
                   Tidak ada kunci API OpenAI. Tidak ada data yang keluar dari server Anda. 
                   HARI DEV menggunakan integrasi **pgvector** untuk mengingat gaya coding Anda 
                   dan **Ollama** untuk memproses logika secara instan di CPU/GPU lokal.
                 </p>
                 <div className="space-y-6">
                    {[
                      { t: 'Local Data Processing', d: 'Data sensitif tidak pernah meninggalkan infrastruktur Anda.' },
                      { t: 'Unlimited Token Usage', d: 'Lupakan biaya bulanan per token yang mencekik.' },
                      { t: 'Custom Component Library', d: 'Ajarkan AI menggunakan sistem desain milik perusahaan Anda.' },
                    ].map((feat, i) => (
                      <div key={i} className="flex gap-4">
                         <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 text-[10px]">✓</div>
                         <div><h6 className="font-bold mb-1">{feat.t}</h6><p className="text-gray-500 text-sm font-sans">{feat.d}</p></div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-32 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
             <h2 className="text-4xl md:text-6xl font-black mb-6 uppercase">Ready to <span className="text-blue-500">Self-Host?</span></h2>
             <p className="text-gray-400">Pilih paket yang sesuai dengan skala infrastruktur Anda.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { name: 'Community', price: 'FREE', perks: ['Local SQLite Support', 'Llama 3.1 Optimized', 'Community Components', 'Basic Export'] },
               { name: 'Developer', price: '$29', perks: ['Postgres pgvector Support', 'Custom Model Tuning', 'Advanced AI Workflows', 'Priority Support'], popular: true },
               { name: 'Enterprise', price: 'Custom', perks: ['Multiple GPU Support', 'SSO & IAM Integration', 'Whitelabel Dashboard', 'Dedicated Engineer'] },
             ].map((p, i) => (
               <motion.div key={i} whileHover={{ scale: 1.02 }} className={`p-10 rounded-[40px] border flex flex-col h-full relative ${p.popular ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
                 {p.popular && <div className="absolute top-0 right-10 -translate-y-1/2 bg-cyan-500 text-black text-[10px] font-black px-4 py-1 rounded-full">POPULAR CHOICE</div>}
                 <h4 className="text-xl font-bold mb-2 uppercase tracking-widest">{p.name}</h4>
                 <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-black">{p.price}</span>{p.price !== 'Custom' && <span className="text-gray-500 text-sm">/mo</span>}
                 </div>
                 <ul className="space-y-4 mb-10 flex-1">
                    {p.perks.map((perk, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm text-gray-400"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> {perk}</li>
                    ))}
                 </ul>
                 <button onClick={() => userSession ? router.push('/dashboard') : router.push('/login')} className={`w-full py-4 rounded-full font-black text-sm text-center block transition-all ${p.popular ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    {userSession ? 'UPGRADE PLAN' : 'CHOOSE PLAN'}
                 </button>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-6">
         <div className="max-w-7xl mx-auto rounded-[60px] bg-gradient-to-br from-blue-600 to-cyan-500 p-1 bg-white/5 overflow-hidden">
            <div className="bg-black rounded-[58px] py-20 px-10 md:px-20 text-center relative overflow-hidden">
               <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/20 blur-[100px] rounded-full" />
               <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="relative z-10 max-w-3xl mx-auto">
                  <h2 className="text-5xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter">START YOUR <br /> OWN ENGINE.</h2>
                  <p className="text-gray-400 text-lg mb-12">Bergabung dengan ribuan developer yang memilih kemandirian data bersama Hari Dev.</p>
                  <div className="flex flex-col md:flex-row gap-6 justify-center">
                     <button onClick={() => userSession ? router.push('/dashboard') : router.push('/login')} className="bg-white text-black px-12 py-5 rounded-full font-black flex items-center justify-center gap-3 group">
                        {userSession ? 'GO TO WORKSPACE' : 'GET STARTED FOR FREE'} <ChevronRight className="group-hover:translate-x-2 transition-transform"/>
                     </button>
                     <button onClick={() => handleDummyClick('Jadwalkan Demo')} className="bg-white/10 border border-white/20 px-12 py-5 rounded-full font-black hover:bg-white/20 transition-all">
                        BOOK A DEMO
                     </button>
                  </div>
               </motion.div>
            </div>
         </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-6 border-t border-white/5">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-1">
               <div className="flex items-center mb-8">
                  <span className="bg-blue-600 px-2 py-1 text-sm font-black tracking-tighter uppercase">HARI</span>
                  <span className="bg-white text-black px-2 py-1 text-sm font-black tracking-tighter uppercase">Dev</span>
               </div>
               <p className="text-gray-500 text-xs leading-relaxed max-w-xs font-sans">
                 Platform SaaS Masa Depan untuk pengembangan website berbasis AI dengan infrastruktur lokal yang aman dan mandiri.
               </p>
            </div>
            <div>
               <h5 className="font-bold mb-6 text-sm uppercase tracking-widest text-white/40">Product</h5>
               <ul className="space-y-3 text-sm text-gray-500 font-sans">
                  <li onClick={() => handleDummyClick('Builder Engine')} className="hover:text-white cursor-pointer transition-colors">Builder Engine</li>
                  <li onClick={() => handleDummyClick('Vector Store')} className="hover:text-white cursor-pointer transition-colors">Vector Store</li>
                  <li onClick={() => handleDummyClick('Deployment')} className="hover:text-white cursor-pointer transition-colors">Deployment</li>
                  <li onClick={() => handleDummyClick('Whitelabel')} className="hover:text-white cursor-pointer transition-colors">Whitelabel</li>
               </ul>
            </div>
            <div>
               <h5 className="font-bold mb-6 text-sm uppercase tracking-widest text-white/40">Resources</h5>
               <ul className="space-y-3 text-sm text-gray-500 font-sans">
                  <li onClick={() => handleDummyClick('Dokumentasi')} className="hover:text-white cursor-pointer transition-colors">Documentation</li>
                  <li onClick={() => handleDummyClick('Github')} className="hover:text-white cursor-pointer transition-colors">Github Repo</li>
                  <li onClick={() => handleDummyClick('Ollama Guide')} className="hover:text-white cursor-pointer transition-colors">Ollama Integration</li>
                  <li onClick={() => handleDummyClick('API')} className="hover:text-white cursor-pointer transition-colors">API Docs</li>
               </ul>
            </div>
            <div>
               <h5 className="font-bold mb-6 text-sm uppercase tracking-widest text-white/40">Newsletter</h5>
               <div className="flex gap-2 mb-4">
                  <input placeholder="Email" className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs outline-none focus:border-cyan-500 w-full" />
                  <button onClick={() => handleDummyClick('Subscribe')} className="bg-white text-black p-3 rounded-lg"><Send size={16}/></button>
               </div>
               <div className="flex gap-4 text-gray-500">
                  <Globe onClick={() => handleDummyClick('Website Utama')} size={18} className="hover:text-white cursor-pointer" />
                  <Mail onClick={() => handleDummyClick('Kirim Email')} size={18} className="hover:text-white cursor-pointer" />
                  <GitBranch onClick={() => handleDummyClick('Github')} size={18} className="hover:text-white cursor-pointer" />
               </div>
            </div>
         </div>
         <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-gray-700 font-mono">
            <p>© 2026 HARI DEV TECHNOLOGIES INC. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-6">
               <span onClick={() => handleDummyClick('Privacy Policy')} className="cursor-pointer hover:text-white">PRIVACY POLICY</span>
               <span onClick={() => handleDummyClick('Terms of Service')} className="cursor-pointer hover:text-white">TERMS OF SERVICE</span>
               <span onClick={() => handleDummyClick('Cookies')} className="cursor-pointer hover:text-white">COOKIES</span>
            </div>
         </div>
      </footer>
    </div>
  );
}