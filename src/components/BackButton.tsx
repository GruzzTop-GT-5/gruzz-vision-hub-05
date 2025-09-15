import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  onClick: () => void;
  text?: string;
  className?: string;
}

export const BackButton = ({ onClick, text = "Назад", className = "" }: BackButtonProps) => {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className={`mb-6 border-steel-600 hover:border-primary hover:bg-steel-700 text-steel-300 hover:text-primary transition-all duration-300 ${className}`}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {text}
    </Button>
  );
};