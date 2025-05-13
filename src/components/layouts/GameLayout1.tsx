import React, { useState } from 'react';
import { Progress } from "@/components/ui/progress";
import { useHint } from '@/hooks/useHint';
import HintModal from '@/components/HintModal';

// Import refactored components
import GameHeader from '@/components/game/GameHeader';
import YearSelector from '@/components/game/YearSelector';
import LocationSelector from '@/components/game/LocationSelector';
import TimerDisplay, { formatTime } from '@/components/game/TimerDisplay';
import { GameImage, GuessCoordinates } from '@/contexts/GameContext'; // Import necessary types
import { useGame } from '@/contexts/GameContext'; // Import useGame

export interface GameLayout1Props {
  onComplete?: () => void;
  gameMode?: string;
  currentRound?: number;
  image: GameImage | null;
  onMapGuess: (lat: number, lng: number) => void;
  initialGuess?: GuessCoordinates | null;
  selectedYear: number;
  onYearChange: (year: number) => void;
  remainingTime: number;
  setRemainingTime: React.Dispatch<React.SetStateAction<number>>;
  isTimerActive: boolean;
}

const GameLayout1: React.FC<GameLayout1Props> = ({
  onComplete,
  gameMode = 'solo',
  currentRound = 1,
  image,
  onMapGuess,
  initialGuess,
  selectedYear,
  onYearChange,
  remainingTime,
  setRemainingTime,
  isTimerActive,
}) => {
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const { hintsAllowed } = useGame();
  
  const {
    selectedHintType,
    selectedHintTypes,
    hintContent,
    hintContents,
    selectHint,
    viewHint,
    hintsUsed,
    canSelectHint,
    canSelectHintType
  } = useHint(image);

  const handleHintClick = () => {
    if (canSelectHint) {
    setIsHintModalOpen(true);
    } else {
      console.log("Cannot select hint now.");
    }
  };

  const handleCoordinatesSelect = (lat: number, lng: number) => {
    onMapGuess(lat, lng);
    console.log("Map coordinates selected:", lat, lng);
  };

  if (!image) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-history-light dark:bg-history-dark">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-500 mb-4">Failed to load round data</h2>
          <p className="mb-4">Image data for round {currentRound} is missing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-history-light dark:bg-history-dark">
      <TimerDisplay 
        remainingTime={remainingTime} 
        setRemainingTime={setRemainingTime}
        isActive={isTimerActive}
        onTimeout={onComplete}
      />
      
      <GameHeader 
        imageUrl={image.url}
        imageAlt={image.title}
        selectedHintType={selectedHintType}
        remainingTime={isTimerActive ? formatTime(remainingTime) : undefined}
        rawRemainingTime={isTimerActive ? remainingTime : undefined}
        onHintClick={handleHintClick}
        hintsUsed={hintsUsed || 0}
        hintsAllowed={hintsAllowed}
      />
      
      <div className="flex-grow p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <YearSelector 
            selectedYear={selectedYear}
            onChange={onYearChange}
          />
          
          <LocationSelector 
            selectedLocation={null}
            onLocationSelect={() => {}}
            onCoordinatesSelect={handleCoordinatesSelect}
          />
        </div>
      </div>

      <HintModal
        isOpen={isHintModalOpen}
        onOpenChange={setIsHintModalOpen}
        selectedHintType={selectedHintType}
        selectedHintTypes={selectedHintTypes}
        hintContent={hintContent}
        hintContents={hintContents}
        onSelectHint={selectHint}
        onViewHint={viewHint}
        canSelectHint={canSelectHint}
        canSelectHintType={canSelectHintType}
      />
    </div>
  );
};

export default GameLayout1;
