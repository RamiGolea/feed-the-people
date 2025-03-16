import { useFindMany } from "@gadgetinc/react";
import { useState } from "react";
import { api } from "../api";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

export default function LeaderboardPage() {
  
  return (
    <div className="container py-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Feed the People Leaderboard</CardTitle>
          <CardDescription>
            Users ranked by their sharing score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShareScoreLeaderboard />
        </CardContent>
      </Card>
    </div>
  );
}

function ShareScoreLeaderboard() {
  const usersPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [inputPage, setInputPage] = useState("");
  
  const [{ data: shareScores, fetching, error }] = useFindMany(api.shareScore, {
    sort: { score: "Descending" },
    live: true,
    refetchInterval: 5000, // Refetch every 5 seconds
    select: {
      id: true,
      score: true,
      user: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    }
  });

  // Pagination handlers
  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePageInputChange = (e) => {
    setInputPage(e.target.value);
  };

  const handleGoToPage = (e) => {
    e.preventDefault();
    const pageNumber = parseInt(inputPage, 10);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setInputPage("");
    } else {
      // Reset input if invalid
      setInputPage("");
    }
  };

  if (fetching && !shareScores) {
    return <div className="flex justify-center p-4">Loading leaderboard data...</div>;
  }

  if (fetching && shareScores) {
    // Show a subtle loading indicator when refreshing data
    return (
      <div>
        <div className="flex justify-center p-2 text-sm text-muted-foreground">
          Refreshing leaderboard data...
        </div>
        <ShareScoreLeaderboardContent shareScores={shareScores} currentPage={currentPage} setCurrentPage={setCurrentPage} inputPage={inputPage} setInputPage={setInputPage} />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading leaderboard: {error.message}</div>;
  }

  return <ShareScoreLeaderboardContent 
    shareScores={shareScores || []} 
    currentPage={currentPage} 
    setCurrentPage={setCurrentPage} 
    inputPage={inputPage} 
    setInputPage={setInputPage} 
  />;
}

function ShareScoreLeaderboardContent({ 
  shareScores, 
  currentPage, 
  setCurrentPage, 
  inputPage, 
  setInputPage 
}) {
  const usersPerPage = 10;

  if (shareScores.length === 0) {
    return <div className="p-4">No leaderboard data available yet.</div>;
  }

  // Get top 3 users for the special display
  const topThreeUsers = shareScores.slice(0, 3);
  
  // Get the remaining users for the table (excluding top 3)
  const allRemainingUsers = shareScores.slice(3);
  
  // Calculate total pages
  const totalRemainingUsers = Math.max(0, allRemainingUsers.length);
  const totalPages = Math.ceil(totalRemainingUsers / usersPerPage);
  
  // Get current page's users
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentPageUsers = allRemainingUsers.slice(startIndex, endIndex);
  
  return (
    <div className="space-y-6 overflow-visible">
      {/* Top 3 Users Podium Section */}
      <div className="py-8 px-4 overflow-hidden relative z-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-visible">
          {/* Second Place - Left Position */}
          {topThreeUsers[1] && (
            <div className="md:self-end md:mt-8 flex flex-col items-center p-6 rounded-lg shadow-md transition-all hover:shadow-lg bg-white dark:bg-slate-800 order-2 md:order-1">
              <div className="text-4xl mb-2">🥈</div>
              <div className="text-xl font-semibold text-center mb-1">
                {topThreeUsers[1].user 
                  ? `${topThreeUsers[1].user.firstName || ""} ${topThreeUsers[1].user.lastName || ""}`.trim() || topThreeUsers[1].user.email
                  : "Unknown User"}
              </div>
              <div className="text-lg font-bold text-amber-600">{topThreeUsers[1].score} points</div>
            </div>
          )}
          
          {/* First Place - Center Top Position */}
          {topThreeUsers[0] && (
            <div className="flex flex-col items-center p-8 rounded-lg shadow-md transition-all hover:shadow-lg bg-white dark:bg-slate-800 order-1 md:order-2 z-1">
              <div className="text-5xl mb-3">🥇</div>
              <div className="text-2xl font-bold text-center mb-2">
                {topThreeUsers[0].user 
                  ? `${topThreeUsers[0].user.firstName || ""} ${topThreeUsers[0].user.lastName || ""}`.trim() || topThreeUsers[0].user.email
                  : "Unknown User"}
              </div>
              <div className="text-xl font-bold text-amber-600">{topThreeUsers[0].score} points</div>
            </div>
          )}
          
          {/* Third Place - Right Position */}
          {topThreeUsers[2] && (
            <div className="md:self-end md:mt-12 flex flex-col items-center p-6 rounded-lg shadow-md transition-all hover:shadow-lg bg-white dark:bg-slate-800 order-3">
              <div className="text-4xl mb-2">🥉</div>
              <div className="text-xl font-semibold text-center mb-1">
                {topThreeUsers[2].user 
                  ? `${topThreeUsers[2].user.firstName || ""} ${topThreeUsers[2].user.lastName || ""}`.trim() || topThreeUsers[2].user.email
                  : "Unknown User"}
              </div>
              <div className="text-lg font-bold text-amber-600">{topThreeUsers[2].score} points</div>
            </div>
          )}
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <div className="rounded-md border overflow-hidden">
        <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Rank</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Score</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {currentPageUsers.map((score, index) => (
            <tr key={score.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <td className="p-4 align-middle">{startIndex + index + 4}</td>
              <td className="p-4 align-middle">
                {score.user 
                  ? `${score.user.firstName || ""} ${score.user.lastName || ""}`.trim() || score.user.email
                  : "Unknown User"}
              </td>
              <td className="p-4 align-middle">{score.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Pagination controls */}
    {totalPages > 1 && (
      <div className="mt-4 flex justify-between items-center">
        <form onSubmit={handleGoToPage} className="inline-flex items-center gap-2">
          <span className="text-sm">Go to page:</span>
          <Input
            type="number"
            min="1"
            max={totalPages}
            value={inputPage}
            onChange={handlePageInputChange}
            className="w-16 h-8"
            placeholder="#"
          />
          <Button 
            type="submit"
            size="sm"
            variant="outline"
          >
            Go
          </Button>
        </form>
        
        <div className="inline-flex items-center gap-2 rounded-md p-2">
          <Button 
            size="sm"
            variant="outline" 
            onClick={goToPreviousPage} 
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm mx-1">
            {currentPage} / {totalPages}
          </span>
          <Button 
            size="sm"
            variant="outline" 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    )}
  </div>
  );
}
