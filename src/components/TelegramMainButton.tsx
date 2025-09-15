import React, { useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { Button } from '@/components/ui/button';

interface TelegramMainButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  fallbackButton?: boolean;
}

export const TelegramMainButton: React.FC<TelegramMainButtonProps> = ({
  text,
  onClick,
  disabled = false,
  loading = false,
  fallbackButton = true,
}) => {
  const { isInTelegram, mainButton, hapticFeedback } = useTelegram();

  useEffect(() => {
    if (isInTelegram && mainButton) {
      mainButton.setText(text);
      
      const handleClick = () => {
        hapticFeedback?.impactOccurred('light');
        onClick();
      };

      mainButton.onClick(handleClick);
      
      if (disabled) {
        mainButton.disable();
      } else {
        mainButton.enable();
      }

      if (loading) {
        mainButton.showProgress();
      } else {
        mainButton.hideProgress();
      }

      mainButton.show();

      return () => {
        mainButton.offClick(handleClick);
        mainButton.hide();
      };
    }
  }, [isInTelegram, mainButton, text, onClick, disabled, loading, hapticFeedback]);

  // Fallback button for non-Telegram environments
  if (!isInTelegram && fallbackButton) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50">
        <Button 
          onClick={onClick} 
          disabled={disabled || loading}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {loading ? "Загрузка..." : text}
        </Button>
      </div>
    );
  }

  return null;
};