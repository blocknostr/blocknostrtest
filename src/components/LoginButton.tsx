import React from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalLoginDialog } from "@/hooks/useGlobalLoginDialog";
import { nostrService } from "@/lib/nostr";
import { toast } from "@/lib/utils/toast-replacement";

interface LoginButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

const LoginButton: React.FC<LoginButtonProps> = ({
  variant = "default",
  size = "default", 
  className = "",
  showText = true
}) => {
  const { isLoggedIn, shortPubkey } = useAuth();
  const { openLoginDialog } = useGlobalLoginDialog();

  // Add debugging
  console.log('[LoginButton] Render - isLoggedIn:', isLoggedIn, 'shortPubkey:', shortPubkey);

  const handleClick = () => {
    if (isLoggedIn) {
      // Sign out if already logged in
      console.log('[LoginButton] Signing out...');
      nostrService.signOut();
      toast.success("Signed out successfully", { 
        description: "You have been disconnected from your Nostr account" 
      });
    } else {
      // Open login dialog if not logged in
      console.log('[LoginButton] Opening login dialog...');
      openLoginDialog();
    }
  };

  if (isLoggedIn) {
    return (
      <Button 
        variant={variant === "default" ? "default" : variant}
        size={size} 
        className={`${className} bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0`}
        onClick={handleClick}
      >
        <Check className="h-4 w-4 mr-1" />
        {showText && "Connected"}
        <LogOut className="h-3 w-3 ml-2 opacity-70" />
      </Button>
    );
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={handleClick}
    >
      <Wallet className="h-4 w-4 mr-1" />
      {showText && "Connect Wallet"}
    </Button>
  );
};

export default LoginButton;
