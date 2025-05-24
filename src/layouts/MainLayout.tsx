import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/sidebar/Sidebar";
import GlobalSidebar from "@/components/sidebar/GlobalSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useSwipeable } from "@/hooks/use-swipeable";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { NavigationProvider } from '@/contexts/NavigationContext';
import { useBackgroundRelayConnection } from '@/hooks/useBackgroundRelayConnection';
import { useGlobalLoginDialog } from '@/hooks/useGlobalLoginDialog';
import LoginDialog from '@/components/auth/LoginDialog';
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import HeaderRelayStatus from "@/components/header/HeaderRelayStatus";
import LoginButton from "@/components/LoginButton";
import { nostrService } from "@/lib/nostr";

export interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { preferences, isLoading } = useUserPreferences();
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);
  const isMobile = useIsMobile();
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [iOSSafeArea, setIOSSafeArea] = useState(false);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const { darkMode, toggleDarkMode } = useTheme();
  const isLoggedIn = !!nostrService.publicKey;
  
  // Initialize background relay connections
  const relayState = useBackgroundRelayConnection();
  
  // Check for iOS device and set up dynamic viewport height
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIOSSafeArea(isIOS);
    
    // Add class to body for iOS-specific styling
    if (isIOS) {
      document.body.classList.add('ios-device');
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
      
      // Update on resize or orientation change
      const updateHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        setWindowHeight(window.innerHeight);
      };
      
      window.addEventListener('resize', updateHeight);
      window.addEventListener('orientationchange', updateHeight);
      
      // Initial call to set the height
      updateHeight();
      
      return () => {
        window.removeEventListener('resize', updateHeight);
        window.removeEventListener('orientationchange', updateHeight);
        document.body.classList.remove('ios-device');
      };
    }
  }, []);
  
  // Setup swipe handlers for mobile gesture navigation with improved sensitivity
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile && !rightPanelOpen) {
        setRightPanelOpen(true);
        setLeftPanelOpen(false);
      }
    },
    onSwipedRight: () => {
      if (isMobile && !leftPanelOpen) {
        setLeftPanelOpen(true);
        setRightPanelOpen(false);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false,
    swipeThreshold: 10, // Make swipe detection more sensitive for iOS
    swipeDuration: 250 // Reduce duration needed for swipe on iOS
  });

  // Listen for hashtag changes from global events
  useEffect(() => {
    const handleHashtagChange = (event: CustomEvent) => {
      setActiveHashtag(event.detail);
    };
    window.addEventListener('set-hashtag', handleHashtagChange as EventListener);
    return () => {
      window.removeEventListener('set-hashtag', handleHashtagChange as EventListener);
    };
  }, []);

  const handleTopicClick = (topic: string) => {
    setActiveHashtag(topic);
    if (isMobile) {
      setRightPanelOpen(false);
    }
    window.scrollTo(0, 0);
    window.dispatchEvent(new CustomEvent('set-hashtag', { detail: topic }));
  };

  const clearHashtag = () => {
    setActiveHashtag(undefined);
    window.dispatchEvent(new CustomEvent('set-hashtag', { detail: undefined }));
  };

  // Close panels when clicking on main content (mobile only)
  const handleMainContentClick = () => {
    if (isMobile) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  };

  const { isOpen: loginDialogOpen, setLoginDialogOpen } = useGlobalLoginDialog();

  useEffect(() => {
    console.log('[MainLayout] Background relay connection state:', relayState);
  }, [relayState]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const sidebarWidth = isMobile ? 0 : (preferences?.sidebarCollapsed ? 60 : 240);
  const rightSidebarWidth = isMobile ? 0 : 320;

  return (
    <NavigationProvider>
      <div
        className={cn(
          "flex min-h-screen bg-background relative overscroll-none",
          preferences.uiPreferences?.compactMode ? "text-sm" : "",
          iOSSafeArea ? "ios-safe-area" : ""
        )}
        style={iOSSafeArea ? { minHeight: `${windowHeight}px` } : undefined}
      >
        {/* Desktop sidebar - only visible on non-mobile */}
        {!isMobile && <Sidebar />}

        <div
          className={cn(
            "flex-1 transition-all duration-200",
            !isMobile && "ml-64",
            iOSSafeArea && "ios-safe-padding-bottom"
          )}
          {...swipeHandlers}
        >
          {/* Simple header with essential controls */}
          <header className="fixed top-0 right-0 z-50 p-4">
            <div className="flex items-center space-x-2">
              {/* Add relay status indicator when logged in */}
              {isLoggedIn && <HeaderRelayStatus />}
              <Button 
                variant="ghost"
                size="icon"
                className="rounded-full theme-toggle-button"
                onClick={(e) => toggleDarkMode(e)}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                <Lightbulb className={darkMode ? "h-5 w-5" : "h-5 w-5 text-yellow-500 fill-yellow-500"} />
              </Button>
              <LoginButton size="sm" />
            </div>
          </header>

          <div className="flex">
            <main
              className={cn(
                "flex-1 min-h-screen", /* Removed top margin since header is now floating */
                iOSSafeArea && "ios-safe-padding-bottom px-safe"
              )}
              onClick={handleMainContentClick}
              style={iOSSafeArea ? { minHeight: `calc(${windowHeight}px)` } : undefined}
            >
              {children || <Outlet />}
            </main>

            <GlobalSidebar
              rightPanelOpen={rightPanelOpen}
              setRightPanelOpen={setRightPanelOpen}
              onTopicClick={handleTopicClick}
              isMobile={isMobile}
              activeHashtag={activeHashtag}
              onClearHashtag={clearHashtag}
            />
          </div>
        </div>

        {/* Global Login Dialog */}
        <LoginDialog 
          open={loginDialogOpen}
          onOpenChange={setLoginDialogOpen}
        />
      </div>
    </NavigationProvider>
  );
};

export default MainLayout;
