import React from 'react';
import { Moon, Sun } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="
        relative overflow-hidden group
        h-10 w-10 rounded-2xl
        bg-gradient-to-br from-primary/10 to-accent/10
        border border-primary/20
        hover:border-primary/40
        transition-all duration-500 ease-out
        hover:scale-110 hover:rotate-12
        shadow-lg shadow-primary/10
        hover:shadow-xl hover:shadow-primary/20
      "
    >
      {/* Animated background gradient */}
      <div className="
        absolute inset-0 
        bg-gradient-to-br from-primary/20 to-accent/20
        opacity-0 group-hover:opacity-100
        transition-opacity duration-500
        rounded-2xl
      "></div>
      
      {/* Icon container with 3D effect */}
      <div className="
        relative z-10
        transition-all duration-300 ease-out
        group-hover:scale-110
      ">
        {theme === 'light' ? (
          <Moon 
            size={20} 
            weight="fill"
            className="
              text-primary
              filter drop-shadow-lg
              group-hover:rotate-12
              transition-all duration-300
            "
          />
        ) : (
          <Sun 
            size={20} 
            weight="fill"
            className="
              text-accent
              filter drop-shadow-lg
              group-hover:rotate-12
              transition-all duration-300
            "
          />
        )}
      </div>
      
      {/* Futuristic glow effect */}
      <div className="
        absolute inset-0
        rounded-2xl
        bg-gradient-to-r from-primary/20 to-accent/20
        blur-md
        opacity-0 group-hover:opacity-60
        transition-all duration-500
        scale-75 group-hover:scale-100
      "></div>
    </Button>
  );
}