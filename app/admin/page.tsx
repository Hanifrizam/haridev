'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, PanelTop, Users, 
  Settings, Plus, Trash2, Save, Eye, 
  Terminal, Bell, Search, Menu, X, CheckCircle2, ChevronRight, LayoutTemplate,
  Check, XCircle, RefreshCcw, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// --- Tipe Data ---
type TabType = 'hero' | 'portfolio';
type PortfolioItem = { id: number; title: string; type: string; color: string; status: 'Published' | 'Draft' };
type UserProfile = { id: string; email: string; full_name: string; phone_number: string; birth_date: string; status: 'pending' | 'approved' | 'rejected'; created_at: string };

export default function AdminDashboard() {
  // --- States Umum ---
  const [activeMenu, setActiveMenu] = useState('landing-page');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotification, setShowNotification] = useState<{show: boolean, msg: string, type: 'success'|'error'}>({show: false, msg: '', type: 'success'});

  // --- States User Database ---
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // --- States Landing Page CMS ---
  const [activeTab, setActiveTab] = useState<TabType>('hero');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCMS, setIsLoadingCMS] = useState(true);
  
  // Data Hero (Teks Landing Page)
  const [heroData, setHeroData] = useState({
    badge_text: '',
    title_line1: '',
    title_line2: '',
    description: ''
  });

  // Data Portfolio
  const [portfolioList, setPortfolioList] = useState<PortfolioItem[]>([]);
  const [newPortfolio, setNewPortfolio] = useState({ title: '', type: '' });

  // --- HANDLERS & FETCHERS ---
  const triggerNotification = (msg: string, type: 'success'|'error' = 'success') => {
    setShowNotification({ show: true, msg, type });
    setTimeout(() => setShowNotification({ show: false, msg: '', type: 'success' }), 3000);
  };

  // 1. Fetch Users
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!error && data) setUserList(data);
    setIsLoadingUsers(false);
  };

  // 2. Fetch Data CMS (Hero & Portfolio)
  const fetchCMSData = async () => {
    setIsLoadingCMS(true);
    // Fetch Hero
    const { data: hero } = await supabase.from('landing_page_content').select('*').eq('id', 1).single();
    if (hero) setHeroData(hero);

    // Fetch Portfolios
    const { data: ports } = await supabase.from('portfolios').select('*').order('id', { ascending: true });
    if (ports) setPortfolioList(ports);
    
    setIsLoadingCMS(false);
  };

  // 3. Update User Status
  const handleUpdateUserStatus = async (userId: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
    if (error) triggerNotification(error.message, 'error');
    else { triggerNotification(`User berhasil di-${newStatus}!`); fetchUsers(); }
  };

  // 4. Save Hero Content
  const handleSaveHero = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('landing_page_content').update(heroData).eq('id', 1);
    setIsSaving(false);
    if (error) triggerNotification("Gagal menyimpan data!", 'error');
    else triggerNotification("Teks Landing Page berhasil diperbarui!");
  };

  // 5. Portfolio Actions
  const handleAddPortfolio = async () => {
    if (!newPortfolio.title || !newPortfolio.type) return alert('Isi nama dan kategori!');
    const { error } = await supabase.from('portfolios').insert([{ 
      title: newPortfolio.title, type: newPortfolio.type, status: 'Draft', color: 'from-blue-500/20' 
    }]);
    if (!error) {
      triggerNotification("Portfolio ditambahkan!");
      setNewPortfolio({ title: '', type: '' });
      fetchCMSData();
    }
  };

  const handleDeletePortfolio = async (id: number) => {
    const { error } = await supabase.from('portfolios').delete().eq('id', id);
    if (!error) { triggerNotification("Portfolio dihapus!"); fetchCMSData(); }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Published' ? 'Draft' : 'Published';
    await supabase.from('portfolios').update({ status: newStatus }).eq('id', id);
    fetchCMSData();
  };

  // Effect Trigger
  useEffect(() => {
    if (activeMenu === 'users') fetchUsers();
    if (activeMenu === 'landing-page') fetchCMSData();
  }, [activeMenu]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex overflow-hidden selection:bg-cyan-500/30">
      
      {/* NOTIFICATION */}
      <AnimatePresence>
        {showNotification.show && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-xl backdrop-blur-xl flex items-center gap-3 shadow-2xl border ${
              showNotification.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
            }`}
          >
            {showNotification.type === 'error' ? <XCircle size={20}/> : <CheckCircle2 size={20} />}
            <p className="font-mono text-sm">{showNotification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] border-r border-white/5 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 flex flex-col`}>
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
             <span className="bg-gradient-to-r from-blue-600 to-cyan-400 px-2 py-1 text-sm font-black uppercase">HARI</span>
             <span className="bg-white text-black px-2 py-1 text-sm font-black uppercase">Admin</span>
          </div>
          <button className="md:hidden text-gray-500" onClick={() => setIsMobileMenuOpen(false)}><X size={20}/></button>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2 font-mono text-sm">
          <p className="px-4 text-[10px] text-gray-500 font-bold mb-4 tracking-widest">MAIN MENU</p>
          {[
            { id: 'dashboard', icon: <LayoutDashboard size={18}/>, label: 'Dashboard Overview' },
            { id: 'users', icon: <Users size={18}/>, label: 'User Database (SSO)' },
            { id: 'landing-page', icon: <PanelTop size={18}/>, label: 'Landing Page CMS' },
          ].map((item) => (
            <button key={item.id} onClick={() => { setActiveMenu(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeMenu === item.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#020202]">
        
        {/* HEADER */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-gray-400" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24}/></button>
            <div className="hidden md:flex items-center gap-2 text-sm font-mono text-gray-500">
              <span>Admin</span> <ChevronRight size={14}/> <span className="text-cyan-400 capitalize">{activeMenu.replace('-', ' ')}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <a href="/" target="_blank" className="hidden md:flex items-center gap-2 text-xs font-bold bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-colors">
               <Eye size={14}/> View Live Site
             </a>
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 p-[2px]">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-xs font-bold">AD</div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {/* ===================================== */}
          {/* VIEW: USER DATABASE (SAMA SEPERTI SEBELUMNYA) */}
          {/* ===================================== */}
          {activeMenu === 'users' && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
               <div className="flex justify-between items-end mb-8">
                <div>
                  <h1 className="text-3xl font-black mb-2 flex items-center gap-3"><Users className="text-cyan-400"/> User Database</h1>
                  <p className="text-gray-400 text-sm">Review pendaftaran user baru.</p>
                </div>
                <button onClick={fetchUsers} className="px-4 py-2 bg-white/5 rounded-lg text-sm flex items-center gap-2 hover:bg-white/10">
                  <RefreshCcw size={16} className={isLoadingUsers ? 'animate-spin' : ''}/> Refresh
                </button>
              </div>

              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-sm font-mono text-gray-400">
                      <th className="p-5 font-normal">Nama Lengkap</th>
                      <th className="p-5 font-normal">Email</th>
                      <th className="p-5 font-normal text-center">Status</th>
                      <th className="p-5 font-normal text-center">Aksi Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userList.map((user) => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-5 font-bold">{user.full_name || 'N/A'}</td>
                        <td className="p-5 text-gray-400 text-sm">{user.email}</td>
                        <td className="p-5 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            user.status === 'approved' ? 'bg-green-500/10 text-green-400' : 
                            user.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400 animate-pulse'
                          }`}>{user.status}</span>
                        </td>
                        <td className="p-5 text-center">
                          {user.status === 'pending' ? (
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleUpdateUserStatus(user.id, 'approved')} className="px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-black font-bold rounded text-xs">Approve</button>
                              <button onClick={() => handleUpdateUserStatus(user.id, 'rejected')} className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-black font-bold rounded text-xs">Reject</button>
                            </div>
                          ) : <span className="text-xs text-gray-600">SELESAI</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
             </motion.div>
          )}

          {/* ===================================== */}
          {/* VIEW: LANDING PAGE CMS (LIVE DATABASE) */}
          {/* ===================================== */}
          {activeMenu === 'landing-page' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-black mb-2 flex items-center gap-3"><LayoutTemplate className="text-cyan-400"/> Landing Page Editor</h1>
                  <p className="text-gray-400 text-sm">Data di bawah ini terhubung langsung ke Database Supabase.</p>
                </div>
              </div>

              {isLoadingCMS ? (
                <div className="h-64 flex items-center justify-center text-cyan-400"><Loader2 className="animate-spin" size={40}/></div>
              ) : (
                <>
                  {/* TABS */}
                  <div className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto pb-2">
                    <button onClick={() => setActiveTab('hero')} className={`px-6 py-3 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'hero' ? 'bg-white/10 text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>Hero Section</button>
                    <button onClick={() => setActiveTab('portfolio')} className={`px-6 py-3 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'portfolio' ? 'bg-white/10 text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>Portfolio Manager</button>
                  </div>

                  {/* TAB: HERO */}
                  {activeTab === 'hero' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-2xl">
                      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                        <h3 className="text-xl font-bold">Teks Utama Landing Page</h3>
                        <button onClick={handleSaveHero} disabled={isSaving} className="px-5 py-2 bg-cyan-500 text-black rounded-lg text-sm font-black flex items-center gap-2 hover:bg-cyan-400">
                          {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} {isSaving ? 'Menyimpan...' : 'Simpan Teks'}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2 font-mono">Badge Text</label>
                          <input value={heroData.badge_text} onChange={(e) => setHeroData({...heroData, badge_text: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-4 outline-none focus:border-cyan-500" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2 font-mono">Headline 1</label>
                            <input value={heroData.title_line1} onChange={(e) => setHeroData({...heroData, title_line1: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-4 outline-none focus:border-cyan-500 font-black uppercase" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2 font-mono">Headline 2 (Highlight)</label>
                            <input value={heroData.title_line2} onChange={(e) => setHeroData({...heroData, title_line2: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-4 outline-none focus:border-cyan-500 font-black uppercase text-gray-400" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2 font-mono">Deskripsi Lengkap</label>
                          <textarea rows={3} value={heroData.description} onChange={(e) => setHeroData({...heroData, description: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-4 outline-none focus:border-cyan-500 leading-relaxed" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB: PORTFOLIO */}
                  {activeTab === 'portfolio' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      
                      {/* ADD NEW PORTFOLIO FORM */}
                      <div className="bg-cyan-500/10 border border-cyan-500/20 p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                          <label className="block text-xs text-cyan-400 mb-1 font-mono">Nama Project</label>
                          <input value={newPortfolio.title} onChange={e => setNewPortfolio({...newPortfolio, title: e.target.value})} placeholder="Cth: Zenith Studio" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 outline-none focus:border-cyan-500 text-sm" />
                        </div>
                        <div className="flex-1 w-full">
                          <label className="block text-xs text-cyan-400 mb-1 font-mono">Kategori Industri</label>
                          <input value={newPortfolio.type} onChange={e => setNewPortfolio({...newPortfolio, type: e.target.value})} placeholder="Cth: SaaS / Fintech" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 outline-none focus:border-cyan-500 text-sm" />
                        </div>
                        <button onClick={handleAddPortfolio} className="px-6 py-3 h-[46px] bg-cyan-500 text-black font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-cyan-400 w-full md:w-auto">
                          <Plus size={18}/> Tambah Baru
                        </button>
                      </div>

                      {/* PORTFOLIO TABLE */}
                      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/5 text-sm font-mono text-gray-400">
                              <th className="p-4 font-normal">Project</th>
                              <th className="p-4 font-normal">Kategori</th>
                              <th className="p-4 font-normal text-center">Status</th>
                              <th className="p-4 font-normal text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {portfolioList.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">Belum ada portofolio.</td></tr>}
                            {portfolioList.map((item) => (
                              <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                <td className="p-4 font-bold">{item.title}</td>
                                <td className="p-4 text-sm text-gray-400">{item.type}</td>
                                <td className="p-4 text-center">
                                  <button onClick={() => handleToggleStatus(item.id, item.status)} className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${item.status === 'Published' ? 'bg-green-500/10 text-green-400 hover:bg-red-500/20 hover:text-red-400' : 'bg-yellow-500/10 text-yellow-400 hover:bg-green-500/20 hover:text-green-400'}`} title="Klik untuk mengubah status">
                                    {item.status}
                                  </button>
                                </td>
                                <td className="p-4 flex justify-end gap-2">
                                  <button onClick={() => handleDeletePortfolio(item.id)} className="p-2 bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20"><Trash2 size={16}/></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}

                </>
              )}
            </motion.div>
          )}

          {/* DASHBOARD DUMMY */}
          {activeMenu === 'dashboard' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <h1 className="text-3xl font-black mb-8">System Overview</h1>
               <p className="text-gray-500 font-mono">Ini adalah area statistik yang akan dikembangkan selanjutnya.</p>
             </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}