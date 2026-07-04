import { Github, Facebook, Mail, Instagram, Loader2, Linkedin, Twitter, Youtube, Dribbble, Twitch, X, Eye, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence, Variants, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useState, useCallback, lazy, Suspense, useRef } from "react";
import Background from "./Background";
import { supabase } from "../lib/supabase";
import { SiteInfo } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { getDeviceTier } from "../lib/performance";
import { useVisitorTracker } from "../lib/visitorTracker";

const GamingHub = lazy(() => import("./GamingHub"));

const Tiktok = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const Behance = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 13H15" />
    <path d="M18 9.5a2.5 2.5 0 0 0-2.5 2.5v1.5a2.5 2.5 0 0 0 5 0v-1.5a2.5 2.5 0 0 0-2.5-2.5Z" />
    <path d="M8 12h3" />
    <path d="M11 9H4v10h7a3 3 0 0 0 0-6 3 3 0 0 0 0-4Z" />
  </svg>
);

const Discord = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.17 6c-1.39-1-2.9-1.63-4.49-1.85a.07.07 0 0 0-.07.03 9.54 9.54 0 0 0-.42.86 8.79 8.79 0 0 0-2.38 0 .07.07 0 0 0-.07-.03c-1.58.22-3.1.85-4.49 1.85a.07.07 0 0 0-.03.03C3.39 10.46 2.3 14.77 2.76 19a.07.07 0 0 0 .03.05c1.9 1.4 3.73 2.26 5.53 2.82a.08.08 0 0 0 .08-.03c.42-.58.8-1.2 1.14-1.85a.07.07 0 0 0-.04-.1 6.14 6.14 0 0 1-.88-.42.07.07 0 0 1-.01-.11c.07-.05.15-.11.22-.17a.07.07 0 0 1 .07-.01c3.62 1.66 7.55 1.66 11.13 0a.07.07 0 0 1 .07.01c.07.06.15.12.22.17a.07.07 0 0 1-.01.11 6.13 6.13 0 0 1-.88.42.07.07 0 0 0-.04.1c.34.65.72 1.27 1.14 1.85a.08.08 0 0 0 .08.03c1.8-.56 3.63-1.42 5.53-2.82a.07.07 0 0 0 .03-.05c.53-4.93-.86-9.17-3.04-13a.07.07 0 0 0-.03-.03z" />
    <circle cx="8.5" cy="12.5" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="12.5" r="1.5" fill="currentColor" />
  </svg>
);

export default function Portfolio() {
  const { t, language, setLanguage } = useLanguage();
  const stats = useVisitorTracker();
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGaming, setShowGaming] = useState(false);
  const [showIntroPopup, setShowIntroPopup] = useState(false);
  const [showEducationPopup, setShowEducationPopup] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  // Audio Player State & Functions
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn("Audio playback blocked by browser:", err);
      });
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Device tier — detected once at render
  const tier = getDeviceTier();
  const enableTilt = tier >= 3;   // only strong devices
  const enableMotion = tier >= 2; // weak devices skip all entry animations

  // 3D Tilt Effect — motion values always declared (hooks rules), but only used when tier 3
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 100, mass: 1 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [enableTilt, mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  useEffect(() => {
    // Weak devices: no artificial delay to show content immediately
    const delay = tier >= 3 ? 1500 : tier === 2 ? 800 : 0;
    const minLoadTime = new Promise(resolve => setTimeout(resolve, delay));
    Promise.all([fetchSiteInfo(), minLoadTime]).then(() => setLoading(false));

    // Đăng ký Supabase Realtime để đồng bộ tức thời khi Admin thay đổi dữ liệu
    let channel: any;
    if (supabase) {
      channel = supabase
        .channel('site_info_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'site_info' },
          (payload) => {
            if (payload.new) {
              const newData = { ...payload.new };
              // Fallback for fields that might not exist in Supabase yet
              if (!newData.education_logo && localStorage.getItem('education_logo')) {
                newData.education_logo = localStorage.getItem('education_logo');
              }
              if (!newData.education_desc && localStorage.getItem('education_desc')) {
                newData.education_desc = localStorage.getItem('education_desc');
              }
              if (!newData.education_school_en && localStorage.getItem('education_school_en')) {
                newData.education_school_en = localStorage.getItem('education_school_en');
              }
              if (!newData.education_major_en && localStorage.getItem('education_major_en')) {
                newData.education_major_en = localStorage.getItem('education_major_en');
              }
              if (!newData.education_years_en && localStorage.getItem('education_years_en')) {
                newData.education_years_en = localStorage.getItem('education_years_en');
              }
              if (!newData.education_desc_en && localStorage.getItem('education_desc_en')) {
                newData.education_desc_en = localStorage.getItem('education_desc_en');
              }
              setSiteInfo(newData as SiteInfo);
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Cập nhật favicon + SEO meta tags theo siteInfo
  useEffect(() => {
    if (!siteInfo) return;

    const setMeta = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };

    // Title
    if (siteInfo.name) {
      document.title = siteInfo.name;
      setMeta('meta[property="og:title"]',   'content', `${siteInfo.name} — Portfolio`);
      setMeta('meta[name="twitter:title"]',  'content', `${siteInfo.name} — Portfolio`);
    }

    // Favicon + og:image
    if (siteInfo.avatar_url) {
      const favicon = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
      if (favicon) favicon.href = siteInfo.avatar_url;
      setMeta('#og-image',                   'content', siteInfo.avatar_url);
      setMeta('#twitter-image',              'content', siteInfo.avatar_url);
    }

    // og:url
    setMeta('meta[property="og:url"]', 'content', window.location.origin);
  }, [siteInfo]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && targetUrl) {
      window.open(targetUrl, '_blank');
      setCountdown(null);
      setTargetUrl(null);
    }
    return () => clearTimeout(timer);
  }, [countdown, targetUrl]);

  const fetchSiteInfo = async () => {
    try {
      if (!supabase) {
        // Fallback data if Supabase is not configured
        setSiteInfo({
          name: "ANH TUẤN",
          avatar_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
          project_link: "https://tradiemlms.click/",
          education_school: "TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG",
          education_major: "CÔNG NGHỆ THÔNG TIN",
          education_years: "2024 - 2028",
          facebook_url: "#",
          instagram_url: "#",
          github_url: "#",
          email: "mailto:tuanaraoo@gmail.com"
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('site_info')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching site info:", error.message || error);
      } else if (data) {
        // Fallback for fields that might not exist in Supabase yet
        if (!data.education_logo && localStorage.getItem('education_logo')) {
          data.education_logo = localStorage.getItem('education_logo');
        }
        if (!data.education_desc && localStorage.getItem('education_desc')) {
          data.education_desc = localStorage.getItem('education_desc');
        }
        if (!data.education_school_en && localStorage.getItem('education_school_en')) {
          data.education_school_en = localStorage.getItem('education_school_en');
        }
        if (!data.education_major_en && localStorage.getItem('education_major_en')) {
          data.education_major_en = localStorage.getItem('education_major_en');
        }
        if (!data.education_years_en && localStorage.getItem('education_years_en')) {
          data.education_years_en = localStorage.getItem('education_years_en');
        }
        if (!data.education_desc_en && localStorage.getItem('education_desc_en')) {
          data.education_desc_en = localStorage.getItem('education_desc_en');
        }
        setSiteInfo(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const info = siteInfo || {
    name: "ANH TUẤN",
    avatar_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
    project_link: "https://tradiemlms.click/",
    education_school: "TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG",
    education_major: "CÔNG NGHỆ THÔNG TIN",
    education_years: "2024 - 2028",
    education_school_en: "University of Information Technology and Communication",
    education_major_en: "Information Technology",
    education_years_en: "2024 - 2028",
    education_desc_en: "",
    facebook_url: "#",
    instagram_url: "#",
    github_url: "#",
    email: "mailto:tuanaraoo@gmail.com"
  };

  const educationSchool = language === 'en'
    ? (info.education_school_en || t('education_school_default'))
    : (info.education_school || t('education_school_default'));

  const educationMajor = language === 'en'
    ? (info.education_major_en || t('education_major_default'))
    : (info.education_major || t('education_major_default'));

  const educationYears = language === 'en'
    ? (info.education_years_en || t('education_years_default'))
    : (info.education_years || t('education_years_default'));

  const educationDesc = language === 'en'
    ? (info.education_desc_en || t('education_desc_default'))
    : (info.education_desc || t('education_desc_default'));

  const socialLinks = [
    { icon: <Facebook size={16} />, href: info.facebook_url, label: "Facebook" },
    { icon: <Instagram size={16} />, href: info.instagram_url, label: "Instagram" },
    { icon: <Github size={16} />, href: info.github_url, label: "GitHub" },
    { icon: <Linkedin size={16} />, href: info.linkedin_url, label: "LinkedIn" },
    { icon: <Twitter size={16} />, href: info.twitter_url, label: "Twitter" },
    { icon: <Youtube size={16} />, href: info.youtube_url, label: "YouTube" },
    { icon: <Tiktok size={16} />, href: info.tiktok_url, label: "TikTok" },
    { icon: <Dribbble size={16} />, href: info.dribbble_url, label: "Dribbble" },
    { icon: <Behance size={16} />, href: info.behance_url, label: "Behance" },
    { icon: <Twitch size={16} />, href: info.twitch_url, label: "Twitch" },
    { icon: <Discord size={16} />, href: info.discord_url, label: "Discord" },
    { icon: <Mail size={16} />, href: info.email?.startsWith('mailto:') ? info.email : `mailto:${info.email}`, label: "Email" },
  ].filter(link => link.href && link.href !== "#" && link.href !== "mailto:" && link.href !== "mailto:undefined");

  // Adaptive animation variants
  const containerVariants: Variants = enableMotion ? {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: tier >= 3 ? 0.1 : 0.05,
        delayChildren: tier >= 3 ? 0.6 : 0.2,
        ease: "easeOut"
      }
    }
  } : { hidden: { opacity: 1 }, visible: { opacity: 1 } };

  const itemVariants: Variants = enableMotion ? {
    hidden: { opacity: 0, y: tier >= 3 ? 20 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: tier >= 3 ? 0.8 : 0.4, ease: "easeOut" }
    }
  } : { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } };

  const [firstName, ...lastNameParts] = info.name.split(' ');
  const lastName = lastNameParts.join(' ');

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            exit={{ opacity: 0, filter: "blur(10px)", scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-16 h-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-white/10 border-t-amber-500"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 rounded-full border border-white/5 border-b-amber-500"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-[1px] bg-gradient-to-r from-transparent to-amber-500/50" />
                <p className="text-amber-500 text-[10px] tracking-[0.3em] font-mono uppercase">{t('init')}</p>
                <div className="w-6 h-[1px] bg-gradient-to-l from-transparent to-amber-500/50" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-sans overflow-hidden text-white bg-transparent pointer-events-none">
        {/* Animated Background Engine */}
        <div className="pointer-events-auto">
          <Background />
        </div>

        <AnimatePresence>
          {!loading && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="w-full max-w-[800px] pointer-events-none flex flex-col"
            >
              {/* Mobile Header Row (Visible on mobile/tablet, hidden on desktop) */}
              <div className="w-full flex md:hidden items-center justify-between px-2 pb-4 pt-2 z-50 pointer-events-auto border-b border-white/5 mb-4 shrink-0">
                <div className="flex flex-col gap-1">
                  <div className="text-[9px] tracking-widest text-gray-500 uppercase">EST. {info.est_year || '2026'}</div>
                  <div className="flex items-center gap-1.5 text-[9px] tracking-widest font-mono">
                    <button
                      onClick={() => setLanguage('vi')}
                      className={`transition-colors uppercase ${language === 'vi' ? 'text-amber-500' : 'text-gray-500 hover:text-white'}`}
                    >
                      VI
                    </button>
                    <span className="text-gray-700">|</span>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`transition-colors uppercase ${language === 'en' ? 'text-amber-500' : 'text-gray-500 hover:text-white'}`}
                    >
                      EN
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] tracking-widest text-gray-500 uppercase">{info.location_text || t('location')}</p>
                  <p className="text-[8px] tracking-widest text-gray-700 uppercase mt-0.5">{info.coordinates || '14.0583° N, 108.2772° E'}</p>
                </div>
              </div>

              {/* Desktop HUD Elements (Hidden on mobile) */}
              <div className="hidden md:flex absolute top-12 left-12 flex-col gap-2 z-50 pointer-events-auto">
                <div className="w-4 h-4 border border-white/20"></div>
                <div className="text-[10px] tracking-widest text-gray-500">EST. {info.est_year || '2026'}</div>
                <div className="flex items-center gap-2 mt-4 text-[10px] tracking-widest font-mono">
                  <button
                    onClick={() => setLanguage('vi')}
                    className={`transition-colors uppercase ${language === 'vi' ? 'text-amber-500' : 'text-gray-500 hover:text-white'}`}
                  >
                    VI
                  </button>
                  <span className="text-gray-700">|</span>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`transition-colors uppercase ${language === 'en' ? 'text-amber-500' : 'text-gray-500 hover:text-white'}`}
                  >
                    EN
                  </button>
                </div>
              </div>

              <div className="hidden md:flex absolute top-12 right-12 flex-col items-end gap-4 z-50 pointer-events-auto">
                <div className="text-right">
                  <p className="text-[10px] tracking-widest text-gray-500 uppercase">{info.location_text || t('location')}</p>
                  <p className="text-[10px] tracking-widest text-gray-700 uppercase mt-1">{info.coordinates || '14.0583° N, 108.2772° E'}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!loading && (
            <motion.div
              key="main-card"
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 1.2,
                delay: 0.2,
                ease: "easeOut"
              }}
              style={{
                rotateX,
                rotateY,
                transformPerspective: 1000
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative z-10 w-full max-w-[800px] min-h-[450px] flex flex-col md:flex-row pointer-events-auto"
            >

              {/* Central Display Card */}
              <div
                className="flex-1 bg-white/[0.02] backdrop-blur-xl border border-white/10 p-6 sm:p-10 md:p-12 lg:p-16 flex flex-col justify-between relative"
              >
                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-amber-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-amber-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-500"></div>

                <div className="flex flex-col">
                  <button
                    onClick={() => setShowIntroPopup(true)}
                    className="text-amber-500 text-[10px] sm:text-xs font-mono tracking-widest mb-6 uppercase text-center sm:text-left hover:text-white transition-colors flex items-center justify-center sm:justify-start gap-2 group cursor-pointer bg-transparent border-none outline-none focus:outline-none"
                  >
                    <span>{t('menu_intro')}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                    </span>
                  </button>

                  <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-center sm:items-start mb-10 text-center sm:text-left">
                    {/* Profile Avatar */}
                    <motion.div
                      onClick={() => setShowIntroPopup(true)}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        y: [0, -5, 0]
                      }}
                      transition={{
                        scale: { delay: 0.2, duration: 0.8, ease: "easeOut" },
                        opacity: { delay: 0.2, duration: 0.8, ease: "easeOut" },
                        y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                      }}
                      className="relative w-36 h-36 sm:w-44 sm:h-44 shrink-0 transition-all duration-700 ease-out mx-auto sm:mx-0 sm:mt-2 group cursor-pointer rounded-full overflow-hidden"
                    >
                      <div className="w-full h-full p-1 border-2 border-amber-500/50 group-hover:border-amber-500 transition-colors duration-700 ease-out shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] rounded-full overflow-hidden">
                        <img
                          src={info.avatar_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"}
                          alt="Avatar"
                          className="w-full h-full object-cover contrast-110 saturate-110 transition-transform duration-700 ease-out rounded-full"
                        />
                      </div>
                    </motion.div>

                    <div className="flex-1 flex flex-col sm:flex-row justify-between items-center sm:items-start w-full gap-4">
                      <div className="flex flex-col items-center sm:items-start">
                        {/* Name */}
                        <h1 className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black tracking-widest leading-[1] mb-4">
                          {firstName}<br className="hidden sm:block" />
                          {lastName && (
                            <span className="text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.4)" }}>
                              {' '}{lastName}
                            </span>
                          )}
                        </h1>
                      </div>

                      {/* Actions Group (Projects + Gaming Center) */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-6 mt-4 sm:mt-0">
                        {/* Project Link */}
                        {info.project_link && (
                          <motion.button
                            onClick={() => {
                              setTargetUrl(info.project_link as string);
                              setCountdown(3);
                            }}
                            initial={{ opacity: 0, filter: "blur(4px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="flex flex-col items-center sm:items-end opacity-60 hover:opacity-100 transition-all cursor-pointer group bg-transparent border-none outline-none focus:outline-none"
                          >
                            <div className="relative w-9 h-9 sm:w-16 sm:h-16 mb-1 sm:mb-2">
                              {/* Outer dashed ring */}
                              <motion.svg
                                animate={{ rotate: 360 }}
                                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                viewBox="0 0 100 100"
                                className="absolute inset-0 w-full h-full text-white/20 group-hover:text-amber-500/50 transition-colors duration-500"
                              >
                                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 8" />
                              </motion.svg>
                              {/* Inner solid ring */}
                              <motion.svg
                                animate={{ rotate: -360 }}
                                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                viewBox="0 0 100 100"
                                className="absolute inset-0 w-full h-full text-amber-500/30 group-hover:text-amber-400 transition-colors duration-500"
                              >
                                <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="20 10" />
                              </motion.svg>
                              {/* Center dot */}
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-1 sm:h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)] group-hover:scale-150 group-hover:shadow-[0_0_15px_rgba(245,158,11,1)] transition-all duration-300"></div>
                            </div>

                            {/* Decorative lines/text */}
                            <div className="hidden sm:flex items-center gap-1.5 mb-0.5">
                              <div className="w-6 h-[1px] bg-amber-500/50 group-hover:bg-amber-500/80 transition-colors duration-500"></div>
                              <p className="text-[7px] font-mono tracking-[0.2em] text-amber-500 group-hover:text-amber-400 transition-colors duration-500 uppercase">{t('menu_project')}</p>
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5">
                              <div className="w-3 h-[1px] bg-amber-500/40 group-hover:bg-amber-500/80 transition-colors duration-500"></div>
                              <p className="text-[7px] font-mono tracking-[0.2em] text-gray-500 group-hover:text-amber-400 transition-colors duration-500 uppercase">
                                {info.project_name || "LINK"}
                              </p>
                            </div>
                          </motion.button>
                        )}

                        {/* Gaming Center Toggle */}
                        <motion.button
                          onClick={() => setShowGaming(true)}
                          initial={{ opacity: 0, filter: "blur(4px)" }}
                          animate={{ opacity: 1, filter: "blur(0px)" }}
                          transition={{ delay: 0.6, duration: 0.8 }}
                          className="flex flex-col items-center sm:items-end opacity-60 hover:opacity-100 transition-all cursor-pointer group bg-transparent border-none outline-none focus:outline-none"
                        >
                          <div className="relative w-9 h-9 sm:w-16 sm:h-16 mb-1 sm:mb-2">
                            {/* Outer dashed ring */}
                            <motion.svg
                              animate={{ rotate: -360 }}
                              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                              viewBox="0 0 100 100"
                              className="absolute inset-0 w-full h-full text-white/20 group-hover:text-amber-400/50 transition-colors duration-500"
                            >
                              <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
                            </motion.svg>
                            {/* Inner solid ring */}
                            <motion.svg
                              animate={{ rotate: 360 }}
                              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                              viewBox="0 0 100 100"
                              className="absolute inset-0 w-full h-full text-amber-500/30 group-hover:text-amber-300 transition-colors duration-500"
                            >
                              <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="15 15" />
                            </motion.svg>
                            {/* Game icon in the center */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500 group-hover:text-amber-400 transition-colors">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 sm:w-5 sm:h-5">
                                <line x1="6" y1="12" x2="10" y2="12" />
                                <line x1="8" y1="10" x2="8" y2="14" />
                                <line x1="15" y1="13" x2="15.01" y2="13" />
                                <line x1="18" y1="11" x2="18.01" y2="11" />
                                <rect x="2" y="6" width="20" height="12" rx="3" />
                              </svg>
                            </div>
                          </div>

                          {/* Decorative lines/text */}
                          <div className="hidden sm:flex items-center gap-1.5 mb-0.5">
                            <div className="w-6 h-[1px] bg-amber-500/50 group-hover:bg-amber-500/80 transition-colors duration-500"></div>
                            <p className="text-[7px] font-mono tracking-[0.2em] text-amber-500 group-hover:text-amber-400 transition-colors duration-500 uppercase">{t('menu_gaming')}</p>
                          </div>
                          <div className="hidden sm:flex items-center gap-1.5">
                            <div className="w-3 h-[1px] bg-amber-500/40 group-hover:bg-amber-500/80 transition-colors duration-500"></div>
                            <p className="text-[7px] font-mono tracking-[0.2em] text-gray-500 group-hover:text-amber-400 transition-colors duration-500">CENTER</p>
                          </div>
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Education / University */}
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="mb-10 w-full text-center sm:text-left"
                  >
                    <motion.button
                      variants={itemVariants}
                      onClick={() => setShowEducationPopup(true)}
                      className="text-amber-500 hover:text-white text-[10px] sm:text-xs font-mono tracking-widest mb-6 uppercase text-center sm:text-left transition-colors flex items-center justify-center sm:justify-start gap-2 group cursor-pointer bg-transparent border-none outline-none focus:outline-none w-full sm:w-auto"
                    >
                      <span>{t('menu_education')}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                      </span>
                    </motion.button>
                    <div className="flex flex-col gap-3 w-full items-center sm:items-start">
                      <motion.div
                        variants={itemVariants}
                        onClick={() => setShowEducationPopup(true)}
                        whileHover={{ scale: 1.02, x: 5, backgroundColor: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.4)" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 text-[9px] sm:text-[10px] md:text-xs font-tech uppercase tracking-widest text-white border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all cursor-pointer w-full sm:w-auto text-center sm:text-left"
                      >
                        {educationSchool}
                      </motion.div>

                      <div className="flex flex-row flex-wrap justify-center sm:justify-start gap-3 w-full sm:w-auto">
                        <motion.div
                          variants={itemVariants}
                          onClick={() => setShowEducationPopup(true)}
                          whileHover={{ scale: 1.05, backgroundColor: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.4)", color: "#fff" }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="px-3 sm:px-4 py-2.5 sm:py-3 text-[9px] sm:text-[10px] md:text-xs uppercase font-tech tracking-widest text-amber-500 border border-white/10 bg-white/[0.02] cursor-pointer text-center sm:text-left transition-all"
                        >
                          {educationMajor}
                        </motion.div>
                        <motion.div
                          variants={itemVariants}
                          onClick={() => setShowEducationPopup(true)}
                          whileHover={{ scale: 1.05, color: "#fff", backgroundColor: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.4)" }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="px-3 sm:px-4 py-2.5 sm:py-3 text-[9px] sm:text-[10px] md:text-xs uppercase tracking-widest text-white border border-white/10 bg-white/[0.02] cursor-pointer whitespace-nowrap transition-all"
                        >
                          {educationYears}
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Social Links Section */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                  className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12 border-t border-white/5 pt-6 sm:pt-8 text-center sm:text-left"
                >
                  <div className="flex flex-col gap-3 sm:gap-1 w-full">
                    <motion.span variants={itemVariants} className="text-[10px] sm:text-xs font-mono text-amber-500 tracking-widest uppercase mb-4 text-center sm:text-left">
                      {t('menu_social')}
                    </motion.span>
                    <div className="flex flex-row flex-wrap justify-center sm:justify-start gap-2 sm:gap-x-6 sm:gap-y-4">
                      {socialLinks.length > 0 ? socialLinks.map((link, index) => (
                        <motion.a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          variants={itemVariants}
                          whileHover={{ scale: 1.05, y: -2, transition: { duration: 0.2, ease: "easeOut" } }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs text-gray-400 hover:text-amber-500 transition-colors uppercase tracking-widest group p-2.5 sm:p-0 border border-white/5 sm:border-none bg-white/[0.02] sm:bg-transparent rounded-sm sm:rounded-none min-w-[38px] sm:min-w-0 h-[38px] sm:h-auto"
                          aria-label={link.label}
                        >
                          <motion.div
                            className="group-hover:text-amber-500 transition-colors duration-300"
                          >
                            {link.icon}
                          </motion.div>
                          <span className="hidden sm:inline relative">
                            {link.label}
                            <span className="absolute left-0 bottom-[-4px] w-0 h-[1px] bg-amber-500 transition-all duration-300 group-hover:w-full"></span>
                          </span>
                        </motion.a>
                      )) : (
                        <motion.span variants={itemVariants} className="text-[10px] text-gray-500">Chưa có liên kết</motion.span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Bottom Right Decoration */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="flex absolute bottom-[-20px] right-[-20px] w-32 h-32 border border-white/10 items-center justify-center opacity-40 pointer-events-none"
              >
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border border-amber-500/30 rotate-45"
                ></motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Suspense fallback={null}>
          <GamingHub isOpen={showGaming} onClose={() => setShowGaming(false)} />
        </Suspense>

        {/* Countdown Overlay */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto"
              onClick={() => {
                setCountdown(null);
                setTargetUrl(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="flex flex-col items-center gap-6 p-8 border border-amber-500/30 bg-black/50 cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[12px] font-mono tracking-[0.2em] text-amber-500 uppercase">
                  {t('redirecting')}
                </div>
                {siteInfo?.project_name && (
                  <div className="text-xl font-bold font-tech text-white mb-2 tracking-widest uppercase text-center">
                    {siteInfo.project_name}
                  </div>
                )}
                {!siteInfo?.project_name && targetUrl && (
                  <div className="text-sm font-mono text-gray-400 mb-2 max-w-xs truncate">
                    {targetUrl}
                  </div>
                )}
                <div className="text-8xl font-display font-bold text-white tabular-nums">
                  {countdown}
                </div>
                <button
                  onClick={() => {
                    setCountdown(null);
                    setTargetUrl(null);
                  }}
                  className="mt-4 px-6 py-2 border border-white/20 text-[10px] font-mono tracking-widest text-gray-400 hover:text-white hover:border-white/50 hover:bg-white/5 transition-all uppercase cursor-pointer"
                >
                  {t('redirect_cancel')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Intro Overlay Popup */}
        <AnimatePresence>
          {showIntroPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto"
              onClick={() => setShowIntroPopup(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#050505] border border-white/10 p-8 sm:p-12 max-w-2xl w-full relative overflow-hidden flex flex-col items-center text-center"
              >
                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-amber-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-amber-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-500"></div>

                <button
                  onClick={() => setShowIntroPopup(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-amber-500 transition-colors"
                >
                  <X size={24} />
                </button>

                <div className="w-24 h-24 sm:w-32 sm:h-32 mb-6 p-1 border-2 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] rounded-full overflow-hidden">
                  <img
                    src={siteInfo?.avatar_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"}
                    alt="Avatar"
                    className="w-full h-full object-cover contrast-110 saturate-110 rounded-full"
                  />
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 tracking-widest uppercase">
                  {siteInfo?.name || "ANH TUẤN"}
                </h2>
                <div className="text-amber-500 text-xs font-mono tracking-[0.2em] mb-6 uppercase">
                  {t('location')}
                </div>
                <div className="text-gray-400 text-sm font-sans leading-relaxed max-w-lg mx-auto">
                  {t('intro_text')}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Education Overlay Popup */}
        <AnimatePresence>
          {showEducationPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto"
              onClick={() => setShowEducationPopup(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#050505] border border-white/10 p-8 sm:p-12 max-w-2xl w-full relative overflow-hidden flex flex-col items-center text-center"
              >
                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-amber-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-amber-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-500"></div>

                <button
                  onClick={() => setShowEducationPopup(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-amber-500 transition-colors"
                >
                  <X size={24} />
                </button>

                <a
                  href="https://ictu.edu.vn"
                  target="_blank"
                  rel="noreferrer"
                  className="w-24 h-24 sm:w-32 sm:h-32 mb-6 p-2 bg-white/5 border border-white/10 rounded-full flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.12)] transition-transform hover:scale-105"
                >
                  {info.education_logo ? (
                    <img
                      src={info.education_logo}
                      alt={info.education_school}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-tech text-4xl">
                      {info.education_school.charAt(0)}
                    </div>
                  )}
                </a>
                <h2 className="text-xl sm:text-2xl font-tech font-bold text-white mb-2 tracking-widest uppercase">
                  {educationSchool}
                </h2>
                <div className="text-amber-500 text-xs font-mono tracking-[0.2em] mb-4 uppercase">
                  {educationMajor}
                </div>
                <div className="text-white text-xs font-mono tracking-[0.2em] mb-6 uppercase">
                  {educationYears}
                </div>
                {educationDesc && (
                  <div className="text-gray-400 text-sm font-sans leading-relaxed max-w-lg mx-auto border-t border-white/10 pt-6">
                    {educationDesc}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Visitor Stats (Mắt xem) */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 flex items-center gap-1.5 px-3 py-1.5 border border-white/10 bg-[#050505]/80 backdrop-blur-md rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-amber-500/30 transition-all duration-300 select-none group"
            title={t('views')}
          >
            <Eye size={12} className="text-gray-400 group-hover:text-amber-500 transition-colors" />
            <span className="text-[10px] sm:text-xs font-mono font-medium text-gray-300">
              {stats.totalViews}
            </span>
          </motion.div>
        )}

        {/* Audio Player Tag */}
        <audio ref={audioRef} src="/lofi.mp3" loop />

        {/* CSS Keyframes for Soundwave */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes soundwave {
            0%, 100% { height: 3px; }
            50% { height: 12px; }
          }
        `}} />

        {/* Floating Music Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          onClick={togglePlay}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 border border-white/10 bg-[#050505]/80 backdrop-blur-md rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-amber-500/30 transition-all duration-300 select-none group cursor-pointer"
        >
          {isPlaying ? (
            /* Soundwave Equalizer Animation */
            <div className="flex items-end gap-[2px] h-3 w-4 shrink-0 pb-[1px]">
              <span className="w-[1.5px] bg-amber-500 rounded-full animate-[soundwave_0.8s_ease-in-out_infinite]" style={{ animationDelay: '0.1s' }} />
              <span className="w-[1.5px] bg-amber-500 rounded-full animate-[soundwave_0.8s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }} />
              <span className="w-[1.5px] bg-amber-500 rounded-full animate-[soundwave_0.8s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }} />
              <span className="w-[1.5px] bg-amber-500 rounded-full animate-[soundwave_0.8s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }} />
            </div>
          ) : (
            /* Play Icon */
            <Play size={11} className="text-gray-400 group-hover:text-amber-500 transition-colors" />
          )}

          {/* Track Text */}
          <span className="text-[10px] sm:text-xs font-mono font-medium text-gray-300 group-hover:text-amber-500 transition-colors">
            {isPlaying 
              ? 'Acoustic Chill'
              : (language === 'vi' ? 'Phát Nhạc' : 'Play Music')
            }
          </span>

          {/* Mute toggle button (only visible when playing) */}
          {isPlaying && (
            <button
              onClick={toggleMute}
              className="text-gray-500 hover:text-white transition-colors border-l border-white/10 pl-1.5 sm:pl-2 shrink-0 flex items-center justify-center"
              title={isMuted ? (language === 'vi' ? 'Bật âm' : 'Unmute') : (language === 'vi' ? 'Tắt âm' : 'Mute')}
            >
              {isMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
            </button>
          )}
        </motion.div>

      </main>
    </>
  );
}
