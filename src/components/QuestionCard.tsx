import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Option {
  id: string;
  text: string;
}

interface QuestionCardProps {
  question: string;
  options: Option[];
  correctOptionId: string;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (optionId: string, isCorrect: boolean) => void;
  showFeedback?: boolean;
}

const QuestionCard = ({
  question,
  options,
  correctOptionId,
  questionNumber,
  totalQuestions,
  onAnswer,
  showFeedback = true,
}: QuestionCardProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const handleSelect = (optionId: string) => {
    if (hasAnswered) return;
    
    setSelectedOption(optionId);
    setHasAnswered(true);
    const isCorrect = optionId === correctOptionId;
    
    setTimeout(() => {
      onAnswer(optionId, isCorrect);
      setSelectedOption(null);
      setHasAnswered(false);
    }, showFeedback ? 1500 : 0);
  };

  const getOptionStyles = (optionId: string) => {
    if (!hasAnswered || !showFeedback) {
      if (selectedOption === optionId) {
        return "border-primary bg-primary/10";
      }
      return "border-border hover:border-primary/50 hover:bg-muted/50";
    }

    if (optionId === correctOptionId) {
      return "border-accent bg-accent/10";
    }
    
    if (selectedOption === optionId && optionId !== correctOptionId) {
      return "border-destructive bg-destructive/10";
    }
    
    return "border-border opacity-50";
  };

  return (
    <div className="animate-scale-in">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="h-2 flex-1 mx-4 rounded-full bg-muted overflow-hidden">
          <div 
            className="h-full gradient-primary transition-all duration-300"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="mb-8 font-display text-2xl font-bold text-foreground">
        {question}
      </h2>

      <div className="grid gap-4">
        {options.map((option, index) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            disabled={hasAnswered}
            className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-300 ${getOptionStyles(option.id)}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-display font-bold text-foreground">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="flex-1 text-foreground">{option.text}</span>
            
            {hasAnswered && showFeedback && option.id === correctOptionId && (
              <Check className="h-5 w-5 text-accent" />
            )}
            {hasAnswered && showFeedback && selectedOption === option.id && option.id !== correctOptionId && (
              <X className="h-5 w-5 text-destructive" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;