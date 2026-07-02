export interface FavoriteGame {
  id: string;
  title: string;
  category: string;
  developer: string;
  rank: string;
  image_url: string;
  description: string;
}

export interface ValorantSkin {
  weaponUuid?: string;
  weaponName: string;
  skinUuid?: string;
  skinName: string;
  skinIcon: string;
  englishName?: string;
}

export interface ValorantProfile {
  ingameName: string;
  level: string;
  server: string;
  rankName: string;
  rankIcon: string;
  mainAgentUuids: string[];
  mainAgentUuid1?: string;
  mainAgentUuid2?: string;
  favoriteSkins: ValorantSkin[];
  kd?: string;
  winrate?: string;
  headshot?: string;
  matchesPlayed?: string;
}

export interface SiteInfo {
  id?: number;
  name: string;
  avatar_url: string;
  project_name?: string;
  project_link: string;
  education_school: string;
  education_logo?: string;
  education_desc?: string;
  education_major: string;
  education_years: string;
  education_school_en?: string;
  education_major_en?: string;
  education_years_en?: string;
  education_desc_en?: string;
  facebook_url: string;
  instagram_url: string;
  github_url: string;
  email: string;
  linkedin_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  dribbble_url?: string;
  behance_url?: string;
  twitch_url?: string;
  discord_url?: string;
  favorite_games?: FavoriteGame[];
  valorant_profile?: ValorantProfile;
  est_year?: string;
  coordinates?: string;
  location_text?: string;
}
