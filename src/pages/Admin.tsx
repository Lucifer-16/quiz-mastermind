import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Trash2, 
  Edit, 
  LayoutDashboard, 
  FileQuestion, 
  Trophy,
  Users,
  Settings,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Quiz {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  timeLimit: number;
  difficulty: "easy" | "medium" | "hard";
  status: "draft" | "published";
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("quizzes");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    timeLimit: 10,
    difficulty: "medium" as "easy" | "medium" | "hard",
  });

  // Mock quizzes data
  const [quizzes, setQuizzes] = useState<Quiz[]>([
    {
      id: "1",
      title: "JavaScript Fundamentals",
      description: "Test your knowledge of JavaScript basics",
      questionCount: 15,
      timeLimit: 10,
      difficulty: "easy",
      status: "published",
    },
    {
      id: "2",
      title: "React Deep Dive",
      description: "Advanced React concepts",
      questionCount: 20,
      timeLimit: 15,
      difficulty: "hard",
      status: "published",
    },
    {
      id: "3",
      title: "CSS Mastery",
      description: "From flexbox to grid",
      questionCount: 12,
      timeLimit: 8,
      difficulty: "medium",
      status: "draft",
    },
  ]);

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

  const handleCreateQuiz = () => {
    if (!newQuiz.title.trim()) {
      toast({
        title: "Error",
        description: "Quiz title is required",
        variant: "destructive",
      });
      return;
    }

    const quiz: Quiz = {
      id: String(Date.now()),
      title: newQuiz.title,
      description: newQuiz.description,
      questionCount: 0,
      timeLimit: newQuiz.timeLimit,
      difficulty: newQuiz.difficulty,
      status: "draft",
    };

    setQuizzes([...quizzes, quiz]);
    setNewQuiz({ title: "", description: "", timeLimit: 10, difficulty: "medium" });
    setIsDialogOpen(false);
    
    toast({
      title: "Quiz Created",
      description: "Your new quiz has been created as a draft.",
    });
  };

  const handleDeleteQuiz = (id: string) => {
    setQuizzes(quizzes.filter((q) => q.id !== id));
    toast({
      title: "Quiz Deleted",
      description: "The quiz has been permanently deleted.",
    });
  };

  const handleToggleStatus = (id: string) => {
    setQuizzes(
      quizzes.map((q) =>
        q.id === id
          ? { ...q, status: q.status === "draft" ? "published" : "draft" }
          : q
      )
    );
  };

  const stats = [
    { label: "Total Quizzes", value: quizzes.length, icon: FileQuestion },
    { label: "Published", value: quizzes.filter((q) => q.status === "published").length, icon: Trophy },
    { label: "Total Questions", value: quizzes.reduce((acc, q) => acc + q.questionCount, 0), icon: LayoutDashboard },
    { label: "Active Users", value: 156, icon: Users },
  ];

  const sidebarItems = [
    { id: "quizzes", label: "Quizzes", icon: FileQuestion },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "users", label: "Users", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card p-6">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to App
          </Button>
          <h1 className="font-display text-xl font-bold text-gradient">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                activeTab === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="gradient-card rounded-xl border border-border p-6 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <stat.icon className="h-8 w-8 text-primary mb-3" />
                <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Quizzes Tab */}
          {activeTab === "quizzes" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold text-foreground">Manage Quizzes</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="hero">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Quiz
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="font-display">Create New Quiz</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={newQuiz.title}
                          onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                          placeholder="Enter quiz title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={newQuiz.description}
                          onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                          placeholder="Enter quiz description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Time Limit (minutes)</Label>
                          <Input
                            type="number"
                            value={newQuiz.timeLimit}
                            onChange={(e) => setNewQuiz({ ...newQuiz, timeLimit: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Difficulty</Label>
                          <Select
                            value={newQuiz.difficulty}
                            onValueChange={(value: "easy" | "medium" | "hard") =>
                              setNewQuiz({ ...newQuiz, difficulty: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button variant="hero" className="w-full" onClick={handleCreateQuiz}>
                        Create Quiz
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="gradient-card rounded-xl border border-border p-6 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display font-bold text-foreground">{quiz.title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            quiz.status === "published"
                              ? "bg-accent/20 text-accent"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {quiz.status}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            quiz.difficulty === "easy"
                              ? "bg-accent/20 text-accent"
                              : quiz.difficulty === "medium"
                              ? "bg-warning/20 text-warning"
                              : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {quiz.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{quiz.description}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {quiz.questionCount} questions • {quiz.timeLimit} min
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(quiz.id)}
                      >
                        {quiz.status === "draft" ? "Publish" : "Unpublish"}
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Placeholder for other tabs */}
          {activeTab !== "quizzes" && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} management coming soon...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;