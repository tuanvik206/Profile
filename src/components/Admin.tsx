import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SiteInfo } from '../types';
import { Save, Loader2, AlertCircle, CheckCircle, LogOut, Gamepad2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { DEFAULT_GAMES, FavoriteGame } from './GamingHub';
import { useLanguage } from '../contexts/LanguageContext';

import ValorantAdmin from './ValorantAdmin';

export default function Admin() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authAttempts, setAuthAttempts] = useState(0);
  const [authLockUntil, setAuthLockUntil] = useState<number | null>(null);

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
  const [games, setGames] = useState<FavoriteGame[]>([]);
  const [activeAdminTab, setActiveAdminTab] = useState<'info' | 'games' | 'valorant'>('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [configured, setConfigured] = useState(false);
  const [searchResults, setSearchResults] = useState<{ [key: number]: any[] }>({});
  const [searchLoading, setSearchLoading] = useState<{ [key: number]: boolean }>({});

  // Load games from localStorage on mount as fallback
  useEffect(() => {
    // Only load from localStorage initially, fetchInfo will override if Supabase has data
    const stored = localStorage.getItem('favorite_games');
    if (stored) {
      try {
        setGames(JSON.parse(stored));
      } catch (e) {
        setGames(DEFAULT_GAMES);
      }
    } else {
      setGames(DEFAULT_GAMES);
    }
  }, []);

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

  const fetchInfo = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase.from('site_info').select('*').single();
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching site info:", error.message || error);
      }
      if (data) {
        const { favorite_games, ...restInfo } = data;

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
        if (favorite_games && Array.isArray(favorite_games)) {
          const cleanedGames = favorite_games.map(g => {
            const lowTitle = g.title?.toLowerCase() || '';
            const lowUrl = g.image_url || '';
            if (lowTitle === 'valorant' && (lowUrl.includes('unsplash.com') || lowUrl.includes('epicgames.com'))) {
              return {
                ...g,
                image_url: 'https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png'
              };
            }
            if (lowTitle === 'league of legends' && (lowUrl.includes('unsplash.com') || lowUrl.includes('epicgames.com'))) {
              return {
                ...g,
                image_url: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg'
              };
            }
            if (lowTitle === 'teamfight tactics' && (lowUrl.includes('unsplash.com') || lowUrl.includes('epicgames.com'))) {
              return {
                ...g,
                image_url: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Teemo_0.jpg'
              };
            }
            if (lowTitle === 'legends of runeterra' && (lowUrl.includes('unsplash.com') || lowUrl.includes('epicgames.com'))) {
              return {
                ...g,
                image_url: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/AurelionSol_0.jpg'
              };
            }
            if (lowTitle === 'genshin impact' && lowUrl.includes('epicgames.com')) {
              return {
                ...g,
                image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200&auto=format&fit=crop'
              };
            }
            if (lowTitle === 'honkai: star rail' && lowUrl.includes('epicgames.com')) {
              return {
                ...g,
                image_url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1200'
              };
            }
            if (lowTitle === 'zenless zone zero' && lowUrl.includes('epicgames.com')) {
              return {
                ...g,
                image_url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200'
              };
            }
            return g;
          });
          setGames(cleanedGames);
        }
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

  const POPULAR_GAMES_PRESETS = [
    {
      gameID: "riot_lol",
      external: "League of Legends",
      thumb: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg",
      steamAppID: null,
      isPreset: true,
      aliases: ["lol", "league of legends", "liên minh huyền thoại", "lmht", "riot lol", "league"]
    },
    {
      gameID: "riot_valorant",
      external: "VALORANT",
      thumb: "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png",
      steamAppID: null,
      isPreset: true,
      aliases: ["valorant", "vlr", "riot valorant", "val", "vlorant"]
    },
    {
      gameID: "riot_tft",
      external: "Teamfight Tactics",
      thumb: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Teemo_0.jpg",
      steamAppID: null,
      isPreset: true,
      aliases: ["tft", "teamfight tactics", "đấu trường chân lý", "dtcl", "riot tft", "cờ liên minh"]
    },
    {
      gameID: "riot_runeterra",
      external: "Legends of Runeterra",
      thumb: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/AurelionSol_0.jpg",
      steamAppID: null,
      isPreset: true,
      aliases: ["legends of runeterra", "runeterra", "huyền thoại runeterra", "lor"]
    },
    {
      gameID: "riot_wildrift",
      external: "League of Legends: Wild Rift",
      thumb: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg",
      steamAppID: null,
      isPreset: true,
      aliases: ["wild rift", "wildrift", "tốc chiến", "toc chien", "lol mobile"]
    },
    {
      gameID: "genshin_impact",
      external: "Genshin Impact",
      thumb: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200&auto=format&fit=crop",
      steamAppID: null,
      isPreset: true,
      aliases: ["genshin impact", "genshin", "gi", "hoyoverse", "mihoyo"]
    },
    {
      gameID: "honkai_star_rail",
      external: "Honkai: Star Rail",
      thumb: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1200",
      steamAppID: null,
      isPreset: true,
      aliases: ["honkai star rail", "hsr", "honkai", "star rail", "hoyoverse", "mihoyo"]
    },
    {
      gameID: "zenless_zone_zero",
      external: "Zenless Zone Zero",
      thumb: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200",
      steamAppID: null,
      isPreset: true,
      aliases: ["zenless zone zero", "zzz", "zenless", "hoyoverse", "mihoyo"]
    },
    {
      gameID: "fc_online",
      external: "EA SPORTS FC Online",
      thumb: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop",
      steamAppID: null,
      isPreset: true,
      aliases: ["fc online", "fo4", "fifa online 4", "fifa online", "fco"]
    },
    {
      gameID: "minecraft_game",
      external: "Minecraft",
      thumb: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?q=80&w=1200&auto=format&fit=crop",
      steamAppID: null,
      isPreset: true,
      aliases: ["minecraft", "mc", "mojang"]
    },
    {
      gameID: "pubg_mobile_game",
      external: "PUBG Mobile",
      thumb: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
      steamAppID: null,
      isPreset: true,
      aliases: ["pubg mobile", "pubgm", "pubg m"]
    },
    {
      gameID: "lien_quan_mobile",
      external: "Arena of Valor (Liên Quân Mobile)",
      thumb: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
      steamAppID: null,
      isPreset: true,
      aliases: ["lien quan", "liên quân", "lien quan mobile", "lq", "lqmb", "arena of valor", "aov"]
    }
  ];

  const handleGameSearch = async (index: number, query: string) => {
    if (!query) {
      alert("Vui lòng nhập tên game trước khi tìm kiếm!");
      return;
    }
    setSearchLoading(prev => ({ ...prev, [index]: true }));
    try {
      const cleanQuery = query.toLowerCase().trim();
      const normalizeTitle = (value: string) =>
        value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

      // --- 1. Preset games ---
      const matchingPresets = POPULAR_GAMES_PRESETS.filter(item =>
        item.external.toLowerCase().includes(cleanQuery) ||
        item.aliases.some(alias => alias.includes(cleanQuery) || cleanQuery.includes(alias))
      );

      const results: any[] = [];
      const seen = new Set<string>();
      const addResult = (title: string, imageUrl: string, extra: Record<string, any> = {}) => {
        const key = normalizeTitle(title);
        if (!title || !key || seen.has(key)) return;
        seen.add(key);
        results.push({ external: title, thumb: imageUrl, ...extra });
      };

      matchingPresets.forEach(p => addResult(p.external, p.thumb, { gameID: p.gameID, steamAppID: p.steamAppID, isPreset: true, source: 'preset' }));

      // --- 2. CheapShark + Steam CDN header image (460x215, đẹp) ---
      try {
        const csRes = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}&limit=15`);
        if (csRes.ok) {
          const csData: any[] = await csRes.json();
          if (Array.isArray(csData)) {
            csData.forEach((item: any) => {
              const title = item.external || query;
              // Ưu tiên ảnh header Steam CDN (to đẹp 460x215)
              const steamHeader = item.steamAppID
                ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.steamAppID}/header.jpg`
                : '';
              const thumb = steamHeader || item.thumb || '';
              addResult(title, thumb, {
                gameID: item.gameID,
                steamAppID: item.steamAppID || null,
                thumb_small: item.thumb || '',
                source: 'cheapshark+steam',
              });
            });
          }
        }
      } catch (err) {
        console.warn('CheapShark API error:', err);
      }

      // --- 3. Wikipedia API (Tìm kiếm toàn cầu miễn phí, không bị CORS, không cần key) ---
      try {
        const queryEncoded = encodeURIComponent(query);
        // Gọi cả Wikipedia tiếng Anh và tiếng Việt song song
        const [wpEnRes, wpViRes] = await Promise.all([
          fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages|pageterms&generator=search&piprop=original&pithumbsize=600&gsrsearch=${queryEncoded}&gsrlimit=8`),
          fetch(`https://vi.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages|pageterms&generator=search&piprop=original&pithumbsize=600&gsrsearch=${queryEncoded}&gsrlimit=8`)
        ]);

        const processWpData = async (res: Response, lang: string) => {
          if (!res.ok) return;
          const data = await res.json();
          if (data.query && data.query.pages) {
            Object.values(data.query.pages).forEach((page: any) => {
              const terms = page.terms || {};
              const desc = (terms.description || []).join(' ').toLowerCase();
              
              // Kiểm tra xem bài viết có liên quan đến game, giải đấu, nhân vật game, thiết bị game hay nhà phát triển không
              const isGameRelated = 
                desc.includes('game') || 
                desc.includes('playstation') || 
                desc.includes('xbox') || 
                desc.includes('nintendo') || 
                desc.includes('software') || 
                desc.includes('esport') || 
                desc.includes('tournament') || 
                desc.includes('series') || 
                desc.includes('developer') ||
                desc.includes('trò chơi') || 
                desc.includes('điện tử') ||
                desc.includes('nhà phát triển') ||
                desc.includes('phát hành') ||
                page.title.toLowerCase().includes('game') ||
                page.title.toLowerCase().includes('video game');
              
              const imgUrl = page.original?.source || page.thumbnail?.source || '';
              
              // Nếu có ảnh và liên quan đến game hoặc có từ khóa khớp tên game trong tiêu đề
              if (imgUrl && (isGameRelated || page.title.toLowerCase().includes(cleanQuery))) {
                addResult(page.title, imgUrl, {
                  gameID: `wiki-${lang}-${page.pageid}`,
                  steamAppID: null,
                  source: `wikipedia-${lang}`,
                  description: terms.description?.[0] || 'Wikipedia Article'
                });
              }
            });
          }
        };

        await Promise.all([
          processWpData(wpEnRes, 'en'),
          processWpData(wpViRes, 'vi')
        ]);
      } catch (err) {
        console.warn('Wikipedia API error:', err);
      }

      // --- 4. RAWG.io (nếu có key trong env) ---
      const rawgKey = import.meta.env.VITE_RAWG_API_KEY || '';
      if (rawgKey) {
        try {
          const rawgRes = await fetch(
            `https://api.rawg.io/api/games?key=${rawgKey}&search=${encodeURIComponent(query)}&page_size=10`
          );
          if (rawgRes.ok) {
            const rawgData = await rawgRes.json();
            (rawgData.results || []).forEach((game: any) => {
              addResult(game.name, game.background_image || '', {
                gameID: `rawg-${game.id}`,
                steamAppID: null,
                source: 'rawg',
                genres: (game.genres || []).map((g: any) => g.name).join(' / '),
              });
            });
          }
        } catch (err) {
          console.warn('RAWG API error:', err);
        }
      }

      setSearchResults(prev => ({ ...prev, [index]: results.slice(0, 15) }));
    } catch (error) {
      console.error('Error searching game:', error);
    } finally {
      setSearchLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setStatus({ type: null, message: '' });

    try {
      const { data: existingData } = await supabase.from('site_info').select('id').single();

      // Remove id and valorant_profile from the payload so we don't attempt to update it or overwrite it
      const { id, valorant_profile, ...restPayload } = info as any;
      const updatePayload = {
        ...restPayload,
        favorite_games: games
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
          favorite_games,
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

        setStatus({ type: 'error', message: 'Lưu cơ bản. Tạo thêm cột: favorite_games(JSONB), project_name, education_logo, education_desc, est_year, coordinates, location_text (TEXT) trên Supabase!' });
        localStorage.setItem('favorite_games', JSON.stringify(games));
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
      localStorage.setItem('favorite_games', JSON.stringify(games));
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
              <li>favorite_games (jsonb)</li>
              <li>valorant_profile (jsonb)</li>
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
              onClick={() => setActiveAdminTab('games')}
              className={`flex items-center gap-2 px-6 py-4 font-mono text-[11px] tracking-widest uppercase transition-all duration-300 border-b-2 -mb-[1px] whitespace-nowrap ${activeAdminTab === 'games'
                ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>{t('favorite_games')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab('valorant')}
              className={`flex items-center gap-2 px-6 py-4 font-mono text-[11px] tracking-widest uppercase transition-all duration-300 border-b-2 -mb-[1px] whitespace-nowrap ${activeAdminTab === 'valorant'
                ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>{t('val_profile')}</span>
            </button>
          </div>

          <div className="relative min-h-[600px]">
            <form onSubmit={handleSave} className={`space-y-12 ${activeAdminTab !== 'valorant' ? 'block' : 'hidden'}`}>
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
                          <input type="text" name="avatar_url" value={info.avatar_url || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="URL hình ảnh" />
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
                        <input type="text" name="education_logo" value={info.education_logo || ''} onChange={handleChange} className="bg-black/50 border border-white/10 p-3 text-sm focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all placeholder-gray-700" placeholder="https://..." />
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

                <div className={activeAdminTab === 'games' ? 'block' : 'hidden'}>
                  <div className="space-y-12">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="text-[10px] font-mono tracking-widest text-amber-500">04.</div>
                        <h2 className="text-sm font-bold font-mono tracking-widest uppercase">{t('favorite_games')}</h2>
                        <div className="flex-1 h-[1px] bg-white/10"></div>
                      </div>

                      <div className="space-y-8">
                        {games.map((game, index) => (
                          <div key={game.id} className="p-4 sm:p-6 border border-white/5 bg-white/[0.01] hover:border-white/10 transition-colors space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <span className="text-[10px] font-mono text-amber-500 uppercase font-bold">GAME #{index + 1}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] font-mono text-gray-500 uppercase">{game.title || t('unknown')}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = games.filter((_, i) => i !== index);
                                    setGames(updated);
                                  }}
                                  className="text-[9px] font-mono text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 transition-colors uppercase border border-red-500/20"
                                >
                                  {t('delete')}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                              {/* Left side: Image Preview */}
                              <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-2">
                                <label className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">
                                  Ảnh bìa
                                </label>
                                <div className="w-full aspect-[16/10] bg-black/40 border border-white/10 rounded-sm overflow-hidden flex items-center justify-center relative group-hover:border-amber-500/30 transition-all">
                                  {game.image_url ? (
                                    <img
                                      src={game.image_url}
                                      alt={game.title || 'Preview'}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop";
                                      }}
                                    />
                                  ) : (
                                    <div className="text-[10px] font-mono text-gray-600 uppercase flex flex-col items-center gap-2">
                                      <span className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.02]">?</span>
                                      <span>Chưa có ảnh</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right side: Inputs & Search */}
                              <div className="md:col-span-8 lg:col-span-9 flex flex-col gap-4">
                                <div className="grid grid-cols-1 gap-4">
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">{t('game_name')}</label>
                                      <button
                                        type="button"
                                        onClick={() => handleGameSearch(index, game.title)}
                                        disabled={searchLoading[index]}
                                        className="text-[9px] font-mono text-amber-500 hover:text-amber-400 flex items-center gap-1 uppercase bg-transparent border-none cursor-pointer focus:outline-none transition-colors"
                                      >
                                        {searchLoading[index] ? <Loader2 className="w-3 h-3 animate-spin" /> : "🔍 TÌM ẢNH TỰ ĐỘNG"}
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      value={game.title}
                                      onChange={(e) => {
                                        const updated = games.map((g, i) => i === index ? { ...g, title: e.target.value } : g);
                                        setGames(updated);
                                      }}
                                      className="bg-black/50 border border-white/10 p-2.5 text-xs focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all text-white"
                                      placeholder="VD: Valorant"
                                    />
                                  </div>

                                  <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">Link ảnh bìa (Image URL)</label>
                                    <input
                                      type="text"
                                      value={game.image_url}
                                      onChange={(e) => {
                                        const updated = games.map((g, i) => i === index ? { ...g, image_url: e.target.value } : g);
                                        setGames(updated);
                                      }}
                                      className="bg-black/50 border border-white/10 p-2.5 text-xs focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none transition-all text-white"
                                      placeholder="https://images.unsplash.com..."
                                    />
                                  </div>
                                </div>

                                {searchResults[index] && searchResults[index].length > 0 && (
                                  <div className="border border-amber-500/20 bg-amber-500/5 p-3 space-y-2 rounded-sm mt-2">
                                    <div className="flex justify-between items-center text-[9px] font-mono text-amber-500 tracking-wider">
                                      <span>CHỌN GAME ĐỂ TỰ ĐỘNG ĐIỀN TÊN VÀ ẢNH BÌA:</span>
                                      <button
                                        type="button"
                                        onClick={() => setSearchResults(prev => {
                                          const updated = { ...prev };
                                          delete updated[index];
                                          return updated;
                                        })}
                                        className="text-gray-500 hover:text-white transition-colors uppercase text-[9px] font-mono"
                                      >
                                        Đóng
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                                      {searchResults[index].map((result: any) => (
                                        <button
                                          key={result.gameID}
                                          type="button"
                                          onClick={() => {
                                            const updated = games.map((g, i) => {
                                              if (i === index) {
                                                let imageUrl = result.thumb;
                                                if (result.isPreset) {
                                                  imageUrl = result.thumb;
                                                } else if (result.steamAppID) {
                                                  imageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${result.steamAppID}/header.jpg`;
                                                }
                                                return { ...g, title: result.external, image_url: imageUrl };
                                              }
                                              return g;
                                            });
                                            setGames(updated);
                                            setSearchResults(prev => {
                                              const updatedResults = { ...prev };
                                              delete updatedResults[index];
                                              return updatedResults;
                                            });
                                          }}
                                          className="flex items-center gap-2.5 p-1.5 bg-black/40 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/20 text-left transition-all text-white rounded-sm group cursor-pointer"
                                        >
                                          <img
                                            src={result.thumb}
                                            alt={result.external}
                                            className="w-10 h-7 object-cover border border-white/10 shrink-0"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-medium text-white group-hover:text-amber-500 truncate">{result.external}</p>
                                             <p className="text-[9px] font-mono text-gray-400 group-hover:text-amber-500/80">
                                               {result.source === 'preset' ? 'Premium Artwork' : 
                                                result.source === 'cheapshark+steam' ? (result.steamAppID ? `Steam AppID: ${result.steamAppID}` : 'CheapShark') :
                                                result.source === 'wikipedia-en' ? 'Wikipedia (EN)' :
                                                result.source === 'wikipedia-vi' ? 'Wikipedia (VI)' :
                                                result.source === 'rawg' ? 'RAWG.io' : 'Khác'}
                                             </p>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setGames([...games, {
                            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(),
                            title: '',
                            category: '',
                            image_url: '',
                            description: '',
                            rank: '',
                            developer: ''
                          }]);
                        }}
                        className="w-full p-4 border border-dashed border-white/20 text-gray-400 hover:text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all flex items-center justify-center gap-2 font-mono text-[10px] tracking-widest uppercase"
                      >
                        + {t('add_game')}
                      </button>
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
            <div className={activeAdminTab === 'valorant' ? 'block' : 'hidden'}>
              <ValorantAdmin />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
