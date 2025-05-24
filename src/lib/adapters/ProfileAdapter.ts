import { ProfileDataService, ProfileLoadResult } from '@/lib/services/ProfileDataService';
import { ProfileData } from '@/lib/services/profile/types';
import { verifyNip05, isValidNip05Format, fetchNip05Data, discoverNip05Relays } from '@/lib/nostr/utils/nip/nip05';
import { nostrService } from "@/lib/nostr";
import { getNpubFromHex, getHexFromNpub } from '@/lib/nostr';

export interface ProfileMetadata {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  nip05?: string;
  lud16?: string;
  website?: string;
  created_at?: number;
}

/**
 * ProfileAdapter - Interfaces between Profile components and data services
 * Following the data manager > adapter > hook > component pattern
 * 
 * The adapter ONLY calls the ProfileDataService (single source of truth)
 * Enhanced with full NIP-05 compliance functionality
 */
export class ProfileAdapter {
  private profileDataService: ProfileDataService;

  constructor() {
    this.profileDataService = ProfileDataService.getInstance();
  }

  /**
   * Load profile data by npub or current user
   * All operations go through ProfileDataService (single source of truth)
   * @param npub - Optional npub string, if not provided loads current user
   * @param currentUserPubkey - Current authenticated user's public key
   * @returns Promise<ProfileLoadResult>
   */
  async loadProfile(npub?: string, currentUserPubkey?: string): Promise<ProfileLoadResult> {
    return this.profileDataService.loadCompleteProfile(npub, currentUserPubkey);
  }

  /**
   * Refresh profile data (no-op)
   * @deprecated handled via loadProfile or subscriptions
   */
  async refreshProfile(npub?: string, currentUserPubkey?: string): Promise<void> {
    // refreshProfile is deprecated; use loadProfile or automatic subscriptions
  }

  /**
   * Get loading status for a profile
   * @param pubkey - Public key to check loading status for
   */
  getLoadingStatus(pubkey: string) {
    return this.profileDataService.getLoadingStatus(pubkey);
  }

  /**
   * Convert npub to hex pubkey
   * @param npub - npub string
   */
  convertNpubToHex(npub: string): string {
    return getHexFromNpub(npub);
  }

  /**
   * Convert hex pubkey to npub
   * @param hexPubkey - hex pubkey string
   */
  convertHexToNpub(hexPubkey: string): string {
    return getNpubFromHex(hexPubkey);
  }

  /**
   * Subscribe to profile data changes
   * @param callback - Callback function to handle profile updates
   * @returns Cleanup function
   */
  subscribeToProfileUpdates(callback: (pubkey: string, profileData: ProfileData) => void): () => void {
    this.profileDataService.on('profile-data-changed', callback);
    
    return () => {
      this.profileDataService.off('profile-data-changed', callback);
    };
  }

  /**
   * Subscribe to loading state changes
   * @param callback - Callback function to handle loading state updates
   * @returns Cleanup function
   */
  subscribeToLoadingStateChanges(callback: (pubkey: string, loadingState: any) => void): () => void {
    this.profileDataService.on('loading-state-changed', callback);
    
    return () => {
      this.profileDataService.off('loading-state-changed', callback);
    };
  }

  // ============================================================================
  // NIP-05 COMPLIANCE METHODS
  // ============================================================================

  /**
   * Validate if a string is a valid NIP-05 identifier format
   * @param nip05Id - The identifier to validate (e.g., "user@domain.com")
   * @returns True if the format is valid
   */
  isValidNip05Format(nip05Id: string): boolean {
    return isValidNip05Format(nip05Id);
  }

  /**
   * Verify if a NIP-05 identifier resolves to the expected pubkey
   * @param nip05Id - NIP-05 identifier (e.g., "alice@example.com")
   * @param pubkey - Public key to verify (hex or npub format)
   * @returns Promise<boolean> - True if verified successfully
   */
  async verifyNip05(nip05Id: string, pubkey: string): Promise<boolean> {
    return verifyNip05(nip05Id, pubkey);
  }

  /**
   * Verify a profile's NIP-05 identifier against their public key
   * @param profile - Profile metadata containing nip05 field
   * @param pubkey - Public key to verify against
   * @returns Promise<boolean> - True if the profile's NIP-05 is verified
   */
  async verifyProfileNip05(profile: ProfileMetadata, pubkey: string): Promise<boolean> {
    if (!profile.nip05) {
      return false; // No NIP-05 identifier to verify
    }

    return this.verifyNip05(profile.nip05, pubkey);
  }

  /**
   * Fetch complete NIP-05 data for an identifier
   * @param nip05Id - NIP-05 identifier (e.g., "alice@example.com")
   * @returns Promise with pubkey, relays, and domain info or null if invalid
   */
  async fetchNip05Data(nip05Id: string) {
    return fetchNip05Data(nip05Id);
  }

  /**
   * Discover relays for a user based on their NIP-05 identifier
   * @param nip05Id - NIP-05 identifier (e.g., "alice@example.com")
   * @returns Promise<string[]> - Array of relay URLs
   */
  async discoverNip05Relays(nip05Id: string): Promise<string[]> {
    return discoverNip05Relays(nip05Id);
  }

  /**
   * Load a profile by NIP-05 identifier instead of npub
   * This method looks up the pubkey from the NIP-05 identifier first
   * @param nip05Id - NIP-05 identifier (e.g., "alice@example.com")
   * @param currentUserPubkey - Current authenticated user's public key
   * @returns Promise<ProfileLoadResult>
   */
  async loadProfileByNip05(nip05Id: string, currentUserPubkey?: string): Promise<ProfileLoadResult> {
    try {
      // First validate the NIP-05 format
      if (!this.isValidNip05Format(nip05Id)) {
        return {
          profile: null,
          npub: '',
          pubkeyHex: '',
          isOwnProfile: false,
          error: 'Invalid NIP-05 identifier format'
        };
      }

      // Fetch the NIP-05 data to get the pubkey
      const nip05Data = await this.fetchNip05Data(nip05Id);
      if (!nip05Data) {
        return {
          profile: null,
          npub: '',
          pubkeyHex: '',
          isOwnProfile: false,
          error: 'Failed to resolve NIP-05 identifier'
        };
      }

      // Convert pubkey to npub format for loading
      const npub = this.convertHexToNpub(nip05Data.pubkey);
      
      // Load the profile using the resolved pubkey
      const result = await this.loadProfile(npub, currentUserPubkey);
      
      // Verify the NIP-05 if the profile loaded successfully
      if (result.profile && result.profile.nip05) {
        const isVerified = await this.verifyNip05(result.profile.nip05, nip05Data.pubkey);
        if (!isVerified) {
          console.warn(`NIP-05 verification failed for ${nip05Id}`);
        }
      }

      return result;
    } catch (error: any) {
      console.error(`Error loading profile by NIP-05 ${nip05Id}:`, error);
      return {
        profile: null,
        npub: '',
        pubkeyHex: '',
        isOwnProfile: false,
        error: error.message || 'Failed to load profile by NIP-05'
      };
    }
  }

  /**
   * Enhanced profile verification that includes NIP-05 verification
   * @param profile - Profile metadata to verify
   * @param pubkey - Public key to verify against
   * @returns Promise with verification results
   */
  async getProfileVerificationStatus(profile: ProfileMetadata, pubkey: string): Promise<{
    hasNip05: boolean;
    isNip05Valid: boolean;
    isNip05Verified: boolean;
    nip05Domain?: string;
    nip05Name?: string;
  }> {
    const hasNip05 = !!profile.nip05;
    
    if (!hasNip05) {
      return {
        hasNip05: false,
        isNip05Valid: false,
        isNip05Verified: false
      };
    }

    const isNip05Valid = this.isValidNip05Format(profile.nip05!);
    
    if (!isNip05Valid) {
      return {
        hasNip05: true,
        isNip05Valid: false,
        isNip05Verified: false
      };
    }

    const isNip05Verified = await this.verifyNip05(profile.nip05!, pubkey);
    
    // Extract domain and name from NIP-05 identifier
    const [nip05Name, nip05Domain] = profile.nip05!.split('@');

    return {
      hasNip05: true,
      isNip05Valid: true,
      isNip05Verified,
      nip05Domain,
      nip05Name
    };
  }
}

// Export a singleton instance
export const profileAdapter = new ProfileAdapter();