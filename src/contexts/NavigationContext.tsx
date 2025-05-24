
import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface NavigationContextType {
  history: string[];
  goBack: () => void;
  canGoBack: boolean;
}

const NavigationContext = createContext<NavigationContextType>({
  history: [],
  goBack: () => {},
  canGoBack: false
});

export const useNavigation = () => useContext(NavigationContext);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Update history when location changes
  useEffect(() => {
    setHistory(prev => {
      // Don't add duplicate entries for the same path
      if (prev.length > 0 && prev[prev.length - 1] === location.pathname) {
        return prev;
      }
      return [...prev, location.pathname];
    });
  }, [location.pathname]);

  const goBack = () => {
    if (history.length > 1) {
      // Remove current page from history
      const newHistory = [...history];
      newHistory.pop();
      const previousPage = newHistory[newHistory.length - 1];
      
      // Update history and navigate
      setHistory(newHistory);
      navigate(previousPage);
    } else {
      // If no previous page in history, go to home
      navigate("/");
    }
  };

  return (
    <NavigationContext.Provider 
      value={{ 
        history, 
        goBack, 
        canGoBack: history.length > 1 
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};
