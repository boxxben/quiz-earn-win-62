
import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  House, 
  Wallet, 
  Brain, 
  Trophy, 
  User 
} from '@phosphor-icons/react';

const navItems = [
  { path: '/home', icon: House, label: 'Home' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/quizzes', icon: Brain, label: 'Quizzes' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();

  // Don't show layout on auth pages or when not authenticated
  if (!user) {
    return <Outlet />;
  }

  // Don't show footer navigation on auth pages and admin pages
  const hideFooter = location.pathname === '/' || 
                     location.pathname === '/login' || 
                     location.pathname === '/register' || 
                     location.pathname.startsWith('/admin');

  if (hideFooter) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 relative overflow-hidden">
      {/* Futuristic background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      {/* Theme toggle - positioned at top right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <main className="pb-24 transition-all duration-300 ease-in-out relative z-10">
        <Outlet />
      </main>
      
      {/* Futuristic Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl bg-card/60 border-t border-primary/30 shadow-2xl">
        {/* Futuristic holographic overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-accent/5 to-transparent pointer-events-none"></div>
        {/* Animated border glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-pulse"></div>
        
        <div className="relative flex items-center justify-around px-4 py-3">
          {navItems.map(({ path, icon: Icon, label }, index) => {
            const isActive = location.pathname === path;
            
            return (
              <NavLink
                key={path}
                to={path}
                className={`
                  group relative flex flex-col items-center py-3 px-5 rounded-3xl
                  transition-all duration-500 ease-out transform
                  hover:scale-115 hover:-translate-y-2
                  ${isActive 
                    ? 'text-primary bg-gradient-to-br from-primary/20 to-accent/10 shadow-2xl shadow-primary/30 border border-primary/30' 
                    : 'text-muted-foreground hover:text-primary hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/5 hover:border hover:border-primary/20'
                  }
                `}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Futuristic active indicator */}
                {isActive && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse shadow-lg shadow-primary/50"></div>
                )}
                
                {/* Futuristic icon with 3D effect */}
                <div className={`
                  relative transition-all duration-500 ease-out
                  ${isActive ? 'transform scale-125 rotate-3' : 'group-hover:scale-125 group-hover:rotate-3'}
                `}>
                  <Icon 
                    size={24} 
                    weight={isActive ? 'fill' : 'regular'}
                    className={`
                      transition-all duration-500 ease-out
                      ${isActive 
                        ? 'drop-shadow-2xl filter brightness-110' 
                        : 'group-hover:drop-shadow-xl group-hover:brightness-110'
                      }
                    `}
                  />
                  
                  {/* Holographic glow effect */}
                  {isActive && (
                    <div className="absolute inset-0 blur-lg opacity-40 bg-gradient-to-br from-primary to-accent rounded-full animate-pulse scale-150"></div>
                  )}
                  
                  {/* Hover glow effect */}
                  <div className={`
                    absolute inset-0 blur-md rounded-full transition-all duration-500
                    ${isActive 
                      ? 'opacity-0' 
                      : 'opacity-0 group-hover:opacity-30 group-hover:bg-primary group-hover:scale-150'
                    }
                  `}></div>
                </div>
                
                {/* Label with smooth fade */}
                <span className={`
                  text-xs mt-1.5 font-medium transition-all duration-300 ease-out
                  ${isActive 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-80 group-hover:opacity-100 group-hover:transform group-hover:-translate-y-0.5'
                  }
                `}>
                  {label}
                </span>
                
                {/* Futuristic energy field effect */}
                <div className={`
                  absolute inset-0 rounded-3xl transition-all duration-500 ease-out
                  ${isActive 
                    ? 'bg-gradient-to-br from-primary/10 to-accent/5 ring-2 ring-primary/30 shadow-inner' 
                    : 'group-hover:bg-gradient-to-br group-hover:from-primary/5 group-hover:to-accent/5 group-hover:ring-1 group-hover:ring-primary/20 group-hover:shadow-inner'
                  }
                `}></div>
              </NavLink>
            );
          })}
        </div>
        
        {/* Futuristic energy beam */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-primary/40 via-accent/60 to-primary/40 animate-pulse delay-500"></div>
      </nav>
    </div>
  );
}
