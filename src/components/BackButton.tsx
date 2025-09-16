import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

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
  const location = useLocation();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    // Определяем откуда пришли и куда вернуться
    const from = location.state?.from;
    
    try {
      if (from) {
        // Если есть информация о предыдущей странице, переходим туда
        navigate(from);
      } else {
        // Пытаемся вернуться назад
        navigate(-1);
        
        // Проверяем через небольшую задержку, изменился ли URL
        setTimeout(() => {
          if (window.location.pathname === location.pathname) {
            // Если URL не изменился, значит истории назад нет, переходим на fallback
            navigate(fallbackPath);
          }
        }, 100);
      }
    } catch (error) {
      // Если произошла ошибка, переходим на fallback
      console.warn('Navigation error, falling back to:', fallbackPath);
      navigate(fallbackPath);
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className={`mb-6 border-steel-600 hover:bg-steel-700 text-steel-300 hover:text-primary transition-colors duration-200 ${className}`}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {text}
    </Button>
  );
};