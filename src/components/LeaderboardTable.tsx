import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  time: number;
  quizTitle?: string;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  showQuizTitle?: boolean;
}

const LeaderboardTable = ({ entries, showQuizTitle = false }: LeaderboardTableProps) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-300" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="font-display font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankStyles = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-400/10 border-yellow-400/30";
      case 2:
        return "bg-gray-300/10 border-gray-300/30";
      case 3:
        return "bg-amber-600/10 border-amber-600/30";
      default:
        return "bg-card border-border";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <div
          key={`${entry.username}-${entry.rank}`}
          className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02] ${getRankStyles(entry.rank)}`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex h-10 w-10 items-center justify-center">
            {getRankIcon(entry.rank)}
          </div>
          
          <div className="flex-1">
            <p className="font-semibold text-foreground">{entry.username}</p>
            {showQuizTitle && entry.quizTitle && (
              <p className="text-sm text-muted-foreground">{entry.quizTitle}</p>
            )}
          </div>
          
          <div className="text-right">
            <p className="font-display font-bold text-primary">{entry.score} pts</p>
            <p className="text-sm text-muted-foreground">{formatTime(entry.time)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeaderboardTable;