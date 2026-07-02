import { ValorantSkin } from '../types';

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 phút

const determineWeaponName = (assetPath: string, displayName: string): string => {
    const pathLower = (assetPath || '').toLowerCase();
    const nameLower = (displayName || '').toLowerCase();

    if (pathLower.includes('vandal') || nameLower.includes('vandal')) return 'Vandal';
    if (pathLower.includes('phantom') || nameLower.includes('phantom')) return 'Phantom';
    if (pathLower.includes('operator') || nameLower.includes('operator')) return 'Operator';
    if (pathLower.includes('sheriff') || nameLower.includes('sheriff')) return 'Sheriff';
    if (pathLower.includes('ghost') || nameLower.includes('ghost')) return 'Ghost';
    if (pathLower.includes('spectre') || nameLower.includes('spectre')) return 'Spectre';
    if (pathLower.includes('odin') || nameLower.includes('odin')) return 'Odin';
    if (pathLower.includes('ares') || nameLower.includes('ares')) return 'Ares';
    if (pathLower.includes('guardian') || nameLower.includes('guardian')) return 'Guardian';
    if (pathLower.includes('marshal') || nameLower.includes('marshal')) return 'Marshal';
    if (pathLower.includes('outlaw') || nameLower.includes('outlaw')) return 'Outlaw';
    if (pathLower.includes('bulldog') || nameLower.includes('bulldog')) return 'Bulldog';
    if (pathLower.includes('bucky') || nameLower.includes('bucky')) return 'Bucky';
    if (pathLower.includes('judge') || nameLower.includes('judge')) return 'Judge';
    if (pathLower.includes('stinger') || nameLower.includes('stinger')) return 'Stinger';
    if (pathLower.includes('classic') || nameLower.includes('classic')) return 'Classic';
    if (pathLower.includes('shorty') || nameLower.includes('shorty')) return 'Shorty';
    if (pathLower.includes('frenzy') || nameLower.includes('frenzy')) return 'Frenzy';
    if (
        pathLower.includes('melee') || pathLower.includes('knife') ||
        nameLower.includes('melee') || nameLower.includes('knife') ||
        nameLower.includes('kiếm') || nameLower.includes('rìu') || nameLower.includes('dao')
    ) return 'Melee';

    return 'Unknown';
};

const getBestSkinIcon = (skin: any): string => {
    return skin?.displayIcon ||
        skin?.chromas?.find((c: any) => c.displayIcon)?.displayIcon ||
        skin?.levels?.find((l: any) => l.displayIcon)?.displayIcon ||
        skin?.chromas?.[0]?.displayIcon ||
        skin?.levels?.[0]?.displayIcon ||
        '';
};

export async function fetchValorantSkinCatalog(language: 'vi' | 'en' = 'vi'): Promise<ValorantSkin[]> {
    const cacheKey = `valorant_skins_cache_${language}`;
    const cacheTimestampKey = `${cacheKey}_ts`;

    // Check sessionStorage cache (30 phút TTL)
    try {
        const cachedTs = sessionStorage.getItem(cacheTimestampKey);
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedTs && cachedData && Date.now() - parseInt(cachedTs) < CACHE_TTL_MS) {
            return JSON.parse(cachedData) as ValorantSkin[];
        }
    } catch (_) { /* ignore parse errors */ }

    const langCode = language === 'vi' ? 'vi-VN' : 'en-US';

    const [weaponsRes, englishWeaponsRes, localizedSkinsRes, englishSkinsRes] = await Promise.all([
        fetch(`https://valorant-api.com/v1/weapons?language=${langCode}`),
        fetch('https://valorant-api.com/v1/weapons?language=en-US'),
        fetch(`https://valorant-api.com/v1/weapons/skins?language=${langCode}`),
        fetch('https://valorant-api.com/v1/weapons/skins?language=en-US'),
    ]);

    const localizedWeapons = weaponsRes.ok ? (await weaponsRes.json()).data ?? [] : [];
    const englishWeapons = englishWeaponsRes.ok ? (await englishWeaponsRes.json()).data ?? [] : [];
    const localizedSkins = localizedSkinsRes.ok ? (await localizedSkinsRes.json()).data ?? [] : [];
    const englishSkins = englishSkinsRes.ok ? (await englishSkinsRes.json()).data ?? [] : [];

    const englishNameMap = new Map<string, string>();
    [...englishWeapons, ...englishSkins].forEach((item: any) => {
        (item?.skins ?? []).forEach((skin: any) => {
            if (skin?.uuid) {
                englishNameMap.set(skin.uuid, skin.displayName || '');
            }
        });
    });
    englishSkins.forEach((skin: any) => {
        if (skin?.uuid) {
            englishNameMap.set(skin.uuid, skin.displayName || englishNameMap.get(skin.uuid) || '');
        }
    });

    const uniqueSkins = new Map<string, ValorantSkin>();

    const addSkin = (skin: any, weaponName: string) => {
        if (!skin?.uuid) return;

        const icon = getBestSkinIcon(skin);
        if (!icon) return;

        const normalizedSkin: ValorantSkin = {
            weaponName,
            skinName: skin.displayName || 'Unknown Skin',
            skinIcon: icon,
            englishName: englishNameMap.get(skin.uuid) || skin.displayName || '',
            skinUuid: skin.uuid,
            weaponUuid: skin.weaponUuid || skin.uuid,
        };

        const key = `${skin.uuid}-${normalizedSkin.skinName}`;
        if (!uniqueSkins.has(key)) {
            uniqueSkins.set(key, normalizedSkin);
        }
    };

    localizedWeapons.forEach((weapon: any) => {
        const weaponName = weapon?.displayName || 'Unknown';
        (weapon?.skins ?? []).forEach((skin: any) => {
            addSkin(skin, weaponName);
        });
    });

    localizedSkins.forEach((skin: any) => {
        if (!skin?.uuid) return;
        addSkin(skin, determineWeaponName(skin?.assetPath || '', skin?.displayName || ''));
    });

    if (uniqueSkins.size === 0) {
        const fallbackSkins = [...localizedSkins, ...englishSkins];
        fallbackSkins.forEach((skin: any) => {
            addSkin(skin, determineWeaponName(skin?.assetPath || '', skin?.displayName || ''));
        });
    }

    const result = Array.from(uniqueSkins.values()).sort((a, b) => a.skinName.localeCompare(b.skinName));

    // Lưu cache vào sessionStorage
    try {
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
        sessionStorage.setItem(cacheTimestampKey, Date.now().toString());
    } catch (_) { /* ignore storage quota errors */ }

    return result;
}
