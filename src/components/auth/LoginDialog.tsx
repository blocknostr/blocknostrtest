import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { nostrService } from "@/lib/nostr";
import { toast } from "@/lib/utils/toast-replacement";
import { cn } from "@/lib/utils";

// Import our components
import DialogHeader from "./login/DialogHeader";
import DialogFooter from "./login/DialogFooter";
import ExtensionTab from "./login/ExtensionTab";
import ManualTab from "./login/ManualTab";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ open, onOpenChange }) => {
  const [hasExtension, setHasExtension] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [connectStatus, setConnectStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [animateIn, setAnimateIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"extension" | "manual">("extension");

  // Check for Nostr extension
  useEffect(() => {
    const checkExtension = () => {
      setHasExtension(!!window.nostr);
    };

    checkExtension();
    
    // Check periodically in case extension loads after page
    const interval = setInterval(checkExtension, 1000);
    return () => clearInterval(interval);
  }, []);

  // Add animation when dialog opens
  useEffect(() => {
    if (open) {
      // Slight delay for animation to trigger after dialog opens
      const timer = setTimeout(() => {
        setAnimateIn(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
      // Reset states when dialog closes
      setActiveTab("extension");
      setConnectStatus('idle');
    }
  }, [open]);

  const handleConnect = async () => {
    if (!hasExtension) {
      return;
    }

    setIsLoggingIn(true);
    setConnectStatus('connecting');
    
    try {
      console.log('[LoginDialog] Starting login process...');
      const success = await nostrService.login();
      
      if (success) {
        console.log('[LoginDialog] Login successful, publicKey:', nostrService.publicKey);
        setConnectStatus('success');
        toast.success("Connected successfully", { description: "Welcome to BlockNoster" });
        
        // Close dialog immediately on success
        console.log('[LoginDialog] Closing dialog after successful login');
        onOpenChange(false);
        
        // Force a page refresh if auth state didn't update properly
        setTimeout(() => {
          if (!nostrService.publicKey) {
            console.warn('[LoginDialog] Auth state not updated, forcing refresh');
            window.location.reload();
          }
        }, 1000);
      } else {
        console.error('[LoginDialog] Login failed');
        setConnectStatus('error');
        toast.error("Connection failed", { description: "Please try again or check your extension" });
      }
    } catch (error) {
      console.error("Login error:", error);
      setConnectStatus('error');
      toast.error("Connection error", { description: "Please check your extension settings" });
    } finally {
      if (connectStatus !== 'success') {
        setIsLoggingIn(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-md bg-background/95 backdrop-blur-xl border-muted/30 shadow-xl p-4",
        "animate-in fade-in-0 zoom-in-95 duration-300 max-h-[90vh]",
        "before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-b before:from-primary/5 before:to-primary/10 before:rounded-lg before:opacity-70"
      )}>
        <div className={cn(
          "absolute inset-0 -z-10 rounded-lg opacity-80",
          "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]",
          "from-background/20 via-background/60 to-background/90",
          "transition-opacity duration-300 ease-in-out",
          animateIn ? "opacity-80" : "opacity-0"
        )}/>
        
        {/* Dialog Header */}
        <DialogHeader animateIn={animateIn} />

        <div className={cn(
          "mt-2 transition-all duration-500 ease-out", 
          animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        )}>
          {/* Tabs */}
          <Tabs defaultValue="extension" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="extension">Extension</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>
            
            <TabsContent value="extension" className="space-y-4">
              <ExtensionTab 
                hasExtension={hasExtension} 
                connectStatus={connectStatus} 
                onConnect={handleConnect}
                isLoggingIn={isLoggingIn}
              />
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4">
              <ManualTab />
            </TabsContent>
          </Tabs>
          
          <div className="pt-2 border-t border-border/20 mt-3">
            <p className="text-xs text-muted-foreground text-center">
              New to Nostr? <a href="https://nostr.how" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Learn more
              </a>
            </p>
          </div>
        </div>

        {/* Dialog Footer */}
        <DialogFooter 
          onConnect={handleConnect}
          activeTab={activeTab}
          isLoggingIn={isLoggingIn}
          hasExtension={hasExtension}
          connectStatus={connectStatus}
          animateIn={animateIn}
        />
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
