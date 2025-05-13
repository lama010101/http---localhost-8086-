
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string;
  email?: string;
  created_at: string;
  updated_at?: string;
  avatar_image_url: string;
}

export interface Avatar {
  id: string;
  name: string;
  image_url: string;
  created_at: string;
}

export interface UserStats {
  games_played: number;
  avg_accuracy: number;
  best_accuracy: number;
  perfect_scores: number;
  total_xp: number;
  global_rank: number;
  time_accuracy: number;
  location_accuracy: number;
  challenge_accuracy: number;
}

export type UserMetrics = Record<string, number>;

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  sound_enabled: boolean;
  notification_enabled: boolean;
  distance_unit: 'km' | 'mi';
  language: string;
}

// Fetch user profile
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data as unknown as UserProfile;
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    return null;
  }
}

// Update user avatar
export async function updateUserAvatar(userId: string, avatarId: string): Promise<boolean> {
  try {
    // Get the avatar image URL
    const { data: avatarData, error: avatarError } = await supabase
      .from('avatars')
      .select('image_url')
      .eq('id', avatarId)
      .single();
      
    if (avatarError || !avatarData) {
      console.error('Error fetching avatar:', avatarError);
      return false;
    }
    
    // Update the user profile with the new avatar
    const { error } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: avatarId,
        avatar_image_url: avatarData.image_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) {
      console.error('Error updating avatar:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateUserAvatar:', error);
    return false;
  }
}

// Create a new user profile if it doesn't exist
export async function createUserProfileIfNotExists(userId: string, displayName: string): Promise<boolean> {
  try {
    // Check if profile exists
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    // If profile exists, no need to create one
    if (data) {
      return true;
    }
    
    // If error is not "not found", then something else went wrong
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking profile existence:', fetchError);
      return false;
    }
    
    // Create new profile
    const defaultAvatarUrl = 'https://api.dicebear.com/6.x/adventurer/svg?seed=' + userId;
    
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        display_name: displayName,
        avatar_image_url: defaultAvatarUrl,
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error creating profile:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in createUserProfileIfNotExists:', error);
    return false;
  }
}

// Fetch available avatars
export async function fetchAvatars(): Promise<Avatar[]> {
  try {
    const { data, error } = await supabase
      .from('avatars')
      .select('*')
      .order('created_at');

    if (error) {
      console.error('Error fetching avatars:', error);
      return [];
    }

    return data as Avatar[];
  } catch (error) {
    console.error('Error in fetchAvatars:', error);
    return [];
  }
}

// Fetch user stats
export async function fetchUserStats(userId: string): Promise<UserStats | null> {
  try {
    // In a real implementation, this would fetch from a user_stats table or view
    // For now, return mock data
    const mockStats: UserStats = {
      games_played: 42,
      avg_accuracy: 78.5,
      best_accuracy: 96.0,
      perfect_scores: 3,
      total_xp: 2750,
      global_rank: 142,
      time_accuracy: 82.3,
      location_accuracy: 74.8,
      challenge_accuracy: 80.1
    };
    
    return mockStats;
  } catch (error) {
    console.error('Error in fetchUserStats:', error);
    return null;
  }
}

// Fetch user settings
export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('id', userId)
      .single();

    if (error) {
      // If settings don't exist, return default settings
      if (error.code === 'PGRST116') {
        const defaultSettings: UserSettings = {
          theme: 'system',
          sound_enabled: true,
          notification_enabled: true,
          distance_unit: 'km',
          language: 'en'
        };
        return defaultSettings;
      }
      
      console.error('Error fetching user settings:', error);
      return null;
    }

    return data.value as UserSettings;
  } catch (error) {
    console.error('Error in fetchUserSettings:', error);
    return null;
  }
}

// Update user settings
export async function updateUserSettings(userId: string, settings: UserSettings): Promise<boolean> {
  try {
    // Check if settings exist for this user
    const { data, error: fetchError } = await supabase
      .from('settings')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking settings existence:', fetchError);
      return false;
    }
    
    // If settings exist, update them
    if (data) {
      const { error } = await supabase
        .from('settings')
        .update({ 
          value: settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (error) {
        console.error('Error updating settings:', error);
        return false;
      }
    }
    // If settings don't exist, insert them
    else {
      const { error } = await supabase
        .from('settings')
        .insert({
          id: userId,
          value: settings,
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Error creating settings:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateUserSettings:', error);
    return false;
  }
}
