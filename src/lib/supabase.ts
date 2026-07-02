import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Dùng sessionStorage thay vì localStorage để session tự xóa khi đóng tab/trình duyệt.
// Mỗi lần mở lại trình duyệt, admin cần đăng nhập lại.
const sessionStorageAdapter = typeof window !== 'undefined'
  ? {
      getItem: (key: string) => window.sessionStorage.getItem(key),
      setItem: (key: string, value: string) => window.sessionStorage.setItem(key, value),
      removeItem: (key: string) => window.sessionStorage.removeItem(key),
    }
  : undefined;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: sessionStorageAdapter,
        persistSession: true,   // vẫn persist trong tab hiện tại
        autoRefreshToken: true, // auto refresh token khi còn trong tab
      },
    })
  : null;
