import { useEffect, useState } from 'react';

// Telegram WebApp interface
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
            is_premium?: boolean;
          };
          start_param?: string;
          auth_date?: number;
          hash?: string;
        };
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color: string;
          text_color: string;
          hint_color: string;
          link_color: string;
          button_color: string;
          button_text_color: string;
          secondary_bg_color: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        showPopup: (params: {
          title?: string;
          message: string;
          buttons?: Array<{
            id?: string;
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
            text: string;
          }>;
        }, callback?: (buttonId: string) => void) => void;
      };
    };
  }
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

interface UseTelegramReturn {
  user: TelegramUser | null;
  webApp: typeof window.Telegram?.WebApp | null;
  isInTelegram: boolean;
  initData: string;
  colorScheme: 'light' | 'dark';
  themeParams: any;
  mainButton: typeof window.Telegram?.WebApp.MainButton | null;
  backButton: typeof window.Telegram?.WebApp.BackButton | null;
  hapticFeedback: typeof window.Telegram?.WebApp.HapticFeedback | null;
  ready: () => void;
  expand: () => void;
  close: () => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  sendData: (data: string) => void;
}

export const useTelegram = (): UseTelegramReturn => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [webApp, setWebApp] = useState<typeof window.Telegram?.WebApp | null>(null);
  const [isInTelegram, setIsInTelegram] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      setWebApp(tg);
      setIsInTelegram(true);
      
      // Get user data from initDataUnsafe
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
      
      // Ready the app
      tg.ready();
      
      // Expand to full height
      tg.expand();
      
      // Set up theme
      document.documentElement.setAttribute('data-theme', tg.colorScheme);
    } else {
      setIsInTelegram(false);
    }
  }, []);

  return {
    user,
    webApp,
    isInTelegram,
    initData: webApp?.initData || '',
    colorScheme: webApp?.colorScheme || 'light',
    themeParams: webApp?.themeParams || {},
    mainButton: webApp?.MainButton || null,
    backButton: webApp?.BackButton || null,
    hapticFeedback: webApp?.HapticFeedback || null,
    ready: () => webApp?.ready(),
    expand: () => webApp?.expand(),
    close: () => webApp?.close(),
    showAlert: (message: string, callback?: () => void) => webApp?.showAlert(message, callback),
    showConfirm: (message: string, callback?: (confirmed: boolean) => void) => webApp?.showConfirm(message, callback),
    sendData: (data: string) => webApp?.sendData(data)
  };
};