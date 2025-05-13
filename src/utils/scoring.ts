/**
 * Calculates the final round score after applying penalties for hint usage
 * 
 * @param baseScore The initial calculated score before penalties
 * @param hintsUsed The number of hints used in the round
 * @returns The final score after applying hint penalties
 */
export function calculateRoundScore(baseScore: number, hintsUsed: number): number {
  // Cap the hints used at 3
  const cappedHints = Math.min(hintsUsed, 3);
  
  // Each hint reduces score by 10%, up to 30% for 3 hints
  const penaltyMultiplier = 1 - 0.1 * cappedHints;
  
  // Apply the penalty and round to nearest integer
  const finalScore = Math.round(baseScore * penaltyMultiplier);
  
  return finalScore;
} 