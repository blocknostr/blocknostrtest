import { NostrService } from './service';
import { eventBus, EVENTS } from '@/lib/services/EventBus';
import { nostrService } from './index';

// Create a dedicated Nostr service instance for chat functionality
const chatNostrServiceInstance = new NostrService();

// Sync authentication state with main service
const syncAuthState = () => {
  const mainPublicKey = nostrService.publicKey;
  if (mainPublicKey && !chatNostrServiceInstance.publicKey) {
    // Main service is logged in but chat service isn't - sync the state
    chatNostrServiceInstance.userManager.setPublicKey(mainPublicKey);
    console.log('[ChatService] Synced authentication state from main service');
  } else if (!mainPublicKey && chatNostrServiceInstance.publicKey) {
    // Main service logged out but chat service still has auth - clear it
    chatNostrServiceInstance.userManager.setPublicKey(null);
    console.log('[ChatService] Cleared authentication state from main service');
  }
};

// Listen for authentication changes from the main service
eventBus.on(EVENTS.AUTH_CHANGED, (authData: { isLoggedIn: boolean; publicKey: string | null }) => {
  if (authData.isLoggedIn && authData.publicKey) {
    chatNostrServiceInstance.userManager.setPublicKey(authData.publicKey);
    console.log('[ChatService] Authentication synced: User logged in');
  } else {
    chatNostrServiceInstance.userManager.setPublicKey(null);
    console.log('[ChatService] Authentication synced: User logged out');
  }
});

// Initial sync in case main service is already authenticated
syncAuthState();

// Export the chat-specific Nostr service
export const chatNostrService = chatNostrServiceInstance;
