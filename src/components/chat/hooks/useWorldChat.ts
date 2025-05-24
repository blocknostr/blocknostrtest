
import { useState } from "react";
import { useRelayConnection } from "./useRelayConnection";
import { useChatProfile } from "@/hooks/useUnifiedProfile";
import { useMessageSubscription } from "./useMessageSubscription";
import { useReactionHandler } from "./useReactionHandler";
import { useMessageSender } from "./useMessageSender";
import { chatNostrService } from "@/lib/nostr/chat-service";

export type { ConnectionStatus } from "./useRelayConnection";

/**
 * Main World Chat hook that composes other specialized hooks
 */
export const useWorldChat = (chatTag: string = "world-chat") => {
  const [error, setError] = useState<string | null>(null);
  
  // Connection management
  const { 
    connectionStatus, 
    error: connectionError, 
    isReconnecting,
    reconnect
  } = useRelayConnection();
  
  // Profile management
  const [, { fetchProfile, getProfile, profiles }] = useChatProfile();
  
  // Message subscription management
  const { 
    messages, 
    loading, 
    isLoggedIn,
    setMessages 
  } = useMessageSubscription(connectionStatus, fetchProfile, chatTag);
  
  // Reaction management
  const { emojiReactions, addReaction } = useReactionHandler(connectionStatus, chatTag);
  
  // Message sending
  const { sendMessage } = useMessageSender(connectionStatus, setMessages, setError, chatTag);
  
  // Combine errors
  const combinedError = error || connectionError;

  return {
    // Connection state
    connectionStatus,
    reconnect,
    isReconnecting,
    
    // Content state
    messages,
    profiles,
    emojiReactions,
    loading,
    isLoggedIn,
    error: combinedError,
    
    // Actions
    sendMessage,
    addReaction,
  };
};
