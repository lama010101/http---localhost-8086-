import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
// Remove Progress component if no longer used
// import { Progress } from "@/components/ui/progress";
import { 
  ChevronRight,
  Award,
  Share2,
  MapPin,
  Calendar,
  Star,
  Target,
  Zap
} from "lucide-react";
import ResultsHeader from "@/components/results/ResultsHeader";
// Import the specific RoundResult type this component uses
import { RoundResult, XP_WHERE_MAX, XP_WHEN_MAX } from '@/utils/resultsFetching'; 

// Import Leaflet components and CSS
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, Polyline } from 'react-leaflet';
import { FullscreenControl } from 'react-leaflet-fullscreen';
import 'react-leaflet-fullscreen/styles.css';
import 'leaflet/dist/leaflet.css';
// Import Leaflet's default icon handling (important for markers)
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Import the new CircularProgress component
import CircularProgress from '@/components/ui/CircularProgress';
import { checkAndAwardBadges } from '@/utils/badges/badgeService';
import { Badge as BadgeType } from '@/utils/badges/types';
import { BadgeEarnedPopup } from '@/components/badges/BadgeEarnedPopup';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

// Component to handle fullscreen events
const FullscreenHandler: React.FC = () => {
  const map = useMap();
  
  useEffect(() => {
    map.on('enterFullscreen', () => document.body.classList.add('leaflet-fullscreen-on'));
    map.on('exitFullscreen', () => document.body.classList.remove('leaflet-fullscreen-on'));
    
    return () => {
      map.off('enterFullscreen');
      map.off('exitFullscreen');
    };
  }, [map]);
  
  return null;
};

// Define proper props interface
interface ResultsLayout2Props {
  onNext?: () => void;
  round?: number;
  gameId?: string;
  isLoading?: boolean;
  error?: string | null;
  result?: RoundResult | null;
  userAvatarUrl?: string;
}

const ResultsLayout2: React.FC<ResultsLayout2Props> = ({ 
  onNext, 
  round = 1, 
  gameId,
  isLoading = false,
  error,
  result,
  userAvatarUrl = '/assets/default-avatar.png'
}) => {
  const { user } = useAuth();
  const [earnedBadge, setEarnedBadge] = useState<BadgeType | null>(null);
  
  // Display an error message if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <ResultsHeader 
          round={round} 
          totalRounds={5} 
          onNext={onNext} 
          isLoading={isLoading} 
          currentRoundXP={result?.xpTotal}
          currentRoundAccuracy={result ? Math.round((result.locationAccuracy + result.timeAccuracy) / 2) : undefined}
        />
        <div className="max-w-7xl mx-auto p-4 pt-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-history-primary dark:text-history-light">
              Oops! Something went wrong
            </h2>
            <p className="mb-6 text-muted-foreground">{error}</p>
            {onNext && (
              <Button 
                className="bg-history-primary hover:bg-history-primary/90 text-white"
                onClick={onNext}
              >
                Continue to Next Round
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If no result is available, show a placeholder
  if (!result) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <ResultsHeader 
          round={round} 
          totalRounds={5} 
          onNext={onNext} 
          isLoading={isLoading} 
        />
        <div className="max-w-7xl mx-auto p-4 pt-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-history-primary dark:text-history-light">
              Failed to load your guess
            </h2>
            {onNext && (
              <Button 
                className="bg-history-primary hover:bg-history-primary/90 text-white"
                onClick={onNext}
              >
                Continue to Next Round
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Use the round information from props
  const progressPercentage = (round / 5) * 100;
  
  // Calculate total accuracy as average of where and when
  const totalAccuracy = Math.round((result.locationAccuracy + result.timeAccuracy) / 2);
  
  // Max XP possible
  const maxXP = XP_WHERE_MAX + XP_WHEN_MAX;
  
  // Coordinates for the map - handle potential null guess
  const correctLat = result.eventLat;
  const correctLng = result.eventLng;
  const userLat = result.guessLat;
  const userLng = result.guessLng;
  const mapCenter: L.LatLngExpression = [correctLat, correctLng]; // Default center to correct location
  const hasUserGuess = userLat !== null && userLng !== null;
  
  // Create custom icons for markers
  const userIcon = new L.DivIcon({ 
    html: `<img src="${userAvatarUrl}" class="rounded-full w-8 h-8 border-2 border-white" alt="Your guess" />`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
  
  const correctIcon = new L.DivIcon({ 
    html: `<div class="rounded-full w-8 h-8 bg-green-500 flex items-center justify-center text-white">✓</div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  // Define positions for the polyline
  const userPosition: [number, number] = [userLat || 0, userLng || 0];
  const correctPosition: [number, number] = [correctLat, correctLng];

  useEffect(() => {
    const checkBadges = async () => {
      if (!user) return;
      
      try {
        // Try to get existing user metrics from localStorage first
        let existingMetrics = {
          games_played: 0,
          perfect_rounds: 0,
          perfect_games: 0,
          time_accuracy: 0,
          location_accuracy: 0,
          overall_accuracy: 0,
          win_streak: 0,
          daily_streak: 0,
          xp_total: 0,
          year_bullseye: 0,
          location_bullseye: 0
        };
        
        // For guest users particularly, we need to track metrics in localStorage
        const storageKey = `user_metrics_${user.id}`;
        const storedMetrics = localStorage.getItem(storageKey);
        if (storedMetrics) {
          try {
            existingMetrics = JSON.parse(storedMetrics);
          } catch (e) {
            console.error('Error parsing stored metrics:', e);
          }
        }
        
        // Calculate metrics from this round
        // Check if this round is perfect (both time and location accuracy are 100%)
        const isPerfectRound = result.timeAccuracy === 100 && result.locationAccuracy === 100;
        const perfectRounds = isPerfectRound ? 1 : 0;
        
        const isPerfectGame = totalAccuracy === 100;
        
        // Check if this is a year bullseye (exact match)
        const yearBullseye = result.yearDifference === 0 ? 1 : 0;
        
        // Check if this is a location bullseye (less than 10km distance)
        const locationBullseye = result.distanceKm < 10 ? 1 : 0;
        
        // Update cumulative metrics
        const updatedMetrics = {
          games_played: existingMetrics.games_played + 1,
          perfect_rounds: existingMetrics.perfect_rounds + perfectRounds,
          perfect_games: existingMetrics.perfect_games + (isPerfectGame ? 1 : 0),
          time_accuracy: Math.round((existingMetrics.time_accuracy + result.timeAccuracy) / 2),
          location_accuracy: Math.round((existingMetrics.location_accuracy + result.locationAccuracy) / 2),
          overall_accuracy: Math.round((existingMetrics.overall_accuracy + totalAccuracy) / 2),
          win_streak: isPerfectGame ? existingMetrics.win_streak + 1 : 0,
          daily_streak: existingMetrics.daily_streak, // Would need more logic to track this properly
          xp_total: existingMetrics.xp_total + result.xpTotal,
          year_bullseye: existingMetrics.year_bullseye + yearBullseye,
          location_bullseye: existingMetrics.location_bullseye + locationBullseye
        };
        
        // Save the updated metrics to localStorage
        localStorage.setItem(storageKey, JSON.stringify(updatedMetrics));
        
        // Check for earned badges using the updated metrics
        const newBadges = await checkAndAwardBadges(user.id, updatedMetrics);
        
        // If any badges were earned, show the first one
        if (newBadges.length > 0) {
          setEarnedBadge(newBadges[0]);
        }
      } catch (error) {
        console.error('Error checking badges:', error);
      }
    };
    
    checkBadges();
  }, [user, result, totalAccuracy]);
  
  const handleBadgePopupClose = () => {
    setEarnedBadge(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sticky header with progress visualization */}
      <ResultsHeader 
        round={round} 
        totalRounds={5} 
        onNext={onNext} 
        isLoading={isLoading} 
        currentRoundXP={result.xpTotal}
        currentRoundAccuracy={totalAccuracy}
      />
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto p-4 pt-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left column - Score & Map */}
          <div className="w-full md:w-1/2 space-y-6">
            {/* Score card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
              <h2 className="text-2xl font-bold mb-6 text-history-primary dark:text-history-light">Your Score</h2>
              
              <div className="flex justify-center gap-6 mb-4">
                <Badge variant="accuracy" className="text-lg flex items-center gap-1">
                  <Target className="h-5 w-5" />
                  {totalAccuracy}%
                </Badge>
                <Badge variant="xp" className="text-lg flex items-center gap-1">
                  <Zap className="h-5 w-5" />
                  +{result.xpTotal}
                </Badge>
              </div>
              
              {/* Display earned badges if any */}
              {result.earnedBadges && result.earnedBadges.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center justify-center">
                    <Award className="h-4 w-4 mr-1 text-yellow-500" /> 
                    Badges Earned
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {result.earnedBadges.map(badge => (
                      <Badge 
                        key={badge.id} 
                        variant="outline" 
                        className="flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700"
                      >
                        <Award className="h-3 w-3" />
                        {badge.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-center gap-4 mt-6">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-1"
                  onClick={() => {/* Share functionality */}}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
            
            {/* Map card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-border flex justify-between items-center">
                <h2 className="font-bold text-lg text-history-primary dark:text-history-light flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  Where
                </h2>
                <div className="px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm">
                  {result.distanceKm === 0 ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">Perfect!</span>
                  ) : (
                    `${result.distanceKm.toFixed(0)} km off`
                  )}
                </div>
              </div>
              
              <div className="p-4 border-b border-border flex flex-col md:flex-row justify-between items-center">
                <div className="text-center md:text-left mb-2 md:mb-0">
                  <div className="font-medium">
                    <span className="text-foreground">Correct: </span>
                    <Badge variant="selectedValue" className="ml-1">
                      {result.locationName}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="text-center">
                    <Badge variant="accuracy" className="text-sm flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {result.locationAccuracy}%
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <Badge variant="xp" className="text-sm flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      +{result.xpWhere}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">XP</div>
                  </div>
                </div>
              </div>
              
              <div className="h-80 w-full">
                <MapContainer 
                  id="results-map"
                  className="results-map-container leaflet-container"
                  center={mapCenter} 
                  zoom={3}
                  style={{ height: '100%', width: '100%' }} 
                  scrollWheelZoom={false}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  <FullscreenHandler />
                  
                  {/* Marker for Correct Location */}
                  <Marker position={correctPosition} icon={correctIcon}>
                    <Popup>Correct Location: {result.locationName}</Popup>
                  </Marker>
                  
                  {/* Marker for User Guess (only if coordinates exist) */}
                  {hasUserGuess && (
                    <Marker position={userPosition} icon={userIcon}>
                      <Popup>Your Guess</Popup>
                    </Marker>
                  )}
                  
                  {/* Connector line between the two points */}
                  {hasUserGuess && (
                    <Polyline 
                      positions={[userPosition, correctPosition]} 
                      pathOptions={{ dashArray: '4 4', color: '#666' }} 
                    />
                  )}
                  
                  {/* Add fullscreen and zoom controls in desired order */}
                  <FullscreenControl position="topright" />
                  <ZoomControl position="topleft" zoomInText="+" zoomOutText="–" />
                </MapContainer>
              </div>
            </div>
            
            {/* Time accuracy card for smaller screens */}
            <div className="md:hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
              <div className="border-b border-border pb-3 mb-3 flex justify-between items-center">
                <h2 className="font-bold text-lg text-history-primary dark:text-history-light flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  When
                </h2>
                <Badge variant="hint" className="text-sm">
                  {result.timeDifferenceDesc}
                </Badge>
              </div>
              
              <div className="flex justify-between text-sm mb-4">
                <div>Your guess: <span className="font-medium">{result.guessYear}</span></div>
                <div>
                  <span className="text-foreground">Correct: </span>
                  <Badge variant="selectedValue" className="ml-1">
                    {result.eventYear}
                  </Badge>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-center">
                  <Badge variant="accuracy" className="text-sm flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {result.timeAccuracy}%
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">Accuracy</div>
                </div>
                <div className="text-center">
                  <Badge variant="xp" className="text-sm flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    +{result.xpWhen}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">XP</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Image & Description */}
          <div className="w-full md:w-1/2 space-y-6">
            {/* Time accuracy card for larger screens */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
              <div className="border-b border-border pb-3 mb-3 flex justify-between items-center">
                <h2 className="font-bold text-lg text-history-primary dark:text-history-light flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  When
                </h2>
                <Badge variant="hint" className="text-sm">
                  {result.timeDifferenceDesc}
                </Badge>
              </div>
              
              <div className="flex justify-between text-sm mb-4">
                <div>Your guess: <span className="font-medium">{result.guessYear}</span></div>
                <div>
                  <span className="text-foreground">Correct: </span>
                  <Badge variant="selectedValue" className="ml-1">
                    {result.eventYear}
                  </Badge>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-center">
                  <Badge variant="accuracy" className="text-sm flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {result.timeAccuracy}%
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">Accuracy</div>
                </div>
                <div className="text-center">
                  <Badge variant="xp" className="text-sm flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    +{result.xpWhen}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">XP</div>
                </div>
              </div>
            </div>
            
            {/* Historical image and description */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <img 
                src={result.imageUrl} 
                alt={result.imageTitle} 
                className="w-full h-48 object-cover"
              />
              
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2 text-history-primary dark:text-history-light">
                  {result.imageTitle} ({result.eventYear})
                </h2>
                <div className="max-h-48 overflow-y-auto pr-2 text-muted-foreground">
                  <p>{result.imageDescription}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sticky footer with next button for mobile only */}
        <div className="md:hidden sticky bottom-4 mt-6">
          {onNext && (
            <Button 
              onClick={onNext}
              disabled={isLoading}
              className="w-full py-6 font-semibold text-lg bg-history-primary hover:bg-history-primary/90 text-white shadow-lg rounded-xl"
            >
              Next Round
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Badge earned popup */}
      <BadgeEarnedPopup 
        badge={earnedBadge} 
        onClose={handleBadgePopupClose} 
      />
    </div>
  );
};

export default ResultsLayout2;
