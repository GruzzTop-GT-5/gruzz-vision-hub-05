interface AnimatedBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedBackground = ({ children, className = "" }: AnimatedBackgroundProps) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Particles */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-primary/20 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-1 h-1 bg-electric-400/30 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-32 w-3 h-3 bg-primary/10 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-10 w-1.5 h-1.5 bg-electric-500/20 rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-32 right-1/3 w-2 h-2 bg-primary/15 rounded-full animate-ping" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-3/4 left-20 w-1 h-1 bg-electric-300/25 rounded-full animate-pulse" style={{ animationDelay: '5s' }}></div>
        
        {/* Floating Geometric Shapes */}
        <div className="absolute top-20 right-1/4 w-8 h-8 border border-primary/10 rotate-45 animate-float" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-6 h-6 border border-electric-400/15 rounded-full animate-float" style={{ animationDelay: '2.5s' }}></div>
        <div className="absolute top-2/3 left-10 w-4 h-4 border-l-2 border-primary/20 animate-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/3 right-16 w-5 h-5 border-r-2 border-electric-500/15 animate-float" style={{ animationDelay: '3.5s' }}></div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-gradient-to-br from-primary/5 to-electric-500/5 rounded-full blur-xl animate-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-electric-400/5 to-primary/5 rounded-full blur-2xl animate-glow" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/5 w-24 h-24 bg-gradient-to-br from-electric-300/3 to-primary/3 rounded-full blur-lg animate-glow" style={{ animationDelay: '6s' }}></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};