import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuestionCard from "@/components/QuestionCard";
import Timer from "@/components/Timer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
}

const Quiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Mock quiz data
  const quizData = {
    id: id || "1",
    title: "JavaScript Fundamentals",
    description: "Test your knowledge of JavaScript basics",
    timeLimit: 600, // 10 minutes in seconds
    questions: [
      {
        id: "q1",
        question: "What is the output of typeof null in JavaScript?",
        options: [
          { id: "a", text: "null" },
          { id: "b", text: "object" },
          { id: "c", text: "undefined" },
          { id: "d", text: "number" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        question: "Which method is used to add an element to the end of an array?",
        options: [
          { id: "a", text: "shift()" },
          { id: "b", text: "unshift()" },
          { id: "c", text: "push()" },
          { id: "d", text: "pop()" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q3",
        question: "What does 'use strict' do in JavaScript?",
        options: [
          { id: "a", text: "Makes code run faster" },
          { id: "b", text: "Enables strict mode for catching errors" },
          { id: "c", text: "Disables all warnings" },
          { id: "d", text: "Allows deprecated features" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q4",
        question: "Which of the following is NOT a JavaScript data type?",
        options: [
          { id: "a", text: "Boolean" },
          { id: "b", text: "Float" },
          { id: "c", text: "Symbol" },
          { id: "d", text: "BigInt" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q5",
        question: "What is the result of 3 + '3' in JavaScript?",
        options: [
          { id: "a", text: "6" },
          { id: "b", text: "33" },
          { id: "c", text: "NaN" },
          { id: "d", text: "Error" },
        ],
        correctOptionId: "b",
      },
    ] as Question[],
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUser({ email: session.user.email || "" });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser({ email: session.user.email || "" });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (isStarted && startTime) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isStarted, startTime]);

  const handleStart = () => {
    setIsStarted(true);
    setStartTime(Date.now());
  };

  const handleAnswer = (optionId: string, isCorrect: boolean) => {
    if (isCorrect) {
      setScore((prev) => prev + 100);
    }

    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const handleTimeUp = () => {
    toast({
      title: "Time's Up!",
      description: "Your quiz has been submitted.",
      variant: "destructive",
    });
    finishQuiz();
  };

  const finishQuiz = () => {
    setIsFinished(true);
    const finalTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : timeSpent;
    setTimeSpent(finalTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative w-full max-w-lg">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="gradient-card rounded-2xl border border-border p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl gradient-primary animate-pulse-glow">
              <Trophy className="h-10 w-10 text-primary-foreground" />
            </div>
            
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              {quizData.title}
            </h1>
            <p className="text-muted-foreground mb-8">{quizData.description}</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="rounded-lg bg-muted p-4">
                <Target className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="font-display font-bold text-foreground">{quizData.questions.length}</p>
                <p className="text-xs text-muted-foreground">Questions</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <Clock className="h-5 w-5 text-accent mx-auto mb-2" />
                <p className="font-display font-bold text-foreground">{quizData.timeLimit / 60} min</p>
                <p className="text-xs text-muted-foreground">Time Limit</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <Trophy className="h-5 w-5 text-secondary mx-auto mb-2" />
                <p className="font-display font-bold text-foreground">{quizData.questions.length * 100}</p>
                <p className="text-xs text-muted-foreground">Max Points</p>
              </div>
            </div>

            <Button variant="hero" size="xl" className="w-full" onClick={handleStart}>
              Start Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / (quizData.questions.length * 100)) * 100);
    const isPassing = percentage >= 60;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative w-full max-w-lg">
          <div className="gradient-card rounded-2xl border border-border p-8 text-center">
            <div className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full ${isPassing ? 'bg-accent/20' : 'bg-destructive/20'}`}>
              <Trophy className={`h-12 w-12 ${isPassing ? 'text-accent' : 'text-destructive'}`} />
            </div>
            
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              {isPassing ? "Congratulations!" : "Quiz Completed"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {isPassing ? "Great job on completing the quiz!" : "Keep practicing to improve your score!"}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-display text-3xl font-bold text-primary">{score}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="font-display text-3xl font-bold text-accent">{percentage}%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="font-display text-3xl font-bold text-secondary">{formatTime(timeSpent)}</p>
                <p className="text-xs text-muted-foreground">Time</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => navigate("/leaderboard")}>
                Leaderboard
              </Button>
              <Button variant="hero" size="lg" className="flex-1" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Quiz
          </Button>
          
          <Timer
            totalSeconds={quizData.timeLimit}
            onTimeUp={handleTimeUp}
            isActive={isStarted && !isFinished}
          />
          
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="font-display text-2xl font-bold text-primary">{score}</p>
          </div>
        </div>

        <div className="gradient-card rounded-2xl border border-border p-8">
          <QuestionCard
            question={quizData.questions[currentQuestion].question}
            options={quizData.questions[currentQuestion].options}
            correctOptionId={quizData.questions[currentQuestion].correctOptionId}
            questionNumber={currentQuestion + 1}
            totalQuestions={quizData.questions.length}
            onAnswer={handleAnswer}
          />
        </div>
      </div>
    </div>
  );
};

export default Quiz;