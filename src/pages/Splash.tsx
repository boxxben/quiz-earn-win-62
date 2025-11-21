import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Trophy, Coins, Sparkles, Star } from "lucide-react";

const Splash = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Enhanced Animated background with multiple layers */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary glow orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/30 to-neon-purple/20 rounded-full blur-3xl animate-pulse opacity-80"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-secondary/30 to-gold/20 rounded-full blur-3xl animate-pulse delay-1000 opacity-80"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-bl from-accent/25 to-neon-cyan/15 rounded-full blur-2xl animate-bounce delay-500 opacity-70"></div>
        
        {/* Secondary ambient orbs */}
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-gradient-to-r from-neon-pink/20 to-electric-blue/15 rounded-full blur-3xl animate-pulse delay-2000 opacity-60"></div>
        <div className="absolute bottom-1/3 right-1/3 w-40 h-40 bg-gradient-to-l from-neon-green/20 to-primary/10 rounded-full blur-2xl animate-bounce delay-1500 opacity-50"></div>
      </div>

      {/* Enhanced Floating particles with different sizes and behaviors */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute ${i % 3 === 0 ? 'w-3 h-3' : i % 2 === 0 ? 'w-2 h-2' : 'w-1 h-1'} 
            ${i % 4 === 0 ? 'bg-primary/40' : i % 3 === 0 ? 'bg-secondary/30' : i % 2 === 0 ? 'bg-accent/35' : 'bg-neon-pink/25'} 
            rounded-full animate-float backdrop-blur-sm`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${4 + (i % 3)}s`,
              boxShadow: `0 0 ${8 + i % 4 * 2}px currentColor`
            }}
          />
        ))}
      </div>

      {/* Enhanced 3D Exploding Elements with more variety */}
      <div className="absolute inset-0 perspective-1000">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className={`absolute ${i % 2 === 0 ? 'w-5 h-5' : 'w-3 h-3'} 
            bg-gradient-to-r ${i % 4 === 0 ? 'from-primary to-neon-purple' : 
                              i % 3 === 0 ? 'from-secondary to-gold' : 
                              i % 2 === 0 ? 'from-accent to-neon-cyan' : 'from-neon-pink to-electric-blue'} 
            rounded-full animate-explode opacity-80`}
            style={{
              left: `${50 + Math.cos(i * 22.5 * Math.PI / 180) * 25}%`,
              top: `${50 + Math.sin(i * 22.5 * Math.PI / 180) * 25}%`,
              animationDelay: `${i * 0.08}s`,
              animationDuration: `${2.5 + i * 0.05}s`,
              transform: `translateZ(${i * 8}px) rotateX(${i * 25}deg) rotateY(${i * 35}deg)`,
              boxShadow: `0 0 15px currentColor`
            }}
          />
        ))}
      </div>

      {/* Animated star field */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <Star
            key={i}
            className={`absolute ${i % 3 === 0 ? 'w-4 h-4' : 'w-2 h-2'} 
            ${i % 4 === 0 ? 'text-primary/60' : i % 3 === 0 ? 'text-secondary/50' : i % 2 === 0 ? 'text-accent/40' : 'text-neon-pink/30'} 
            animate-twinkle`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Sparkle effects */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <Sparkles
            key={i}
            className={`absolute w-6 h-6 text-gold/40 animate-sparkle`}
            style={{
              left: `${20 + i * 7}%`,
              top: `${15 + Math.sin(i * 0.8) * 60}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `3s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Floating Icons around title */}
        <div className="absolute inset-0 pointer-events-none">
          <Trophy className="absolute top-1/4 left-1/4 w-8 h-8 text-gold/60 animate-bounce" style={{animationDelay: '0s'}} />
          <Coins className="absolute top-1/3 right-1/4 w-6 h-6 text-secondary/70 animate-bounce" style={{animationDelay: '0.5s'}} />
          <Zap className="absolute bottom-1/3 left-1/3 w-7 h-7 text-accent/60 animate-bounce" style={{animationDelay: '1s'}} />
          <Star className="absolute top-1/2 left-1/5 w-5 h-5 text-primary/50 animate-pulse" />
          <Sparkles className="absolute bottom-1/4 right-1/3 w-6 h-6 text-neon-pink/60 animate-pulse" style={{animationDelay: '1.5s'}} />
        </div>

        {/* Enhanced Quiz2cash Title with subtitle */}
        <div className={`transition-all duration-1500 transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-90'}`}>
          <div className="relative mb-2">
            <img 
              src="/quiz2cashlogo1-removebg-preview.png" 
              alt="Quiz2cash" 
              className="w-64 sm:w-80 md:w-96 lg:w-[32rem] mx-auto animate-neon-pulse drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.3))' }}
            />
          </div>
          
          {/* Animated subtitle */}
          <div className={`transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground font-medium mb-1 tracking-wide">
              Turn Knowledge Into Cash
            </p>
            <p className="text-sm sm:text-base text-muted-foreground/80 max-w-md mx-auto leading-relaxed">
              Challenge yourself, earn rewards, and climb the leaderboards
            </p>
          </div>
        </div>

        {/* Enhanced Navigation Button with icon animations */}
        <div className={`mt-16 transition-all duration-1200 delay-700 transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-90'}`}>
          <div className="relative">
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-30 animate-pulse"></div>
            
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/login'}
              className="relative group px-12 py-6 text-xl font-bold bg-gradient-primary hover:shadow-glow transition-all duration-500 transform hover:scale-110 hover:-translate-y-1 border-0 rounded-full overflow-hidden"
            >
              {/* Button shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
              
              <span className="relative flex items-center">
                Get Started
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-all duration-300" />
              </span>
            </Button>
          </div>
        </div>

        {/* Feature indicators */}
        <div className={`mt-12 transition-all duration-1000 delay-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex justify-center items-center space-x-8">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Trophy className="w-4 h-4 text-gold" />
              <span>Win Prizes</span>
            </div>
            <div className="w-px h-4 bg-border"></div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Coins className="w-4 h-4 text-secondary" />
              <span>Earn Money</span>
            </div>
            <div className="w-px h-4 bg-border"></div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-accent" />
              <span>Challenge Friends</span>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className={`mt-8 transition-all duration-1000 delay-1200 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex justify-center items-center flex-wrap gap-4 text-sm text-muted-foreground">
            <a href="/about" className="hover:text-primary transition-colors">About</a>
            <div className="w-px h-4 bg-border"></div>
            <a href="/how-to-play" className="hover:text-primary transition-colors">How to Play</a>
            <div className="w-px h-4 bg-border"></div>
            <a href="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</a>
            <div className="w-px h-4 bg-border"></div>
            <a href="/contact" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes explode {
          0% { 
            transform: translateX(0) translateY(0) translateZ(0) scale(1);
            opacity: 1;
          }
          100% { 
            transform: translateX(var(--random-x, 200px)) translateY(var(--random-y, -300px)) translateZ(var(--random-z, 100px)) scale(0);
            opacity: 0;
          }
        }
        .animate-explode {
          animation: explode 3s ease-out infinite;
        }
        @keyframes twinkle {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1) rotate(0deg);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2) rotate(180deg);
          }
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        @keyframes sparkle {
          0%, 100% { 
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          25% { 
            opacity: 1;
            transform: scale(1) rotate(90deg);
          }
          50% { 
            opacity: 0.8;
            transform: scale(1.1) rotate(180deg);
          }
          75% { 
            opacity: 1;
            transform: scale(1) rotate(270deg);
          }
        }
        .animate-sparkle {
          animation: sparkle 3s ease-in-out infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default Splash;