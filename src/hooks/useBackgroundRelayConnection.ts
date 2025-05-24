import { useState, useEffect, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';
import { eventBus, EVENTS } from '@/lib/services/EventBus';

export interface BackgroundRelayState {
  isConnecting: boolean;
  isConnected: boolean;
  connectedCount: number;
  totalCount: number;
  error: string | null;
  readyForFeeds: boolean;
}

/**
 * Hook to manage background relay connections even when not logged in
 * This improves the user experience by connecting to relays and loading feeds
 * before the user decides to log in
 */
export function useBackgroundRelayConnection() {
  const [state, setState] = useState<BackgroundRelayState>({
    isConnecting: false,
    isConnected: false,
    connectedCount: 0,
    totalCount: 0,
    error: null,
    readyForFeeds: false,
  });

  // Update relay status
  const updateRelayStatus = useCallback(() => {
    const relays = nostrService.getRelayStatus();
    const connectedCount = relays.filter(r => r.status === 'connected').length;
    const totalCount = relays.length;
    const isConnected = connectedCount > 0;

    setState(prev => ({
      ...prev,
      connectedCount,
      totalCount,
      isConnected,
      readyForFeeds: isConnected,
      isConnecting: prev.isConnecting && !isConnected, // Stop showing connecting if we're connected
    }));
  }, []);

  // Connect to default relays in background
  const connectToRelays = useCallback(async () => {
    if (state.isConnecting || state.isConnected) return;

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Connect to default relays without requiring authentication
      const defaultRelays = [
        "wss://relay.damus.io",
        "wss://nos.lol", 
        "wss://relay.nostr.band",
        "wss://relay.snort.social"
      ];

      // Add default relays to get public content
      await nostrService.addMultipleRelays(defaultRelays);
      
      // Update status
      updateRelayStatus();
      
      console.log('[BackgroundRelay] Connected to default relays for public content');
    } catch (error) {
      console.error('[BackgroundRelay] Failed to connect to relays:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: 'Failed to connect to network' 
      }));
    }
  }, [state.isConnecting, state.isConnected, updateRelayStatus]);

  // Initialize background connection on mount
  useEffect(() => {
    // Start connecting to relays immediately
    connectToRelays();

    // Listen for relay connection events
    const handleRelayConnected = () => updateRelayStatus();
    const handleRelayDisconnected = () => updateRelayStatus();

    eventBus.on(EVENTS.RELAY_CONNECTED, handleRelayConnected);
    eventBus.on(EVENTS.RELAY_DISCONNECTED, handleRelayDisconnected);

    // Periodic status check
    const statusInterval = setInterval(updateRelayStatus, 10000);

    return () => {
      eventBus.off(EVENTS.RELAY_CONNECTED, handleRelayConnected);
      eventBus.off(EVENTS.RELAY_DISCONNECTED, handleRelayDisconnected);
      clearInterval(statusInterval);
    };
  }, [connectToRelays, updateRelayStatus]);

  return {
    ...state,
    reconnect: connectToRelays,
  };
} 