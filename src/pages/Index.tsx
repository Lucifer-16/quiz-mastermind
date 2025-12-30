import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Trophy, Users, Clock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import QuizCard from "@/components/QuizCard";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email: string; isAdmin?: boolean } | null>(null);

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

  const featuredQuizzes = [
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
  ];

  const handleStartQuiz = (quizId: string) => {
    if (!user) {
      navigate("/auth");
    } else {
      navigate(`/quiz/${quizId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        </div>
        
        <div className="container relative mx-auto px-4 pt-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Challenge yourself, climb the ranks</span>
            </div>
            
            <h1 className="mb-6 font-display text-5xl font-bold leading-tight text-foreground md:text-7xl">
              Master Skills Through
              <span className="text-gradient"> Interactive Quizzes</span>
            </h1>
            
            <p className="mb-10 text-lg text-muted-foreground md:text-xl">
              Compete with others, track your progress, and prove your expertise.
              Join thousands of learners in the ultimate quiz arena.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button 
                variant="hero" 
                size="xl"
                onClick={() => navigate(user ? "/dashboard" : "/auth")}
              >
                {user ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button 
                variant="glass" 
                size="xl"
                onClick={() => navigate("/leaderboard")}
              >
                View Leaderboard
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { icon: Users, label: "Active Users", value: "10K+" },
              { icon: Trophy, label: "Quizzes Completed", value: "50K+" },
              { icon: Zap, label: "Questions Answered", value: "500K+" },
              { icon: Clock, label: "Hours of Learning", value: "25K+" },
            ].map((stat, index) => (
              <div 
                key={stat.label}
                className="rounded-xl glass p-6 text-center animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <stat.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Quizzes */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              Featured Quizzes
            </h2>
            <p className="text-muted-foreground">
              Start with our most popular challenges
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                {...quiz}
                onStart={() => handleStartQuiz(quiz.id)}
              />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
            >
              Browse All Quizzes
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl gradient-primary p-12 text-center">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            </div>
            
            <div className="relative">
              <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground md:text-4xl">
                Ready to Test Your Knowledge?
              </h2>
              <p className="mb-8 text-primary-foreground/80">
                Join the arena and start competing today!
              </p>
              <Button 
                variant="glass"
                size="xl"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={() => navigate(user ? "/dashboard" : "/auth")}
              >
                Start Your Journey
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 QuizArena. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;