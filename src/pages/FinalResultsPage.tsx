import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { Share2, Loader, Home, MapPin, Calendar, ArrowLeft, Target, Zap } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { Badge } from "@/components/ui/badge";

const FinalResultsPage = () => {
  const navigate = useNavigate();
  const { 
    images, 
    isLoading: isContextLoading, 
    error: contextError, 
    startGame,
    resetGame,
    roundResults
  } = useGame();

  const handlePlayAgain = async () => {
    resetGame();
    await startGame();
  };

  const handleHome = () => {
    resetGame();
    navigate("/");
  };

  if (isContextLoading) {
    return (
      <div className="min-h-screen bg-history-light dark:bg-history-dark p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-history-primary mx-auto mb-4" />
          <p className="text-lg">Loading final results...</p>
        </div>
      </div>
    );
  }

  if (contextError) {
    return (
      <div className="min-h-screen bg-history-light dark:bg-history-dark p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Error Loading Results</h2>
          <p className="mb-6">{contextError}</p>
          <Button
            onClick={() => navigate("/")}
            className="bg-history-primary hover:bg-history-primary/90 text-white"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="min-h-screen bg-history-light dark:bg-history-dark p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">No game data found for this session.</p>
          <Button onClick={handlePlayAgain}>Start New Game</Button>
        </div>
      </div>
    );
  }

  // Calculate total score from roundResults
  const totalScore = roundResults?.reduce((total, result) => total + (result?.score || 0), 0) || 0;
  // Placeholder for total percentage calculation
  const totalPercentage = roundResults && roundResults.length > 0 ? 
    roundResults.reduce((acc, curr) => {
      const roundLocAcc = curr && curr.distanceKm != null ? Math.max(0, 100 - (curr.distanceKm / 2000) * 100) : 0; // Simplified loc accuracy
      const roundTimeAcc = curr && curr.guessYear && images.find(img => img.id === curr.imageId)?.year ? Math.max(0, 100 - (Math.abs(curr.guessYear - images.find(img => img.id === curr.imageId).year) * 2)) : 0; // Simplified time acc
      return acc + (roundLocAcc + roundTimeAcc) / 2;
    }, 0) / roundResults.length : 0;

  return (
    <div className="min-h-screen bg-history-light dark:bg-history-dark p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-history-primary dark:text-history-light">
            Final Score
          </h1>
          <div className="flex justify-center items-center space-x-4 mt-2">
            <span className="font-semibold">Accuracy:</span>
            <Badge variant="accuracy" className="text-lg flex items-center gap-1" aria-label={`Accuracy: ${Math.round(totalPercentage)}%`}>
              <Target className="h-4 w-4" />
              <span>{Math.round(totalPercentage)}%</span>
            </Badge>
            <span className="font-semibold">XP:</span>
            <Badge variant="xp" className="text-lg flex items-center gap-1" aria-label={`XP: ${Math.round(totalScore)}`}>
              <Zap className="h-4 w-4" />
              <span>{Math.round(totalScore)}</span>
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 mb-8">
          {images.map((image, index) => {
            const result = roundResults?.[index];
            const yearDifference = result?.guessYear && image.year ? 
              Math.abs(result.guessYear - image.year) : 0;
            // Placeholder for per-round percentage
            const roundLocAcc = result && result.distanceKm != null ? Math.max(0, 100 - (result.distanceKm / 2000) * 100) : 0;
            const roundTimeAcc = result && result.guessYear && image.year ? Math.max(0, 100 - (Math.abs(result.guessYear - image.year) * 2)) : 0;
            const roundPercentage = (roundLocAcc + roundTimeAcc) / 2;
            
            return (
              <div
                key={image.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3">
                    <img
                      src={image.url}
                      alt={`Round ${index + 1} - ${image.title}`}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="p-4 md:w-2/3">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-history-primary dark:text-history-light">
                          Round {index + 1}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="accuracy" className="flex items-center gap-1" aria-label={`Accuracy: ${Math.round(roundPercentage)}%`}>
                            <Target className="h-3 w-3" />
                            <span>{Math.round(roundPercentage)}%</span>
                          </Badge>
                          <Badge variant="xp" className="flex items-center gap-1" aria-label={`XP: ${Math.round(result?.score || 0)}`}>
                            <Zap className="h-3 w-3" />
                            <span>{Math.round(result?.score || 0)}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{image.title}</p>
                        <p className="text-xs text-muted-foreground">
                          <Badge variant="selectedValue" className="text-xs mt-1">
                            {image.location_name} ({image.year})
                          </Badge>
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="p-3 rounded-lg bg-history-primary/10 dark:bg-history-primary/20">
                        <div className="flex items-center mb-2">
                          <MapPin className="h-4 w-4 mr-1 text-history-primary" />
                          <span className="text-sm font-medium text-history-primary dark:text-history-light">Where</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-history-primary dark:text-history-light">
                            {result?.distanceKm === 0 ? (
                              <span className="text-green-600 dark:text-green-400 font-medium">Perfect!</span>
                            ) : (
                              `${result?.distanceKm?.toFixed(0) || '?'} km off`
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="accuracy" className="text-xs flex items-center gap-1" aria-label={`Location Accuracy: ${Math.round((result?.distanceKm || 0) > 2000 ? 0 : 100 - (result?.distanceKm || 0) / 20)}%`}>
                              <Target className="h-2 w-2" />
                              <span>{Math.round((result?.distanceKm || 0) > 2000 ? 0 : 100 - (result?.distanceKm || 0) / 20)}%</span>
                            </Badge>
                            <Badge variant="xp" className="text-xs flex items-center gap-1" aria-label={`Location XP: ${Math.round((result?.score || 0) * 0.7)}`}>
                              <Zap className="h-2 w-2" />
                              <span>{Math.round((result?.score || 0) * 0.7)}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-history-primary/10 dark:bg-history-primary/20">
                        <div className="flex items-center mb-2">
                          <Calendar className="h-4 w-4 mr-1 text-history-primary" />
                          <span className="text-sm font-medium text-history-primary dark:text-history-light">When</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-history-primary dark:text-history-light">
                            {yearDifference === 0 ? (
                              <span className="text-green-600 dark:text-green-400 font-medium">Perfect!</span>
                            ) : (
                              `${yearDifference || '?'} years off`
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="accuracy" className="text-xs flex items-center gap-1" aria-label={`Time Accuracy: ${Math.round(yearDifference > 50 ? 0 : 100 - yearDifference * 2)}%`}>
                              <Target className="h-2 w-2" />
                              <span>{Math.round(yearDifference > 50 ? 0 : 100 - yearDifference * 2)}%</span>
                            </Badge>
                            <Badge variant="xp" className="text-xs flex items-center gap-1" aria-label={`Time XP: ${Math.round((result?.score || 0) * 0.3)}`}>
                              <Zap className="h-2 w-2" />
                              <span>{Math.round((result?.score || 0) * 0.3)}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => {
              // Share functionality would go here
              alert("Share functionality coming soon!");
            }}
            variant="outline"
            className="border-history-primary text-history-primary gap-2"
          >
            <Share2 size={16} />
            Share Score
          </Button>
          <Button
            onClick={handlePlayAgain}
            className="bg-history-primary hover:bg-history-primary/90 text-white gap-2"
          >
            <Loader size={16} />
            Play Again
          </Button>
          <Button
            onClick={handleHome}
            variant="secondary"
            className="gap-2"
          >
            <Home size={16} />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinalResultsPage; 