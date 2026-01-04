import { useEffect, useState } from 'react';
import { validatePasswordStrength, PasswordStrength } from '@/lib/security';
import { CheckCircle, XCircle } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  showFeedback?: boolean;
}

export const PasswordStrengthMeter = ({ password, showFeedback = true }: PasswordStrengthMeterProps) => {
  const [strength, setStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isStrong: false,
  });

  useEffect(() => {
    if (password) {
      setStrength(validatePasswordStrength(password));
    } else {
      setStrength({ score: 0, feedback: [], isStrong: false });
    }
  }, [password]);

  const getStrengthColor = () => {
    if (strength.score === 0) return 'bg-destructive';
    if (strength.score === 1) return 'bg-red-500';
    if (strength.score === 2) return 'bg-orange-500';
    if (strength.score === 3) return 'bg-yellow-500';
    return 'bg-success';
  };

  const getStrengthLabel = () => {
    if (strength.score === 0) return 'Very Weak';
    if (strength.score === 1) return 'Weak';
    if (strength.score === 2) return 'Fair';
    if (strength.score === 3) return 'Good';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password Strength</span>
        <span className={`font-medium ${
          strength.isStrong ? 'text-success' : 
          strength.score >= 3 ? 'text-yellow-500' : 
          'text-destructive'
        }`}>
          {getStrengthLabel()}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${(strength.score / 4) * 100}%` }}
        />
      </div>
      {showFeedback && strength.feedback.length > 0 && (
        <div className="space-y-1 mt-2">
          {strength.feedback.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              {strength.isStrong ? (
                <CheckCircle className="h-3 w-3 text-success" />
              ) : (
                <XCircle className="h-3 w-3 text-muted-foreground" />
              )}
              <span className={strength.isStrong ? 'text-success' : 'text-muted-foreground'}>
                {item}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

