import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../contexts/LanguageContext";
import { fetchValorantSkinCatalog } from "../lib/valorant";
import type { FavoriteGame, ValorantSkin, ValorantProfile } from "../types";

// Fallback arrays for Valorant Competitive Ranks and Weapon Skins
const FALLBACK_RANKS = [
  { tierName: "SẮT 1", tier: 3, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/3/largeicon.png" },
  { tierName: "SẮT 2", tier: 4, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/4/largeicon.png" },
  { tierName: "SẮT 3", tier: 5, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/5/largeicon.png" },
  { tierName: "ĐỒNG 1", tier: 6, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/6/largeicon.png" },
  { tierName: "ĐỒNG 2", tier: 7, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/7/largeicon.png" },
  { tierName: "ĐỒNG 3", tier: 8, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/8/largeicon.png" },
  { tierName: "BẠC 1", tier: 9, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/9/largeicon.png" },
  { tierName: "BẠC 2", tier: 10, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/10/largeicon.png" },
  { tierName: "BẠC 3", tier: 11, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/11/largeicon.png" },
  { tierName: "VÀNG 1", tier: 12, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/12/largeicon.png" },
  { tierName: "VÀNG 2", tier: 13, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/13/largeicon.png" },
  { tierName: "VÀNG 3", tier: 14, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/14/largeicon.png" },
  { tierName: "BẠCH KIM 1", tier: 15, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/15/largeicon.png" },
  { tierName: "BẠCH KIM 2", tier: 16, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/16/largeicon.png" },
  { tierName: "BẠCH KIM 3", tier: 17, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/17/largeicon.png" },
  { tierName: "KIM CƯƠNG 1", tier: 18, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/18/largeicon.png" },
  { tierName: "KIM CƯƠNG 2", tier: 19, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/19/largeicon.png" },
  { tierName: "KIM CƯƠNG 3", tier: 20, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/20/largeicon.png" },
  { tierName: "TIÊN PHONG 1", tier: 21, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/21/largeicon.png" },
  { tierName: "TIÊN PHONG 2", tier: 22, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/22/largeicon.png" },
  { tierName: "TIÊN PHONG 3", tier: 23, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/23/largeicon.png" },
  { tierName: "BẤT TỬ 1", tier: 24, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/24/largeicon.png" },
  { tierName: "BẤT TỬ 2", tier: 25, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/25/largeicon.png" },
  { tierName: "BẤT TỬ 3", tier: 26, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/26/largeicon.png" },
  { tierName: "HÀO QUANG", tier: 27, largeIcon: "https://media.valorant-api.com/competitivetiers/03b2d15d-4348-745f-4c15-d9a3b72f105a/27/largeicon.png" }
];

const FALLBACK_SKINS = [
  { weaponName: "Vandal", skinName: "Reaver Vandal", skinIcon: "https://media.valorant-api.com/weaponskinchromas/2d4957e8-468f-a95e-1678-01990924be30/displayicon.png" },
  { weaponName: "Vandal", skinName: "Prime Vandal", skinIcon: "https://media.valorant-api.com/weaponskinchromas/3fa942f2-45e0-8806-ab99-2e9bcf2ca8e2/displayicon.png" },
  { weaponName: "Vandal", skinName: "Kuronami Vandal", skinIcon: "https://media.valorant-api.com/weaponskinchromas/6ee35fa4-469b-13b3-2aa2-82ab87dc67b6/displayicon.png" },
  { weaponName: "Vandal", skinName: "Sovereign Vandal", skinIcon: "https://media.valorant-api.com/weaponskinchromas/b6426367-4e96-a0b2-75d1-9da781b0a2c5/displayicon.png" },
  { weaponName: "Vandal", skinName: "RGX 11z Pro Vandal", skinIcon: "https://media.valorant-api.com/weaponskinchromas/34327916-4171-8728-66df-2082269e843c/displayicon.png" },
  { weaponName: "Phantom", skinName: "Reaver Phantom", skinIcon: "https://media.valorant-api.com/weaponskinchromas/cd6ca68e-473d-6b58-0051-789a793c12aa/displayicon.png" },
  { weaponName: "Phantom", skinName: "Oni Phantom", skinIcon: "https://media.valorant-api.com/weaponskinchromas/4f1aa67e-409e-71b5-654a-d6bf0914f6b0/displayicon.png" },
  { weaponName: "Phantom", skinName: "Recon Phantom", skinIcon: "https://media.valorant-api.com/weaponskinchromas/09147e6d-4952-4424-df35-f483a992e4ec/displayicon.png" },
  { weaponName: "Operator", skinName: "Elderflame Operator", skinIcon: "https://media.valorant-api.com/weaponskinchromas/46a51241-4712-bdae-0738-4e89791404c0/displayicon.png" },
  { weaponName: "Sheriff", skinName: "Reaver Sheriff", skinIcon: "https://media.valorant-api.com/weaponskinchromas/e6037da9-4977-1c70-6da4-c6bfa6b449b5/displayicon.png" },
  { weaponName: "Sheriff", skinName: "Singularity Sheriff", skinIcon: "https://media.valorant-api.com/weaponskinchromas/5a07404e-4fbf-4050-8b1b-be84c718b532/displayicon.png" },
  { weaponName: "Ghost", skinName: "Sovereign Ghost", skinIcon: "https://media.valorant-api.com/weaponskinchromas/6b73b53f-4e01-cc91-7294-fdb47db95f72/displayicon.png" },
  { weaponName: "Melee", skinName: "RGX 11z Pro Firefly", skinIcon: "https://media.valorant-api.com/weaponskinchromas/2d59306b-4e1a-82ee-06a9-858cb2ee62bf/displayicon.png" },
  { weaponName: "Melee", skinName: "Reaver Karambit", skinIcon: "https://media.valorant-api.com/weaponskinchromas/632fb5b8-4bf8-e215-ca8f-16986cf339cf/displayicon.png" },
  { weaponName: "Melee", skinName: "Sovereign Sword", skinIcon: "https://media.valorant-api.com/weaponskinchromas/738dfbc6-4ba2-e5f6-b1cb-ccb1e7fa8f6e/displayicon.png" },
];

// Inline Custom Game Controller Icon
const GameControllerIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
    <line x1="6" y1="12" x2="10" y2="12" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="15" y1="13" x2="15.01" y2="13" />
    <line x1="18" y1="11" x2="18.01" y2="11" />
    <rect x="2" y="6" width="20" height="12" rx="3" />
  </svg>
);

export type { FavoriteGame, ValorantSkin, ValorantProfile };


export const DEFAULT_VAL_PROFILE: ValorantProfile = {
  ingameName: "",
  level: "",
  server: "",
  rankName: "",
  rankIcon: "",
  mainAgentUuids: [],
  favoriteSkins: []
};

export const DEFAULT_GAMES: FavoriteGame[] = [];

interface GamingHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GamingHub({ isOpen, onClose }: GamingHubProps) {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"favorite" | "valProfile" | "valorant">("favorite");
  const [games, setGames] = useState<FavoriteGame[]>([]);

  // Valorant Agents State (tab 3)
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [selectedAbilityIndex, setSelectedAbilityIndex] = useState<number>(0);
  const [agentsLoading, setAgentsLoading] = useState<boolean>(false);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  // Valorant Profile State (tab 2)
  const [valProfile, setValProfile] = useState<ValorantProfile>(DEFAULT_VAL_PROFILE);

  // API lookup lists for editing & rendering
  const [apiAgents, setApiAgents] = useState<any[]>([]);
  const [apiRanks, setApiRanks] = useState<any[]>([]);
  const [apiSkins, setApiSkins] = useState<any[]>([]);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);


  // Load data from Supabase, fallback to localStorage
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        if (supabase) {
          try {
            const { data, error } = await supabase.from('site_info').select('favorite_games, valorant_profile').single();
            if (!error) {
              if (data && 'favorite_games' in data) {
                if (Array.isArray(data.favorite_games)) {
                  setGames(data.favorite_games);
                }
              }
              if (data?.valorant_profile) {
                setValProfile(data.valorant_profile);
              } else {
                loadValProfileFallback();
              }
              return;
            }
          } catch (err) {
            console.error("Error loading data from Supabase:", err);
          }
        }

        // Fallback localStorage (không dùng sample data)
        const storedGames = localStorage.getItem("favorite_games");
        if (storedGames) {
          try {
            setGames(JSON.parse(storedGames));
          } catch (e) {
            setGames([]);
          }
        } else {
          setGames([]);
        }

        loadValProfileFallback();
      };

      const loadValProfileFallback = () => {
        const storedProfile = localStorage.getItem("valorant_profile");
        if (storedProfile) {
          try {
            setValProfile(JSON.parse(storedProfile));
          } catch (e) {
            setValProfile(DEFAULT_VAL_PROFILE);
          }
        } else {
          setValProfile(DEFAULT_VAL_PROFILE);
        }
      };

      fetchData();

      // Đăng ký Supabase Realtime để đồng bộ tức thời khi Admin thay đổi dữ liệu
      let channel: any;
      if (supabase) {
        channel = supabase
          .channel('gaming_hub_changes')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'site_info' },
            (payload) => {
              if (payload.new) {
                if (payload.new.favorite_games && Array.isArray(payload.new.favorite_games)) {
                  setGames(payload.new.favorite_games);
                }
                if (payload.new.valorant_profile) {
                  setValProfile(payload.new.valorant_profile);
                }
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
    }
  }, [isOpen]);

  // Load lookup data on demand
  useEffect(() => {
    if (isOpen && (activeTab === "valProfile" || activeTab === "valorant") && apiAgents.length === 0) {
      loadLookupData();
    }
  }, [isOpen, activeTab, apiAgents.length]);

  useEffect(() => {
    // Reset API data when language changes so it refetches
    setApiAgents([]);
    setAgents([]);
    setSelectedAgent(null);
  }, [language]);

  const loadLookupData = async () => {
    setAgentsLoading(true);
    setLookupLoading(true);
    setAgentsError(null);

    if (apiRanks.length === 0) setApiRanks(FALLBACK_RANKS);
    if (apiSkins.length === 0) setApiSkins(FALLBACK_SKINS);

    try {
      try {
        const agentsRes = await fetch(`https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=${language === 'vi' ? 'vi-VN' : 'en-US'}`);
        if (agentsRes.ok) {
          const agentsJson = await agentsRes.json();
          if (agentsJson.data && Array.isArray(agentsJson.data)) {
            const sortedAgents = agentsJson.data.sort((a: any, b: any) => a.displayName.localeCompare(b.displayName));
            setApiAgents(sortedAgents);
            setAgents(sortedAgents);
            setSelectedAgent(sortedAgents[0]);
            setSelectedAbilityIndex(0);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch agents, using local state if any", e);
      }

      try {
        const ranksRes = await fetch("https://valorant-api.com/v1/competitivetiers");
        if (ranksRes.ok) {
          const ranksJson = await ranksRes.json();
          if (ranksJson.data && Array.isArray(ranksJson.data)) {
            const latestSet = ranksJson.data.reduce((prev: any, current: any) =>
              (current.tiers?.length > prev.tiers?.length) ? current : prev
              , ranksJson.data[0]);
            const validTiers = (latestSet.tiers || []).filter((t: any) => t.tierName && t.tier > 2);

            const processedTiers = validTiers.map((t: any) => {
              let displayName = t.tierName;
              if (displayName.startsWith("IRON")) displayName = displayName.replace("IRON", "SẮT");
              else if (displayName.startsWith("BRONZE")) displayName = displayName.replace("BRONZE", "ĐỒNG");
              else if (displayName.startsWith("SILVER")) displayName = displayName.replace("SILVER", "BẠC");
              else if (displayName.startsWith("GOLD")) displayName = displayName.replace("GOLD", "VÀNG");
              else if (displayName.startsWith("PLATINUM")) displayName = displayName.replace("PLATINUM", "BẠCH KIM");
              else if (displayName.startsWith("DIAMOND")) displayName = displayName.replace("DIAMOND", "KIM CƯƠNG");
              else if (displayName.startsWith("ASCENDANT")) displayName = displayName.replace("ASCENDANT", "TIÊN PHONG");
              else if (displayName.startsWith("IMMORTAL")) displayName = displayName.replace("IMMORTAL", "BẤT TỬ");
              else if (displayName === "RADIANT") displayName = "HÀO QUANG";
              return {
                ...t,
                tierName: displayName
              };
            });
            if (processedTiers.length > 0) {
              setApiRanks(processedTiers);
            }
          }
        }
      } catch (e) {
        console.warn("Failed to fetch competitive tiers, using fallback ranks", e);
      }

      try {
        const skins = await fetchValorantSkinCatalog(language);
        if (skins.length > 0) {
          const formattedFallback = FALLBACK_SKINS.map(fs => ({
            ...fs,
            skinUuid: "",
            englishName: fs.skinName
          }));
          const combined = [...skins, ...formattedFallback];
          const uniqueSkins = Array.from(new Map(combined.map(s => [s.skinName, s])).values());
          setApiSkins(uniqueSkins.sort((a, b) => a.skinName.localeCompare(b.skinName)));
        }
      } catch (e) {
        console.warn("Failed to fetch weapons/skins, using fallback skins", e);
      }

    } catch (err: any) {
      console.error(err);
    } finally {
      setAgentsLoading(false);
      setLookupLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-2.5 sm:p-6 bg-black/90 backdrop-blur-md pointer-events-auto overflow-hidden text-white"
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-6xl h-[94vh] sm:h-[88vh] bg-[#070707] border border-white/10 flex flex-col p-3.5 sm:p-8 md:p-10 overflow-hidden shadow-2xl"
        >
          {/* Decorative Corners */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-500"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-amber-500"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-amber-500"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-500"></div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-8 sm:right-8 text-gray-500 hover:text-white transition-colors z-[210] group"
          >
            <span className="text-[10px] tracking-widest uppercase flex items-center gap-1.5 sm:gap-2">
              <span className="hidden xs:inline">{t('close')}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 xs:w-3.5 xs:h-3.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <div className="hidden sm:block w-4 h-[1px] bg-gray-500 group-hover:bg-white transition-colors"></div>
            </span>
          </button>

          {/* Title Area */}
          <div className="mb-4 sm:mb-6 pr-16">
            <p className="text-amber-500 text-[9px] sm:text-[10px] font-mono tracking-widest mb-1 uppercase flex items-center gap-1.5">
              <GameControllerIcon size={10} /> {t('menu_gaming')}
            </p>
            <h2 className="text-xl sm:text-4xl font-display font-black tracking-widest uppercase">
              {t('gaming_space')} <span className="text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.4)" }}>{t('gaming_entertainment')}</span>
            </h2>
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-white/10 mb-4 sm:mb-6 gap-4 sm:gap-8 overflow-x-auto whitespace-nowrap no-scrollbar shrink-0 pb-1">
            <button
              onClick={() => setActiveTab("favorite")}
              className={`pb-2.5 font-mono text-[9px] sm:text-xs tracking-widest uppercase relative transition-colors ${activeTab === "favorite" ? "text-amber-500" : "text-gray-500 hover:text-gray-300"
                }`}
            >
              {t('favorite_games')}
              {activeTab === "favorite" && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("valProfile")}
              className={`pb-2.5 font-mono text-[9px] sm:text-xs tracking-widest uppercase relative transition-colors ${activeTab === "valProfile" ? "text-amber-500" : "text-gray-500 hover:text-gray-300"
                }`}
            >
              {t('val_profile')}
              {activeTab === "valProfile" && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("valorant")}
              className={`pb-2.5 font-mono text-[9px] sm:text-xs tracking-widest uppercase relative transition-colors ${activeTab === "valorant" ? "text-amber-500" : "text-gray-500 hover:text-gray-300"
                }`}
            >
              {t('agent_database')}
              {activeTab === "valorant" && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500"
                />
              )}
            </button>
          </div>

          {/* Main Content Pane */}
          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
            {activeTab === "favorite" ? (
              // TAB 1: FAVORITE GAMES (ONLY IMAGE AND NAME)
              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 content-start gap-4 pb-4 custom-scrollbar">
              {games.length > 0 ? games.map((game) => (
                  <div
                    key={game.id}
                    className="group border border-white/10 bg-white/[0.01] hover:bg-black/20 hover:border-amber-500/40 transition-all duration-500 relative overflow-hidden aspect-[16/10] rounded-sm flex flex-col justify-end"
                  >
                    {/* Game Cover Image */}
                    <div className="absolute inset-0 overflow-hidden bg-black/40">
                      <img
                        src={game.image_url}
                        alt={game.title}
                        loading="lazy"
                        className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop";
                        }}
                      />
                      {/* Gradient Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-95 transition-all duration-500"></div>
                      <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    </div>

                    {/* Cyber line indicator */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500/20 group-hover:bg-amber-500 transition-all duration-500 scale-x-0 group-hover:scale-x-100 origin-left"></div>

                    {/* Game Name */}
                    <div className="relative z-10 p-3 sm:p-4 space-y-1 transform group-hover:translate-y-[-2px] transition-transform duration-500">
                      <h3 className="text-xs sm:text-sm font-bold font-mono tracking-wider text-white group-hover:text-amber-500 transition-colors uppercase truncate">
                        {game.title}
                      </h3>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full flex flex-col items-center justify-center gap-3 py-20 text-center">
                    <div className="w-12 h-12 border border-dashed border-white/10 flex items-center justify-center mb-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8M12 17v4" />
                      </svg>
                    </div>
                    <p className="text-[10px] font-mono tracking-widest text-gray-600 uppercase">{t('no_games_yet')}</p>
                  </div>
                )}
              </div>
            ) : activeTab === "valProfile" ? (
              // TAB 2: VALORANT PLAYER PROFILE
              // Mobile: outer scrolls (flex-col). Desktop lg+: each column scrolls independently (flex-row, outer overflow-y-hidden)
              <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 overflow-x-hidden overflow-y-auto lg:overflow-y-hidden custom-scrollbar">

                {/* ── LEFT COLUMN: Player Identity Card ── */}
                <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 overflow-x-hidden lg:overflow-y-auto custom-scrollbar">
                  <div className="border border-white/10 bg-white/[0.01] p-5 sm:p-6 relative flex flex-col gap-5">
                    {/* Decorative top line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-yellow-500 to-transparent" />
                    {/* Bg logo */}
                    <div className="absolute -bottom-8 -right-8 w-40 h-40 opacity-5 pointer-events-none">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current"><path d="M10 30 L50 10 L90 30 L50 90 Z" /></svg>
                    </div>

                    {/* Ingame Name */}
                    <div>
                      <span className="text-[8px] font-mono tracking-widest text-amber-500 uppercase">{t('agent_profile_header')}</span>
                      <h3 className="text-2xl sm:text-3xl font-display font-black tracking-widest text-white mt-1 uppercase break-all">
                        {valProfile.ingameName}
                      </h3>
                    </div>

                    {/* Level & Server */}
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
                      <div>
                        <span className="text-[8px] font-mono tracking-widest text-gray-500 uppercase">{t('level')}</span>
                        <p className="text-sm font-mono text-amber-500 font-bold mt-0.5">{valProfile.level}</p>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono tracking-widest text-gray-500 uppercase">{t('server')}</span>
                        <p className="text-xs font-mono text-gray-300 font-medium mt-0.5 truncate">{valProfile.server}</p>
                      </div>
                    </div>

                    {/* Rank */}
                    <div className="pt-3.5 border-t border-white/5 flex items-center gap-4">
                      <div className="w-14 h-14 shrink-0 bg-black/40 border border-white/10 flex items-center justify-center relative rounded-sm p-1">
                        <div className="absolute inset-0 bg-amber-500/5 blur-md" />
                        {valProfile.rankIcon ? (
                          <img src={valProfile.rankIcon} alt={valProfile.rankName}
                            className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                            referrerPolicy="no-referrer" />
                        ) : (
                          <div className="text-[10px] font-mono text-gray-500">RANK</div>
                        )}
                      </div>
                      <div>
                        <span className="text-[8px] font-mono tracking-widest text-gray-500 uppercase">{t('current_rank')}</span>
                        <p className="text-base font-bold tracking-wider uppercase text-white mt-0.5">{valProfile.rankName}</p>
                        <span className="text-[8px] font-mono text-amber-500/80 uppercase">{t('competitive_system')}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="pt-4 border-t border-white/5 space-y-2">
                      <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase">{t('val_stats_header')}</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: t('val_kd_ratio'), value: valProfile.kd || "1.15", color: "text-white" },
                          { label: t('val_win_rate'), value: valProfile.winrate || "53.2%", color: "text-white" },
                          { label: t('val_headshot'), value: valProfile.headshot || "22.5%", color: "text-white" },
                          { label: t('val_matches'), value: valProfile.matchesPlayed || "5", color: "text-amber-500" },
                        ].map((stat, i) => (
                          <div key={i} className="bg-white/[0.02] border border-white/5 p-3 rounded-sm text-center hover:border-amber-500/20 transition-colors">
                            <span className="text-[9px] font-mono text-gray-500 uppercase block">{stat.label}</span>
                            <span className={`text-sm font-mono font-bold block mt-1 ${stat.color}`}>{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Main Agents — click để xem thông tin đặc vụ */}
                    <div className="pt-4 border-t border-white/5 space-y-2">
                      <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase">{t('main_agents')}</span>
                      <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1.5">
                        {valProfile.mainAgentUuids?.map((uuid, idx) => {
                          const agent = apiAgents.find(a => a.uuid === uuid) || agents.find(a => a.uuid === uuid);
                          const canNavigate = !!agent;
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (!agent) return;
                                // Nếu data agents chưa load thì load trước rồi navigate
                                if (agents.length === 0) {
                                  loadLookupData().then(() => {
                                    setSelectedAgent(agent);
                                    setSelectedAbilityIndex(0);
                                    setActiveTab("valorant");
                                  });
                                } else {
                                  setSelectedAgent(agent);
                                  setSelectedAbilityIndex(0);
                                  setActiveTab("valorant");
                                }
                              }}
                              disabled={!canNavigate}
                              title={canNavigate ? (agent?.displayName + " — Xem thông tin đặc vụ") : t('loading')}
                              className={`flex items-center gap-3 p-2.5 border rounded-sm shrink-0 min-w-[130px] transition-all duration-200 group text-left ${
                                canNavigate
                                  ? "bg-white/[0.02] border-white/5 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer"
                                  : "bg-white/[0.01] border-white/5 opacity-50 cursor-default"
                              }`}
                            >
                              <div className="w-10 h-10 bg-black/40 border border-white/10 rounded-sm shrink-0 flex items-center justify-center group-hover:border-amber-500/30 transition-colors">
                                {agent?.displayIcon
                                  ? <img src={agent.displayIcon} alt={agent.displayName} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                  : <span className="text-[9px] font-mono text-gray-500">?</span>}
                              </div>
                              <div className="min-w-0 overflow-hidden">
                                <p className="text-[11px] font-bold text-white uppercase truncate group-hover:text-amber-500 transition-colors">{agent?.displayName || t('loading')}</p>
                                <p className="text-[9px] font-mono text-gray-500 uppercase truncate">{agent?.role?.displayName || "ROLE"}</p>
                                {canNavigate && (
                                  <p className="text-[7px] font-mono text-amber-500/50 uppercase mt-0.5 group-hover:text-amber-500/80 transition-colors">► Xem chi tiết</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT COLUMN: Skin Collection ── */}
                <div className="w-full lg:flex-1 min-w-0 shrink-0 lg:shrink overflow-x-hidden lg:overflow-y-auto custom-scrollbar">
                  <div className="border border-white/10 bg-white/[0.01] p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[8px] font-mono tracking-widest text-amber-500 uppercase">{t('gun_skins_showcase')}</span>
                        <h4 className="text-sm font-bold tracking-wider text-white mt-0.5 uppercase">{t('favorite_collection')}</h4>
                      </div>
                      <span className="text-[8px] font-mono text-gray-600 tracking-widest uppercase hidden sm:inline">
                        {t('total_skins').replace('{count}', (valProfile.favoriteSkins?.length || 0).toString())}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 content-start gap-4 pb-4">
                      {valProfile.favoriteSkins && valProfile.favoriteSkins.length > 0 ? (
                        valProfile.favoriteSkins.map((skin, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            className="group p-4 bg-white/[0.02] border border-white/5 hover:border-amber-500/30 hover:bg-white/[0.04] transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[180px] sm:min-h-[140px]"
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/0 group-hover:bg-amber-500/[0.03] blur-xl rounded-full transition-all duration-500 pointer-events-none" />
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <span className="text-[8px] font-mono tracking-widest text-amber-500 bg-amber-500/5 border border-amber-500/10 px-1.5 py-0.5 uppercase">
                                  {skin.weaponName && skin.weaponName !== "Unknown" ? skin.weaponName : (skin.skinName.split(' ')[0] || "WEAPON")}
                                </span>
                                <span className="text-[8px] font-mono text-gray-600">#{idx + 1}</span>
                              </div>
                              <h5 className="text-[11px] font-bold text-white uppercase group-hover:text-amber-500 transition-colors tracking-wide truncate mt-1">
                                {language === 'en' && skin.englishName ? skin.englishName : skin.skinName}
                              </h5>
                            </div>
                            <div className="h-24 sm:h-16 flex items-center justify-center p-1 relative mt-3 sm:mt-1 select-none shrink-0">
                              {skin.skinIcon ? (
                                <img src={skin.skinIcon} alt={skin.skinName}
                                  className="max-w-full max-h-full object-contain scale-[1.05] sm:scale-100 group-hover:scale-[1.12] sm:group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_10px_10px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_15px_15px_rgba(245,158,11,0.2)]"
                                  referrerPolicy="no-referrer" />
                              ) : (
                                <div className="text-[9px] font-mono text-gray-500 uppercase">{t('unknown')}</div>
                              )}
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10">
                          <p className="text-xs text-gray-500 font-mono uppercase mb-4">{t('empty_collection_title')}</p>
                          <p className="text-[9px] text-gray-600 font-mono uppercase">{t('empty_collection_desc')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
                {agentsLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    <p className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">{t('connecting_api')}</p>
                  </div>
                ) : agentsError ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6">
                    <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-500 font-mono text-xs max-w-md">
                      {agentsError}
                    </div>
                    <button
                      onClick={loadLookupData}
                      className="px-4 py-2 bg-white/5 hover:bg-amber-500 border border-white/10 hover:border-amber-500 text-white hover:text-black font-mono text-[10px] tracking-widest uppercase transition-colors"
                    >
                      {t('retry')}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Left Panel: Agent Selection Scroll List */}
                    <div className="w-full md:w-56 shrink-0 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto md:overflow-x-hidden pr-0 md:pr-2 gap-2 pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-white/10 custom-scrollbar">
                      {agents.map((agent) => {
                        const isSelected = selectedAgent?.uuid === agent.uuid;
                        return (
                          <button
                            key={agent.uuid}
                            onClick={() => {
                              setSelectedAgent(agent);
                              setSelectedAbilityIndex(0);
                            }}
                            className={`flex items-center gap-3 p-2 border shrink-0 transition-all ${isSelected
                                ? "bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                                : "bg-white/[0.01] border-white/5 text-gray-400 hover:text-white hover:border-white/20"
                              }`}
                          >
                            <img
                              src={agent.displayIcon}
                              alt={agent.displayName}
                              className="w-8 h-8 rounded-sm bg-black/40 border border-white/10 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="text-left hidden md:block">
                              <p className="text-[11px] font-bold tracking-wider leading-none uppercase">
                                {agent.displayName}
                              </p>
                              <p className="text-[8px] font-mono text-gray-500 uppercase mt-0.5">
                                {agent.role?.displayName || "Agent"}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Panel: Interactive Agent Details Display */}
                    {selectedAgent && (
                      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-y-auto lg:overflow-hidden pr-1 pb-4 lg:pb-0 custom-scrollbar">
                        {/* Artwork with background banner */}
                        <div className="w-full lg:w-2/5 flex items-center justify-center bg-black/20 border border-white/10 relative overflow-hidden min-h-[260px] lg:min-h-0 shrink-0">
                          {/* Radial Background Artwork Shape */}
                          {selectedAgent.background && (
                            <img
                              src={selectedAgent.background}
                              alt="Background Art"
                              className="absolute inset-0 w-full h-full object-cover opacity-20 scale-125 saturate-50 mix-blend-color-dodge"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-[#070707]/60 pointer-events-none"></div>

                          {/* Agent Main Portrait */}
                          {(selectedAgent.fullPortrait || selectedAgent.bustPortrait) && (
                            <motion.img
                              key={selectedAgent.uuid}
                              initial={{ opacity: 0, scale: 0.9, y: 15 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              src={selectedAgent.fullPortrait || selectedAgent.bustPortrait}
                              alt={selectedAgent.displayName}
                              className="w-full h-full object-contain max-h-[260px] lg:max-h-[380px] z-10 drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)]"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>

                        {/* Interactive Abilities & Description Card */}
                        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-2">
                          <div className="space-y-4">
                            {/* Header details */}
                            <div>
                              <div className="flex items-center gap-2.5">
                                {selectedAgent.role?.displayIcon && (
                                  <img
                                    src={selectedAgent.role.displayIcon}
                                    alt={selectedAgent.role.displayName}
                                    className="w-4 h-4 invert opacity-75"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                <span className="text-[9px] font-mono tracking-[0.2em] text-amber-500 uppercase">
                                  {selectedAgent.role?.displayName || "Agent"}
                                </span>
                              </div>
                              <h3 className="text-3xl font-display font-black tracking-widest text-white mt-1 uppercase">
                                {selectedAgent.displayName}
                              </h3>
                            </div>

                            {/* Bio */}
                            <p className="text-xs text-gray-400 leading-relaxed font-sans border-l-2 border-amber-500/40 pl-3">
                              {selectedAgent.description}
                            </p>

                            {/* Interactive Abilities Tab-set */}
                            <div className="pt-3">
                              <p className="text-[8px] font-mono tracking-widest text-gray-500 uppercase mb-2">{t('abilities_info')}</p>
                              <div className="flex gap-2">
                                {selectedAgent.abilities?.map((ability: any, idx: number) => {
                                  if (!ability.displayName || ability.slot === "Passive") return null;
                                  const isActive = selectedAbilityIndex === idx;
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => setSelectedAbilityIndex(idx)}
                                      className={`w-10 h-10 border flex items-center justify-center p-1.5 transition-all ${isActive
                                          ? "bg-amber-500/10 border-amber-500 text-amber-500"
                                          : "bg-white/[0.01] border-white/10 text-gray-500 hover:text-white hover:border-white/30"
                                        }`}
                                      title={ability.displayName}
                                    >
                                      {ability.displayIcon ? (
                                        <img
                                          src={ability.displayIcon}
                                          alt={ability.displayName}
                                          className={`w-full h-full object-contain transition-all ${isActive ? "brightness-100" : "opacity-40 brightness-75 group-hover:opacity-100"}`}
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <span className="text-[9px] font-mono">{ability.slot?.replace("Ability", "A") || idx}</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Selected Ability Detail view */}
                              <AnimatePresence mode="wait">
                                {selectedAgent.abilities?.[selectedAbilityIndex] && (
                                  <motion.div
                                    key={selectedAbilityIndex}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.25 }}
                                    className="mt-3 p-3 bg-white/[0.02] border border-white/5 rounded-sm"
                                  >
                                    <p className="text-[10px] font-bold tracking-wider uppercase text-amber-500">
                                      {selectedAgent.abilities[selectedAbilityIndex].displayName}
                                    </p>
                                    <p className="text-[10px] leading-relaxed text-gray-400 font-sans mt-1">
                                      {selectedAgent.abilities[selectedAbilityIndex].description}
                                    </p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                          {/* Signature line / stats footer */}
                          <div className="mt-4 pt-3 border-t border-white/5 text-right">
                            <span className="text-[8px] font-mono text-gray-600 tracking-widest uppercase">
                              VALORANT-API.COM // RIOT GAMES
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
