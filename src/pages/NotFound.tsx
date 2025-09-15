import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <AnimatedBackground className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        <div className="w-24 h-24 bg-gradient-to-br from-primary via-electric-500 to-electric-600 rounded-3xl flex items-center justify-center mx-auto animate-glow">
          <span className="text-steel-900 font-black text-4xl">404</span>
        </div>
        <h1 className="text-4xl font-bold text-glow">Страница не найдена</h1>
        <p className="text-xl text-steel-300">Упс! Запрашиваемая страница не существует</p>
        <Link 
          to="/" 
          className="inline-block btn-3d px-8 py-4 text-lg font-bold bg-gradient-to-r from-primary to-electric-600 text-steel-900 rounded-xl hover:scale-105 transition-transform duration-300"
        >
          Вернуться на главную
        </Link>
      </div>
    </AnimatedBackground>
  );
};

export default NotFound;
