import React, { useEffect, ReactNode } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';

interface TelegramLayoutProps {
  children: ReactNode;
  className?: string;
  showMainButton?: boolean;
  mainButtonText?: string;
  onMainButtonClick?: () => void;
  showBackButton?: boolean;
  onBackButtonClick?: () => void;
}

export const TelegramLayout: React.FC<TelegramLayoutProps> = ({
  children,
  className,
  showMainButton = false,
  mainButtonText = "Продолжить",
  onMainButtonClick,
  showBackButton = false,
  onBackButtonClick,
}) => {
  const { 
    isInTelegram, 
    webApp, 
    mainButton, 
    backButton, 
    themeParams,
    colorScheme 
  } = useTelegram();

  useEffect(() => {
    if (isInTelegram && webApp) {
      // Apply Telegram theme colors
      const root = document.documentElement;
      
      if (themeParams) {
        root.style.setProperty('--tg-bg-color', themeParams.bg_color || '#ffffff');
        root.style.setProperty('--tg-text-color', themeParams.text_color || '#000000');
        root.style.setProperty('--tg-hint-color', themeParams.hint_color || '#999999');
        root.style.setProperty('--tg-link-color', themeParams.link_color || '#2481cc');
        root.style.setProperty('--tg-button-color', themeParams.button_color || '#2481cc');
        root.style.setProperty('--tg-button-text-color', themeParams.button_text_color || '#ffffff');
        root.style.setProperty('--tg-secondary-bg-color', themeParams.secondary_bg_color || '#f1f1f1');
      }

      // Set color scheme
      root.setAttribute('data-telegram-theme', colorScheme);
    }
  }, [isInTelegram, themeParams, colorScheme]);

  useEffect(() => {
    if (isInTelegram && mainButton) {
      if (showMainButton && onMainButtonClick) {
        mainButton.setText(mainButtonText);
        mainButton.onClick(onMainButtonClick);
        mainButton.show();
      } else {
        mainButton.hide();
      }

      return () => {
        if (onMainButtonClick) {
          mainButton.offClick(onMainButtonClick);
        }
      };
    }
  }, [isInTelegram, mainButton, showMainButton, mainButtonText, onMainButtonClick]);

  useEffect(() => {
    if (isInTelegram && backButton) {
      if (showBackButton && onBackButtonClick) {
        backButton.onClick(onBackButtonClick);
        backButton.show();
      } else {
        backButton.hide();
      }

      return () => {
        if (onBackButtonClick) {
          backButton.offClick(onBackButtonClick);
        }
      };
    }
  }, [isInTelegram, backButton, showBackButton, onBackButtonClick]);

  const telegramStyles = isInTelegram ? {
    backgroundColor: 'var(--tg-bg-color, transparent)',
    color: 'var(--tg-text-color, inherit)',
    minHeight: '100vh',
  } : {};

  return (
    <div 
      className={cn(
        "telegram-layout",
        isInTelegram && "telegram-webapp",
        className
      )}
      style={telegramStyles}
    >
      {children}
    </div>
  );
};