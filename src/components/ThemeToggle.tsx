import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    
    // Add transition class for smooth animation
    document.documentElement.classList.add("theme-transition");
    
    // Apply the theme change
    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    
    setIsDark(newIsDark);
    
    // Remove transition class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 300);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 relative overflow-hidden"
    >
      <Sun className={cn(
        "h-4 w-4 absolute transition-all duration-300",
        isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
      )} />
      <Moon className={cn(
        "h-4 w-4 absolute transition-all duration-300",
        isDark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
      )} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
