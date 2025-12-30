import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
  isActive: boolean;
}

const Timer = ({ totalSeconds, onTimeUp, isActive }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  useEffect(() => {
    setTimeLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onTimeUp, timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const percentage = (timeLeft / totalSeconds) * 100;
  
  const isLowTime = timeLeft <= 30;
  const isCritical = timeLeft <= 10;

  return (
    <div className={`flex flex-col items-center gap-2 ${isCritical ? 'animate-countdown' : ''}`}>
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90 transform">
          <circle
            cx="48"
            cy="48"
            r="44"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="48"
            cy="48"
            r="44"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeDasharray={276.46}
            strokeDashoffset={276.46 - (percentage / 100) * 276.46}
            strokeLinecap="round"
            className={`transition-all duration-1000 ${
              isCritical
                ? "text-destructive"
                : isLowTime
                ? "text-warning"
                : "text-primary"
            }`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock className={`h-5 w-5 ${isCritical ? "text-destructive" : "text-primary"}`} />
        </div>
      </div>
      
      <div className={`font-display text-2xl font-bold ${
        isCritical ? "text-destructive" : isLowTime ? "text-warning" : "text-foreground"
      }`}>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>
    </div>
  );
};

export default Timer;