import { SimplePool } from 'nostr-tools';
import { Relay } from '../types';
import { RelayInfoService } from './relay-info-service';
import { RelayPerformanceTracker, relayPerformanceTracker } from './performance/relay-performance-tracker';
import { RelaySelector, relaySelector } from './selection/relay-selector';
import { CircuitBreaker, circuitBreaker, CircuitState } from './circuit/circuit-breaker';
import { RelayDiscoverer } from './discovery/relay-discoverer';

/**
 * Unified RelayManager that incorporates all relay functionality:
 * - Connection management (absorbed from ConnectionManager)
 * - Health monitoring (absorbed from HealthManager) 
 * - Performance tracking and smart selection
 * - Circuit breaker patterns
 * - Relay discovery
 */
export class RelayManager {
  private pool: SimplePool;
  private _userRelays: Map<string, boolean> = new Map(); // Map<relayURL, readWrite>
  private defaultRelays: string[] = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://nostr.bitcoiner.social',
    'wss://relay.nostr.band'
  ];
  private relayInfoService: RelayInfoService;
  private relayDiscoverer: RelayDiscoverer;
  private performanceTracker: RelayPerformanceTracker = relayPerformanceTracker;
  private discoveryRunning: boolean = false;
  
  // Connection management properties (absorbed from ConnectionManager)
  private relays: Map<string, WebSocket> = new Map();
  private connectionStatus: Map<string, { connected: boolean, lastAttempt: number, failures: number }> = new Map();
  private reconnectTimers: Map<string, number> = new Map();
  
  // Health management properties (absorbed from HealthManager)
  private healthCheckInterval: number | null = null;
  
  constructor(pool: SimplePool) {
    this.pool = pool;
    this.loadUserRelays();
    this.relayInfoService = new RelayInfoService(this.pool);
    this.relayDiscoverer = new RelayDiscoverer(this.pool);
    
    // Start monitoring relay health (absorbed from HealthManager)
    this.startHealthCheck();
    
    // Schedule periodic relay performance investigations
    setTimeout(() => this.investigateRelayPerformance(), 10000); // Start after 10s
  }
  
  get userRelays(): Map<string, boolean> {
    return new Map(this._userRelays);
  }
  
  /**
   * Load user relays from local storage
   */
  loadUserRelays(): void {
    const savedRelays = localStorage.getItem('nostr_user_relays');
    if (savedRelays) {
      try {
        const relaysObject = JSON.parse(savedRelays);
        this._userRelays = new Map(Object.entries(relaysObject));
      } catch (e) {
        console.error('Error loading user relays:', e);
      }
    } else {
      // Default to the app's default relays
      this.defaultRelays.forEach(relay => {
        this._userRelays.set(relay, true); // Read/write by default
      });
    }
  }
  
  /**
   * Save user relays to local storage
   */
  saveUserRelays(): void {
    const relaysObject = Object.fromEntries(this._userRelays);
    localStorage.setItem('nostr_user_relays', JSON.stringify(relaysObject));
  }
  
  /**
   * Connect to a specific relay with enhanced error handling and performance tracking
   * @param relayUrl URL of the relay
   * @param retryCount Number of retry attempts
   * @returns Promise resolving to boolean indicating connection success
   */
  async connectToRelay(relayUrl: string, retryCount: number = 0): Promise<boolean> {
    // Check circuit breaker first
    if (!circuitBreaker.isAllowed(relayUrl)) {
      console.log(`Circuit breaker preventing connection to ${relayUrl}`);
      return false;
    }
    
    // Check if already connected
    if (this.relays.has(relayUrl) && this.relays.get(relayUrl)?.readyState === WebSocket.OPEN) {
      return true; // Already connected
    }
    
    // Track connection attempt
    if (!this.connectionStatus.has(relayUrl)) {
      this.connectionStatus.set(relayUrl, { connected: false, lastAttempt: Date.now(), failures: 0 });
    }
    
    const status = this.connectionStatus.get(relayUrl)!;
    status.lastAttempt = Date.now();
    
    // Clear any existing reconnect timer
    if (this.reconnectTimers.has(relayUrl)) {
      window.clearTimeout(this.reconnectTimers.get(relayUrl));
      this.reconnectTimers.delete(relayUrl);
    }
    
    const startTime = performance.now();
    try {
      const socket = new WebSocket(relayUrl);
      
      return new Promise((resolve) => {
        socket.onopen = () => {
          this.relays.set(relayUrl, socket);
          status.connected = true;
          status.failures = 0;
          
          const duration = performance.now() - startTime;
          
          // Record successful connection
          this.performanceTracker.trackResponseTime(relayUrl, 'connect', duration);
          circuitBreaker.recordSuccess(relayUrl);
          
          // Fetch relay information if we don't have it yet
          this.fetchRelayInfo(relayUrl).catch(err => 
            console.warn(`Failed to fetch relay info for ${relayUrl}:`, err)
          );
          
          resolve(true);
        };
        
        socket.onerror = () => {
          status.failures++;
          
          // Record failed connection
          this.performanceTracker.recordFailure(relayUrl, 'connect', 'Connection failed');
          circuitBreaker.recordFailure(relayUrl);
          
          resolve(false);
        };
        
        socket.onclose = () => {
          status.connected = false;
          this.relays.delete(relayUrl);
          
          // Exponential backoff for reconnection (max ~1 minute)
          if (retryCount < 6) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 60000);
            const timerId = window.setTimeout(() => {
              this.connectToRelay(relayUrl, retryCount + 1);
            }, delay);
            this.reconnectTimers.set(relayUrl, timerId);
          }
        };
        
        socket.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            // Handle different types of messages from the relay
            // Event handling happens in the NostrService class
          } catch (e) {
            console.error('Error parsing relay message:', e);
          }
        };
        
        // Set timeout for connection
        setTimeout(() => {
          if (socket.readyState !== WebSocket.OPEN) {
            socket.close();
            
            // Record connection timeout
            this.performanceTracker.recordFailure(relayUrl, 'connect', 'Connection timeout');
            circuitBreaker.recordFailure(relayUrl);
            
            resolve(false);
          }
        }, 5000);
      });
    } catch (error) {
      console.error(`Failed to connect to relay ${relayUrl}:`, error);
      status.failures++;
      
      // Record connection error
      this.performanceTracker.recordFailure(relayUrl, 'connect', String(error));
      circuitBreaker.recordFailure(relayUrl);
      
      return false;
    }
  }
  
  /**
   * Fetch relay information using NIP-11
   * @param relayUrl URL of the relay
   */
  private async fetchRelayInfo(relayUrl: string): Promise<void> {
    try {
      const info = await this.relayInfoService.getRelayInfo(relayUrl);
      if (info?.supported_nips) {
        this.performanceTracker.updateSupportedNips(relayUrl, info.supported_nips);
      }
    } catch (error) {
      console.warn(`Failed to fetch relay info for ${relayUrl}:`, error);
    }
  }
  
  /**
   * Connect to the default relays with smart selection
   * @returns Promise resolving when connection attempts complete
   */
  async connectToDefaultRelays(): Promise<void> {
    const selectedRelays = relaySelector.selectBestRelays(this.defaultRelays, {
      operation: 'both',
      count: this.defaultRelays.length
    });
    
    return this.connectToRelays(selectedRelays);
  }
  
  /**
   * Connect to all user relays with enhanced selection
   * @returns Promise resolving when connection attempts complete
   */
  async connectToUserRelays(): Promise<void> {
    const userRelayUrls = Array.from(this._userRelays.keys());
    
    // If we have few relays, add some defaults
    if (userRelayUrls.length < 3) {
      this.defaultRelays.forEach(relay => {
        if (!this._userRelays.has(relay)) {
          userRelayUrls.push(relay);
        }
      });
    }
    
    // Use the selector to prioritize which relays to connect to
    const selectedRelays = relaySelector.selectBestRelays(userRelayUrls, {
      operation: 'both',
      count: Math.min(userRelayUrls.length, 5) // Limit to 5 connections
    });
    
    // Start discovery process in background if not already running
    this.startBackgroundDiscovery();
    
    return this.connectToRelays(selectedRelays);
  }
  
  /**
   * Add a new relay to the user's relay list with enhanced validation and testing
   * @param relayUrl URL of the relay to add
   * @param readWrite Whether the relay should be read/write or read-only
   * @returns Promise resolving to boolean indicating success
   */
  async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    // Validate URL format
    try {
      new URL(relayUrl);
    } catch (e) {
      return false;
    }
    
    // Test the relay before adding
    const startTime = performance.now();
    const connected = await this.connectToRelay(relayUrl);
    const duration = performance.now() - startTime;
    
    if (connected) {
      // Record successful connection
      this.performanceTracker.trackResponseTime(relayUrl, 'connect', duration);
      circuitBreaker.recordSuccess(relayUrl);
      
      // Add to user relays
      this._userRelays.set(relayUrl, readWrite);
      this.saveUserRelays();
      
      // Health is automatically monitored through the built-in health check
      
      // Fetch relay information
      this.fetchRelayInfo(relayUrl).catch(err => 
        console.warn(`Failed to fetch relay info for ${relayUrl}:`, err)
      );
      
      // Add to discovered relays
      this.relayDiscoverer.addDiscoveredRelay(relayUrl, 'manual');
      
      return true;
    } else {
      // Record failed connection
      this.performanceTracker.recordFailure(relayUrl, 'connect', 'Failed to connect');
      circuitBreaker.recordFailure(relayUrl);
      return false;
    }
  }
  
  /**
   * Remove a relay from the user's relay list
   * @param relayUrl URL of the relay to remove
   */
  removeRelay(relayUrl: string): void {
    this._userRelays.delete(relayUrl);
    this.saveUserRelays();
    
    // Disconnect
    this.disconnect(relayUrl);
  }
  
  /**
   * Get status of all relays with performance data
   * @returns Array of Relay objects with status information
   */
  getRelayStatus(): Relay[] {
    // First get all relays from userRelays
    const relayMap = new Map<string, Relay>();
    
    // Add all user relays first (even if not connected)
    Array.from(this._userRelays.keys()).forEach(url => {
      const isConnected = this.isConnected(url);
      const circuitState = circuitBreaker.getState(url);
      const performance = this.performanceTracker.getRelayPerformance(url);
      
      relayMap.set(url, {
        url,
        status: isConnected ? 'connected' : 
               (circuitState === CircuitState.OPEN ? 'failed' : 'disconnected'),
        read: true,
        write: !!this._userRelays.get(url),
        score: performance?.score,
        avgResponse: performance?.avgResponseTime
      });
    });
    
    // Add any connected relays that might not be in userRelays
    const connectedRelays = this.getConnectedRelayUrls();
    connectedRelays.forEach(url => {
      if (!relayMap.has(url)) {
        const performance = this.performanceTracker.getRelayPerformance(url);
        
        relayMap.set(url, {
          url,
          status: 'connected',
          read: true,
          write: true,
          score: performance?.score,
          avgResponse: performance?.avgResponseTime
        });
      }
    });
    
    return Array.from(relayMap.values());
  }
  
  /**
   * Add multiple relays at once with smart selection and performance tracking
   * @param relayUrls Array of relay URLs to add
   * @returns Promise resolving to number of successfully added relays
   */
  async addMultipleRelays(relayUrls: string[]): Promise<number> {
    if (!relayUrls.length) return 0;
    
    // Filter out already added relays
    const newRelays = relayUrls.filter(url => !this._userRelays.has(url));
    if (newRelays.length === 0) return 0;
    
    // Filter out relays with open circuit breakers
    const availableRelays = newRelays.filter(url => {
      const state = circuitBreaker.getState(url);
      return state !== CircuitState.OPEN;
    });
    
    let successCount = 0;
    
    // Try connecting to each relay
    for (const url of availableRelays) {
      try {
        const success = await this.addRelay(url);
        if (success) {
          successCount++;
          // Add successful relay to the discoverer
          this.relayDiscoverer.addDiscoveredRelay(url, 'manual');
        }
      } catch (error) {
        console.error(`Failed to add relay ${url}:`, error);
      }
      
      // Small delay between connection attempts to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return successCount;
  }
  
  /**
   * Set user relays map (used when loading from NIP-65)
   * @param relays Map of relay URLs to read/write status
   */
  setUserRelays(relays: Map<string, boolean>): void {
    this._userRelays = relays;
    this.saveUserRelays();
    
    // Connect to these relays
    this.connectToUserRelays();
  }
  
  /**
   * Pick best relays for a specific operation using smart selection
   * @param operation 'read' or 'write' operation
   * @param count Number of relays to pick
   * @returns Array of relay URLs
   */
  pickBestRelays(operation: 'read' | 'write', count: number = 3): string[] {
    const relayUrls = this.getRelayStatus()
      .filter(relay => relay.status === 'connected')
      .map(relay => relay.url);
    
    return relaySelector.selectBestRelays(relayUrls, {
      operation,
      count,
      requireWriteSupport: operation === 'write',
      minScore: 30
    });
  }
  
  /**
   * Get information about a relay using NIP-11
   * @param relayUrl URL of the relay
   * @returns Promise resolving to relay information or null
   */
  async getRelayInformation(relayUrl: string): Promise<any | null> {
    const info = await this.relayInfoService.getRelayInfo(relayUrl);
    
    // If successful, update performance tracker with NIP support info
    if (info?.supported_nips) {
      this.performanceTracker.updateSupportedNips(relayUrl, info.supported_nips);
    }
    
    return info;
  }
  
  /**
   * Check if a relay supports a specific NIP
   * @param relayUrl URL of the relay
   * @param nipNumber NIP number to check
   * @returns Promise resolving to boolean indicating support
   */
  async doesRelaySupport(relayUrl: string, nipNumber: number): Promise<boolean> {
    return this.relayInfoService.supportsNIP(relayUrl, nipNumber);
  }
  
  /**
   * Get relay limitations based on NIP-11
   * @param relayUrl URL of the relay
   * @returns Promise resolving to relay limitations
   */
  async getRelayLimitations(relayUrl: string): Promise<any | null> {
    return this.relayInfoService.getRelayLimitations(relayUrl);
  }
  
  /**
   * Start background relay discovery if not already running
   */
  private async startBackgroundDiscovery(): Promise<void> {
    if (this.discoveryRunning) return;
    
    this.discoveryRunning = true;
    try {
              // Try to discover new relays from existing connections
        const connectedRelays = this.getConnectedRelayUrls();
      if (connectedRelays.length > 0) {
        console.log('Starting background relay discovery...');
        
        // Find following list to check their relays
        // This is a simplified approach - in a real app you'd want to check the current user's following list
        const pubkeys: string[] = [];
        // This could be populated from profiles the user has interacted with
        
        if (pubkeys.length > 0) {
          const discoveries = await this.relayDiscoverer.discoverFromContacts(pubkeys);
          console.log(`Discovered ${discoveries.length} new relays from contacts`);
          
          // Test some of the new discoveries
          const relaysToTest = this.relayDiscoverer.getBestRelaysToTry(3, connectedRelays);
          for (const url of relaysToTest) {
            this.relayDiscoverer.testRelay(url).catch(err => {
              console.warn(`Error testing relay ${url}:`, err);
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in background relay discovery:', error);
    } finally {
      this.discoveryRunning = false;
      
      // Schedule next discovery after some time
      setTimeout(() => {
        this.discoveryRunning = false;
      }, 300000); // 5 minutes
    }
  }
  
  /**
   * Investigate relay performance periodically
   */
  private async investigateRelayPerformance(): Promise<void> {
    try {
      const relayStatus = this.getRelayStatus();
      
      // Check if we have enough connected relays
      const connectedRelays = relayStatus.filter(r => r.status === 'connected');
      if (connectedRelays.length < 2) {
        console.log('Not enough connected relays, trying discovery...');
        
        // Try to add some new relays from discovered ones
        const discoveredRelays = this.relayDiscoverer.getDiscoveredRelays();
        const relaysToTry = this.relayDiscoverer.getBestRelaysToTry(
          3, 
          relayStatus.map(r => r.url)
        );
        
        if (relaysToTry.length > 0) {
          console.log(`Trying ${relaysToTry.length} new relays from discoveries...`);
          await this.addMultipleRelays(relaysToTry);
        }
      }
      
      // Schedule next investigation
      setTimeout(() => this.investigateRelayPerformance(), 60000); // Check every minute
    } catch (error) {
      console.error('Error investigating relay performance:', error);
      // Still schedule next investigation
      setTimeout(() => this.investigateRelayPerformance(), 60000);
    }
  }
  
  /**
   * Clean up when manager is destroyed
   */
  cleanup(): void {
    // Clean up health checks
    this.stopHealthCheck();
    
    // Clean up all connections
    this.cleanupConnections();
  }
  
  // ============================================================================
  // CONNECTION MANAGEMENT METHODS (absorbed from ConnectionManager)
  // ============================================================================

  /**
   * Connect to multiple relays at once
   * @param relayUrls Array of relay URLs to connect to
   * @returns Promise resolving when all connection attempts complete
   */
  async connectToRelays(relayUrls: string[]): Promise<void> {
    const promises = relayUrls.map(url => this.connectToRelay(url));
    await Promise.all(promises);
  }

  /**
   * Get the websocket for a connected relay
   * @param relayUrl URL of the relay
   * @returns WebSocket instance or undefined if not connected
   */
  getRelaySocket(relayUrl: string): WebSocket | undefined {
    return this.relays.get(relayUrl);
  }

  /**
   * Get URLs of all connected relays
   * @returns Array of connected relay URLs
   */
  getConnectedRelayUrls(): string[] {
    return Array.from(this.relays.keys())
      .filter(url => this.relays.get(url)?.readyState === WebSocket.OPEN);
  }

  /**
   * Check if a relay is connected
   * @param relayUrl URL of the relay
   * @returns Boolean indicating if relay is connected
   */
  isConnected(relayUrl: string): boolean {
    return this.relays.has(relayUrl) && 
           this.relays.get(relayUrl)?.readyState === WebSocket.OPEN;
  }

  /**
   * Disconnect from a relay
   * @param relayUrl URL of the relay to disconnect from
   */
  disconnect(relayUrl: string): void {
    const socket = this.relays.get(relayUrl);
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      socket.close();
      this.relays.delete(relayUrl);
    }
    
    // Clear any reconnect timer
    if (this.reconnectTimers.has(relayUrl)) {
      window.clearTimeout(this.reconnectTimers.get(relayUrl));
      this.reconnectTimers.delete(relayUrl);
    }
  }

  /**
   * Clean up all connections and timers
   */
  cleanupConnections(): void {
    // Close all open connections
    this.relays.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    });
    
    this.relays.clear();
    
    // Clear all reconnect timers
    this.reconnectTimers.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    
    this.reconnectTimers.clear();
  }

  // ============================================================================
  // HEALTH MANAGEMENT METHODS (absorbed from HealthManager)
  // ============================================================================

  /**
   * Start periodic health checks of relay connections
   * @param interval Interval in milliseconds between checks
   */
  startHealthCheck(interval: number = 30000): void {
    if (this.healthCheckInterval !== null) {
      window.clearInterval(this.healthCheckInterval);
    }
    
    // Check relay health periodically
    this.healthCheckInterval = window.setInterval(() => {
      this.performHealthCheck();
    }, interval);
  }

  /**
   * Perform a health check on all user relays
   */
  async performHealthCheck(): Promise<void> {
    // Check all user relays
    for (const relayUrl of this._userRelays.keys()) {
      if (!this.isConnected(relayUrl)) {
        this.connectToRelay(relayUrl);
      }
    }
  }

  /**
   * Stop health checks and clean up
   */
  stopHealthCheck(): void {
    if (this.healthCheckInterval !== null) {
      window.clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}
