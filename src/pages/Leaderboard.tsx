import { useState, useEffect } from "react";
import { Trophy, Medal, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import LeaderboardTable from "@/components/LeaderboardTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  time: number;
  quizTitle?: string;
}

const Leaderboard = () => {
  const [user, setUser] = useState<{ email: string; isAdmin?: boolean } | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [quizzes, setQuizzes] = useState<{ id: string; name: string }[]>([{ id: "all", name: "All Quizzes" }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user?.email ? { email: session.user.email } : null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user?.email ? { email: session.user.email } : null);
    });

    fetchLeaderboard();
    fetchQuizzes();

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedQuiz]);

  const fetchQuizzes = async () => {
    const { data } = await supabase
      .from("quizzes")
      .select("id, title")
      .eq("status", "published");

    if (data) {
      setQuizzes([
        { id: "all", name: "All Quizzes" },
        ...data.map((q) => ({ id: q.id, name: q.title })),
      ]);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    
    let query = supabase
      .from("quiz_attempts")
      .select(`
        score,
        time_taken,
        user_id,
        quiz_id,
        quizzes (title)
      `)
      .order("score", { ascending: false })
      .order("time_taken", { ascending: true })
      .limit(50);

    if (selectedQuiz !== "all") {
      query = query.eq("quiz_id", selectedQuiz);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching leaderboard:", error);
      setLoading(false);
      return;
    }

    if (data) {
      const leaderboardEntries: LeaderboardEntry[] = await Promise.all(
        data.map(async (entry, index) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("user_id", entry.user_id)
            .maybeSingle();

          return {
            rank: index + 1,
            username: profile?.username || "Anonymous",
            score: entry.score,
            time: entry.time_taken,
            quizTitle: (entry.quizzes as { title: string } | null)?.title,
          };
        })
      );

      setEntries(leaderboardEntries);
    }
    setLoading(false);
  };

  const filteredEntries = entries.filter((entry) =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = filteredEntries.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl gradient-primary animate-pulse-glow">
            <Trophy className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">
            <span className="text-gradient">Global Leaderboard</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            See how you stack up against the competition. Top performers are updated in real-time.
          </p>
        </div>

        {/* Top 3 Podium */}
        {topThree.length >= 3 && (
          <div className="mb-12 flex justify-center items-end gap-4">
            {/* 2nd Place */}
            <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: "100ms" }}>
              <div className="w-20 h-20 rounded-full bg-gray-300/20 border-4 border-gray-300 flex items-center justify-center mb-2">
                <Medal className="h-8 w-8 text-gray-300" />
              </div>
              <p className="font-semibold text-foreground">{topThree[1]?.username}</p>
              <p className="text-sm text-muted-foreground">{topThree[1]?.score} pts</p>
              <div className="mt-4 w-24 h-24 gradient-card rounded-t-lg flex items-center justify-center">
                <span className="font-display text-4xl font-bold text-gray-300">2</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-yellow-400/20 border-4 border-yellow-400 flex items-center justify-center mb-2 glow-primary">
                <Trophy className="h-10 w-10 text-yellow-400" />
              </div>
              <p className="font-semibold text-foreground text-lg">{topThree[0]?.username}</p>
              <p className="text-sm text-muted-foreground">{topThree[0]?.score} pts</p>
              <div className="mt-4 w-28 h-32 gradient-primary rounded-t-lg flex items-center justify-center">
                <span className="font-display text-5xl font-bold text-primary-foreground">1</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: "200ms" }}>
              <div className="w-20 h-20 rounded-full bg-amber-600/20 border-4 border-amber-600 flex items-center justify-center mb-2">
                <Medal className="h-8 w-8 text-amber-600" />
              </div>
              <p className="font-semibold text-foreground">{topThree[2]?.username}</p>
              <p className="text-sm text-muted-foreground">{topThree[2]?.score} pts</p>
              <div className="mt-4 w-24 h-20 gradient-card rounded-t-lg flex items-center justify-center">
                <span className="font-display text-4xl font-bold text-amber-600">3</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {quizzes.map((quiz) => (
              <Button
                key={quiz.id}
                variant={selectedQuiz === quiz.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedQuiz(quiz.id)}
              >
                {quiz.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="gradient-card rounded-xl border border-border p-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No scores yet. Be the first to complete a quiz!</p>
            </div>
          ) : (
            <LeaderboardTable entries={filteredEntries} showQuizTitle={selectedQuiz === "all"} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;