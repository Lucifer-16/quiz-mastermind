import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Target, Clock, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import QuizCard from "@/components/QuizCard";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email: string; isAdmin?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUser({ email: session.user.email || "" });
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser({ email: session.user.email || "" });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const stats = [
    { icon: Trophy, label: "Quizzes Completed", value: "12", color: "text-primary" },
    { icon: Target, label: "Average Score", value: "85%", color: "text-accent" },
    { icon: Clock, label: "Total Time", value: "3h 24m", color: "text-secondary" },
    { icon: TrendingUp, label: "Current Streak", value: "5 days", color: "text-warning" },
  ];

  const availableQuizzes = [
    {
      id: "1",
      title: "JavaScript Fundamentals",
      description: "Test your knowledge of JavaScript basics including variables, functions, and control flow.",
      questionCount: 15,
      timeLimit: 10,
      difficulty: "easy" as const,
      participants: 1247,
    },
    {
      id: "2",
      title: "React Deep Dive",
      description: "Advanced React concepts including hooks, context, and performance optimization.",
      questionCount: 20,
      timeLimit: 15,
      difficulty: "hard" as const,
      participants: 892,
    },
    {
      id: "3",
      title: "CSS Mastery",
      description: "From flexbox to grid, animations to responsive design - prove your CSS skills.",
      questionCount: 12,
      timeLimit: 8,
      difficulty: "medium" as const,
      participants: 1560,
    },
    {
      id: "4",
      title: "TypeScript Essentials",
      description: "Master TypeScript types, interfaces, generics, and advanced patterns.",
      questionCount: 18,
      timeLimit: 12,
      difficulty: "medium" as const,
      participants: 723,
    },
    {
      id: "5",
      title: "Node.js Backend",
      description: "Server-side JavaScript, Express, APIs, and database integration.",
      questionCount: 16,
      timeLimit: 14,
      difficulty: "hard" as const,
      participants: 654,
    },
    {
      id: "6",
      title: "HTML5 Basics",
      description: "Semantic HTML, forms, accessibility, and modern web standards.",
      questionCount: 10,
      timeLimit: 6,
      difficulty: "easy" as const,
      participants: 2103,
    },
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                {...quiz}
                onStart={() => navigate(`/quiz/${quiz.id}`)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;