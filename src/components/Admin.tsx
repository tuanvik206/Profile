import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { normalizeSiteInfo } from '../lib/security';
import { SiteInfo } from '../types';
import { Save, Loader2, AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';

export default function Admin() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [info, setInfo] = useState<SiteInfo>({
    name: '',
    avatar_url: '',
    project_link: '',
    education_school: '',
    education_major: '',
    education_years: '',
    facebook_url: '',
    instagram_url: '',
    github_url: '',
    email: '',
    location_name: '',
    location_coordinates: '',
    est_label: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    if (supabase) {
      setConfigured(true);

      const clearExistingSession = async () => {
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.warn('Failed to clear existing admin session:', err);
        }
        setSession(null);
        setLoading(false);
      };

      void clearExistingSession();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setSession(session);
          void supabase.auth.signOut();
          setSession(null);
        } else {
          setSession(null);
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setAuthLoading(true);
    setAuthError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message || 'Lỗi đăng nhập');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const fetchInfo = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase.from('site_info').select('*').single();
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching site info:", error.message || error);
      }
      if (data) setInfo(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInfo({ ...info, [name]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setStatus({ type: null, message: '' });

    try {
      const { data: existingData } = await supabase.from('site_info').select('id').single();

      const safeInfo = normalizeSiteInfo(info) as SiteInfo;
      const { id, ...updatePayload } = safeInfo as any;

      let error;
      if (existingData) {
        // Update
        const { error: updateError } = await supabase
          .from('site_info')
          .update(updatePayload)
          .eq('id', existingData.id);
        error = updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('site_info')
          .insert([updatePayload]);
        error = insertError;
      }

      if (error) throw error;

      setStatus({ type: 'success', message: 'Cập nhật thành công!' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Lỗi khi lưu dữ liệu' });
    } finally {
      setSaving(false);
    }
  };

  if (!configured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black text-white font-sans">
        <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-lg text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-4">Chưa cấu hình Supabase</h1>
          <p className="text-sm text-gray-400 mb-6">
            Vui lòng thêm biến môi trường <code className="bg-black px-1 py-0.5 text-amber-500">VITE_SUPABASE_URL</code> và <code className="bg-black px-1 py-0.5 text-amber-500">VITE_SUPABASE_ANON_KEY</code> vào file <code className="bg-black px-1 py-0.5">.env.example</code> và thiết lập qua giao diện quản lý.
          </p>
          <div className="text-left text-xs text-gray-500 bg-black/50 p-4 rounded mb-6">
            <p className="font-bold mb-2">Cấu trúc bảng site_info:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>id (int8, primary key)</li>
              <li>name (text)</li>
              <li>avatar_url (text)</li>
              <li>project_link (text)</li>
              <li>education_school (text)</li>
              <li>education_major (text)</li>
              <li>education_years (text)</li>
              <li>facebook_url (text)</li>
              <li>instagram_url (text)</li>
              <li>github_url (text)</li>
              <li>email (text)</li>
              <li>linkedin_url (text)</li>
              <li>twitter_url (text)</li>
              <li>youtube_url (text)</li>
              <li>tiktok_url (text)</li>
              <li>dribbble_url (text)</li>
              <li>behance_url (text)</li>
              <li>twitch_url (text)</li>
              <li>discord_url (text)</li>
            </ul>
          </div>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded text-sm">
            Trở về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505] text-white font-sans relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-md w-full bg-white/[0.02] backdrop-blur-xl border border-white/10 p-8 sm:p-12 relative z-10">
          <div className="mb-8 text-center">
            <p className="text-amber-500 text-[10px] sm:text-xs font-mono tracking-widest mb-4 uppercase">— QUẢN TRỊ VIÊN</p>
            <h1 className="text-3xl font-black font-display tracking-widest uppercase">
              ĐĂNG NHẬP <span className="text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.4)" }}>HỆ THỐNG</span>
            </h1>
          </div>

          <div className="mb-6 rounded border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[11px] font-mono tracking-[0.2em] text-amber-400 uppercase">
            Mỗi lần truy cập admin đều yêu cầu đăng nhập lại.
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Email</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700"
                placeholder="admin@example.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Mật khẩu</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <div className="p-4 text-xs font-mono tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex justify-center items-center gap-3 bg-white/5 hover:bg-amber-500 border border-white/10 hover:border-amber-500 text-white hover:text-black p-4 font-mono text-xs tracking-[0.2em] uppercase transition-all duration-300 disabled:opacity-50 mt-8 group"
            >
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>XÁC NHẬN</span>
              <div className="w-4 h-[1px] bg-white group-hover:bg-black transition-colors"></div>
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-white/10">
            <button onClick={() => navigate('/')} className="text-[10px] font-mono tracking-widest text-gray-500 hover:text-amber-500 uppercase transition-colors">
              &larr; TRỞ VỀ TRANG CHỦ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8 md:p-12 font-sans relative overflow-x-hidden">
      {/* Background Accents */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-12">
          <div>
            <p className="text-amber-500 text-[10px] sm:text-xs font-mono tracking-widest mb-4 uppercase">— QUẢN TRỊ VIÊN</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-widest uppercase">
              CẬP NHẬT <span className="text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.4)" }}>THÔNG TIN</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 border border-white/10 bg-white/[0.02] p-2 backdrop-blur-sm">
            <button onClick={() => navigate('/')} className="px-4 py-2 text-[10px] font-mono tracking-widest text-gray-400 hover:text-amber-500 uppercase transition-colors">
              TRANG CHỦ
            </button>
            <div className="w-[1px] h-4 bg-white/20"></div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-[10px] font-mono tracking-widest text-gray-400 hover:text-red-500 uppercase transition-colors">
              <LogOut className="w-3 h-3" />
              <span>ĐĂNG XUẤT</span>
            </button>
          </div>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 p-6 sm:p-10 relative">
          {/* Decorative Corner Elements */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-500"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-amber-500"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-500"></div>

          <form onSubmit={handleSave} className="space-y-12">

            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-[10px] font-mono tracking-widest text-amber-500">01.</div>
                <h2 className="text-sm font-bold font-mono tracking-widest uppercase">CÁ NHÂN</h2>
                <div className="flex-1 h-[1px] bg-white/10"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Họ và tên</label>
                  <input type="text" name="name" value={info.name || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="VD: ANH TUẤN" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Link Avatar</label>
                  <input type="text" name="avatar_url" value={info.avatar_url || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="URL hình ảnh" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Tỉnh / Địa điểm</label>
                  <input type="text" name="location_name" value={info.location_name || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="Ví dụ: Việt Nam" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Tọa độ</label>
                  <input type="text" name="location_coordinates" value={info.location_coordinates || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="Ví dụ: 14.0583° N, 108.2772° E" />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">EST</label>
                  <input type="text" name="est_label" value={info.est_label || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="Ví dụ: EST. 2026" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-[10px] font-mono tracking-widest text-amber-500">02.</div>
                <h2 className="text-sm font-bold font-mono tracking-widest uppercase">HỌC VẤN & DỰ ÁN</h2>
                <div className="flex-1 h-[1px] bg-white/10"></div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Link Dự án nổi bật (CV PDF)</label>
                <input type="text" name="project_link" value={info.project_link || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2 md:col-span-3 lg:col-span-1">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Trường học</label>
                  <input type="text" name="education_school" value={info.education_school || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="Đại học ABC" />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-1">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Chuyên ngành</label>
                  <input type="text" name="education_major" value={info.education_major || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="Công nghệ thông tin" />
                </div>
                <div className="flex flex-col gap-2 lg:col-span-1">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Niên khóa</label>
                  <input type="text" name="education_years" value={info.education_years || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="2024 - 2028" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-[10px] font-mono tracking-widest text-amber-500">03.</div>
                <h2 className="text-sm font-bold font-mono tracking-widest uppercase">MẠNG XÃ HỘI</h2>
                <div className="flex-1 h-[1px] bg-white/10"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Facebook</label>
                  <input type="text" name="facebook_url" value={info.facebook_url || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="URL Facebook" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Instagram</label>
                  <input type="text" name="instagram_url" value={info.instagram_url || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="URL Instagram" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">GitHub</label>
                  <input type="text" name="github_url" value={info.github_url || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="URL GitHub" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Email</label>
                  <input type="email" name="email" value={info.email || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="email@example.com" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">LinkedIn</label>
                  <input type="text" name="linkedin_url" value={info.linkedin_url || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="URL LinkedIn" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Twitter/X</label>
                  <input type="text" name="twitter_url" value={info.twitter_url || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="URL Twitter" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">YouTube</label>
                  <input type="text" name="youtube_url" value={info.youtube_url || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="URL YouTube" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">TikTok</label>
                  <input type="text" name="tiktok_url" value={info.tiktok_url || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="URL TikTok" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Dribbble</label>
                  <input type="text" name="dribbble_url" value={info.dribbble_url || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="URL Dribbble" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Behance</label>
                  <input type="text" name="behance_url" value={info.behance_url || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="URL Behance" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Twitch</label>
                  <input type="text" name="twitch_url" value={info.twitch_url || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="URL Twitch" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Discord</label>
                  <input type="text" name="discord_url" value={info.discord_url || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="URL Discord" />
                </div>
              </div>
            </div>

            <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="w-full sm:w-auto">
                {status.type === 'success' && (
                  <div className="flex items-center gap-3 text-green-500 text-xs font-mono tracking-widest bg-green-500/10 px-4 py-2 border border-green-500/20">
                    <CheckCircle className="w-4 h-4" />
                    <span>{status.message}</span>
                  </div>
                )}
                {status.type === 'error' && (
                  <div className="flex items-center gap-3 text-red-500 text-xs font-mono tracking-widest bg-red-500/10 px-4 py-2 border border-red-500/20">
                    <AlertCircle className="w-4 h-4" />
                    <span>{status.message}</span>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/5 hover:bg-amber-500 border border-white/10 hover:border-amber-500 text-white hover:text-black px-8 py-4 font-mono text-xs tracking-[0.2em] uppercase transition-all duration-300 disabled:opacity-50 group"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>LƯU THAY ĐỔI</span>
                <div className="w-4 h-[1px] bg-white group-hover:bg-black transition-colors"></div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
