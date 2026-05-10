'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Plus, Globe, Copy, Edit3, Trash2, 
  Settings, LogOut, Terminal, Cpu, Send, CheckCircle2, 
  Sparkles, MonitorPlay, Smartphone, Laptop, Zap, ArrowLeft, Save, Loader2, Layout, Image as ImageIcon, Type, Link as LinkIcon, Palette
} from 'lucide-react';
import { supabase } from '../lib/supabase'; 

// --- Tipe Data ---
type Notification = { id: number; text: string; type: 'info' | 'success' | 'warning' | 'error' };
type ViewMode = 'dashboard' | 'builder' | 'editor';

type ProjectData = {
  id: string; user_id: string; name: string; url: string; status: 'Live' | 'Draft';
  hero_title: string; hero_subtitle: string; cta_text: string; theme_color: string;
  layout_style: string; nav_links: string[]; 
  features_data: { title: string; desc: string }[];
  created_at: string;
};

export default function UserDashboard() {
  const router = useRouter();

  // States
  const [view, setView] = useState<ViewMode>('dashboard');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [userSession, setUserSession] = useState<any>(null);
  
  // States AI & DB
  const [prompt, setPrompt] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildLog, setBuildLog] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const [sites, setSites] = useState<ProjectData[]>([]);
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);
  const [isFetchingProjects, setIsFetchingProjects] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editor UI State
  const [activeEditorTab, setActiveEditorTab] = useState<'hero' | 'features' | 'nav' | 'theme'>('hero');

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [buildLog]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) router.push('/login');
      else { setUserSession(session); fetchMyProjects(session.user.id); }
      setIsLoadingAuth(false);
    };
    checkUser();
  }, [router]);

  const addNotification = (text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };
  const addLog = (msg: string) => setBuildLog(prev => [...prev, msg]);

  const fetchMyProjects = async (userId: string) => {
    setIsFetchingProjects(true);
    const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (!error && data) setSites(data as ProjectData[]);
    setIsFetchingProjects(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus website ini permanen?')) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) { setSites(sites.filter(site => site.id !== id)); addNotification('Dihapus permanen.', 'success'); }
  };

  // --- AI ENGINE GENERATION ---
  const handleGenerateAI = async () => {
    if (!prompt) return addNotification("Masukkan deskripsi website Anda!", "warning");
    setIsBuilding(true); setBuildLog([`> Menganalisis instruksi: "${prompt}"...`]);
    
    try {
      setTimeout(() => addLog("> Menghubungi HARI DEV AI Engine..."), 800);
      const response = await fetch('/api/build', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt })
      });
      addLog("> Mengekstrak keyword dan memilih Layout Template...");
      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      addLog("> Men-generate Copywriting dan Struktur Komponen...");
      const aiData = result.data;
      const generatedName = prompt.split(' ').slice(0, 3).join(' ') + '...';
      const generatedUrl = `project-${Math.floor(Math.random() * 10000)}.haridev.ai`;

      const newSiteData = {
        user_id: userSession.user.id,
        name: generatedName, url: generatedUrl, status: 'Draft',
        hero_title: aiData.hero_title, hero_subtitle: aiData.hero_subtitle, cta_text: aiData.cta_text,
        theme_color: aiData.theme_color, layout_style: aiData.layout_style, 
        nav_links: aiData.nav_links, features_data: aiData.features_data
      };

      const { data: dbData, error } = await supabase.from('projects').insert([newSiteData]).select().single();
      if (error) throw error;

      addLog("> BERHASIL! Merender website ke Canvas Editor...");
      setSites([dbData as ProjectData, ...sites]);
      setActiveSiteId(dbData.id);
      addNotification("Website Berhasil Digenerate AI!", "success");
      setPrompt('');
      setTimeout(() => setView('editor'), 1500);
    } catch (error: any) {
      addNotification(`Gagal: ${error.message}`, 'error');
      setIsBuilding(false);
    }
  };

  // --- EDITOR UPDATES ---
  const handleUpdateContent = (field: keyof ProjectData, value: any) => {
    setSites(sites.map(site => site.id === activeSiteId ? { ...site, [field]: value } : site));
  };

  const handleUpdateFeature = (index: number, field: 'title' | 'desc', value: string) => {
    setSites(sites.map(site => {
      if (site.id === activeSiteId) {
        const newFeatures = [...site.features_data];
        newFeatures[index] = { ...newFeatures[index], [field]: value };
        return { ...site, features_data: newFeatures };
      }
      return site;
    }));
  };

  const handleSavePublish = async () => {
    const activeSite = sites.find(s => s.id === activeSiteId);
    if (!activeSite) return;
    setIsSaving(true);

    const { error } = await supabase.from('projects').update({
      hero_title: activeSite.hero_title, hero_subtitle: activeSite.hero_subtitle, cta_text: activeSite.cta_text, 
      theme_color: activeSite.theme_color, layout_style: activeSite.layout_style, 
      nav_links: activeSite.nav_links, features_data: activeSite.features_data, status: 'Live'
    }).eq('id', activeSite.id);

    setIsSaving(false);
    if (error) addNotification(`Gagal menyimpan: ${error.message}`, 'error');
    else {
      setSites(sites.map(site => site.id === activeSiteId ? { ...site, status: 'Live' } : site));
      addNotification('Perubahan disimpan dan Website dipublikasikan!', 'success');
      setTimeout(() => setView('dashboard'), 1500);
    }
  };

  if (isLoadingAuth) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-cyan-400"><Loader2 className="animate-spin" size={40}/></div>;
  const activeSite = sites.find(s => s.id === activeSiteId);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex overflow-hidden selection:bg-cyan-500/30">
      
      {/* NOTIFIKASI */}
      <div className="fixed bottom-6 right-6 z-[100] space-y-3 w-72 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div key={n.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8 }}
              className={`p-4 rounded-xl border backdrop-blur-xl flex items-start gap-3 shadow-2xl ${n.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : n.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : n.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}
            >
              <CheckCircle2 size={18} className="shrink-0" /><p className="text-xs font-mono">{n.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- SIDEBAR --- */}
      {view !== 'editor' && (
        <aside className="w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col hidden md:flex">
          <div className="p-6 border-b border-white/5 cursor-pointer" onClick={() => router.push('/')}>
            <span className="bg-gradient-to-r from-blue-600 to-cyan-400 px-2 py-1 text-sm font-black uppercase">HARI</span><span className="bg-white text-black px-2 py-1 text-sm font-black">Workspace</span>
          </div>
          <div className="flex-1 p-4 space-y-2">
            <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${view === 'dashboard' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><LayoutDashboard size={18}/> My Projects</button>
            <button onClick={() => setView('builder')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${view === 'builder' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><Sparkles size={18}/> AI Builder Baru</button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-gray-500 hover:text-white hover:bg-white/5"><Globe size={18}/> Custom Domains</button>
          </div>
          <div className="p-4 border-t border-white/5"><button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-bold"><LogOut size={18}/> Logout</button></div>
        </aside>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* VIEW 1: DASHBOARD */}
        {view === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto p-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div><h1 className="text-3xl font-black mb-2 flex items-center gap-3">My Projects {isFetchingProjects && <Loader2 className="animate-spin text-cyan-400" size={24}/>}</h1><p className="text-gray-400 text-sm">Kelola website yang telah di-generate oleh HARI DEV AI.</p></div>
              <button onClick={() => setView('builder')} className="bg-cyan-500 text-black px-5 py-2.5 rounded-lg text-sm font-black flex items-center gap-2 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"><Plus size={18}/> Create New</button>
            </div>

            {!isFetchingProjects && sites.length === 0 ? (
              <div className="h-64 border-2 border-dashed border-white/10 bg-white/[0.02] rounded-2xl flex flex-col items-center justify-center text-gray-500">
                <Globe size={48} className="mb-4 opacity-20"/><p>Belum ada project.</p><button onClick={() => setView('builder')} className="mt-4 text-cyan-400 font-bold hover:underline">Mulai Generate &rarr;</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sites.map(site => (
                  <div key={site.id} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 transition-colors group flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${site.status === 'Live' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>{site.status}</span>
                      <p className="text-xs text-gray-500 font-mono">{new Date(site.created_at).toLocaleDateString()}</p>
                    </div>
                    <h3 className="text-xl font-bold mb-1 truncate">{site.name}</h3>
                    <p className="text-sm text-gray-400 mb-6 font-mono flex items-center gap-2 truncate"><Globe size={14} className="shrink-0"/> {site.url}</p>
                    <div className="mt-auto flex items-center gap-2 pt-4 border-t border-white/5">
                      <button onClick={() => { setActiveSiteId(site.id); setView('editor'); }} className="flex-1 bg-white/10 hover:bg-white/20 text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-2"><Edit3 size={16}/> Edit UI</button>
                      <button onClick={() => { navigator.clipboard.writeText(`https://${site.url}`); addNotification('Link dicopy!', 'success'); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300"><Copy size={18}/></button>
                      <button onClick={() => handleDelete(site.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 2: AI BUILDER */}
        {view === 'builder' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center p-8 relative">
            <div className="z-10 w-full max-w-2xl">
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto border border-cyan-500/30 mb-6 shadow-[0_0_30px_rgba(6,182,212,0.2)]"><Cpu className="text-cyan-400" size={32} /></div>
                <h1 className="text-4xl font-black mb-4">Hari Dev AI Engine</h1>
                <p className="text-gray-400">Ceritakan website apa yang ingin Anda buat. AI akan memilih layout, menulis copy, dan mengatur warna.</p>
              </div>

              {isBuilding ? (
                 <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-2xl font-mono text-sm h-64 shadow-2xl overflow-hidden flex flex-col">
                    <div className="flex items-center gap-3 text-cyan-400 mb-4 border-b border-white/5 pb-4"><Terminal size={18} /> <span>HARI_DEV_EXECUTION_LOG</span></div>
                    <div className="space-y-3 text-gray-400 flex-1 overflow-y-auto pb-4">
                      {buildLog.map((log, i) => (<motion.p key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={log.includes('BERHASIL') ? 'text-green-400 font-bold' : 'text-gray-300'}>{log}</motion.p>))}
                      <div ref={logEndRef} />
                    </div>
                 </div>
              ) : (
                <div className="relative group shadow-2xl">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Cth: Buatkan website untuk UMKM berjualan mochi dengan tema ceria..." className="w-full bg-[#0a0a0a] border border-white/20 p-6 rounded-2xl outline-none focus:border-cyan-400 text-white relative z-10 resize-none leading-relaxed" />
                  <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                    <button onClick={() => setView('dashboard')} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Batal</button>
                    <button onClick={handleGenerateAI} className="bg-cyan-500 text-black px-6 py-2 rounded-lg font-black flex items-center gap-2 hover:bg-cyan-400 shadow-lg"><Zap size={16}/> Build It</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 3: LIVE EDITOR (SPLIT SCREEN) */}
        {view === 'editor' && activeSite && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col h-screen bg-[#050505]">
            
            {/* Topbar */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a]">
              <div className="flex items-center gap-4">
                <button onClick={() => { setView('dashboard'); fetchMyProjects(userSession.user.id); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"><ArrowLeft size={20}/></button>
                <div><h3 className="font-bold text-sm">{activeSite.name}</h3><p className="text-[10px] text-gray-500 font-mono">{activeSite.url}</p></div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={handleSavePublish} disabled={isSaving} className="bg-cyan-500 text-black px-6 py-2 rounded-lg text-sm font-black flex items-center gap-2 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50">
                  {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} {isSaving ? 'Saving...' : 'Update & Publish'}
                </button>
              </div>
            </div>

            {/* Split Area */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* PROPERTIES PANEL (ADVANCED SIDEBAR) */}
              <div className="w-80 border-r border-white/5 bg-[#0a0a0a] flex flex-col h-full">
                {/* Tabs Menu */}
                <div className="flex border-b border-white/5 text-xs font-bold text-gray-500">
                  <button onClick={() => setActiveEditorTab('hero')} className={`flex-1 py-4 flex flex-col items-center gap-1 ${activeEditorTab === 'hero' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5' : 'hover:text-white'}`}><Type size={16}/> Hero</button>
                  <button onClick={() => setActiveEditorTab('features')} className={`flex-1 py-4 flex flex-col items-center gap-1 ${activeEditorTab === 'features' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5' : 'hover:text-white'}`}><Layout size={16}/> Features</button>
                  <button onClick={() => setActiveEditorTab('nav')} className={`flex-1 py-4 flex flex-col items-center gap-1 ${activeEditorTab === 'nav' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5' : 'hover:text-white'}`}><LinkIcon size={16}/> Nav</button>
                  <button onClick={() => setActiveEditorTab('theme')} className={`flex-1 py-4 flex flex-col items-center gap-1 ${activeEditorTab === 'theme' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5' : 'hover:text-white'}`}><Palette size={16}/> Theme</button>
                </div>

                {/* Editor Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* TAB: HERO */}
                  {activeEditorTab === 'hero' && (
                    <div className="space-y-4 animate-in fade-in">
                      <div>
                        <label className="text-[11px] text-gray-400 mb-1 block font-mono">Hero Title</label>
                        <input value={activeSite.hero_title} onChange={(e) => handleUpdateContent('hero_title', e.target.value)} className="w-full bg-black border border-white/10 rounded-md p-3 text-sm outline-none focus:border-cyan-500" />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 mb-1 block font-mono">Hero Subtitle</label>
                        <textarea rows={5} value={activeSite.hero_subtitle} onChange={(e) => handleUpdateContent('hero_subtitle', e.target.value)} className="w-full bg-black border border-white/10 rounded-md p-3 text-sm outline-none focus:border-cyan-500 resize-none" />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 mb-1 block font-mono">Tombol CTA Text</label>
                        <input value={activeSite.cta_text} onChange={(e) => handleUpdateContent('cta_text', e.target.value)} className="w-full bg-black border border-white/10 rounded-md p-3 text-sm outline-none focus:border-cyan-500" />
                      </div>
                    </div>
                  )}

                  {/* TAB: FEATURES */}
                  {activeEditorTab === 'features' && (
                    <div className="space-y-6 animate-in fade-in">
                      {activeSite.features_data?.map((feat, index) => (
                        <div key={index} className="p-4 border border-white/10 rounded-lg bg-black/50 space-y-3">
                          <label className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Card {index + 1}</label>
                          <input value={feat.title} onChange={(e) => handleUpdateFeature(index, 'title', e.target.value)} placeholder="Judul Fitur" className="w-full bg-transparent border-b border-white/10 py-1 text-sm outline-none focus:border-cyan-500 font-bold" />
                          <textarea rows={2} value={feat.desc} onChange={(e) => handleUpdateFeature(index, 'desc', e.target.value)} placeholder="Deskripsi pendek" className="w-full bg-white/5 rounded p-2 text-xs outline-none focus:border-cyan-500 resize-none text-gray-400" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB: NAV */}
                  {activeEditorTab === 'nav' && (
                    <div className="space-y-4 animate-in fade-in">
                      <p className="text-xs text-gray-400 mb-4">Ubah teks navigasi menu atas website Anda.</p>
                      {activeSite.nav_links?.map((link, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-6 h-6 flex items-center justify-center bg-white/5 rounded text-xs text-gray-500">{index + 1}</div>
                          <input 
                            value={link} 
                            onChange={(e) => {
                              const newLinks = [...activeSite.nav_links];
                              newLinks[index] = e.target.value;
                              handleUpdateContent('nav_links', newLinks);
                            }} 
                            className="flex-1 bg-black border border-white/10 rounded-md p-2 text-sm outline-none focus:border-cyan-500" 
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB: THEME */}
                  {activeEditorTab === 'theme' && (
                    <div className="space-y-6 animate-in fade-in">
                      <div>
                        <label className="text-[11px] text-gray-400 mb-2 block font-mono">Gradient Preset</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { name: 'Tech Blue', val: 'from-blue-600 to-cyan-400' },
                            { name: 'Finance Green', val: 'from-emerald-400 to-teal-500' },
                            { name: 'Creative Pink', val: 'from-purple-500 to-pink-500' },
                            { name: 'Food Warm', val: 'from-rose-400 to-orange-400' },
                            { name: 'Dark Mode', val: 'from-gray-600 to-gray-900' }
                          ].map(color => (
                            <button 
                              key={color.val} 
                              onClick={() => handleUpdateContent('theme_color', color.val)} 
                              className={`p-3 rounded-lg border text-xs font-bold text-left transition-all ${activeSite.theme_color === color.val ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400' : 'border-white/10 bg-black text-gray-400 hover:border-white/30'}`}
                            >
                              <div className={`w-full h-2 rounded-full bg-gradient-to-r ${color.val} mb-2`} />
                              {color.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 mb-2 block font-mono">Layout Style</label>
                        <select 
                          value={activeSite.layout_style || 'modern-centered'} 
                          onChange={(e) => handleUpdateContent('layout_style', e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-md p-3 text-sm outline-none focus:border-cyan-500 text-white"
                        >
                          <option value="modern-centered">Modern Centered</option>
                          <option value="split-left">Split Left (Image Right)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* LIVE PREVIEW CANVAS (RESPONSIF & RAPI) */}
              <div className="flex-1 bg-black p-4 md:p-8 overflow-y-auto flex justify-center">
                <div className="w-full max-w-[1200px] bg-[#0a0a0a] border border-white/10 rounded-xl overflow-y-auto shadow-2xl flex flex-col h-[85vh]">
                  
                  {/* Browser Mockup Header */}
                  <div className="sticky top-0 z-50 h-10 bg-[#050505] border-b border-white/5 flex items-center px-4 gap-2 backdrop-blur-md">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div><div className="w-3 h-3 rounded-full bg-yellow-500/50"></div><div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    <div className="mx-auto px-4 py-1 rounded bg-white/5 text-[10px] font-mono text-gray-400"><MonitorPlay size={10} className="inline mr-1"/> preview.haridev.ai</div>
                  </div>

                  {/* PREVIEW: Navbar Component */}
                  <nav className="border-b border-white/5 px-6 md:px-12 py-5 flex justify-between items-center bg-[#0a0a0a]/80 backdrop-blur-md sticky top-10 z-40">
                    <div className="font-black text-2xl tracking-tighter cursor-pointer">Logo.</div>
                    <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
                      {activeSite.nav_links?.map((link, i) => <span key={i} className="hover:text-white cursor-pointer transition-colors">{link}</span>)}
                    </div>
                    <button className={`bg-gradient-to-r ${activeSite.theme_color} text-black px-5 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform`}>Login</button>
                  </nav>

                  {/* PREVIEW: Dynamic Layout Rendering */}
                  <div className="flex-1 bg-[#050505] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none"/>
                    
                    {/* Render Berdasarkan Layout Style */}
                    <div className={`py-24 px-6 md:px-12 mx-auto max-w-6xl relative z-10 flex ${activeSite.layout_style === 'split-left' ? 'flex-col md:flex-row text-left items-center gap-12' : 'flex-col text-center items-center'}`}>
                      
                      {/* Teks Hero */}
                      <motion.div key={activeSite.hero_title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`w-full ${activeSite.layout_style === 'split-left' ? 'md:w-1/2' : 'max-w-4xl'}`}>
                        <h1 className={`font-black tracking-tight leading-[1.1] mb-6 ${activeSite.layout_style === 'split-left' ? 'text-5xl md:text-6xl' : 'text-5xl md:text-7xl'}`}>
                          <span className={`text-transparent bg-clip-text bg-gradient-to-r ${activeSite.theme_color}`}>
                            {activeSite.hero_title}
                          </span>
                        </h1>
                        <p className={`text-gray-400 font-light mb-10 leading-relaxed ${activeSite.layout_style === 'split-left' ? 'text-lg' : 'text-xl md:text-2xl max-w-2xl mx-auto'}`}>
                          {activeSite.hero_subtitle}
                        </p>
                        <button className={`bg-gradient-to-r ${activeSite.theme_color} text-black font-black px-10 py-4 rounded-full hover:scale-105 transition-transform shadow-xl`}>
                          {activeSite.cta_text}
                        </button>
                      </motion.div>

                      {/* Mockup Gambar Khusus Split Left */}
                      {activeSite.layout_style === 'split-left' && (
                        <div className="w-full md:w-1/2 mt-10 md:mt-0">
                          <div className="aspect-[4/3] bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                             <ImageIcon className="text-white/20" size={64}/>
                             <div className={`absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl ${activeSite.theme_color} rounded-tl-full blur-[80px] opacity-30`} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PREVIEW: Features Grid Component */}
                  <div className="py-24 px-6 md:px-12 border-t border-white/5 bg-[#080808]">
                    <div className="max-w-6xl mx-auto">
                      <div className="text-center mb-16">
                        <h2 className="text-3xl font-black mb-4">Fitur Unggulan</h2>
                        <p className="text-gray-500">Kenapa Anda harus memilih platform ini.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {activeSite.features_data?.map((feat, i) => (
                          <div key={i} className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl text-left hover:bg-white/[0.05] transition-colors">
                              <div className={`w-12 h-12 rounded-xl mb-6 flex items-center justify-center bg-gradient-to-br ${activeSite.theme_color}`}>
                                <Layout className="text-black" size={20}/>
                              </div>
                              <h4 className="font-bold text-xl mb-3 text-white">{feat.title}</h4>
                              <p className="text-gray-400 leading-relaxed text-sm">{feat.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        )}

      </main>
    </div>
  );
}