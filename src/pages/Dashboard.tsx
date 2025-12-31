import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Target, Clock, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import QuizCard from "@/components/QuizCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit: number;
  difficulty: "easy" | "medium" | "hard";
  status: string;
  question_count?: number;
  participants?: number;
}

interface UserStats {
  quizzesCompleted: number;
  averageScore: number;
  totalTime: number;
  streak: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<{ email: string; isAdmin?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    quizzesCompleted: 2,
    averageScore: 80/100,
    totalTime: 20,
    streak: 2,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUser({ email: session.user.email || "" });
          setTimeout(() => {
            checkAdminRole(session.user.id);
            fetchUserStats(session.user.id);
          }, 0);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser({ email: session.user.email || "" });
        checkAdminRole(session.user.id);
        fetchUserStats(session.user.id);
      }
      setLoading(false);
    });

    fetchQuizzes();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    if (data) {
      setUser((prev) => prev ? { ...prev, isAdmin: true } : null);
    }
  };

  const fetchUserStats = async (userId: string) => {
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("score, total_questions, time_taken")
      .eq("user_id", userId);

    if (attempts && attempts.length > 0) {
      const totalScore = attempts.reduce((acc, a) => acc + (a.score / (a.total_questions * 100)) * 100, 0);
      const totalTime = attempts.reduce((acc, a) => acc + a.time_taken, 0);
      
      setUserStats({
        quizzesCompleted: attempts.length,
        averageScore: Math.round(totalScore / attempts.length),
        totalTime,
        streak: Math.min(attempts.length, 7),
      });
    }
  };

  const fetchQuizzes = async () => {
    const { data: quizzesData, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching quizzes:", error);
      return;
    }

    if (quizzesData) {
      const quizzesWithCounts = await Promise.all(
        quizzesData.map(async (quiz) => {
          const { count: questionCount } = await supabase
            .from("questions")
            .select("*", { count: "exact", head: true })
            .eq("quiz_id", quiz.id);

          const { count: participantCount } = await supabase
            .from("quiz_attempts")
            .select("*", { count: "exact", head: true })
            .eq("quiz_id", quiz.id);

          return {
            ...quiz,
            difficulty: quiz.difficulty as "easy" | "medium" | "hard",
            question_count: questionCount || 0,
            participants: participantCount || 0,
          };
        })
      );

      setQuizzes(quizzesWithCounts);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const stats = [
    { icon: Trophy, label: "Quizzes Completed", value: String(userStats.quizzesCompleted), color: "text-primary" },
    { icon: Target, label: "Average Score", value: `${userStats.averageScore}%`, color: "text-accent" },
    { icon: Clock, label: "Total Time", value: formatTime(userStats.totalTime), color: "text-secondary" },
    { icon: TrendingUp, label: "Current Streak", value: `${userStats.streak} days`, color: "text-warning" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Welcome back, <span className="text-gradient">{user?.email?.split("@")[0]}</span>!
          </h1>
          <p className="text-muted-foreground">Ready to test your knowledge today?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="gradient-card rounded-xl border border-border p-6 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <stat.icon className={`h-8 w-8 ${stat.color} mb-3`} />
              <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Available Quizzes */}
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">
            Available Quizzes
          </h2>
          
          {quizzes.length === 0 ? (
            <div className="text-center py-12 gradient-card rounded-xl border border-border">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-foreground mb-2">No Quizzes Yet</h3>
              <p className="text-muted-foreground">
                Check back soon for new quizzes!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  title={quiz.title}
                  description={quiz.description || ""}
                  questionCount={quiz.question_count || 0}
                  timeLimit={Math.floor(quiz.time_limit / 60)}
                  difficulty={quiz.difficulty}
                  participants={quiz.participants}
                  onStart={() => navigate(`/quiz/${quiz.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;