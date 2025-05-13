import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

// Define the structure for a user's guess coordinates
export interface GuessCoordinates {
  lat: number;
  lng: number;
}

// Define the structure for the result of a single round
export interface RoundResult {
  roundIndex: number; // 0-based index
  imageId: string;
  guessCoordinates: GuessCoordinates | null;
  actualCoordinates: { lat: number; lng: number };
  distanceKm: number | null; // Distance in kilometers
  score: number | null;
  guessYear: number | null; // Added year guess
  xpWhere?: number; // Location XP (0-100)
  xpWhen?: number; // Time XP (0-100)
}

// Define the structure of an image object based on actual schema
export interface GameImage {
  id: string;
  title: string;
  description: string;
  // Keep fields that exist
  latitude: number;
  longitude: number;
  year: number;
  image_url: string; // Use actual column name
  location_name: string;
  url: string; // Keep processed url field
}

// Define the context state shape
interface GameContextState {
  roomId: string | null;
  images: GameImage[];
  roundResults: RoundResult[]; // Store results for each round
  isLoading: boolean;
  error: string | null;
  hintsAllowed: number; // Number of hints allowed per game
  roundTimerSec: number; // Timer duration for each round in seconds
  totalGameAccuracy: number; // Current game accuracy
  totalGameXP: number; // Current game XP
  globalAccuracy: number; // Average accuracy across all games
  globalXP: number; // Total XP earned across all games
  setHintsAllowed: (hints: number) => void; // Function to update hints allowed
  setRoundTimerSec: (seconds: number) => void; // Function to update round timer
  startGame: () => Promise<void>;
  recordRoundResult: (result: Omit<RoundResult, 'roundIndex' | 'imageId' | 'actualCoordinates'>, currentRoundIndex: number) => void; // Function to record results
  resetGame: () => void;
  fetchGlobalMetrics: () => Promise<void>; // Function to fetch global metrics from Supabase or localStorage
}

// Create the context
const GameContext = createContext<GameContextState | undefined>(undefined);

// Define the provider props
interface GameProviderProps {
  children: ReactNode;
}

// Helper function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

// Create the provider component
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [images, setImages] = useState<GameImage[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]); // Initialize results state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hintsAllowed, setHintsAllowed] = useState<number>(3); // Default 3 hints per game
  const [roundTimerSec, setRoundTimerSec] = useState<number>(60); // Default 60 seconds per round
  const [totalGameAccuracy, setTotalGameAccuracy] = useState<number>(0);
  const [totalGameXP, setTotalGameXP] = useState<number>(0);
  const [globalAccuracy, setGlobalAccuracy] = useState<number>(0);
  const [globalXP, setGlobalXP] = useState<number>(0);
  const navigate = useNavigate();

  // Function to fetch global metrics from Supabase or localStorage
  const fetchGlobalMetrics = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No user found when fetching global metrics');
        return;
      }
      
      // For guest users, get metrics from localStorage
      if (user.app_metadata?.provider === 'guest') {
        const storageKey = `user_metrics_${user.id}`;
        const storedMetricsJson = localStorage.getItem(storageKey);
        
        if (storedMetricsJson) {
          try {
            const storedMetrics = JSON.parse(storedMetricsJson);
            setGlobalAccuracy(storedMetrics.overall_accuracy || 0);
            setGlobalXP(storedMetrics.xp_total || 0);
          } catch (e) {
            console.error('Error parsing stored metrics:', e);
          }
        }
      } else {
        // For authenticated users, fetch from Supabase
        const { data: metrics, error: fetchError } = await supabase
          .from('user_metrics')
          .select('overall_accuracy, xp_total')
          .eq('user_id', user.id)
          .single();
        
        if (fetchError) {
          console.error('Error fetching user metrics:', fetchError);
          return;
        }
        
        if (metrics) {
          setGlobalAccuracy(metrics.overall_accuracy || 0);
          setGlobalXP(metrics.xp_total || 0);
        }
      }
    } catch (err) {
      console.error('Error in fetchGlobalMetrics:', err);
    }
  }, []);

  // Update game accuracy and XP whenever round results change
  useEffect(() => {
    if (roundResults.length === 0) {
      setTotalGameAccuracy(0);
      setTotalGameXP(0);
      return;
    }
    
    // Calculate total XP from all rounds
    const xpSum = roundResults.reduce((sum, result) => sum + (result.score || 0), 0);
    setTotalGameXP(xpSum);
    
    // Calculate per-round percentages
    const roundPercentages = roundResults.map(result => {
      // Check if xpWhere and xpWhen are available
      if (result.xpWhere !== undefined && result.xpWhen !== undefined) {
        // Use the formula: roundPct = Math.min(100, Math.round(((xpWhere + xpWhen)/200)*100))
        return Math.min(100, Math.round(((result.xpWhere + result.xpWhen) / 200) * 100));
      } else {
        // Fallback to previous calculation method using score
        const maxRoundScore = 1000;
        const roundPct = result.score ? Math.round((result.score / maxRoundScore) * 100) : 0;
        return Math.min(100, roundPct); // Cap at 100%
      }
    });
    
    // Calculate average of all round percentages
    const avgPercentage = roundPercentages.length > 0
      ? roundPercentages.reduce((sum, pct) => sum + pct, 0) / roundPercentages.length
      : 0;
    
    // Round and cap at 100%
    const finalAccuracy = Math.min(100, Math.round(avgPercentage));
    
    // Debug log the calculation to verify
    console.log('Game accuracy calculation:', {
      roundPercentages,
      avgPercentage,
      finalAccuracy
    });
    
    setTotalGameAccuracy(finalAccuracy);
    
  }, [roundResults]);
  
  // Fetch global metrics on initial load
  useEffect(() => {
    fetchGlobalMetrics();
  }, [fetchGlobalMetrics]);

  // Function to fetch images and start a new game
  const startGame = useCallback(async () => {
    console.log("Starting new game...");
    setIsLoading(true);
    setError(null);
    setImages([]); // Clear previous images
    setRoundResults([]); // Clear previous results
    
    try {
      // Generate a simple unique room ID for this session
      const newRoomId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      setRoomId(newRoomId);
      console.log(`Generated Room ID: ${newRoomId}`);

      // Fetch a larger batch of images (e.g., 20) without specific ordering
      console.log("Fetching batch of images from Supabase...");
      const { data: imageBatch, error: fetchError } = await supabase
        .from('images')
        // Select fields that exist in the DB schema
        .select('id, title, description, latitude, longitude, year, image_url, location_name') 
        // Remove the .order() clause
        .limit(20); // Fetch more images than needed
        
      if (fetchError) {
        console.error("Error fetching images:", fetchError);
        throw new Error(`Failed to fetch images: ${fetchError.message}`);
      }

      if (!imageBatch || imageBatch.length < 5) {
        // Handle case where not enough images are found (even in the larger batch)
        console.warn("Could not fetch at least 5 images, fetched:", imageBatch?.length);
        throw new Error(`Database only contains ${imageBatch?.length || 0} images. Need 5 to start.`);
      }

      console.log(`Fetched ${imageBatch.length} images initially.`);

      // Shuffle the fetched images
      const shuffledBatch = shuffleArray(imageBatch);

      // Select the first 5 images from the shuffled batch
      const selectedImages = shuffledBatch.slice(0, 5);
      console.log(`Selected 5 images after shuffling.`);


      // Process the selected 5 images
      const processedImages = await Promise.all(
        selectedImages.map(async (img) => {
          let finalUrl = img.image_url;
          if (finalUrl && !finalUrl.startsWith('http')) {
            // Assume image_url is a path in Supabase storage
            const { data: urlData } = supabase.storage.from('images').getPublicUrl(finalUrl);
            finalUrl = urlData?.publicUrl || 'placeholder.jpg'; // Use placeholder if URL fails
          } else if (!finalUrl) {
              finalUrl = 'placeholder.jpg'; // Use placeholder if image_url is null/empty
          }
          
          return {
            id: img.id,
            title: img.title || 'Untitled',
            description: img.description || 'No description.',
            latitude: img.latitude || 0,
            longitude: img.longitude || 0,
            year: img.year || 0,
            image_url: img.image_url, // Keep original image_url if needed elsewhere
            location_name: img.location_name || 'Unknown Location',
            url: finalUrl // Final processed URL for display
          } as GameImage;
        })
      );

      setImages(processedImages);
      console.log("Selected 5 images stored in context:", processedImages);
      setIsLoading(false);

      // Navigate to the first round (path updated to be relative to /test layout)
      console.log(`Navigating to round 1 for room ${newRoomId} under /test`);
      navigate(`/test/game/room/${newRoomId}/round/1`);

      // Save game settings to local storage for persistence
      localStorage.setItem('gh_game_settings', JSON.stringify({
        hintsAllowed,
        roundTimerSec
      }));

      console.log(`Game settings: ${hintsAllowed} hints, ${roundTimerSec}s timer`);

    } catch (err) {
      console.error("Error in startGame:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsLoading(false);
      // Potentially navigate to an error page or show a toast
    }
  }, [navigate, hintsAllowed, roundTimerSec]);

  // Function to record the result of a round
  const recordRoundResult = useCallback((resultData: Omit<RoundResult, 'roundIndex' | 'imageId' | 'actualCoordinates'>, currentRoundIndex: number) => {
    if (currentRoundIndex < 0 || currentRoundIndex >= images.length) {
        console.error("Cannot record result for invalid round index:", currentRoundIndex);
        return;
    }
    const currentImage = images[currentRoundIndex];
    
    // Calculate xpWhere and xpWhen if score is available but they aren't
    let xpWhere = resultData.xpWhere;
    let xpWhen = resultData.xpWhen;
    
    if (resultData.score && (xpWhere === undefined || xpWhen === undefined)) {
        // Use 70% of score for xpWhere and 30% for xpWhen, as seen in RoundResultsPage.tsx
        xpWhere = Math.round(resultData.score * 0.7);
        xpWhen = Math.round(resultData.score * 0.3);
        console.log(`Calculated xpWhere (${xpWhere}) and xpWhen (${xpWhen}) from score ${resultData.score}`);
    }
    
    const fullResult: RoundResult = {
        roundIndex: currentRoundIndex,
        imageId: currentImage.id,
        actualCoordinates: { lat: currentImage.latitude, lng: currentImage.longitude },
        guessCoordinates: resultData.guessCoordinates,
        distanceKm: resultData.distanceKm,
        score: resultData.score,
        guessYear: resultData.guessYear,
        xpWhere,
        xpWhen,
    };

    console.log(`Recording result for round ${currentRoundIndex + 1}:`, fullResult);
    setRoundResults(prevResults => {
        // Avoid duplicates - replace if already exists for this index
        const existingIndex = prevResults.findIndex(r => r.roundIndex === currentRoundIndex);
        if (existingIndex !== -1) {
            const updatedResults = [...prevResults];
            updatedResults[existingIndex] = fullResult;
            return updatedResults;
        } else {
            return [...prevResults, fullResult];
        }
    });
  }, [images]); // Dependency on images to get actual coordinates

  // Function to reset game state
  const resetGame = useCallback(() => {
    console.log("Resetting game state...");
    setRoomId(null);
    setImages([]);
    setRoundResults([]); // Clear results on reset
    setError(null);
    setIsLoading(false);
    // Optionally navigate home or to a new game setup screen
    // navigate('/'); // Example: navigate home
  }, []);

  // Value provided by the context
  const value: GameContextState = {
    roomId,
    images,
    roundResults,
    isLoading,
    error,
    hintsAllowed,
    roundTimerSec,
    totalGameAccuracy,
    totalGameXP,
    globalAccuracy,
    globalXP,
    setHintsAllowed,
    setRoundTimerSec,
    startGame,
    recordRoundResult,
    resetGame,
    fetchGlobalMetrics
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// Custom hook to use the GameContext
export const useGame = (): GameContextState => { // Ensure hook returns the full state type
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

// Helper function to calculate distance between two lat/lng points (Haversine formula)
// Returns distance in kilometers
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Example scoring function (adjust as needed)
// Lower distance = higher score. Max score 5000.
export function calculateScore(distanceKm: number): number {
    const maxDistanceForPoints = 2000; // Max distance (km) where points are awarded
    const maxScore = 5000;

    if (distanceKm < 0) return 0; // Should not happen
    if (distanceKm === 0) return maxScore; // Perfect guess
    if (distanceKm > maxDistanceForPoints) return 0;

    // Example: Linear decrease (you could use logarithmic, exponential, etc.)
    const score = Math.round(maxScore * (1 - distanceKm / maxDistanceForPoints));

    // Ensure score is within bounds [0, maxScore]
    return Math.max(0, Math.min(score, maxScore));
} 