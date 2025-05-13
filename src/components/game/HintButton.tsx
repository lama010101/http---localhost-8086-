import React from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useHint } from '@/hooks/useHint';
import { GameImage } from '@/contexts/GameContext';

interface HintButtonProps {
  onClick: () => void;
  className?: string;
  imageForRound?: GameImage | null;
}

export const HintButton: React.FC<HintButtonProps> = ({ 
  onClick, 
  className = '', 
  imageForRound = null 
}) => {
  const { 
    canSelectHint, 
    hintsAllowed, 
    hintsUsed,
    selectedHintType 
  } = useHint(imageForRound);

  const hintsRemaining = hintsAllowed - hintsUsed;
  
  return (
    <Button 
      size="sm" 
      className={`${className} ${selectedHintType ? 'bg-history-secondary/50' : 'bg-black/50 hover:bg-black/70'} text-white border-none`}
      onClick={onClick}
      disabled={!canSelectHint}
    >
      <HelpCircle className="h-4 w-4 mr-1" /> 
      Hint
      {selectedHintType && <span className="ml-1 text-xs">({selectedHintType})</span>}
      <span className="ml-2 text-xs opacity-75">Hints: {hintsRemaining}/{hintsAllowed}</span>
    </Button>
  );
}; 