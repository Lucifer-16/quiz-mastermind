import { useState, useEffect } from "react";
import { Trophy, Medal, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import LeaderboardTable from "@/components/LeaderboardTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Leaderboard = () => {
  const [user, setUser] = useState<{ email: string; isAdmin?: boolean } | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user?.email ? { email: session.user.email } : null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user?.email ? { email: session.user.email } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Mock leaderboard data
  const allEntries = [
    { rank: 1, username: "CodeMaster99", score: 4850, time: 245, quizTitle: "JavaScript Fundamentals" },
    { rank: 2, username: "ReactNinja", score: 4720, time: 267, quizTitle: "React Deep Dive" },
    { rank: 3, username: "DevWizard", score: 4650, time: 289, quizTitle: "TypeScript Essentials" },
    { rank: 4, username: "CSSPro", score: 4500, time: 198, quizTitle: "CSS Mastery" },
    { rank: 5, username: "WebDev2024", score: 4380, time: 312, quizTitle: "JavaScript Fundamentals" },
    { rank: 6, username: "FullStackHero", score: 4250, time: 334, quizTitle: "Node.js Backend" },
    { rank: 7, username: "FrontendFan", score: 4120, time: 278, quizTitle: "React Deep Dive" },
    { rank: 8, username: "JSLover", score: 3980, time: 356, quizTitle: "JavaScript Fundamentals" },
    { rank: 9, username: "TypeScriptFan", score: 3850, time: 289, quizTitle: "TypeScript Essentials" },
    { rank: 10, username: "CodingChamp", score: 3720, time: 401, quizTitle: "CSS Mastery" },
  ];

  const quizzes = [
    { id: "all", name: "All Quizzes" },
    { id: "js", name: "JavaScript Fundamentals" },
    { id: "react", name: "React Deep Dive" },
    { id: "css", name: "CSS Mastery" },
    { id: "ts", name: "TypeScript Essentials" },
  ];

  const filteredEntries = allEntries.filter((entry) => {
    const matchesSearch = entry.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesQuiz = selectedQuiz === "all" || 
      (selectedQuiz === "js" && entry.quizTitle === "JavaScript Fundamentals") ||
      (selectedQuiz === "react" && entry.quizTitle === "React Deep Dive") ||
      (selectedQuiz === "css" && entry.quizTitle === "CSS Mastery") ||
      (selectedQuiz === "ts" && entry.quizTitle === "TypeScript Essentials");
    return matchesSearch && matchesQuiz;
  });

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
        <div className="mb-12 flex justify-center items-end gap-4">
          {/* 2nd Place */}
          <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="w-20 h-20 rounded-full bg-gray-300/20 border-4 border-gray-300 flex items-center justify-center mb-2">
              <Medal className="h-8 w-8 text-gray-300" />
            </div>
            <p className="font-semibold text-foreground">{allEntries[1]?.username}</p>
            <p className="text-sm text-muted-foreground">{allEntries[1]?.score} pts</p>
            <div className="mt-4 w-24 h-24 gradient-card rounded-t-lg flex items-center justify-center">
              <span className="font-display text-4xl font-bold text-gray-300">2</span>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-yellow-400/20 border-4 border-yellow-400 flex items-center justify-center mb-2 glow-primary">
              <Trophy className="h-10 w-10 text-yellow-400" />
            </div>
            <p className="font-semibold text-foreground text-lg">{allEntries[0]?.username}</p>
            <p className="text-sm text-muted-foreground">{allEntries[0]?.score} pts</p>
            <div className="mt-4 w-28 h-32 gradient-primary rounded-t-lg flex items-center justify-center">
              <span className="font-display text-5xl font-bold text-primary-foreground">1</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="w-20 h-20 rounded-full bg-amber-600/20 border-4 border-amber-600 flex items-center justify-center mb-2">
              <Medal className="h-8 w-8 text-amber-600" />
            </div>
            <p className="font-semibold text-foreground">{allEntries[2]?.username}</p>
            <p className="text-sm text-muted-foreground">{allEntries[2]?.score} pts</p>
            <div className="mt-4 w-24 h-20 gradient-card rounded-t-lg flex items-center justify-center">
              <span className="font-display text-4xl font-bold text-amber-600">3</span>
            </div>
          </div>
        </div>

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
          <LeaderboardTable entries={filteredEntries} showQuizTitle={selectedQuiz === "all"} />
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;