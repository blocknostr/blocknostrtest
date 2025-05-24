import React, { Suspense } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import GlobalSearch from "@/components/GlobalSearch";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useLocation } from "react-router-dom";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginDialog from "@/components/auth/LoginDialog";
import WorldChat from "@/components/chat/WorldChat";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalLoginDialog } from "@/hooks/useGlobalLoginDialog";

// Lazy load CryptoTracker for better performance
const CryptoTracker = React.lazy(() => import("@/components/crypto/CryptoTracker"));

interface GlobalSidebarProps {
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  onTopicClick: (topic: string) => void;
  isMobile: boolean;
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ 
  rightPanelOpen, 
  setRightPanelOpen, 
  onTopicClick,
  isMobile,
  activeHashtag,
  onClearHashtag
}) => {
  const { preferences } = useUserPreferences();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const { isOpen: loginDialogOpen, openLoginDialog, setLoginDialogOpen } = useGlobalLoginDialog();
  
  const cryptoTrackerFallback = (
    <div className="h-[160px] flex items-center justify-center">
      <Loader2 className="h-4 w-4 text-primary/50 animate-spin" />
    </div>
  );
  
  const renderChatSection = () => {
    if (!isLoggedIn) {
      return (
        <div className="chat-container flex-grow mt-3 overflow-hidden relative rounded-lg border bg-gradient-to-b from-background to-muted/10">
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="p-2 bg-primary/10 rounded-full mb-3">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">Connect to join the chat</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openLoginDialog}
              className="gap-1.5 border-primary/20 hover:border-primary/30 bg-transparent hover:bg-primary/5"
            >
              <Wallet className="h-3.5 w-3.5 text-primary" />
              Connect
            </Button>
          </div>
        </div>
      );
    }

    // User is logged in - show WorldChat directly
    return (
      <div className="chat-container flex-grow mt-3 overflow-hidden relative">
        <WorldChat />
      </div>
    );
  };
  
  // Desktop right sidebar
  if (!isMobile) {
    return (
      <aside className="w-80 p-4 hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="flex flex-col h-full space-y-3 overflow-hidden">
          <div className="search-section">
            <GlobalSearch />
          </div>
          
          <div className="crypto-section">
            <Suspense fallback={cryptoTrackerFallback}>
              <CryptoTracker />
            </Suspense>
          </div>
          
          <div className="divider h-px bg-border/50 my-1" />
          
          {renderChatSection()}
        </div>
        
        {/* Login Dialog is now managed globally in MainLayout */}
      </aside>
    );
  }
  
  // Mobile right panel
  if (isMobile) {
    return (
      <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
        <SheetContent side="right" className="p-4 w-[80%] max-w-[300px] overflow-hidden">
          <div className="flex flex-col h-full space-y-3 overflow-hidden">
            <div className="search-section">
              <GlobalSearch />
            </div>
            
            <div className="crypto-section">
              <Suspense fallback={cryptoTrackerFallback}>
                <CryptoTracker />
              </Suspense>
            </div>
            
            <div className="divider h-px bg-border/50 my-1" />
            
            {renderChatSection()}
          </div>
          
          {/* Login Dialog is now managed globally in MainLayout */}
        </SheetContent>
      </Sheet>
    );
  }
  
  return null;
};

export default GlobalSidebar;
