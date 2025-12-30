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
  ArrowLeft,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  description: string | null;
  time_limit: number;
  difficulty: "easy" | "medium" | "hard";
  status: "draft" | "published";
  question_count?: number;
}

interface Question {
  id?: string;
  question_text: string;
  options: { id: string; text: string }[];
  correct_option_id: string;
  order_index: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("quizzes");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    published: 0,
    totalQuestions: 0,
    activeUsers: 0,
  });
  
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    time_limit: 10,
    difficulty: "medium" as "easy" | "medium" | "hard",
  });

  const [newQuestion, setNewQuestion] = useState<Question>({
    question_text: "",
    options: [
      { id: "a", text: "" },
      { id: "b", text: "" },
      { id: "c", text: "" },
      { id: "d", text: "" },
    ],
    correct_option_id: "a",
    order_index: 0,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUser({ id: session.user.id, email: session.user.email || "" });
          setTimeout(() => checkAdminRole(session.user.id), 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser({ id: session.user.id, email: session.user.email || "" });
        checkAdminRole(session.user.id);
      }
    });

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
      setIsAdmin(true);
      fetchQuizzes();
      fetchStats();
    } else {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    const { count: quizCount } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true });

    const { count: publishedCount } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

    const { count: questionCount } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true });

    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    setStats({
      totalQuizzes: quizCount || 0,
      published: publishedCount || 0,
      totalQuestions: questionCount || 0,
      activeUsers: userCount || 0,
    });
  };

  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching quizzes:", error);
      return;
    }

    if (data) {
      const quizzesWithCounts = await Promise.all(
        data.map(async (quiz) => {
          const { count } = await supabase
            .from("questions")
            .select("*", { count: "exact", head: true })
            .eq("quiz_id", quiz.id);

          return {
            ...quiz,
            difficulty: quiz.difficulty as "easy" | "medium" | "hard",
            status: quiz.status as "draft" | "published",
            question_count: count || 0,
          };
        })
      );
      setQuizzes(quizzesWithCounts);
    }
  };

  const fetchQuestions = async (quizId: string) => {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching questions:", error);
      return;
    }

    if (data) {
      setQuestions(
        data.map((q) => ({
          id: q.id,
          question_text: q.question_text,
          options: q.options as { id: string; text: string }[],
          correct_option_id: q.correct_option_id,
          order_index: q.order_index,
        }))
      );
    }
  };

  const handleCreateQuiz = async () => {
    if (!newQuiz.title.trim()) {
      toast({
        title: "Error",
        description: "Quiz title is required",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("quizzes").insert({
      title: newQuiz.title,
      description: newQuiz.description || null,
      time_limit: newQuiz.time_limit * 60,
      difficulty: newQuiz.difficulty,
      status: "draft",
      created_by: user?.id,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create quiz",
        variant: "destructive",
      });
      return;
    }

    setNewQuiz({ title: "", description: "", time_limit: 10, difficulty: "medium" });
    setIsDialogOpen(false);
    fetchQuizzes();
    fetchStats();
    
    toast({
      title: "Quiz Created",
      description: "Your new quiz has been created as a draft.",
    });
  };

  const handleDeleteQuiz = async (id: string) => {
    const { error } = await supabase.from("quizzes").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      });
      return;
    }

    fetchQuizzes();
    fetchStats();
    toast({
      title: "Quiz Deleted",
      description: "The quiz has been permanently deleted.",
    });
  };

  const handleToggleStatus = async (quiz: Quiz) => {
    const newStatus = quiz.status === "draft" ? "published" : "draft";
    
    const { error } = await supabase
      .from("quizzes")
      .update({ status: newStatus })
      .eq("id", quiz.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update quiz status",
        variant: "destructive",
      });
      return;
    }

    fetchQuizzes();
    fetchStats();
  };

  const handleAddQuestion = async () => {
    if (!selectedQuiz || !newQuestion.question_text.trim()) {
      toast({
        title: "Error",
        description: "Question text is required",
        variant: "destructive",
      });
      return;
    }

    const validOptions = newQuestion.options.filter((o) => o.text.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "At least 2 options are required",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("questions").insert({
      quiz_id: selectedQuiz.id,
      question_text: newQuestion.question_text,
      options: validOptions,
      correct_option_id: newQuestion.correct_option_id,
      order_index: questions.length,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add question",
        variant: "destructive",
      });
      return;
    }

    setNewQuestion({
      question_text: "",
      options: [
        { id: "a", text: "" },
        { id: "b", text: "" },
        { id: "c", text: "" },
        { id: "d", text: "" },
      ],
      correct_option_id: "a",
      order_index: 0,
    });

    fetchQuestions(selectedQuiz.id);
    fetchQuizzes();
    fetchStats();
    
    toast({
      title: "Question Added",
      description: "The question has been added to the quiz.",
    });
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedQuiz) return;

    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
      return;
    }

    fetchQuestions(selectedQuiz.id);
    fetchQuizzes();
    fetchStats();
  };

  const openQuestionManager = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    fetchQuestions(quiz.id);
    setIsQuestionDialogOpen(true);
  };

  const sidebarItems = [
    { id: "quizzes", label: "Quizzes", icon: FileQuestion },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "users", label: "Users", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const statCards = [
    { label: "Total Quizzes", value: stats.totalQuizzes, icon: FileQuestion },
    { label: "Published", value: stats.published, icon: Trophy },
    { label: "Total Questions", value: stats.totalQuestions, icon: LayoutDashboard },
    { label: "Active Users", value: stats.activeUsers, icon: Users },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
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
            {statCards.map((stat, index) => (
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
                            value={newQuiz.time_limit}
                            onChange={(e) => setNewQuiz({ ...newQuiz, time_limit: Number(e.target.value) })}
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
                {quizzes.length === 0 ? (
                  <div className="text-center py-12 gradient-card rounded-xl border border-border">
                    <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No quizzes yet. Create your first quiz!</p>
                  </div>
                ) : (
                  quizzes.map((quiz) => (
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
                          {quiz.question_count} questions • {Math.floor(quiz.time_limit / 60)} min
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(quiz)}
                        >
                          {quiz.status === "draft" ? "Publish" : "Unpublish"}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openQuestionManager(quiz)}
                        >
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
                  ))
                )}
              </div>
            </div>
          )}

          {/* Question Manager Dialog */}
          <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
            <DialogContent className="bg-card border-border max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">
                  Manage Questions - {selectedQuiz?.title}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {/* Add Question Form */}
                <div className="gradient-card rounded-xl border border-border p-4 space-y-4">
                  <h4 className="font-semibold text-foreground">Add New Question</h4>
                  
                  <div className="space-y-2">
                    <Label>Question</Label>
                    <Textarea
                      value={newQuestion.question_text}
                      onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                      placeholder="Enter your question..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {newQuestion.options.map((option, index) => (
                      <div key={option.id} className="space-y-1">
                        <Label>Option {option.id.toUpperCase()}</Label>
                        <Input
                          value={option.text}
                          onChange={(e) => {
                            const newOptions = [...newQuestion.options];
                            newOptions[index].text = e.target.value;
                            setNewQuestion({ ...newQuestion, options: newOptions });
                          }}
                          placeholder={`Option ${option.id.toUpperCase()}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <Select
                      value={newQuestion.correct_option_id}
                      onValueChange={(value) => setNewQuestion({ ...newQuestion, correct_option_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a">Option A</SelectItem>
                        <SelectItem value="b">Option B</SelectItem>
                        <SelectItem value="c">Option C</SelectItem>
                        <SelectItem value="d">Option D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="hero" onClick={handleAddQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                {/* Existing Questions */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">
                    Existing Questions ({questions.length})
                  </h4>
                  
                  {questions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No questions yet.</p>
                  ) : (
                    questions.map((q, index) => (
                      <div
                        key={q.id}
                        className="rounded-lg bg-muted p-4 flex items-start justify-between gap-4"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {index + 1}. {q.question_text}
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            {q.options.map((opt) => (
                              <span
                                key={opt.id}
                                className={`${
                                  opt.id === q.correct_option_id
                                    ? "text-accent font-medium"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {opt.id.toUpperCase()}: {opt.text}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => q.id && handleDeleteQuestion(q.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
