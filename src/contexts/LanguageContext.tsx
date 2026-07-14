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
    'menu_education': '— 03. HỌC VẤN',
    'menu_social': '— 04. MẠNG XÃ HỘI',
    'location': 'VIỆT NAM',
    'redirecting': 'Chuyển hướng đến Dự án',
    'redirect_cancel': 'Hủy chuyển hướng',
    'init': 'Khởi tạo',
    'view_details': 'CHI TIẾT',
    'intro_text': 'Xin chào! Đây là không gian kỹ thuật số của tôi. Nơi tôi lưu trữ các dự án, kinh nghiệm học vấn và những tựa game yêu thích. Cảm ơn bạn đã ghé thăm và hi vọng chúng ta có thể kết nối với nhau.',
    // Admin
    'admin_panel': 'BẢNG ĐIỀU KHIỂN',
    'update_success': 'Đã cập nhật thông tin thành công!',
    'update_failed': 'Lỗi khi cập nhật:',
    'basic_info': 'THÔNG TIN CƠ BẢN',
    'general_info': 'THÔNG TIN CHUNG',
    'social_links': 'MẠNG XÃ HỘI',
    'save_changes': 'LƯU THAY ĐỔI',
    'cancel': 'HỦY',
    'education_projects': 'HỌC VẤN & DỰ ÁN',
    'education_school_default': 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG',
    'education_major_default': 'CÔNG NGHỆ THÔNG TIN',
    'education_years_default': '2024 - 2028',
    'education_desc_default': '',
    'loading': 'Đang tải...',
    'online': 'đang online',
    'views': 'lượt truy cập',
    'visitor_tracking': 'LƯỢT TRUY CẬP',
    'ip_address': 'Địa chỉ IP',
    'visitor_location': 'Vị trí',
    'device_browser': 'Thiết bị & Trình duyệt',
    'visit_time': 'Thời gian vào',
    'status': 'Trạng thái',
    'referrer': 'Nguồn giới thiệu',
    'screen_size': 'Màn hình',
    'clear_logs': 'XÓA NHẬT KÝ',
    'clear_logs_confirm': 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử truy cập?',
    'no_data': 'Không có dữ liệu',
    'active': 'Đang hoạt động',
    'offline': 'Offline'
  },
  en: {
    // Portfolio
    'menu_intro': '— 01. INTRODUCTION',
    'menu_project': '— 02. PROJECTS',
    'menu_education': '— 03. EDUCATION',
    'menu_social': '— 04. SOCIALS',
    'location': 'VIETNAM',
    'redirecting': 'Redirecting to Project',
    'redirect_cancel': 'Cancel Redirection',
    'init': 'Initializing',
    'view_details': 'DETAILS',
    'intro_text': 'Hello! This is my digital space. Where I store my projects, educational experience, and favorite games. Thank you for visiting and I hope we can connect.',
    // Admin
    'admin_panel': 'CONTROL PANEL',
    'update_success': 'Information updated successfully!',
    'update_failed': 'Error updating:',
    'basic_info': 'BASIC INFO',
    'general_info': 'GENERAL INFO',
    'social_links': 'SOCIAL LINKS',
    'save_changes': 'SAVE CHANGES',
    'cancel': 'CANCEL',
    'education_projects': 'EDUCATION & PROJECTS',
    'education_school_default': 'University of Information Technology and Communication',
    'education_major_default': 'Information Technology',
    'education_years_default': '2024 - 2028',
    'education_desc_default': '',
    'loading': 'Loading...',
    'online': 'online',
    'views': 'views',
    'visitor_tracking': 'VISITORS',
    'ip_address': 'IP Address',
    'visitor_location': 'Location',
    'device_browser': 'Device & Browser',
    'visit_time': 'Visit Time',
    'status': 'Status',
    'referrer': 'Referrer',
    'screen_size': 'Screen',
    'clear_logs': 'CLEAR LOGS',
    'clear_logs_confirm': 'Are you sure you want to clear all visit history?',
    'no_data': 'No data available',
    'active': 'Active',
    'offline': 'Offline'
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

