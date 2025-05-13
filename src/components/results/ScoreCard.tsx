import React from 'react';
import { Button } from "@/components/ui/button";
import { Award, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ScoreCardProps {
  locationAccuracy: number;
  timeAccuracy: number;
  xpTotal: number;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ 
  locationAccuracy, 
  timeAccuracy, 
  xpTotal 
}) => {
  // Calculate overall accuracy as the average of location and time accuracy
  const overallAccuracy = Math.round((locationAccuracy + timeAccuracy) / 2);
  const isPerfectScore = locationAccuracy >= 95 && timeAccuracy >= 95;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
      <h2 className="text-2xl font-bold mb-4 text-history-primary dark:text-history-light">Your Score</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-history-primary/5 dark:bg-history-primary/10">
          <Badge variant="blue" className="text-lg mb-1">
            {overallAccuracy}%
          </Badge>
          <div className="text-sm text-muted-foreground">Accuracy</div>
        </div>
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-history-secondary/5 dark:bg-history-secondary/10">
          <Badge variant="green" className="text-lg mb-1">
            +{xpTotal} XP
          </Badge>
          <div className="text-sm text-muted-foreground">XP Gained</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Where:</span>
          <Badge variant="orange">{locationAccuracy}% Correct</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">When:</span>
          <Badge variant="orange">{timeAccuracy}% Correct</Badge>
        </div>
      </div>
      
      {isPerfectScore && (
        <div className="flex justify-center my-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center bg-gradient-to-br from-gold-light to-gold-dark text-white">
            <Award className="h-6 w-6" />
          </div>
        </div>
      )}
      
      <div className="flex justify-center mt-4">
        <Button variant="outline" size="sm" className="text-muted-foreground border-muted">
          <Share2 className="mr-2 h-4 w-4" />
          Share Result
        </Button>
      </div>
    </div>
  );
};

export default ScoreCard;
