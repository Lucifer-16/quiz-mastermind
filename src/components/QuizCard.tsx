import { Clock, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizCardProps {
  title: string;
  description: string;
  questionCount: number;
  timeLimit: number;
  difficulty: "easy" | "medium" | "hard";
  participants?: number;
  onStart: () => void;
}

const difficultyColors = {
  easy: "text-accent",
  medium: "text-warning",
  hard: "text-destructive",
};

const QuizCard = ({
  title,
  description,
  questionCount,
  timeLimit,
  difficulty,
  participants = 0,
  onStart,
}: QuizCardProps) => {
  return (
    <div className="group gradient-card rounded-xl border border-border p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 animate-fade-in">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-display text-xl font-bold text-foreground group-hover:text-gradient transition-colors">
            {title}
          </h3>
          <span className={`text-sm font-medium capitalize ${difficultyColors[difficulty]}`}>
            {difficulty}
          </span>
        </div>
        <div className="rounded-full bg-primary/10 p-2">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
      </div>
      
      <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
        {description}
      </p>
      
      <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{timeLimit} min</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{participants} played</span>
        </div>
        <span>{questionCount} questions</span>
      </div>
      
      <Button 
        variant="hero" 
        className="w-full"
        onClick={onStart}
      >
        Start Quiz
      </Button>
    </div>
  );
};

export default QuizCard;