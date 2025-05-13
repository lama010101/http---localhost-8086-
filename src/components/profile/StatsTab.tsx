import React from 'react';
import { Progress } from "@/components/ui/progress";
import { UserStats } from '@/utils/profile/profileService';

interface StatsTabProps {
  stats: UserStats;
  isLoading: boolean;
}

const StatsTab: React.FC<StatsTabProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-history-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-6 text-history-primary dark:text-history-light">Your Statistics</h3>
      
      {stats.gamesPlayed === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-2">No game statistics yet.</p>
          <p>Play your first game to see your stats!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-history-primary dark:text-history-light">{stats.gamesPlayed}</div>
              <div className="text-sm text-muted-foreground">Games Played</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-history-primary dark:text-history-light">{stats.avgAccuracy}%</div>
              <div className="text-sm text-muted-foreground">Avg. Accuracy</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-history-primary dark:text-history-light">{stats.bestAccuracy}%</div>
              <div className="text-sm text-muted-foreground">Best Accuracy</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-history-primary dark:text-history-light">{stats.perfectScores}</div>
              <div className="text-sm text-muted-foreground">Perfect Scores</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-history-primary dark:text-history-light">
                {stats.totalXp.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total XP</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-history-primary dark:text-history-light">
                {stats.globalRank > 0 ? `#${stats.globalRank}` : '-'}
              </div>
              <div className="text-sm text-muted-foreground">Global Rank</div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <h4 className="font-medium mb-3 text-history-primary dark:text-history-light">Accuracy Breakdown</h4>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Time Accuracy</span>
                  <span className="font-medium">{stats.timeAccuracy}%</span>
                </div>
                <Progress value={stats.timeAccuracy} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Location Accuracy</span>
                  <span className="font-medium">{stats.locationAccuracy}%</span>
                </div>
                <Progress value={stats.locationAccuracy} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Daily Challenges</span>
                  <span className="font-medium">{stats.challengeAccuracy}%</span>
                </div>
                <Progress value={stats.challengeAccuracy} className="h-2" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatsTab; 