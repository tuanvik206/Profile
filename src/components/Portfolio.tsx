import { Github, Facebook, Mail, Instagram, Loader2, Linkedin, Twitter, Youtube, Dribbble, Twitch } from "lucide-react";
import { motion, AnimatePresence, Variants, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import Background from "./Background";
import { supabase } from "../lib/supabase";
import { normalizeSiteInfo } from "../lib/security";
import { SiteInfo } from "../types";

// Fallback icon for TikTok/Discord or anything missing
const CustomIcon = ({ name, size = 16 }: { name: string, size?: number }) => (
  <div style={{ width: size, height: size }} className="flex items-center justify-center font-bold text-[10px]">
    {name.charAt(0)}
  </div>
);

export default function Portfolio() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // 3D Tilt Effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 100, mass: 1 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;

    mouseX.set(mouseXPos / width - 0.5);
    mouseY.set(mouseYPos / height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    // Add artificial delay for smoother loading experience
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 1500));
    Promise.all([fetchSiteInfo(), minLoadTime]).then(() => setLoading(false));
  }, []);

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
        const normalized = normalizeSiteInfo(data as SiteInfo);
        setSiteInfo(normalized as SiteInfo);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const info = normalizeSiteInfo(siteInfo || {
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
  }) as SiteInfo;

  const socialLinks = [
    { icon: <Facebook size={16} />, href: info.facebook_url, label: "Facebook" },
    { icon: <Instagram size={16} />, href: info.instagram_url, label: "Instagram" },
    { icon: <Github size={16} />, href: info.github_url, label: "GitHub" },
    { icon: <Linkedin size={16} />, href: info.linkedin_url, label: "LinkedIn" },
    { icon: <Twitter size={16} />, href: info.twitter_url, label: "Twitter" },
    { icon: <Youtube size={16} />, href: info.youtube_url, label: "YouTube" },
    { icon: <CustomIcon name="TikTok" size={16} />, href: info.tiktok_url, label: "TikTok" },
    { icon: <Dribbble size={16} />, href: info.dribbble_url, label: "Dribbble" },
    { icon: <CustomIcon name="Behance" size={16} />, href: info.behance_url, label: "Behance" },
    { icon: <Twitch size={16} />, href: info.twitch_url, label: "Twitch" },
    { icon: <CustomIcon name="Discord" size={16} />, href: info.discord_url, label: "Discord" },
    { icon: <Mail size={16} />, href: info.email?.startsWith('mailto:') ? info.email : `mailto:${info.email}`, label: "Email" },
  ].filter(link => link.href && link.href !== "#" && link.href !== "mailto:" && link.href !== "mailto:undefined");

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.6,
        ease: "easeOut"
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const [firstName, ...lastNameParts] = (info.name || 'ANH TUẤN').split(' ');
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
                <p className="text-amber-500 text-[10px] tracking-[0.3em] font-mono uppercase">Khởi tạo</p>
                <div className="w-6 h-[1px] bg-gradient-to-l from-transparent to-amber-500/50" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative min-h-screen flex items-center justify-center p-4 sm:p-8 font-sans overflow-hidden text-white bg-transparent pointer-events-none">
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
              className="absolute inset-0 pointer-events-none"
            >
              {/* Peripheral HUD Elements */}
              <div className="flex absolute top-4 left-4 sm:top-12 sm:left-12 flex-col gap-2 -z-10">
                <div className="w-4 h-4 border border-white/20"></div>
                <div className="text-[10px] tracking-widest text-gray-500">{info.est_label || 'EST. 2026'}</div>
              </div>

              <div className="absolute top-6 right-6 sm:top-12 sm:right-12 flex flex-col items-end gap-4 -z-10">
                <div className="text-right">
                  <p className="text-[10px] tracking-widest text-gray-500 uppercase">{info.location_name || 'Việt Nam'}</p>
                  <p className="hidden sm:block text-[10px] tracking-widest text-gray-700 uppercase">{info.location_coordinates || '14.0583° N, 108.2772° E'}</p>
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
                  <p className="text-amber-500 text-[10px] sm:text-xs font-mono tracking-widest mb-6 uppercase text-center sm:text-left">— GIỚI THIỆU</p>

                  <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-center sm:items-start mb-10 text-center sm:text-left">
                    {/* Profile Avatar */}
                    <motion.div
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
                      className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0 transition-all duration-700 ease-out mx-auto sm:mx-0 group cursor-pointer"
                    >
                      <div className="w-full h-full p-1 border-2 border-amber-500/50 group-hover:border-amber-500 transition-colors duration-700 ease-out shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                        <img
                          src={info.avatar_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"}
                          alt="Avatar"
                          className="w-full h-full object-cover contrast-110 saturate-110 transition-transform duration-700 ease-out"
                        />
                      </div>
                    </motion.div>

                    <div className="flex-1 flex flex-col sm:flex-row justify-between items-center sm:items-start w-full">
                      <div className="flex flex-col items-center sm:items-start">
                        {/* Name */}
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black tracking-widest leading-[1] mb-4">
                          {firstName}<br />
                          {lastName && (
                            <span className="text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.4)" }}>
                              {lastName}
                            </span>
                          )}
                        </h1>
                      </div>

                      {/* Right Side Geometric Accent (Project Link) */}
                      {info.project_link && (
                        <motion.a
                          href={info.project_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, filter: "blur(4px)" }}
                          animate={{ opacity: 1, filter: "blur(0px)" }}
                          transition={{ delay: 0.5, duration: 0.8 }}
                          className="absolute top-6 right-6 sm:relative sm:top-auto sm:right-auto flex flex-col items-end opacity-60 hover:opacity-100 transition-all cursor-pointer group mt-6 sm:mt-0"
                        >
                          <div className="relative w-10 h-10 sm:w-16 sm:h-16 mb-2 sm:mb-4">
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
                          <div className="flex items-center gap-1 sm:gap-2 mb-1">
                            <div className="w-4 sm:w-8 h-[1px] bg-white/20 group-hover:bg-amber-500/50 transition-colors duration-500"></div>
                            <p className="text-[6px] sm:text-[8px] font-mono tracking-[0.2em] sm:tracking-[0.3em] text-gray-400 group-hover:text-amber-500 transition-colors duration-500">DỰ ÁN</p>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-2 sm:w-4 h-[1px] bg-amber-500/40 group-hover:bg-amber-500/80 transition-colors duration-500"></div>
                            <p className="text-[6px] sm:text-[8px] font-mono tracking-[0.2em] sm:tracking-[0.3em] text-gray-500 group-hover:text-amber-400 transition-colors duration-500">LINK</p>
                          </div>
                        </motion.a>
                      )}
                    </div>
                  </div>

                  {/* Education / University */}
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="mb-10 w-full text-center sm:text-left"
                  >
                    <motion.p variants={itemVariants} className="text-[9px] text-gray-600 tracking-widest uppercase mb-4">Học vấn</motion.p>
                    <div className="flex flex-col gap-3 w-full items-center sm:items-start">
                      <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, x: 5, backgroundColor: "rgba(255,255,255,0.05)" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 text-[9px] sm:text-[10px] md:text-xs font-tech uppercase tracking-widest text-white border border-white/10 bg-white/[0.02] hover:border-white/30 transition-colors cursor-default w-full sm:w-auto text-center sm:text-left"
                      >
                        {info.education_school}
                      </motion.div>

                      <div className="flex flex-row flex-wrap justify-center sm:justify-start gap-3 w-full sm:w-auto">
                        <motion.div
                          variants={itemVariants}
                          whileHover={{ scale: 1.05, backgroundColor: "rgba(245,158,11,0.1)" }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="px-3 sm:px-4 py-2.5 sm:py-3 text-[9px] sm:text-[10px] md:text-xs uppercase font-tech tracking-widest text-amber-500 border border-amber-500/20 bg-amber-500/[0.02] cursor-default text-center sm:text-left transition-colors"
                        >
                          {info.education_major}
                        </motion.div>
                        <motion.div
                          variants={itemVariants}
                          whileHover={{ scale: 1.05, color: "#fff", backgroundColor: "rgba(255,255,255,0.05)" }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="px-3 sm:px-4 py-2.5 sm:py-3 text-[9px] sm:text-[10px] md:text-xs uppercase tracking-widest text-gray-400 border border-white/5 bg-white/[0.01] cursor-default whitespace-nowrap transition-colors"
                        >
                          {info.education_years}
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
                    <motion.span variants={itemVariants} className="text-[9px] text-gray-600 tracking-widest uppercase mb-1">
                      Liên kết qua
                    </motion.span>
                    <div className="flex flex-row flex-wrap justify-center sm:justify-start gap-x-6 gap-y-4">
                      {socialLinks.length > 0 ? socialLinks.map((link, index) => (
                        <motion.a
                          key={link.label}
                          href={link.href}
                          variants={itemVariants}
                          whileHover={{ scale: 1.05, y: -2, transition: { duration: 0.2, ease: "easeOut" } }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400 hover:text-amber-500 transition-colors uppercase tracking-widest pb-1 group"
                          aria-label={link.label}
                          rel="noopener noreferrer"
                          target={link.href?.startsWith('mailto:') ? undefined : '_blank'}
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

      </main>
    </>
  );
}
