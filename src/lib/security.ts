import { SiteInfo } from '../types';

const DEFAULT_TEXT_LIMIT = 200;

export const SITE_INFO_COMPATIBLE_FIELDS = [
    'id',
    'name',
    'avatar_url',
    'project_link',
    'education_school',
    'education_major',
    'education_years',
    'facebook_url',
    'instagram_url',
    'github_url',
    'email',
    'linkedin_url',
    'twitter_url',
    'youtube_url',
    'tiktok_url',
    'dribbble_url',
    'behance_url',
    'twitch_url',
    'discord_url',
    'location_name',
    'location_coordinates',
    'est_label',
] as const;

export const SITE_INFO_SELECT_FIELDS = SITE_INFO_COMPATIBLE_FIELDS.join(',');

function sanitizeText(value: string | undefined | null, maxLength = DEFAULT_TEXT_LIMIT): string {
    return String(value ?? '')
        .replace(/[\u0000-\u001F\u007F]/g, '')
        .trim()
        .slice(0, maxLength);
}

function isRelativeUrl(value: string): boolean {
    return /^(\/|\.\/|\.\.\/)/.test(value);
}

export function sanitizeUrl(
    value: string | undefined | null,
    options: { allowMailto?: boolean; allowRelative?: boolean; allowImage?: boolean } = {},
): string {
    const { allowMailto = true, allowRelative = true, allowImage = false } = options;
    const raw = sanitizeText(value, 500);

    if (!raw || raw === '#' || raw === 'undefined') return '';

    if (allowRelative && isRelativeUrl(raw)) return raw;

    if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(raw)) {
        try {
            const parsed = new URL(raw);
            const allowedProtocols = allowImage ? ['http:', 'https:'] : ['http:', 'https:'];
            if (allowedProtocols.includes(parsed.protocol)) {
                return parsed.toString();
            }
            if (allowMailto && parsed.protocol === 'mailto:') {
                return parsed.toString();
            }
        } catch {
            // Ignore malformed URLs and fall back to empty string.
        }
    }

    if (allowMailto && /^mailto:/i.test(raw)) {
        const email = raw.replace(/^mailto:/i, '').trim();
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : '';
    }

    return '';
}

export function sanitizeEmail(value: string | undefined | null): string {
    const email = sanitizeText(value, 100).toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

export function normalizeSiteInfo(info: Partial<SiteInfo> | null | undefined): Partial<SiteInfo> {
    const safe = info ?? {};

    const normalized: Partial<SiteInfo> = {};

    if (typeof safe.name === 'string') normalized.name = sanitizeText(safe.name, 100);
    if (typeof safe.avatar_url === 'string') normalized.avatar_url = sanitizeUrl(safe.avatar_url, { allowImage: true }) || '';
    if (typeof safe.project_link === 'string') normalized.project_link = sanitizeUrl(safe.project_link, { allowMailto: false, allowRelative: true }) || '';
    if (typeof safe.education_school === 'string') normalized.education_school = sanitizeText(safe.education_school, 120);
    if (typeof safe.education_major === 'string') normalized.education_major = sanitizeText(safe.education_major, 120);
    if (typeof safe.education_years === 'string') normalized.education_years = sanitizeText(safe.education_years, 60);
    if (typeof safe.facebook_url === 'string') normalized.facebook_url = sanitizeUrl(safe.facebook_url) || '';
    if (typeof safe.instagram_url === 'string') normalized.instagram_url = sanitizeUrl(safe.instagram_url) || '';
    if (typeof safe.github_url === 'string') normalized.github_url = sanitizeUrl(safe.github_url) || '';
    if (typeof safe.email === 'string') normalized.email = sanitizeEmail(safe.email);
    if (typeof safe.location_name === 'string') normalized.location_name = sanitizeText(safe.location_name, 80);
    if (typeof safe.location_coordinates === 'string') normalized.location_coordinates = sanitizeText(safe.location_coordinates, 80);
    if (typeof safe.est_label === 'string') normalized.est_label = sanitizeText(safe.est_label, 40);
    if (typeof safe.linkedin_url === 'string') normalized.linkedin_url = sanitizeUrl(safe.linkedin_url) || '';
    if (typeof safe.twitter_url === 'string') normalized.twitter_url = sanitizeUrl(safe.twitter_url) || '';
    if (typeof safe.youtube_url === 'string') normalized.youtube_url = sanitizeUrl(safe.youtube_url) || '';
    if (typeof safe.tiktok_url === 'string') normalized.tiktok_url = sanitizeUrl(safe.tiktok_url) || '';
    if (typeof safe.dribbble_url === 'string') normalized.dribbble_url = sanitizeUrl(safe.dribbble_url) || '';
    if (typeof safe.behance_url === 'string') normalized.behance_url = sanitizeUrl(safe.behance_url) || '';
    if (typeof safe.twitch_url === 'string') normalized.twitch_url = sanitizeUrl(safe.twitch_url) || '';
    if (typeof safe.discord_url === 'string') normalized.discord_url = sanitizeUrl(safe.discord_url) || '';

    return normalized;
}

export function buildSafeSiteInfoPayload(info: Partial<SiteInfo> | null | undefined): Partial<SiteInfo> {
    const normalized = normalizeSiteInfo(info);
    const payload: Partial<SiteInfo> = {};
    const allowedKeys = new Set<string>(SITE_INFO_COMPATIBLE_FIELDS as readonly string[]);

    Object.entries(normalized).forEach(([key, value]) => {
        if (allowedKeys.has(key)) {
            (payload as Record<string, unknown>)[key] = value;
        }
    });

    return payload;
}
