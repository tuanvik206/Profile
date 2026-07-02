import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import Background from "./Background";

const GlitchText = ({ text }: { text: string }) => {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const scheduleGlitch = () => {
      const delay = Math.random() * 3000 + 1000;
      setTimeout(() => {
        setGlitching(true);
        setTimeout(() => {
          setGlitching(false);
          scheduleGlitch();
        }, 200 + Math.random() * 150);
      }, delay);
    };
    scheduleGlitch();
  }, []);

  return (
    <div className="relative inline-block select-none">
      <span
        className={`font-display font-black tracking-tighter text-white transition-none ${glitching ? "opacity-0" : "opacity-100"}`}
        style={{ fontSize: "clamp(5rem, 20vw, 14rem)", lineHeight: 1 }}
      >
        {text}
      </span>
      {glitching && (
        <>
          <span
            className="absolute inset-0 font-display font-black tracking-tighter text-amber-400"
            style={{
              fontSize: "clamp(5rem, 20vw, 14rem)",
              lineHeight: 1,
              clipPath: "inset(20% 0 50% 0)",
              transform: "translateX(-4px)",
              mixBlendMode: "screen",
            }}
          >
            {text}
          </span>
          <span
            className="absolute inset-0 font-display font-black tracking-tighter text-cyan-400"
            style={{
              fontSize: "clamp(5rem, 20vw, 14rem)",
              lineHeight: 1,
              clipPath: "inset(55% 0 20% 0)",
              transform: "translateX(4px)",
              mixBlendMode: "screen",
            }}
          >
            {text}
          </span>
        </>
      )}
    </div>
  );
};

const ScanlineOverlay = () => (
  <div
    className="fixed inset-0 pointer-events-none z-[1]"
    style={{
      backgroundImage:
        "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
    }}
  />
);

export default function NotFound() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-[#070707] text-white overflow-hidden flex flex-col">
      <ScanlineOverlay />
      <Background />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="font-mono text-[10px] tracking-widest text-gray-500 uppercase">
            {language === "vi" ? "LỖI HỆ THỐNG" : "SYSTEM ERROR"}
          </span>
        </div>
        <button
          onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
          className="font-mono text-[9px] tracking-widest text-gray-600 hover:text-amber-500 uppercase transition-colors border border-white/5 hover:border-amber-500/30 px-2 py-1"
        >
          {language === "vi" ? "EN" : "VI"}
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Decorative top corners */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-amber-500/40" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-amber-500/40" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-amber-500/40" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-amber-500/40" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          {/* Error code label */}
          <div className="flex items-center gap-2">
            <div className="h-[1px] w-8 bg-amber-500/40" />
            <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.3em] text-amber-500 uppercase">
              {language === "vi" ? "MÃ LỖI" : "ERROR CODE"} — HTTP 404
            </span>
            <div className="h-[1px] w-8 bg-amber-500/40" />
          </div>

          {/* Giant glitch 404 */}
          <div className="relative">
            <GlitchText text="404" />
            {/* Horizontal scan line that sweeps */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 0%, rgba(245,158,11,0.06) 50%, transparent 100%)",
                backgroundSize: "100% 30%",
              }}
              animate={{ backgroundPositionY: ["0%", "100%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Message */}
          <div className="space-y-2 max-w-md">
            <h1 className="font-display font-black text-xl sm:text-2xl tracking-widest uppercase text-white">
              {language === "vi" ? "KHÔNG TÌM THẤY TRANG" : "PAGE NOT FOUND"}
            </h1>
            <p className="font-mono text-[10px] sm:text-xs text-gray-500 tracking-wider leading-relaxed">
              {language === "vi"
                ? "Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển sang địa chỉ khác."
                : "The page you're looking for doesn't exist or has been moved to a different location."}
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 sm:gap-10 py-4 px-6 border border-white/5 bg-white/[0.01]">
            {[
              { label: language === "vi" ? "TRẠNG THÁI" : "STATUS", value: "404" },
              { label: language === "vi" ? "ĐỀ XUẤT" : "ROUTE", value: language === "vi" ? "KHÔNG XÁC ĐỊNH" : "UNDEFINED" },
              { label: language === "vi" ? "AUTO REDIRECT" : "AUTO REDIRECT", value: `${countdown}s` },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <span className="block font-mono text-[7px] sm:text-[8px] text-gray-600 uppercase tracking-widest mb-1">
                  {item.label}
                </span>
                <span className={`block font-mono text-xs sm:text-sm font-bold ${i === 2 ? "text-amber-500" : "text-white"}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Countdown bar */}
          <div className="w-64 sm:w-80 h-[2px] bg-white/5 overflow-hidden">
            <motion.div
              className="h-full bg-amber-500"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 10, ease: "linear" }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/")}
              className="group relative px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-[10px] tracking-widest uppercase transition-all duration-200 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M5 12l7 7M5 12l7-7" />
                </svg>
                {language === "vi" ? "VỀ TRANG CHỦ" : "GO HOME"}
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.history.back()}
              className="px-8 py-3 border border-white/10 hover:border-white/30 text-gray-400 hover:text-white font-mono text-[10px] tracking-widest uppercase transition-all duration-200"
            >
              {language === "vi" ? "QUAY LẠI" : "GO BACK"}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Bottom status bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-3 border-t border-white/5 shrink-0">
        <span className="font-mono text-[8px] text-gray-700 tracking-widest uppercase">
          {language === "vi" ? "HỆ THỐNG ĐANG TÌM ĐƯỜNG DẪN..." : "SYSTEM LOCATING ROUTE..."}
        </span>
        <AnimatePresence mode="wait">
          <motion.div
            key={countdown}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="font-mono text-[8px] text-amber-500/70 tracking-widest"
          >
            {language === "vi" ? `TỰ CHUYỂN HƯỚNG SAU ${countdown}S` : `AUTO REDIRECT IN ${countdown}S`}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
