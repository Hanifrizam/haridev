'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Mail, Lock, User, Phone, Calendar, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../lib/supabase'; // Memanggil koneksi Supabase
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'warning' } | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');

  // --- LOGIKA SIGN UP (DAFTAR) ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Mendaftarkan user ke Supabase Auth + mengirimkan data diri
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phone,
            birth_date: birthDate,
          }
        }
      });

      if (error) throw error;

      setMessage({ 
        text: 'Pendaftaran berhasil! Akun Anda sedang direview oleh Admin. Harap tunggu persetujuan sebelum bisa login.', 
        type: 'success' 
      });
      
      // Reset form & kembali ke mode login
      setEmail(''); setPassword(''); setFullName(''); setPhone(''); setBirthDate('');
      setTimeout(() => {
        setIsLoginView(true);
        setMessage(null);
      }, 5000);

    } catch (error: any) {
      setMessage({ text: error.message || 'Terjadi kesalahan saat mendaftar.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIKA SIGN IN (MASUK) ---
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // 1. Coba login via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      // 2. Jika email & password benar, CEK STATUS di tabel profiles
      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', authData.user.id)
          .single();

        if (profileError) throw profileError;

        // 3. Logika Pengecekan Status Approval Admin
        if (profile.status === 'pending') {
          await supabase.auth.signOut(); // Paksa keluar jika belum di-approve
          throw new Error('Akun Anda masih dalam antrean review oleh Admin. Harap bersabar.');
        } else if (profile.status === 'rejected') {
          await supabase.auth.signOut();
          throw new Error('Maaf, pengajuan akun Anda ditolak oleh Admin.');
        } else if (profile.status === 'approved') {
          // SUKSES! Arahkan khusus ke Dashboard User
          setMessage({ text: 'Login berhasil! Mengarahkan ke Dashboard...', type: 'success' });
          setTimeout(() => {
             router.push('/dashboard');
          }, 1000);
        }
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Login gagal. Periksa kembali email dan password Anda.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Tombol Back ke Home */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 hover:scale-105 transition-transform z-50">
        <span className="bg-gradient-to-r from-blue-600 to-cyan-400 px-2 py-1 text-sm font-black tracking-tighter uppercase">HARI</span>
        <span className="bg-white text-black px-2 py-1 text-sm font-black tracking-tighter">Dev.I</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <Terminal size={40} className="text-cyan-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black">{isLoginView ? 'Welcome Back.' : 'Request Access.'}</h2>
          <p className="text-gray-500 text-sm mt-2">
            {isLoginView ? 'Login ke HARI DEV Workspace Anda.' : 'Kirim data diri untuk di-review oleh Admin.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {message && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`p-4 rounded-xl mb-6 text-sm flex items-start gap-3 border ${
                message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                message.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                'bg-green-500/10 border-green-500/20 text-green-400'
              }`}
            >
              {message.type === 'error' ? <AlertCircle size={18} className="shrink-0"/> : <CheckCircle2 size={18} className="shrink-0"/>}
              <p>{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={isLoginView ? handleSignIn : handleSignUp} className="space-y-4">
          
          {/* Fieds yang HANYA muncul saat Sign Up (Request Access) */}
          {!isLoginView && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 overflow-hidden">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input required value={fullName} onChange={e => setFullName(e.target.value)} type="text" placeholder="Nama Lengkap" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-cyan-500 transition-colors" />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input required value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="Nomor WhatsApp / HP" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-cyan-500 transition-colors" />
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input required value={birthDate} onChange={e => setBirthDate(e.target.value)} type="date" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-cyan-500 transition-colors text-gray-300" />
              </div>
            </motion.div>
          )}

          {/* Fields Umum (Email & Password) */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input required value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email Address" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-cyan-500 transition-colors" />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input required value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-cyan-500 transition-colors" />
          </div>

          <button disabled={isLoading} type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-4 rounded-xl mt-6 flex items-center justify-center gap-2 transition-all disabled:opacity-50">
            {isLoading ? 'Processing...' : (isLoginView ? 'SIGN IN' : 'SUBMIT REQUEST')}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          {isLoginView ? "Belum punya akses?" : "Sudah mengajukan akses?"}{" "}
          <button type="button" onClick={() => { setIsLoginView(!isLoginView); setMessage(null); }} className="text-cyan-400 font-bold hover:underline">
            {isLoginView ? 'Request Akun' : 'Sign In di sini'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}