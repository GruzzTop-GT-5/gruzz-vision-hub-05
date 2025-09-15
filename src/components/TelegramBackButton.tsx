import React, { useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface TelegramBackButtonProps {
  onClick: () => void;
  fallbackButton?: boolean;
}

export const TelegramBackButton: React.FC<TelegramBackButtonProps> = ({
  onClick,
  fallbackButton = true,
}) => {
  const { isInTelegram, backButton, hapticFeedback } = useTelegram();

  useEffect(() => {
    if (isInTelegram && backButton) {
      const handleClick = () => {
        hapticFeedback?.impactOccurred('light');
        onClick();
      };

      backButton.onClick(handleClick);
      backButton.show();

      return () => {
        backButton.offClick(handleClick);
        backButton.hide();
      };
    }
  }, [isInTelegram, backButton, onClick, hapticFeedback]);

  // Fallback button for non-Telegram environments
  if (!isInTelegram && fallbackButton) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Назад
      </Button>
    );
  }

  return null;
};