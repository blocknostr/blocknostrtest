
import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useUnifiedProfile";
import { profileAdapter } from "@/lib/adapters/ProfileAdapter";

/**
 * useSidebarProfile Hook - Now uses unified profile hook
 */
export function useSidebarProfile() {
  const { isLoggedIn, publicKey } = useAuth();
  
  // Convert publicKey to npub for the unified profile hook
  const npub = React.useMemo(() => {
    if (!publicKey) return undefined;
    try {
      return profileAdapter.convertHexToNpub(publicKey);
    } catch (error) {
      console.error("[useSidebarProfile] Error converting pubkey to npub:", error);
      return undefined;
    }
  }, [publicKey]);
  
  // Use basic profile hook for sidebar
  const [profileState] = useProfile(npub, { 
    enableDebug: false,
    enableRetry: false,
    autoLoad: isLoggedIn && !!npub
  });
  
  return { 
    isLoggedIn, 
    userProfile: (profileState as any).profile || {}, 
    isLoading: (profileState as any).loading 
  };
}
