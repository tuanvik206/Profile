import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SiteInfo } from '../types';
import { Save, Loader2, AlertCircle, CheckCircle, LogOut, User, Eye, Trash2, Globe, Laptop, RefreshCw, Upload } from 'lucide-react';

const parseUserAgent = (ua: string) => {
  if (!ua) return 'Unknown';
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';

  return `${os} / ${browser}`;
};
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { useLanguage } from '../contexts/LanguageContext';

export default function Admin() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authAttempts, setAuthAttempts] = useState(0);
  const [authLockUntil, setAuthLockUntil] = useState<number | null>(null);
  const [uploadingField, setUploadingField] = useState<'avatar' | 'logo' | null>(null);

  const [info, setInfo] = useState<SiteInfo>({
    name: '',
    avatar_url: '',
    project_link: '',
    education_school: '',
    education_logo: '',
    education_desc: '',
    education_major: '',
    education_years: '',
    education_school_en: '',
    education_major_en: '',
    education_years_en: '',
    education_desc_en: '',
    facebook_url: '',
    instagram_url: '',
    github_url: '',
    email: '',
  });
  const [activeAdminTab, setActiveAdminTab] = useState<'info' | 'visitors'>('info');
  const [visitorLogs, setVisitorLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'online'>('all');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [visitorStats, setVisitorStats] = useState<{ onlineCount: number; totalViews: number; totalVisitors: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [configured, setConfigured] = useState(false);



  useEffect(() => {
    if (supabase) {
      setConfigured(true);

      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) fetchInfo();
        else setLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session) fetchInfo();
        else setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeAdminTab === 'visitors' && session) {
      fetchVisitorLogs();
    }
  }, [activeAdminTab, session]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    // Rate limiting: block sau 3 lần thất bại
    if (authLockUntil && Date.now() < authLockUntil) {
      const remaining = Math.ceil((authLockUntil - Date.now()) / 1000);
      setAuthError(`Quá nhiều lần thử. Vui lòng đợi ${remaining}s.`);
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) throw error;
      setAuthAttempts(0);
      setAuthLockUntil(null);
    } catch (err: any) {
      const newAttempts = authAttempts + 1;
      setAuthAttempts(newAttempts);
      if (newAttempts >= 3) {
        setAuthLockUntil(Date.now() + 60_000); // khoá 60 giây
        setAuthError('Quá 3 lần thất bại. Tài khoản bị khoá 60 giây.');
      } else {
        setAuthError(`${err.message || 'Lỗi đăng nhập'} (${newAttempts}/3 lần)`);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const fetchVisitorLogs = async () => {
    if (!supabase) return;
    setLogsLoading(true);
    setCurrentPage(1);
    try {
      const { data, error } = await supabase
        .from('visitor_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setVisitorLogs(data || []);

      const { data: statsData, error: statsError } = await supabase.rpc('get_visitor_stats');
      if (!statsError && statsData && statsData.length > 0) {
        const s = statsData[0];
        setVisitorStats({
          onlineCount: Number(s.online_count || 0),
          totalViews: Number(s.total_views || 0),
          totalVisitors: Number(s.total_visitors || 0)
        });
      }
    } catch (err: any) {
      console.error('Error fetching visitor logs:', err.message);
      setLogsError(err.message || 'Lỗi không xác định khi tải dữ liệu');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!supabase) return;
    if (!window.confirm(t('clear_logs_confirm'))) return;

    try {
      const { error } = await supabase
        .from('visitor_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      
      setStatus({ type: 'success', message: 'Clear logs success!' });
      setVisitorLogs([]);
      setCurrentPage(1);
      setVisitorStats({ onlineCount: 0, totalViews: 0, totalVisitors: 0 });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to clear logs' });
    }
  };

  const fetchInfo = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase.from('site_info').select('*').single();
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching site info:", error.message || error);
      }
      if (data) {
        const { favorite_games, valorant_profile, ...restInfo } = data;

        // Fallback for fields that might not exist in Supabase yet
        if (!restInfo.education_logo && localStorage.getItem('education_logo')) {
          restInfo.education_logo = localStorage.getItem('education_logo');
        }
        if (!restInfo.education_desc && localStorage.getItem('education_desc')) {
          restInfo.education_desc = localStorage.getItem('education_desc');
        }
        if (!restInfo.education_school_en && localStorage.getItem('education_school_en')) {
          restInfo.education_school_en = localStorage.getItem('education_school_en');
        }
        if (!restInfo.education_major_en && localStorage.getItem('education_major_en')) {
          restInfo.education_major_en = localStorage.getItem('education_major_en');
        }
        if (!restInfo.education_years_en && localStorage.getItem('education_years_en')) {
          restInfo.education_years_en = localStorage.getItem('education_years_en');
        }
        if (!restInfo.education_desc_en && localStorage.getItem('education_desc_en')) {
          restInfo.education_desc_en = localStorage.getItem('education_desc_en');
        }

        setInfo(restInfo);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInfo({ ...info, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar_url' | 'education_logo') => {
    if (!supabase) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Dung lượng ảnh phải nhỏ hơn 5MB.");
      return;
    }

    const fieldKey = field === 'avatar_url' ? 'avatar' : 'logo';
    setUploadingField(fieldKey);
    setStatus({ type: null, message: '' });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-assets')
        .getPublicUrl(filePath);

      setInfo(prev => ({ ...prev, [field]: publicUrl }));
      setStatus({ type: 'success', message: 'Tải ảnh lên thành công!' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setStatus({ type: 'error', message: err.message || 'Lỗi khi tải ảnh lên' });
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  const getLast7DaysStats = () => {
    const statsMap: { [key: string]: { views: number; unique: number } } = {};
    const days: string[] = [];
    const dateLabels: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      statsMap[key] = { views: 0, unique: 0 };
      days.push(key);
      dateLabels.push(label);
    }

    const uniquePerDay: { [key: string]: Set<string> } = {};
    days.forEach(day => {
      uniquePerDay[day] = new Set<string>();
    });

    visitorLogs.forEach((log: any) => {
      if (!log.created_at) return;
      const logDate = new Date(log.created_at).toISOString().split('T')[0];
      if (statsMap[logDate]) {
        statsMap[logDate].views += 1;
        if (log.session_id) {
          uniquePerDay[logDate].add(log.session_id);
        }
      }
    });

    days.forEach(day => {
      statsMap[day].unique = uniquePerDay[day].size;
    });

    return {
      days,
      dateLabels,
      viewsData: days.map(day => statsMap[day].views),
      uniqueData: days.map(day => statsMap[day].unique)
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setStatus({ type: null, message: '' });

    try {
      const { data: existingData } = await supabase.from('site_info').select('id').single();

      // Remove id, valorant_profile and favorite_games from the payload
      const { id, valorant_profile, favorite_games, ...restPayload } = info as any;
      const updatePayload = {
        ...restPayload
      };

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

      if (error && error.code === 'PGRST204') {
        console.warn("Some columns don't exist in 'site_info'. Falling back to saving without them.");
        const {
          project_name,
          education_logo,
          education_desc,
          education_school_en,
          education_major_en,
          education_years_en,
          education_desc_en,
          est_year,
          coordinates,
          location_text,
          ...fallbackPayload
        } = updatePayload;

        let fallbackError;
        if (existingData) {
          const { error: e1 } = await supabase.from('site_info').update(fallbackPayload).eq('id', existingData.id);
          fallbackError = e1;
        } else {
          const { error: e2 } = await supabase.from('site_info').insert([fallbackPayload]);
          fallbackError = e2;
        }
        if (fallbackError) throw fallbackError;

        setStatus({ type: 'error', message: 'Lưu cơ bản. Tạo thêm cột: project_name, education_logo, education_desc, est_year, coordinates, location_text (TEXT) trên Supabase!' });
        localStorage.setItem('education_logo', education_logo || '');
        localStorage.setItem('education_desc', education_desc || '');
        localStorage.setItem('education_school_en', education_school_en || '');
        localStorage.setItem('education_major_en', education_major_en || '');
        localStorage.setItem('education_years_en', education_years_en || '');
        localStorage.setItem('education_desc_en', education_desc_en || '');
        localStorage.setItem('est_year', est_year || '');
        localStorage.setItem('coordinates', coordinates || '');
        localStorage.setItem('location_text', location_text || '');
        setSaving(false);
        return;
      }

      if (error) throw error;

      // Also save to localStorage as backup
      localStorage.setItem('education_logo', info.education_logo || '');
      localStorage.setItem('education_desc', info.education_desc || '');
      localStorage.setItem('education_school_en', info.education_school_en || '');
      localStorage.setItem('education_major_en', info.education_major_en || '');
      localStorage.setItem('education_years_en', info.education_years_en || '');
      localStorage.setItem('education_desc_en', info.education_desc_en || '');
      localStorage.setItem('est_year', info.est_year || '');
      localStorage.setItem('coordinates', info.coordinates || '');
      localStorage.setItem('location_text', info.location_text || '');

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
              <li>project_name (text)</li>
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

  const filteredLogs = visitorLogs.filter((log: any) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      (log.ip && log.ip.toLowerCase().includes(query)) ||
      (log.city && log.city.toLowerCase().includes(query)) ||
      (log.country && log.country.toLowerCase().includes(query));

    const isOnline = new Date().getTime() - new Date(log.last_active_at).getTime() < 35000;
    const matchesFilter = logFilter === 'all' || (logFilter === 'online' && isOnline);

    return matchesSearch && matchesFilter;
  });

  const LOGS_PER_PAGE = 15;
  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + LOGS_PER_PAGE);

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
          <div className="flex items-center gap-2 sm:gap-4 border border-white/10 bg-white/[0.02] p-1.5 xs:p-2 backdrop-blur-sm self-start sm:self-auto">
            <button onClick={() => navigate('/')} className="px-2 xs:px-4 py-1.5 xs:py-2 text-[9px] xs:text-[10px] font-mono tracking-widest text-gray-400 hover:text-amber-500 uppercase transition-colors">
              TRANG CHỦ
            </button>
            <div className="w-[1px] h-4 bg-white/20"></div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 xs:gap-2 px-2 xs:px-4 py-1.5 xs:py-2 text-[9px] xs:text-[10px] font-mono tracking-widest text-gray-400 hover:text-red-500 uppercase transition-colors">
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

          {/* Custom Tabs Navigation */}
          <div className="flex border-b border-white/10 mb-8 -mx-6 sm:-mx-10 px-6 sm:px-10 gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveAdminTab('info')}
              className={`flex items-center gap-2 px-6 py-4 font-mono text-[11px] tracking-widest uppercase transition-all duration-300 border-b-2 -mb-[1px] whitespace-nowrap ${activeAdminTab === 'info'
                ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
            >
              <User className="w-4 h-4" />
              <span>{t('general_info')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab('visitors')}
              className={`flex items-center gap-2 px-6 py-4 font-mono text-[11px] tracking-widest uppercase transition-all duration-300 border-b-2 -mb-[1px] whitespace-nowrap ${activeAdminTab === 'visitors'
                ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
            >
              <Eye className="w-4 h-4" />
              <span>{t('visitor_tracking')}</span>
            </button>
          </div>

          <div className="relative min-h-[600px]">
            <form onSubmit={handleSave} className={`space-y-12 ${activeAdminTab === 'info' ? 'block' : 'hidden'}`}>
              <div className="space-y-12">

                <div className={activeAdminTab === 'info' ? 'block' : 'hidden'}>
                  <div className="space-y-12">
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
                          <div className="flex gap-2">
                            <input
                              type="text"
                              name="avatar_url"
                              value={info.avatar_url || ''}
                              onChange={handleChange}
                              className="flex-1 bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700"
                              placeholder="URL hình ảnh"
                            />
                            <label className="flex items-center gap-2 px-4 bg-white/5 border border-white/10 hover:border-amber-500 hover:bg-amber-500/5 text-xs text-gray-400 hover:text-white cursor-pointer transition-all duration-300 select-none">
                              {uploadingField === 'avatar' ? (
                                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                              <span>{uploadingField === 'avatar' ? 'Đang tải...' : 'Tải lên'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'avatar_url')}
                                className="hidden"
                                disabled={uploadingField !== null}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">EST. (Năm thành lập)</label>
                          <input type="text" name="est_year" value={info.est_year || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="VD: 2026" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Tọa độ</label>
                          <input type="text" name="coordinates" value={info.coordinates || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="VD: 14.0583° N, 108.2772° E" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Vị trí (VIỆT NAM / VIETNAM)</label>
                          <input type="text" name="location_text" value={info.location_text || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="VD: VIỆT NAM" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="text-[10px] font-mono tracking-widest text-amber-500">02.</div>
                        <h2 className="text-sm font-bold font-mono tracking-widest uppercase">{t('education_projects')}</h2>
                        <div className="flex-1 h-[1px] bg-white/10"></div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Tên Dự án nổi bật</label>
                        <input type="text" name="project_name" value={info.project_name || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="VD: Portfolio 2026" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Link Dự án nổi bật (CV PDF)</label>
                        <input type="text" name="project_link" value={info.project_link || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="https://..." />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2 md:col-span-3 lg:col-span-1">
                          <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Trường học (VI)</label>
                          <input type="text" name="education_school" value={info.education_school || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="Đại học ABC" />
                        </div>
                        <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-1">
                          <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Chuyên ngành (VI)</label>
                          <input type="text" name="education_major" value={info.education_major || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="Công nghệ thông tin" />
                        </div>
                        <div className="flex flex-col gap-2 lg:col-span-1">
                          <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Niên khóa (VI)</label>
                          <input type="text" name="education_years" value={info.education_years || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="2024 - 2028" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2 md:col-span-3 lg:col-span-1">
                          <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Trường học (EN)</label>
                          <input type="text" name="education_school_en" value={info.education_school_en || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="University name" />
                        </div>
                        <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-1">
                          <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Chuyên ngành (EN)</label>
                          <input type="text" name="education_major_en" value={info.education_major_en || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="Information Technology" />
                        </div>
                        <div className="flex flex-col gap-2 lg:col-span-1">
                          <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Niên khóa (EN)</label>
                          <input type="text" name="education_years_en" value={info.education_years_en || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="2024 - 2028" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Logo Trường học (URL)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="education_logo"
                            value={info.education_logo || ''}
                            onChange={handleChange}
                            className="flex-1 bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700"
                            placeholder="https://..."
                          />
                          <label className="flex items-center gap-2 px-4 bg-white/5 border border-white/10 hover:border-amber-500 hover:bg-amber-500/5 text-xs text-gray-400 hover:text-white cursor-pointer transition-all duration-300 select-none">
                            {uploadingField === 'logo' ? (
                              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            <span>{uploadingField === 'logo' ? 'Đang tải...' : 'Tải lên'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'education_logo')}
                              className="hidden"
                              disabled={uploadingField !== null}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Giới thiệu ngắn về học vấn (VI)</label>
                        <textarea name="education_desc" value={info.education_desc || ''} onChange={handleChange} rows={3} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700 custom-scrollbar" placeholder="Chia sẻ một chút về quá trình học tập..." />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">Giới thiệu ngắn về học vấn (EN)</label>
                        <textarea name="education_desc_en" value={info.education_desc_en || ''} onChange={handleChange} rows={3} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700 custom-scrollbar" placeholder="A short introduction about your education..." />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="text-[10px] font-mono tracking-widest text-amber-500">03.</div>
                        <h2 className="text-sm font-bold font-mono tracking-widest uppercase">{t('social_links')}</h2>
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
                  </div>
                </div>
              </div>

              <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/10 mt-8">
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
                  <span>{t('save_changes')}</span>
                  <div className="w-4 h-[1px] bg-white group-hover:bg-black transition-colors"></div>
                </button>
              </div>
            </form>

            <div className={activeAdminTab === 'visitors' ? 'block' : 'hidden'}>
              <div className="space-y-8">
                {/* Stats Summary Cards */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-6">
                  {/* Card 1: Online */}
                  <div className="p-3 xs:p-4 sm:p-6 border border-white/5 bg-white/[0.01] hover:border-amber-500/20 transition-all rounded-sm flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-[8px] xs:text-[10px] font-mono tracking-widest text-gray-500 uppercase truncate">{t('online')}</p>
                      <h3 className="text-base xs:text-xl sm:text-3xl font-display font-bold text-white mt-1">
                        {visitorStats ? visitorStats.onlineCount : 0}
                      </h3>
                    </div>
                    <div className="relative flex h-2 w-2 xs:h-3.5 xs:w-3.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 xs:h-3.5 xs:w-3.5 bg-emerald-500"></span>
                    </div>
                  </div>

                  {/* Card 2: Total Views */}
                  <div className="p-3 xs:p-4 sm:p-6 border border-white/5 bg-white/[0.01] hover:border-amber-500/20 transition-all rounded-sm flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-[8px] xs:text-[10px] font-mono tracking-widest text-gray-500 uppercase truncate">{t('views')}</p>
                      <h3 className="text-base xs:text-xl sm:text-3xl font-display font-bold text-amber-500 mt-1">
                        {visitorStats ? visitorStats.totalViews : 0}
                      </h3>
                    </div>
                    <Globe className="w-3.5 h-3.5 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-gray-500 shrink-0" />
                  </div>

                  {/* Card 3: Unique Visitors */}
                  <div className="p-3 xs:p-4 sm:p-6 border border-white/5 bg-white/[0.01] hover:border-amber-500/20 transition-all rounded-sm flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-[8px] xs:text-[10px] font-mono tracking-widest text-gray-500 uppercase truncate">Khách</p>
                      <h3 className="text-base xs:text-xl sm:text-3xl font-display font-bold text-white mt-1">
                        {visitorStats ? visitorStats.totalVisitors : 0}
                      </h3>
                    </div>
                    <User className="w-3.5 h-3.5 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-gray-500 shrink-0" />
                  </div>
                </div>

                {/* SVG Analytics Chart */}
                {visitorLogs.length > 0 && (() => {
                  const chartData = getLast7DaysStats();
                  const maxVal = Math.max(...chartData.viewsData, ...chartData.uniqueData, 5);
                  
                  const viewsPoints = chartData.viewsData.map((val, i) => ({
                    x: 40 + i * 73.33,
                    y: 170 - (val / maxVal) * 140
                  }));
                  const viewsPath = viewsPoints.length > 0 
                    ? `M ${viewsPoints[0].x} ${viewsPoints[0].y} ` + viewsPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
                    : '';
                  const viewsAreaPath = viewsPoints.length > 0
                    ? `${viewsPath} L ${viewsPoints[viewsPoints.length - 1].x} 170 L ${viewsPoints[0].x} 170 Z`
                    : '';

                  const uniquePoints = chartData.uniqueData.map((val, i) => ({
                    x: 40 + i * 73.33,
                    y: 170 - (val / maxVal) * 140
                  }));
                  const uniquePath = uniquePoints.length > 0 
                    ? `M ${uniquePoints[0].x} ${uniquePoints[0].y} ` + uniquePoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
                    : '';
                  const uniqueAreaPath = uniquePoints.length > 0
                    ? `${uniquePath} L ${uniquePoints[uniquePoints.length - 1].x} 170 L ${uniquePoints[0].x} 170 Z`
                    : '';

                  return (
                    <div className="border border-white/10 bg-white/[0.01] p-4 sm:p-6 mt-6 rounded-sm">
                      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                          <span className="font-mono text-[10px] tracking-widest text-gray-400 uppercase">
                            Thống kê truy cập (7 ngày gần nhất)
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[9px] font-mono tracking-widest uppercase">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-1 bg-amber-500 rounded-full inline-block"></span>
                            <span className="text-gray-400">Lượt Xem</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-1 bg-cyan-500 rounded-full inline-block"></span>
                            <span className="text-gray-400">Khách</span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full relative h-[200px]">
                        <svg viewBox="0 0 500 200" className="w-full h-full" preserveAspectRatio="none">
                          <defs>
                            <filter id="glow-views" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.4" />
                            </filter>
                            <filter id="glow-unique" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.4" />
                            </filter>
                            <linearGradient id="grad-views" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="grad-unique" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid lines */}
                          <line x1="40" y1="30" x2="480" y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                          <line x1="40" y1="100" x2="480" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                          <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.1)" />

                          {/* Grid text values */}
                          <text x="30" y="34" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace" textAnchor="end">{Math.round(maxVal)}</text>
                          <text x="30" y="104" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace" textAnchor="end">{Math.round(maxVal / 2)}</text>
                          <text x="30" y="174" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace" textAnchor="end">0</text>

                          {/* Area Paths */}
                          {viewsAreaPath && <path d={viewsAreaPath} fill="url(#grad-views)" />}
                          {uniqueAreaPath && <path d={uniqueAreaPath} fill="url(#grad-unique)" />}

                          {/* Line Paths */}
                          {viewsPath && (
                            <path d={viewsPath} fill="none" stroke="#f59e0b" strokeWidth="2" filter="url(#glow-views)" strokeLinecap="round" strokeLinejoin="round" />
                          )}
                          {uniquePath && (
                            <path d={uniquePath} fill="none" stroke="#06b6d4" strokeWidth="2" filter="url(#glow-unique)" strokeLinecap="round" strokeLinejoin="round" />
                          )}

                          {/* X-axis labels */}
                          {chartData.dateLabels.map((label, idx) => (
                            <text key={idx} x={40 + idx * 73.33} y="190" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace" textAnchor="middle">
                              {label}
                            </text>
                          ))}

                          {/* Interactive dots and text labels for values */}
                          {viewsPoints.map((pt, idx) => (
                            <g key={`views-pt-${idx}`}>
                              <circle cx={pt.x} cy={pt.y} r="3" fill="#f59e0b" stroke="#050505" strokeWidth="1" />
                              {chartData.viewsData[idx] > 0 && (
                                <text x={pt.x} y={pt.y - 8} fill="#f59e0b" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                                  {chartData.viewsData[idx]}
                                </text>
                              )}
                            </g>
                          ))}

                          {uniquePoints.map((pt, idx) => (
                            <g key={`unique-pt-${idx}`}>
                              <circle cx={pt.x} cy={pt.y} r="3" fill="#06b6d4" stroke="#050505" strokeWidth="1" />
                              {chartData.uniqueData[idx] > 0 && (
                                <text x={pt.x} y={pt.y - 8} fill="#06b6d4" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                                  {chartData.uniqueData[idx]}
                                </text>
                              )}
                            </g>
                          ))}
                        </svg>
                      </div>
                    </div>
                  );
                })()}

                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4 border-b border-white/5 pb-6 mt-6">
                  {/* Search Bar */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Tìm kiếm theo IP, Quốc gia, Thành phố..."
                      className="w-full bg-black/50 border border-white/10 p-2.5 text-xs font-mono focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700 rounded-sm"
                    />
                  </div>
                  {/* Filter Tabs */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setLogFilter('all');
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all duration-200 border rounded-sm ${
                        logFilter === 'all'
                          ? 'border-amber-500/50 bg-amber-500/10 text-amber-500'
                          : 'border-white/10 bg-transparent text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLogFilter('online');
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all duration-200 border rounded-sm flex items-center gap-2 ${
                        logFilter === 'online'
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500'
                          : 'border-white/10 bg-transparent text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Đang Online
                    </button>
                  </div>
                </div>

                {/* Actions & Refresh */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                  <div className="text-[10px] sm:text-xs text-gray-500 font-mono order-2 sm:order-1 w-full sm:w-auto text-center sm:text-left">
                    Hiển thị tối đa 200 lượt truy cập mới nhất
                  </div>
                  <div className="flex items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
                    <button
                      type="button"
                      onClick={fetchVisitorLogs}
                      disabled={logsLoading}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-3 sm:px-4 py-2 font-mono text-[9px] sm:text-[10px] tracking-widest uppercase transition-all duration-300 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
                      <span>Làm mới</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearLogs}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-red-500/30 hover:border-red-500 bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-200 px-3 sm:px-4 py-2 font-mono text-[9px] sm:text-[10px] tracking-widest uppercase transition-all duration-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('clear_logs')}</span>
                    </button>
                  </div>
                </div>

                {/* Logs Table */}
                <div className="border border-white/10 rounded-sm overflow-hidden bg-black/40">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.02] font-mono text-[9px] sm:text-[10px] tracking-widest text-gray-500 uppercase">
                          <th className="py-3 px-4 sm:py-4 sm:px-6 font-medium">{t('status')}</th>
                          <th className="py-3 px-4 sm:py-4 sm:px-6 font-medium">{t('ip_address')}</th>
                          <th className="py-3 px-4 sm:py-4 sm:px-6 font-medium">{t('visitor_location')}</th>
                          <th className="py-3 px-4 sm:py-4 sm:px-6 font-medium">{t('device_browser')}</th>
                          <th className="py-3 px-4 sm:py-4 sm:px-6 font-medium">{t('screen_size')}</th>
                          <th className="py-3 px-4 sm:py-4 sm:px-6 font-medium">{t('visit_time')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-[11px] sm:text-xs text-gray-300 font-mono">
                        {logsLoading && visitorLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-gray-500">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                              Đang tải dữ liệu...
                            </td>
                          </tr>
                        ) : logsError ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-red-400 font-sans">
                              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500 animate-bounce" />
                              Lỗi tải dữ liệu: {logsError}
                              <br />
                              <span className="text-[10px] text-gray-500 mt-2 block">
                                Đảm bảo bạn đã chạy đầy đủ file visitor_migration.sql trong Supabase Dashboard - SQL Editor.
                              </span>
                            </td>
                          </tr>
                        ) : visitorLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-gray-500">
                              {t('no_data')}
                            </td>
                          </tr>
                        ) : (
                          paginatedLogs.map((log: any) => {
                            const isOnline = new Date().getTime() - new Date(log.last_active_at).getTime() < 35000;
                            return (
                              <tr key={log.id} onClick={() => setSelectedLog(log)} className="hover:bg-white/[0.03] transition-colors cursor-pointer" title="Click to view details">
                                <td className="py-3 px-4 sm:py-4 sm:px-6">
                                  <span className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-gray-600'}`}></span>
                                    <span className={`text-[10px] uppercase font-mono ${isOnline ? 'text-emerald-500' : 'text-gray-500'}`}>
                                      {isOnline ? t('active') : t('offline')}
                                    </span>
                                  </span>
                                </td>
                                <td className="py-3 px-4 sm:py-4 sm:px-6 text-gray-300">
                                  <span 
                                    className="cursor-pointer hover:text-amber-500 select-all font-bold" 
                                    title="Click to select/copy"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {log.ip}
                                  </span>
                                </td>
                                <td className="py-3 px-4 sm:py-4 sm:px-6">
                                  <span className="flex items-center gap-1.5 text-gray-400">
                                    <Globe className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                                    <span className="truncate">
                                      {log.city && log.city !== 'Unknown' ? `${log.city}, ` : ''}
                                      <span className="text-white">{log.country || 'Unknown'}</span>
                                    </span>
                                  </span>
                                </td>
                                <td className="py-3 px-4 sm:py-4 sm:px-6 text-gray-400" title={log.user_agent}>
                                  <span className="flex items-center gap-1.5">
                                    <Laptop className="w-3.5 h-3.5 text-gray-600" />
                                    <span>{parseUserAgent(log.user_agent)}</span>
                                  </span>
                                </td>
                                <td className="py-3 px-4 sm:py-4 sm:px-6 text-gray-500">
                                  {log.screen_width && log.screen_height ? `${log.screen_width}x${log.screen_height}` : 'N/A'}
                                </td>
                                <td className="py-3 px-4 sm:py-4 sm:px-6 text-gray-500">
                                  {new Date(log.created_at).toLocaleString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-white/5 font-mono text-[10px] tracking-widest text-gray-500 uppercase">
                      <div>
                        {language === 'vi' 
                          ? `Hiển thị từ ${startIndex + 1} đến ${Math.min(startIndex + LOGS_PER_PAGE, filteredLogs.length)} trên tổng số ${filteredLogs.length} lượt`
                          : `Showing ${startIndex + 1} to ${Math.min(startIndex + LOGS_PER_PAGE, filteredLogs.length)} of ${filteredLogs.length} entries`
                        }
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={`px-3 py-1.5 border rounded-sm transition-colors ${
                            currentPage === 1
                              ? 'border-white/5 text-gray-700 bg-white/[0.01] cursor-not-allowed'
                              : 'border-white/10 text-white bg-white/5 hover:border-amber-500 hover:text-amber-500 cursor-pointer'
                          }`}
                        >
                          &larr; {language === 'vi' ? 'Trước' : 'Prev'}
                        </button>
                        
                        {Array.from({ length: totalPages }).map((_, idx) => {
                          const pageNum = idx + 1;
                          if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 py-1.5 border rounded-sm transition-colors cursor-pointer ${
                                  currentPage === pageNum
                                    ? 'bg-amber-500 border-amber-500 text-black font-bold'
                                    : 'border-white/10 text-white bg-white/5 hover:border-amber-500 hover:text-amber-500'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                          if (pageNum === 2 || pageNum === totalPages - 1) {
                            return (
                              <span key={pageNum} className="px-1 text-gray-600">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1.5 border rounded-sm transition-colors ${
                            currentPage === totalPages
                              ? 'border-white/5 text-gray-700 bg-white/[0.01] cursor-not-allowed'
                              : 'border-white/10 text-white bg-white/5 hover:border-amber-500 hover:text-amber-500 cursor-pointer'
                          }`}
                        >
                          {language === 'vi' ? 'Sau' : 'Next'} &rarr;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Visitor Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedLog(null)}>
          <div className="bg-[#050505] border border-white/10 p-6 sm:p-8 max-w-lg w-full relative overflow-hidden flex flex-col font-mono text-xs text-gray-300" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-500"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-500"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500"></div>

            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <span className="text-amber-500 text-[10px] tracking-widest uppercase">— CHI TIẾT TRUY CẬP</span>
              <button onClick={() => setSelectedLog(null)} className="text-gray-500 hover:text-white transition-colors cursor-pointer text-base font-sans">✕</button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              <div>
                <span className="text-gray-500 block text-[9px] uppercase tracking-wider mb-1">Địa chỉ IP</span>
                <span className="text-white text-sm select-all font-bold">{selectedLog.ip || 'Unknown'}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase tracking-wider mb-1">Vị trí</span>
                  <span className="text-white">
                    {selectedLog.city && selectedLog.city !== 'Unknown' ? `${selectedLog.city}, ` : ''}
                    {selectedLog.country || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase tracking-wider mb-1">Mã quốc gia</span>
                  <span className="text-white">{selectedLog.country_code || 'Unknown'}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-500 block text-[9px] uppercase tracking-wider mb-1">Đường dẫn truy cập</span>
                <span className="text-emerald-500 select-all">{selectedLog.path || '/'}</span>
              </div>

              <div>
                <span className="text-gray-500 block text-[9px] uppercase tracking-wider mb-1">Nguồn giới thiệu (Referrer)</span>
                <span className="text-white select-all break-all">{selectedLog.referrer || 'Direct'}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase tracking-wider mb-1">Màn hình</span>
                  <span className="text-white">{selectedLog.screen_width && selectedLog.screen_height ? `${selectedLog.screen_width}x${selectedLog.screen_height}` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase tracking-wider mb-1">Thiết bị & Trình duyệt</span>
                  <span className="text-white">{parseUserAgent(selectedLog.user_agent)}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-500 block text-[9px] uppercase tracking-wider mb-1">User Agent đầy đủ</span>
                <span className="text-gray-400 block p-2 bg-white/[0.02] border border-white/5 text-[10px] break-all select-all leading-normal max-h-20 overflow-y-auto custom-scrollbar">
                  {selectedLog.user_agent}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase tracking-wider mb-1">Thời gian vào</span>
                  <span className="text-white text-[10px]">
                    {new Date(selectedLog.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase tracking-wider mb-1">Hoạt động cuối</span>
                  <span className="text-white text-[10px]">
                    {new Date(selectedLog.last_active_at).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-white/10 pt-6 mt-6">
              {((selectedLog.city && selectedLog.city !== 'Unknown') || (selectedLog.country && selectedLog.country !== 'Unknown')) && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${selectedLog.city || ''} ${selectedLog.country || ''}`.trim()
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-[10px] tracking-widest uppercase transition-all duration-200"
                >
                  Xem trên Bản đồ
                </a>
              )}
              <button
                onClick={() => setSelectedLog(null)}
                className="flex-1 py-2.5 border border-white/10 hover:border-white/30 text-gray-400 hover:text-white font-mono text-[10px] tracking-widest uppercase transition-all duration-200 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
