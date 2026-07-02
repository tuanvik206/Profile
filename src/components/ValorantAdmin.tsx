import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ValorantProfile, ValorantSkin } from '../types';
import { Loader2 } from 'lucide-react';
import { DEFAULT_VAL_PROFILE } from './GamingHub';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchValorantSkinCatalog } from '../lib/valorant';

export default function ValorantAdmin() {
  const { language, t } = useLanguage();
  const [valProfile, setValProfile] = useState<ValorantProfile>(DEFAULT_VAL_PROFILE);
  const [apiAgents, setApiAgents] = useState<any[]>([]);
  const [apiRanks, setApiRanks] = useState<any[]>([]);
  const [apiSkins, setApiSkins] = useState<any[]>([]);
  const [skinSearchQuery, setSkinSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  // Riot API Sync states
  const [riotIdInput, setRiotIdInput] = useState("");
  const [riotRegion, setRiotRegion] = useState("ap");
  const [henrikKey, setHenrikKey] = useState(() => localStorage.getItem("henrik_api_key") || "");
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [language]);

  const handleSyncFromRiot = async () => {
    if (!riotIdInput.includes("#")) {
      alert("Vui lòng nhập đúng định dạng Riot ID, ví dụ: TuanVik#206");
      return;
    }
    const [name, tag] = riotIdInput.split("#");
    if (!name.trim() || !tag.trim()) {
      alert("Vui lòng nhập đúng định dạng Riot ID, ví dụ: TuanVik#206");
      return;
    }

    setSyncLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const apiKey = henrikKey.trim() || import.meta.env.VITE_HENRIK_API_KEY || '';
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['Authorization'] = apiKey;
      }

      // 1. Fetch account level
      const accountRes = await fetch(
        `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(name.trim())}/${encodeURIComponent(tag.trim())}`,
        { headers }
      );
      
      let level = valProfile.level;
      let actualRegion = riotRegion;

      if (accountRes.ok) {
        const accountData = await accountRes.json();
        if (accountData.status === 200 && accountData.data) {
          level = String(accountData.data.account_level || level);
          actualRegion = accountData.data.region || actualRegion;
          setRiotRegion(actualRegion);
        }
      } else if (accountRes.status === 401) {
        throw new Error("API Key của HenrikDev không hợp lệ hoặc đã hết hạn. Vui lòng nhập HenrikDev API Key hợp lệ!");
      } else {
        const errJson = await accountRes.json().catch(() => ({}));
        console.warn("Account API failed:", errJson);
      }

      // 2. Fetch MMR (current rank and icon)
      const mmrRes = await fetch(
        `https://api.henrikdev.xyz/valorant/v2/mmr/${actualRegion}/${encodeURIComponent(name.trim())}/${encodeURIComponent(tag.trim())}`,
        { headers }
      );

      let rankName = valProfile.rankName;
      let rankIcon = valProfile.rankIcon;

      if (mmrRes.ok) {
        const mmrData = await mmrRes.json();
        if (mmrData.status === 200 && mmrData.data) {
          const currentData = mmrData.data.current_data;
          if (currentData) {
            rankName = (currentData.currenttierpatched || rankName).toUpperCase();
            const images = currentData.images;
            if (images) {
              rankIcon = images.large || images.small || rankIcon;
            }
          }
        }
      } else if (mmrRes.status === 401) {
        throw new Error("API Key của HenrikDev không hợp lệ hoặc đã hết hạn.");
      } else {
        const errJson = await mmrRes.json().catch(() => ({}));
        console.warn("MMR API failed:", errJson);
      }

      const regionNames: Record<string, string> = {
        ap: "APAC / Asia",
        na: "North America",
        eu: "Europe",
        kr: "Korea",
        latam: "LATAM",
        br: "Brazil"
      };
      const serverName = regionNames[actualRegion] || "APAC / Asia";

      // 3. Fetch Matches & Calculate Stats (K/D, Winrate, Headshot % của 5 trận Competitve gần nhất)
      let kd = valProfile.kd || "";
      let winrate = valProfile.winrate || "";
      let headshot = valProfile.headshot || "";
      let matchesPlayed = valProfile.matchesPlayed || "";

      try {
        const matchesRes = await fetch(
          `https://api.henrikdev.xyz/valorant/v3/matches/${actualRegion}/${encodeURIComponent(name.trim())}/${encodeURIComponent(tag.trim())}?mode=competitive&size=5`,
          { headers }
        );

        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          if (matchesData.status === 200 && Array.isArray(matchesData.data) && matchesData.data.length > 0) {
            const matches = matchesData.data;
            let totalKills = 0;
            let totalDeaths = 0;
            let wins = 0;
            let totalHeadshots = 0;
            let totalBodyshots = 0;
            let totalLegshots = 0;
            let matchesFound = 0;

            matches.forEach((match: any) => {
              const player = match.players?.all_players?.find(
                (p: any) => p.name?.toLowerCase() === name.trim().toLowerCase() && p.tag?.toLowerCase() === tag.trim().toLowerCase()
              );

              if (player) {
                matchesFound++;
                const stats = player.stats || {};
                totalKills += stats.kills || 0;
                totalDeaths += stats.deaths || 0;
                
                totalHeadshots += stats.headshots || 0;
                totalBodyshots += stats.bodyshots || 0;
                totalLegshots += stats.legshots || 0;

                const playerTeam = player.team;
                if (playerTeam && match.teams?.[playerTeam]) {
                  if (match.teams[playerTeam].has_won) {
                    wins++;
                  }
                }
              }
            });

            if (matchesFound > 0) {
              if (totalDeaths > 0) {
                kd = (totalKills / totalDeaths).toFixed(2);
              } else {
                kd = totalKills.toFixed(2);
              }

              winrate = `${((wins / matchesFound) * 100).toFixed(1)}%`;

              const totalShots = totalHeadshots + totalBodyshots + totalLegshots;
              if (totalShots > 0) {
                headshot = `${((totalHeadshots / totalShots) * 100).toFixed(1)}%`;
              }

              matchesPlayed = String(matchesFound);
            }
          }
        } else {
          const errJson = await matchesRes.json().catch(() => ({}));
          console.warn("Matches API failed:", errJson);
        }
      } catch (err) {
        console.warn("Error fetching or parsing stats:", err);
      }

      // Update valProfile state
      setValProfile(prev => ({
        ...prev,
        ingameName: riotIdInput.trim(),
        level,
        server: serverName,
        rankName,
        rankIcon,
        kd,
        winrate,
        headshot,
        matchesPlayed
      }));

      setStatus({
        type: 'success',
        message: `Đồng bộ thành công! Level: ${level}, Rank: ${rankName}, K/D: ${kd}, Tỷ lệ thắng: ${winrate}, Headshot: ${headshot}, Số trận: ${matchesPlayed}. Hãy nhấn 'LƯU HỒ SƠ' để lưu vĩnh viễn!`
      });

      // Save key to localstorage if entered
      if (henrikKey.trim()) {
        localStorage.setItem("henrik_api_key", henrikKey.trim());
      } else {
        localStorage.removeItem("henrik_api_key");
      }
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: 'error',
        message: err.message || 'Lỗi khi đồng bộ từ Riot API. Hãy kiểm tra Riot ID hoặc HenrikDev API Key!'
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    // Fetch profile from supabase
    if (supabase) {
      try {
        const { data, error } = await supabase.from('site_info').select('valorant_profile').single();
        if (data?.valorant_profile) {
          setValProfile(data.valorant_profile);
          setRiotIdInput(data.valorant_profile.ingameName || "");
        } else {
          // fallback to localStorage for migration
          const localProfile = localStorage.getItem("valorant_profile");
          if (localProfile) {
            const parsed = JSON.parse(localProfile);
            setValProfile(parsed);
            setRiotIdInput(parsed.ingameName || "");
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    try {
      const agentsRes = await fetch(`https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=${language === 'vi' ? 'vi-VN' : 'en-US'}`);
      if (agentsRes.ok) {
        const agentsJson = await agentsRes.json();
        const sortedAgents = agentsJson.data?.sort((a: any, b: any) => a.displayName.localeCompare(b.displayName)) || [];
        setApiAgents(sortedAgents);
      }

      const ranksRes = await fetch("https://valorant-api.com/v1/competitivetiers");
      if (ranksRes.ok) {
        const ranksJson = await ranksRes.json();
        const latestSet = ranksJson.data?.reduce((prev: any, current: any) =>
          (current.tiers?.length > prev.tiers?.length) ? current : prev
          , ranksJson.data[0]);
        if (latestSet && latestSet.tiers) {
          const playableTiers = latestSet.tiers.filter((tier: any) => tier.tier > 0 && tier.tierName !== "Unused1" && tier.tierName !== "Unused2");
          setApiRanks(playableTiers);
        }
      }

      const skins = await fetchValorantSkinCatalog(language);
      if (skins.length > 0) {
        setApiSkins(skins);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: null, message: '' });
    try {
      let fallbackError;
      const { data: existingData } = await supabase.from('site_info').select('id').single();

      if (existingData) {
        const { error } = await supabase.from('site_info').update({ valorant_profile: valProfile }).eq('id', existingData.id);
        fallbackError = error;
      } else {
        const { error } = await supabase.from('site_info').insert([{ valorant_profile: valProfile }]);
        fallbackError = error;
      }

      if (fallbackError) {
        if (fallbackError.code === 'PGRST204' || fallbackError.message?.includes("could not find the 'valorant_profile' column")) {
          // Fallback to localstorage
          localStorage.setItem("valorant_profile", JSON.stringify(valProfile));
          setStatus({ type: 'error', message: 'Đã lưu tạm cục bộ. Bạn cần tạo cột "valorant_profile" (kiểu JSONB) trên Supabase để lưu trữ đám mây!' });
          setSaving(false);
          return;
        }
        throw fallbackError;
      }

      setStatus({ type: 'success', message: 'Lưu hồ sơ Valorant thành công!' });
      // Clear localStorage so we use Supabase now
      localStorage.removeItem("valorant_profile");
    } catch (err: any) {
      console.error(err);
      // Even on other errors, fallback to local storage
      localStorage.setItem("valorant_profile", JSON.stringify(valProfile));
      setStatus({ type: 'error', message: 'Lưu cục bộ. Lỗi Supabase: ' + (err.message || 'Không xác định') });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-10"><Loader2 className="animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">
          CẤU HÌNH <span className="text-amber-500">HỒ SƠ VALORANT</span>
        </h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-amber-500 text-black px-4 py-2 hover:bg-amber-400 transition-colors uppercase font-mono tracking-widest text-[10px] font-bold disabled:opacity-50"
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          <span>{saving ? 'ĐANG LƯU...' : 'LƯU HỒ SƠ'}</span>
        </button>
      </div>

      {status.message && (
        <div className={`p-4 border ${status.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-red-500/10 border-red-500/50 text-red-500'} text-xs font-mono`}>
          {status.message}
        </div>
      )}

      {/* Riot API Sync panel */}
      <div className="p-4 sm:p-5 border border-amber-500/20 bg-amber-500/5 rounded-sm space-y-4">
        <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
          <span>🔄 TỰ ĐỘNG ĐỒNG BỘ TỪ RIOT GAMES</span>
          <span className="text-[9px] font-normal text-gray-400 capitalize">(Qua HenrikDev API)</span>
        </h4>
        <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
          Bạn có thể tự động lấy Level và Rank hiện tại của mình bằng cách điền Riot ID bên dưới. 
          Yêu cầu <strong>HenrikDev API Key</strong> (Lấy miễn phí bằng cách đăng ký tại <a href="https://docs.henrikdev.xyz/" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline">docs.henrikdev.xyz</a>).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4 flex flex-col gap-1.5">
            <label className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">Riot ID (Tên#Tag)</label>
            <input
              type="text"
              value={riotIdInput}
              onChange={(e) => setRiotIdInput(e.target.value)}
              placeholder="VD: TuanVik#206"
              className="bg-black/55 border border-white/10 p-2 text-xs focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none text-white w-full"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">Khu vực</label>
            <select
              value={riotRegion}
              onChange={(e) => setRiotRegion(e.target.value)}
              className="bg-black/55 border border-white/10 p-2 text-xs focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none text-white w-full"
            >
              <option value="ap" className="bg-[#111] text-white">APAC (Asia)</option>
              <option value="na" className="bg-[#111] text-white">North America</option>
              <option value="eu" className="bg-[#111] text-white">Europe</option>
              <option value="kr" className="bg-[#111] text-white">Korea</option>
              <option value="latam" className="bg-[#111] text-white">LATAM</option>
              <option value="br" className="bg-[#111] text-white">Brazil</option>
            </select>
          </div>

          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">HenrikDev API Key (Tùy chọn)</label>
            <input
              type="password"
              value={henrikKey}
              onChange={(e) => setHenrikKey(e.target.value)}
              placeholder="HDEV-xxxx... hoặc để trống nếu có trong .env"
              className="bg-black/55 border border-white/10 p-2 text-xs focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none text-white w-full"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="button"
              onClick={handleSyncFromRiot}
              disabled={syncLoading || !riotIdInput.trim()}
              className="w-full flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 hover:border-amber-500 text-amber-500 hover:text-black py-2 py-2.5 px-4 font-mono text-[10px] tracking-wider uppercase transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none font-bold"
            >
              {syncLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>ĐỒNG BỘ NGAY</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">{t('ingame_name')}</label>
          <input
            type="text"
            value={valProfile.ingameName}
            onChange={(e) => setValProfile({ ...valProfile, ingameName: e.target.value })}
            className="bg-black/50 border border-white/10 p-2.5 text-xs focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none text-white"
            placeholder="VD: TuanVik#206"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">Cấp độ</label>
          <input
            type="text"
            value={valProfile.level}
            onChange={(e) => setValProfile({ ...valProfile, level: e.target.value })}
            className="bg-black/50 border border-white/10 p-2.5 text-xs focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none text-white"
            placeholder="VD: 248"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">Server thi đấu</label>
          <input
            type="text"
            value={valProfile.server}
            onChange={(e) => setValProfile({ ...valProfile, server: e.target.value })}
            className="bg-black/50 border border-white/10 p-2.5 text-xs focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none text-white"
            placeholder="VD: APAC / Vietnam"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">Mức Rank (Chọn từ API nếu có)</label>
          <div className="flex items-center gap-2 border border-white/10 bg-black/50 p-2 focus-within:border-amber-500 focus-within:bg-amber-500/5 transition-colors">
            {valProfile.rankIcon && (
              <img src={valProfile.rankIcon} alt="Rank" className="w-6 h-6 object-contain" />
            )}
            <select
              value={`${valProfile.rankName}|${valProfile.rankIcon}`}
              onChange={(e) => {
                const [name, icon] = e.target.value.split('|');
                setValProfile({ ...valProfile, rankName: name, rankIcon: icon });
              }}
              className="bg-transparent w-full text-xs text-white focus:outline-none"
            >
              {apiRanks.length > 0 ? (
                apiRanks.map((r: any, idx: number) => (
                  <option key={idx} value={`${r.tierName}|${r.largeIcon || r.smallIcon}`} className="bg-black text-white">
                    {r.tierName}
                  </option>
                ))
              ) : (
                <option value={`${valProfile.rankName}|${valProfile.rankIcon}`}>{valProfile.rankName}</option>
              )}
            </select>
          </div>
        </div>

        {/* Thêm các trường thống kê */}
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">{t('val_kd_ratio')}</label>
          <input
            type="text"
            value={valProfile.kd || ''}
            onChange={(e) => setValProfile({ ...valProfile, kd: e.target.value })}
            className="bg-black/50 border border-white/10 p-2.5 text-xs focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none text-white"
            placeholder="VD: 1.25"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">{t('val_win_rate')}</label>
          <input
            type="text"
            value={valProfile.winrate || ''}
            onChange={(e) => setValProfile({ ...valProfile, winrate: e.target.value })}
            className="bg-black/50 border border-white/10 p-2.5 text-xs focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none text-white"
            placeholder="VD: 58.4%"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">{t('val_headshot')}</label>
          <input
            type="text"
            value={valProfile.headshot || ''}
            onChange={(e) => setValProfile({ ...valProfile, headshot: e.target.value })}
            className="bg-black/50 border border-white/10 p-2.5 text-xs focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none text-white"
            placeholder="VD: 24.8%"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">{t('val_matches')}</label>
          <input
            type="text"
            value={valProfile.matchesPlayed || ''}
            onChange={(e) => setValProfile({ ...valProfile, matchesPlayed: e.target.value })}
            className="bg-black/50 border border-white/10 p-2.5 text-xs focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none text-white"
            placeholder="VD: 5"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">ĐẶC VỤ YÊU THÍCH</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(valProfile.mainAgentUuids || []).map((uuid, idx) => (
            <div key={idx} className="flex gap-2 relative group">
              <select
                value={uuid}
                onChange={(e) => {
                  const newUuids = [...(valProfile.mainAgentUuids || [])];
                  newUuids[idx] = e.target.value;
                  setValProfile({ ...valProfile, mainAgentUuids: newUuids });
                }}
                className="w-full bg-black/50 border border-white/10 p-2.5 text-xs focus:border-amber-500 focus:bg-amber-500/5 focus:outline-none text-white"
              >
                {apiAgents.length > 0 ? (
                  apiAgents.map((a: any) => (
                    <option key={a.uuid} value={a.uuid} className="bg-black text-white">
                      {a.displayName}
                    </option>
                  ))
                ) : (
                  <option value={uuid}>{t('loading')}</option>
                )}
              </select>
              <button
                type="button"
                onClick={() => {
                  const newUuids = [...(valProfile.mainAgentUuids || [])];
                  newUuids.splice(idx, 1);
                  setValProfile({ ...valProfile, mainAgentUuids: newUuids });
                }}
                className="w-10 flex-shrink-0 bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-black transition-colors"
                title="Xóa đặc vụ"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const newUuids = [...(valProfile.mainAgentUuids || [])];
              newUuids.push(apiAgents[0]?.uuid || "add6443a-41bd-e414-f6ad-e58d267f4e95");
              setValProfile({ ...valProfile, mainAgentUuids: newUuids });
            }}
            className="flex items-center justify-center border border-dashed border-white/20 bg-white/[0.02] hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-500 text-gray-500 p-2.5 text-xs font-mono uppercase transition-colors"
          >
            + THÊM ĐẶC VỤ
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-white/10 space-y-4">
        <h5 className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase">QUẢN LÝ BỘ SƯU TẬP SKIN SÚNG</h5>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {valProfile.favoriteSkins?.map((skin, sIdx) => (
            <div key={sIdx} className="p-3 bg-white/[0.02] border border-white/5 space-y-3 relative">
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                <span className="text-[8px] font-mono text-gray-500 uppercase">SKIN #{sIdx + 1} ({(skin.weaponName && skin.weaponName !== 'Unknown') ? skin.weaponName : (skin.skinName.split(' ')[0] || t('unknown'))})</span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = valProfile.favoriteSkins.filter((_, idx) => idx !== sIdx);
                    setValProfile({ ...valProfile, favoriteSkins: updated });
                  }}
                  className="text-[8px] font-mono text-red-500 hover:text-red-400 uppercase"
                >
                  XÓA
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-10 bg-black/40 border border-white/10 p-1 flex items-center justify-center shrink-0">
                  {skin.skinIcon && (
                    <img src={skin.skinIcon} alt={skin.skinName} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-white uppercase truncate">{skin.skinName}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white/5 border border-white/10 space-y-4">
          <span className="text-[10px] font-mono text-amber-500 uppercase font-bold">TÌM & THÊM SKIN MỚI TỪ API</span>
          <input
            type="text"
            value={skinSearchQuery}
            onChange={(e) => setSkinSearchQuery(e.target.value)}
            placeholder="Nhập tên skin bằng tiếng Việt hoặc tiếng Anh để tìm (VD: Forsaken, Kuronami, Reaver...)"
            className="w-full bg-black/50 border border-white/10 p-3 text-xs focus:border-amber-500 focus:outline-none text-white"
          />

          {skinSearchQuery.trim().length > 1 && (() => {
            const normalizedQuery = skinSearchQuery.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
            const filteredSkins = apiSkins.filter((s) => {
              const haystacks = [
                s.skinName || '',
                s.englishName || '',
                s.weaponName || ''
              ].map((value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());

              return haystacks.some((text) => {
                if (!text.includes(normalizedQuery)) {
                  return tokens.every((token) => text.includes(token));
                }
                return true;
              });
            });

            return (
              <div className="max-h-72 overflow-y-auto border border-white/15 bg-black p-2 space-y-2 custom-scrollbar">
                {filteredSkins.length > 0 ? (
                  filteredSkins.slice(0, 120).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const newSkin = {
                          weaponName: s.weaponName || "Unknown",
                          skinName: s.skinName,
                          skinIcon: s.skinIcon
                        };
                        setValProfile({
                          ...valProfile,
                          favoriteSkins: [...(valProfile.favoriteSkins || []), newSkin]
                        });
                        setSkinSearchQuery("");
                      }}
                      className="w-full text-left p-3 border border-white/5 bg-white/5 hover:bg-amber-500/10 hover:border-amber-500/50 transition-colors flex items-center gap-4 cursor-pointer"
                    >
                      <img src={s.skinIcon} alt={s.skinName} className="w-16 h-8 object-contain bg-black/30 p-1 border border-white/5" referrerPolicy="no-referrer" />
                      <div>
                        <p className="font-bold text-white uppercase text-[11px]">{s.skinName}</p>
                        {s.englishName && s.englishName.toLowerCase() !== s.skinName.toLowerCase() && (
                          <p className="text-[9px] font-mono text-amber-500/80 uppercase">{s.englishName}</p>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-[10px] font-mono text-gray-500 uppercase">Không tìm thấy skin phù hợp. Hãy thử từ khóa khác hoặc tên vũ khí.</div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
