import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  onClick?: () => void;
  text?: string;
  className?: string;
  fallbackPath?: string;
}

export const BackButton = ({ 
  onClick, 
  text = "Назад", 
  className = "",
  fallbackPath = "/" 
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Проверяем, есть ли история для возврата
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        // Если истории нет, переходим на fallback путь
        navigate(fallbackPath);
      }
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className={`mb-6 border-steel-600 hover:border-primary hover:bg-steel-700 text-steel-300 hover:text-primary transition-all duration-300 ${className}`}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {text}
    </Button>
  );
};