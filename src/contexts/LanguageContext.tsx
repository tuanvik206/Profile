import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  vi: {
    // Portfolio
    'menu_intro': '— 01. GIỚI THIỆU',
    'menu_project': '— 02. DỰ ÁN',
    'menu_gaming': '— 03. GAMING',
    'menu_education': '— 04. HỌC VẤN',
    'menu_social': '— 05. MẠNG XÃ HỘI',
    'location': 'VIỆT NAM',
    'redirecting': 'Chuyển hướng đến Dự án',
    'redirect_cancel': 'Hủy chuyển hướng',
    'init': 'Khởi tạo',
    'view_details': 'CHI TIẾT',
    'intro_text': 'Xin chào! Đây là không gian kỹ thuật số của tôi. Nơi tôi lưu trữ các dự án, kinh nghiệm học vấn và những tựa game yêu thích. Cảm ơn bạn đã ghé thăm và hi vọng chúng ta có thể kết nối với nhau.',
    // Gaming Hub
    'close': 'ĐÓNG',
    'gaming_space': 'KHÔNG GIAN',
    'gaming_entertainment': 'GIẢI TRÍ',
    'agent_database': 'ĐẶC VỤ',
    'agent_profile_header': 'HỒ SƠ ĐẶC VỤ // INGAME PROFILE',
    'current_rank': 'HẠNG HIỆN TẠI (RANK)',
    'competitive_system': 'HỆ THỐNG XẾP HẠNG',
    'gun_skins_showcase': 'BỘ SƯU TẬP SKIN SÚNG // GUN SKINS SHOWCASE',
    'empty_collection_title': 'BỘ SƯU TẬP ĐANG TRỐNG',
    'empty_collection_desc': 'Vui lòng thêm Skin trong trang Quản trị',
    'connecting_api': 'ĐANG KẾT NỐI VALORANT-API...',
    'retry': 'THỬ LẠI',
    'abilities_info': 'KỸ NĂNG & THÔNG TIN ĐẶC VỤ',
    'general_info': 'THÔNG TIN CHUNG',
    'favorite_games': 'GAME YÊU THÍCH',
    'val_profile': 'HỒ SƠ VALORANT',
    'stats': 'CHỈ SỐ',
    'main_agents': 'AGENT THUẬN TAY',
    'favorite_collection': 'BỘ SƯU TẬP YÊU THÍCH',
    'level': 'CẤP ĐỘ',
    'server': 'MÁY CHỦ',
    'rank': 'XẾP HẠNG',
    'empty_collection': 'Chưa có skin yêu thích nào.',
    'empty_agent': 'Chưa có Agent',
    'empty_game': 'Chưa có thông tin Game',
    'empty_rank': 'Chưa xếp hạng',
    'skin': 'SKIN',
    'launching_game': 'ĐANG CHẠY GAME',
    'total_skins': 'TỔNG CỘNG: {count} SKINS',
    // Admin
    'admin_panel': 'BẢNG ĐIỀU KHIỂN',
    'update_success': 'Đã cập nhật thông tin thành công!',
    'update_failed': 'Lỗi khi cập nhật:',
    'basic_info': 'THÔNG TIN CƠ BẢN',
    'social_links': 'MẠNG XÃ HỘI',
    'games_config': 'CẤU HÌNH GAME',
    'save_changes': 'LƯU THAY ĐỔI',
    'cancel': 'HỦY',
    'add_game': 'THÊM GAME',
    'game_name': 'Tên Game',
    'game_image': 'URL Ảnh Game',
    'delete': 'Xóa',
    // Valorant Admin
    'ingame_name': 'Tên In-game',
    'loading_agents': 'Đang tải danh sách Agent...',
    'loading_skins': 'Đang tải danh sách Skin...',
    'add_favorite_skin': 'Thêm Skin Yêu Thích',
    'select_agent': 'Chọn Agent...',
    'select_skin': 'Tìm và chọn skin...',
    'val_config': 'Cấu hình Valorant',
    'unknown': 'Chưa rõ',
    'education_projects': 'HỌC VẤN & DỰ ÁN',
    'education_school_default': 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG',
    'education_major_default': 'CÔNG NGHỆ THÔNG TIN',
    'education_years_default': '2024 - 2028',
    'education_desc_default': '',
    'loading': 'Đang tải...',
    'val_stats_header': 'Chỉ số thi đấu (Stats)',
    'val_kd_ratio': 'K/D Ratio',
    'val_win_rate': 'Win Rate',
    'val_headshot': 'Headshot %',
    'val_matches': 'Matches (Số trận)',
    'no_games_yet': 'Chưa có game nào được thêm'
  },
  en: {
    // Portfolio
    'menu_intro': '— 01. INTRODUCTION',
    'menu_project': '— 02. PROJECTS',
    'menu_gaming': '— 03. GAMING',
    'menu_education': '— 04. EDUCATION',
    'menu_social': '— 05. SOCIALS',
    'location': 'VIETNAM',
    'redirecting': 'Redirecting to Project',
    'redirect_cancel': 'Cancel Redirection',
    'init': 'Initializing',
    'view_details': 'DETAILS',
    'intro_text': 'Hello! This is my digital space. Where I store my projects, educational experience, and favorite games. Thank you for visiting and I hope we can connect.',
    // Gaming Hub
    'close': 'CLOSE',
    'gaming_space': 'GAMING',
    'gaming_entertainment': 'SPACE',
    'agent_database': 'AGENT',
    'agent_profile_header': 'AGENT RECORD // INGAME PROFILE',
    'current_rank': 'CURRENT RANK',
    'competitive_system': 'COMPETITIVE SYSTEM',
    'gun_skins_showcase': 'GUN SKINS SHOWCASE',
    'empty_collection_title': 'COLLECTION IS EMPTY',
    'empty_collection_desc': 'Please add skins in the Admin Panel',
    'connecting_api': 'CONNECTING TO VALORANT-API...',
    'retry': 'RETRY',
    'abilities_info': 'ABILITIES & AGENT INFO',
    'general_info': 'GENERAL INFO',
    'favorite_games': 'FAVORITE GAMES',
    'val_profile': 'VALORANT PROFILE',
    'stats': 'STATS',
    'main_agents': 'MAIN AGENTS',
    'favorite_collection': 'FAVORITE COLLECTION',
    'level': 'LEVEL',
    'server': 'SERVER',
    'rank': 'RANK',
    'empty_collection': 'No favorite skins yet.',
    'empty_agent': 'No Agent',
    'empty_game': 'No Game Information',
    'empty_rank': 'Unranked',
    'skin': 'SKIN',
    'launching_game': 'LAUNCHING GAME',
    'total_skins': 'TOTAL: {count} SKINS',
    // Admin
    'admin_panel': 'CONTROL PANEL',
    'update_success': 'Information updated successfully!',
    'update_failed': 'Error updating:',
    'basic_info': 'BASIC INFO',
    'social_links': 'SOCIAL LINKS',
    'games_config': 'GAMES CONFIG',
    'save_changes': 'SAVE CHANGES',
    'cancel': 'CANCEL',
    'add_game': 'ADD GAME',
    'game_name': 'Game Name',
    'game_image': 'Game Image URL',
    'delete': 'Delete',
    // Valorant Admin
    'ingame_name': 'In-game Name',
    'loading_agents': 'Loading Agents...',
    'loading_skins': 'Loading Skins...',
    'add_favorite_skin': 'Add Favorite Skin',
    'select_agent': 'Select Agent...',
    'select_skin': 'Search and select skin...',
    'val_config': 'Valorant Config',
    'unknown': 'Unknown',
    'education_projects': 'EDUCATION & PROJECTS',
    'education_school_default': 'University of Information Technology and Communication',
    'education_major_default': 'Information Technology',
    'education_years_default': '2024 - 2028',
    'education_desc_default': '',
    'loading': 'Loading...',
    'val_stats_header': 'Competitive Statistics',
    'val_kd_ratio': 'K/D Ratio',
    'val_win_rate': 'Win Rate',
    'val_headshot': 'Headshot %',
    'val_matches': 'Matches Played',
    'no_games_yet': 'No games added yet'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'vi' || saved === 'en') ? saved : 'vi';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = (key: string): string => {
    const dict = translations[language] as Record<string, string>;
    return key in dict ? dict[key] : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
