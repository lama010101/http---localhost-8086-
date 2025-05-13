import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface SettingsState {
  soundEnabled: boolean;
  enableSound: () => void;
  disableSound: () => void;
  toggleSound: () => void;
  syncToSupabase: (userId: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  soundEnabled: true,
  enableSound: () => {
    set({ soundEnabled: true });
  },
  disableSound: () => {
    set({ soundEnabled: false });
  },
  toggleSound: () => {
    set(state => ({ soundEnabled: !state.soundEnabled }));
  },
  syncToSupabase: async (userId: string) => {
    if (!userId) return;
    
    // Store settings as JSON in value field
    await supabase
      .from('settings')
      .upsert({
        id: userId, // Use userId as the id
        value: {
          soundEnabled: get().soundEnabled
        }
      });
  }
})); 