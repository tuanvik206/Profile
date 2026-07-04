import { useEffect, useState } from 'react';
import { supabase } from './supabase';

interface GeoInfo {
  ip?: string;
  city?: string;
  country?: string;
  country_code?: string;
}

// Generate a random UUID-like string if crypto is not fully available
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Fetch visitor IP and location details
async function fetchGeoInfo(): Promise<GeoInfo> {
  try {
    // Try ipapi.co first
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      return {
        ip: data.ip,
        city: data.city,
        country: data.country_name,
        country_code: data.country_code,
      };
    }
  } catch (e) {
    console.warn('ipapi.co failed, trying fallback geolocation-db...', e);
  }

  try {
    // Fallback to geolocation-db
    const res = await fetch('https://geolocation-db.com/json/');
    if (res.ok) {
      const data = await res.json();
      return {
        ip: data.IPv4 || data.ip,
        city: data.city,
        country: data.country_name,
        country_code: data.country_code,
      };
    }
  } catch (e) {
    console.warn('All geolocation services failed.', e);
  }

  return {};
}

export function useVisitorTracker() {
  const [sessionStats, setSessionStats] = useState<{
    onlineCount: number;
    totalViews: number;
    totalVisitors: number;
  } | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let heartbeatInterval: any = null;
    let statsInterval: any = null;

    // Get or create session ID in sessionStorage
    let sessionId = sessionStorage.getItem('visitor_session_id');
    if (!sessionId) {
      sessionId = generateUUID();
      sessionStorage.setItem('visitor_session_id', sessionId);
    }

    const initTracker = async () => {
      // 1. Fetch geo location details
      const geo = await fetchGeoInfo();

      // 2. Gather browser details
      const userAgent = navigator.userAgent;
      const referrer = document.referrer || 'Direct';
      const path = window.location.pathname;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      try {
        // 3. Log visit in Supabase
        const { error } = await supabase
          .from('visitor_logs')
          .insert([
            {
              session_id: sessionId,
              ip: geo.ip || 'Unknown',
              city: geo.city || 'Unknown',
              country: geo.country || 'Unknown',
              country_code: geo.country_code || 'Unknown',
              user_agent: userAgent,
              referrer: referrer,
              path: path,
              screen_width: screenWidth,
              screen_height: screenHeight,
            },
          ]);

        if (error) {
          console.error('Failed to log visit:', error.message);
          return;
        }

        // 4. Start heartbeat (update last_active_at every 20s using session_id)
        heartbeatInterval = setInterval(async () => {
          const { error: updateError } = await supabase
            .from('visitor_logs')
            .update({ last_active_at: new Date().toISOString() })
            .eq('session_id', sessionId);

          if (updateError) {
            console.warn('Heartbeat update failed:', updateError.message);
          }
        }, 20000);
      } catch (err) {
        console.error('Visitor logging error:', err);
      }
    };

    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_visitor_stats');
        if (error) {
          console.error('Error fetching visitor stats:', error.message);
          return;
        }
        if (data && data.length > 0) {
          const stats = data[0];
          setSessionStats({
            onlineCount: Number(stats.online_count || 1),
            totalViews: Number(stats.total_views || 1),
            totalVisitors: Number(stats.total_visitors || 1),
          });
        }
      } catch (err) {
        console.error('Error in fetchStats:', err);
      }
    };

    // Initialize tracker and stats
    initTracker().then(() => {
      // Fetch initial stats
      fetchStats();
      // Poll stats every 20 seconds to keep live count accurate
      statsInterval = setInterval(fetchStats, 20000);
    });

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (statsInterval) clearInterval(statsInterval);
    };
  }, []);

  return sessionStats;
}
