import React from 'react';
import { Button } from "@/components/ui/button";
import { Clock, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGame } from '@/contexts/GameContext';

interface GameHeaderProps {
  imageUrl: string;
  imageAlt?: string;
  selectedHintType?: string | null;
  remainingTime?: string;
  onHintClick: () => void;
  hintsUsed?: number;
  hintsAllowed?: number;
  rawRemainingTime?: number;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  imageUrl,
  imageAlt = "Historical scene",
  selectedHintType,
  remainingTime,
  onHintClick,
  hintsUsed = 0,
  hintsAllowed = 0,
  rawRemainingTime = 0
}) => {
  const hintsRemaining = hintsAllowed - hintsUsed;
  const isHintDisabled = hintsRemaining <= 0;
  
  const isTimeRunningOut = rawRemainingTime <= 10;
  const timerBadgeClass = isTimeRunningOut ? "bg-red-600 hover:bg-red-700" : "bg-primary";

  return (
    <div className="w-full h-[40vh] md:h-[50vh] relative">
      <img
        src={imageUrl}
        alt={imageAlt}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="bg-white/70 hover:bg-white"
          onClick={onHintClick}
          disabled={isHintDisabled}
        >
          <HelpCircle className="h-5 w-5" />
          <span className="ml-1">Hint</span>
          <Badge variant="default" className="ml-1">
            {selectedHintType ? selectedHintType : `${hintsRemaining}/${hintsAllowed}`}
          </Badge>
        </Button>
        {remainingTime && (
          <Button size="sm" variant="outline" className="bg-white/70 hover:bg-white">
            <Clock className="h-5 w-5" />
            <Badge 
              variant="default" 
              className={`ml-1 ${timerBadgeClass}`}
            >
              {remainingTime}
            </Badge>
          </Button>
        )}
      </div>
    </div>
  );
};

export default GameHeader;
