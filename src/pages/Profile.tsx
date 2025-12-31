import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { User, Session } from "@supabase/supabase-js";
import { Camera, Save, Trophy, Clock, Target, TrendingUp, Calendar } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number;
  completed_at: string;
  quiz?: {
    title: string;
    difficulty: string;
  };
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    avgScore: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    bestScore: 0,
    totalTime: 0,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchQuizHistory();
      checkAdminRole();
    }
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile(data);
      setUsername(data.username);
      setAvatarUrl(data.avatar_url);
    }
    
    setLoading(false);
  };

  const fetchQuizHistory = async () => {
    if (!user) return;
    
    const { data: attempts, error } = await supabase
      .from("quiz_attempts")
      .select(`
        *,
        quizzes (
          title,
          difficulty
        )
      `)
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching quiz history:", error);
      return;
    }
    
    const formattedAttempts = (attempts || []).map((attempt: any) => ({
      ...attempt,
      quiz: attempt.quizzes,
    }));
    
    setQuizHistory(formattedAttempts);
    
    // Calculate stats
    if (formattedAttempts.length > 0) {
      const totalQuizzes = formattedAttempts.length;
      const totalCorrect = formattedAttempts.reduce((sum: number, a: any) => sum + a.correct_answers, 0);
      const totalQuestions = formattedAttempts.reduce((sum: number, a: any) => sum + a.total_questions, 0);
      const avgScore = Math.round((totalCorrect / totalQuestions) * 100);
      const bestScore = Math.max(...formattedAttempts.map((a: any) => a.score));
      const totalTime = formattedAttempts.reduce((sum: number, a: any) => sum + a.time_taken, 0);
      
      setStats({
        totalQuizzes,
        avgScore,
        totalCorrect,
        totalQuestions,
        bestScore,
        totalTime,
      });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    setUploadingImage(true);
    
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split("/avatars/")[1];
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      }
      
      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      
      setAvatarUrl(publicUrl);
      
      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !username.trim()) {
      toast({
        title: "Invalid username",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: username.trim() })
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been saved",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Save failed",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "hard":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user ? { email: user.email || "", isAdmin } : null} />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card className="glass border-border">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Avatar */}
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-primary/30">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-3xl bg-primary/20 text-primary">
                      {username?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploadingImage}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="h-8 w-8 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                
                {/* Profile Info */}
                <div className="flex-1 space-y-4 w-full md:w-auto">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-muted-foreground">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-background/50 border-border max-w-sm"
                      placeholder="Enter your username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="text-foreground">{user?.email}</p>
                  </div>
                  
                  <Button onClick={handleSaveProfile} disabled={saving} variant="hero">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass border-border">
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">{stats.totalQuizzes}</p>
                <p className="text-sm text-muted-foreground">Quizzes Taken</p>
              </CardContent>
            </Card>
            
            <Card className="glass border-border">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-accent" />
                <p className="text-2xl font-bold text-foreground">{stats.avgScore}%</p>
                <p className="text-sm text-muted-foreground">Avg Score</p>
              </CardContent>
            </Card>
            
            <Card className="glass border-border">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-400" />
                <p className="text-2xl font-bold text-foreground">{stats.bestScore}%</p>
                <p className="text-sm text-muted-foreground">Best Score</p>
              </CardContent>
            </Card>
            
            <Card className="glass border-border">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
                <p className="text-2xl font-bold text-foreground">{formatTime(stats.totalTime)}</p>
                <p className="text-sm text-muted-foreground">Total Time</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Quiz History */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Quiz History</CardTitle>
            </CardHeader>
            <CardContent>
              {quizHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No quizzes completed yet</p>
                  <Button
                    variant="hero"
                    className="mt-4"
                    onClick={() => navigate("/dashboard")}
                  >
                    Take Your First Quiz
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizHistory.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-background/50 border border-border gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {attempt.quiz?.title || "Unknown Quiz"}
                          </p>
                          {attempt.quiz?.difficulty && (
                            <Badge className={getDifficultyColor(attempt.quiz.difficulty)}>
                              {attempt.quiz.difficulty}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(attempt.completed_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(attempt.time_taken)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{attempt.score}%</p>
                          <p className="text-xs text-muted-foreground">
                            {attempt.correct_answers}/{attempt.total_questions} correct
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
