import { Clock, Award, User } from "lucide-react";
import { GameModeCard } from "@/components/GameModeCard";
import { useGame } from "@/contexts/GameContext"; // Import useGame hook
import GameSettings from "@/components/game/GameSettings"; // Import GameSettings

// Rename component
const HomePage = () => {
  const { startGame, isLoading } = useGame(); // Get startGame function and loading state

  const handleStartGame = async (mode: string) => {
    // Potentially pass mode to startGame if needed in context
    console.log(`Starting game with mode: ${mode}`);
    if (!isLoading) { // Prevent multiple clicks while loading
      await startGame(); // Settings are already in context, startGame reads them
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Game Settings Section */}
      <div className="max-w-3xl mx-auto mb-12">
        <GameSettings />
      </div>

      {/* Game modes section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <GameModeCard
          title="Classic"
          description="Test your historical knowledge at your own pace. Perfect for learning and exploring."
          mode="classic"
          icon={User}
          onStartGame={handleStartGame} // Pass handler to the card
          isLoading={isLoading} // Pass loading state
        />
        {/* Add onStartGame and isLoading to other cards if they should also start games */}
        <GameModeCard
          title="Time Attack"
          description="Race against the clock! Make quick decisions about historical events."
          mode="time-attack"
          icon={Clock}
          onStartGame={handleStartGame} // Add handler 
          isLoading={isLoading} // Add loading state
        />
        <GameModeCard
          title="Challenge"
          description="Compete with others in daily challenges and earn achievements."
          mode="challenge"
          icon={Award}
          onStartGame={handleStartGame} // Add handler
          isLoading={isLoading} // Add loading state
        />
      </div>
    </div>
  );
};

export default HomePage; // Export with new name 