import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListOrdered } from "lucide-react";

// Rename component
const LeaderboardPage = () => {
  const mockData = [
    { rank: 1, player: "HistoryBuff", score: 2800, games: 42 },
    { rank: 2, player: "TimeTraveler", score: 2650, games: 38 },
    { rank: 3, player: "AncientExplorer", score: 2400, games: 35 },
    { rank: 4, player: "ChronicleSeeker", score: 2200, games: 30 },
    { rank: 5, player: "EraNavigator", score: 2000, games: 28 },
  ];

  return (
    // ... (rest of JSX) ...
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center gap-3 mb-8">
        <ListOrdered className="h-8 w-8 text-history-primary" />
        <h1 className="text-3xl font-bold text-history-primary">Leaderboard</h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto">
        <Table>
          <TableHeader>{/* ... */}</TableHeader>
          <TableBody>
            {mockData.map((entry) => (
              <TableRow key={entry.rank}>{/* ... Cells ... */}</TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LeaderboardPage; // Export with new name 