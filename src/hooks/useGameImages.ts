import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface GameImage {
  id: string;
  url: string;
  title: string;
  description: string;
  year: number;
  latitude: number;
  longitude: number;
  location_name: string;
}

// Default placeholder images to use when no database images are available
const PLACEHOLDER_IMAGES: GameImage[] = [
  {
    id: 'placeholder_1',
    title: 'Eiffel Tower Construction',
    description: 'The Eiffel Tower nearing completion for the 1889 World\'s Fair in Paris. Initially controversial, it later became one of the world\'s most iconic landmarks.',
    url: 'https://source.unsplash.com/random/?eiffel+tower,paris,historical',
    year: 1889,
    latitude: 48.8584,
    longitude: 2.2945,
    location_name: 'Paris, France'
  },
  {
    id: 'placeholder_2',
    title: 'Berlin Wall',
    description: 'The Berlin Wall was a guarded concrete barrier that physically and ideologically divided Berlin from 1961 to 1989.',
    url: 'https://source.unsplash.com/random/?berlin+wall,historical',
    year: 1961,
    latitude: 52.5163,
    longitude: 13.3777,
    location_name: 'Berlin, Germany'
  },
  {
    id: 'placeholder_3',
    title: 'Golden Gate Bridge Opening',
    description: 'The Golden Gate Bridge opened to the public in 1937 after four years of construction. It was the longest suspension bridge span in the world at the time.',
    url: 'https://source.unsplash.com/random/?golden+gate+bridge,historical',
    year: 1937,
    latitude: 37.8199,
    longitude: -122.4783,
    location_name: 'San Francisco, USA'
  },
  {
    id: 'placeholder_4',
    title: 'Great Wall of China',
    description: 'The Great Wall of China was built over centuries to protect Chinese states and empires from nomadic groups.',
    url: 'https://source.unsplash.com/random/?great+wall+china,historical',
    year: 1644,
    latitude: 40.4319,
    longitude: 116.5704,
    location_name: 'Beijing, China'
  },
  {
    id: 'placeholder_5',
    title: 'Statue of Liberty',
    description: 'The Statue of Liberty was dedicated in 1886 and was a gift to the United States from the people of France.',
    url: 'https://source.unsplash.com/random/?statue+liberty,historical',
    year: 1886,
    latitude: 40.6892,
    longitude: -74.0445,
    location_name: 'New York, USA'
  },
];

export function useGameImages(gameId?: string) {
  const [images, setImages] = useState<GameImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to shuffle array
  const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchReadyImages = async () => {
    console.log('Fetching ready images');
    setIsLoading(true);
    setError(null);
    
    // Handle temp game scenario first
    const isTempGame = gameId?.startsWith('temp_');
    if (isTempGame) {
      console.log('Using placeholder images for temporary game');
      setImages(shuffleArray([...PLACEHOLDER_IMAGES]));
      setCurrentImageIndex(0);
      setIsLoading(false);
      return;
    }
    
    try {
      // Query the images table for ready images
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('ready', true);

      if (error) {
        throw error;
      }

      console.log(`Found ${data?.length || 0} ready images`);

      // If we have no ready images, try to get any images
      if (!data || data.length === 0) {
        console.log('No ready images found, trying to get any images');
        const { data: anyImages, error: anyError } = await supabase
          .from('images')
          .select('*');
          
        if (anyError || !anyImages || anyImages.length === 0) {
          console.log('No images found in database, using placeholder images');
          setImages(shuffleArray([...PLACEHOLDER_IMAGES]));
          setCurrentImageIndex(0);
          setIsLoading(false);
          return;
        }
        
        // Use whatever images we found
        const imagesWithUrls = await processImages(anyImages);
        const shuffledImages = shuffleArray(imagesWithUrls);
        setImages(shuffledImages);
        setCurrentImageIndex(0);
        return;
      }

      // For each image, get the public URL
      const imagesWithUrls = await processImages(data);

      // Shuffle the images for randomization
      const shuffledImages = shuffleArray(imagesWithUrls);
      setImages(shuffledImages);
      setCurrentImageIndex(0);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
      
      // Fall back to placeholder images
      console.log('Falling back to placeholder images');
      setImages(shuffleArray([...PLACEHOLDER_IMAGES]));
      setCurrentImageIndex(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Process images to get URLs
  const processImages = async (imageData: any[]) => {
    return Promise.all(
      imageData.map(async (image) => {
        // If image_url is a full URL, use it directly
        // Otherwise, construct URL from storage
        let url = image.image_url;
        if (url && !url.startsWith('http')) {
          try {
            const { data: publicUrl } = supabase.storage
              .from('images')
              .getPublicUrl(image.image_url);
            url = publicUrl.publicUrl;
          } catch (err) {
            console.error('Error getting public URL:', err);
            // Use a placeholder image if URL generation fails
            url = `https://source.unsplash.com/random?history,${image.title}`;
          }
        } else if (!url) {
          // If no URL at all, use a placeholder
          url = `https://source.unsplash.com/random?history,${image.title || 'historical'}`;
        }

        return {
          id: image.id,
          url: url,
          title: image.title || 'Historical Image',
          description: image.description || 'No description available',
          year: image.year || 1900,
          latitude: image.latitude || 0,
          longitude: image.longitude || 0,
          location_name: image.location_name || 'Unknown Location',
        };
      })
    );
  };

  // Get current image
  const currentImage = images.length > 0 ? images[currentImageIndex] : null;

  // Move to next image
  const nextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetchReadyImages();
  }, [gameId]);

  return {
    images,
    currentImage,
    isLoading,
    error,
    nextImage,
    currentImageIndex,
  };
}
