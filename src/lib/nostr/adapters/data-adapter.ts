import { BaseAdapter } from './base-adapter';
import { NostrEvent } from '@/lib/nostr';
import { Filter } from 'nostr-tools';

/**
 * Data Adapter - Handles general data operations
 */
export class DataAdapter extends BaseAdapter {

  constructor(service: any) {
    super(service);
  }

  // ===== PROFILE METHODS =====

  /**
   * Get user profile data
   */
  async getUserProfile(pubkey: string) {
    return this.service.getUserProfile(pubkey);
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: any): Promise<boolean> {
    try {
      await this.service.publishEvent({
        kind: 0,
        content: JSON.stringify(profileData),
        tags: []
      });
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  }

  // ===== FOLLOWER/FOLLOWING METHODS =====

  /**
   * Get user's following list
   */
  async getFollowing(pubkey: string): Promise<string[]> {
    try {
      const events = await this.service.queryEvents([{
        kinds: [3],
        authors: [pubkey],
        limit: 1
      }]);

      if (events.length > 0) {
        const contactEvent = events[0];
        return contactEvent.tags
          .filter((tag: any[]) => tag[0] === 'p')
          .map((tag: any[]) => tag[1])
          .filter(Boolean);
      }

      return [];
    } catch (error) {
      console.error("Error getting following list:", error);
      return [];
    }
  }

  /**
   * Follow a user
   */
  async followUser(pubkey: string): Promise<boolean> {
    try {
      const currentFollowing = await this.getFollowing(this.service.publicKey);
      if (currentFollowing.includes(pubkey)) {
        return true; // Already following
      }

      const tags = currentFollowing.map(pk => ['p', pk]);
      tags.push(['p', pubkey]);

      await this.service.publishEvent({
        kind: 3,
        content: '',
        tags
      });

      return true;
    } catch (error) {
      console.error("Error following user:", error);
      return false;
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(pubkey: string): Promise<boolean> {
    try {
      const currentFollowing = await this.getFollowing(this.service.publicKey);
      const filteredFollowing = currentFollowing.filter(pk => pk !== pubkey);

      const tags = filteredFollowing.map(pk => ['p', pk]);

      await this.service.publishEvent({
        kind: 3,
        content: '',
        tags
      });

      return true;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return false;
    }
  }

  // ===== DATA RETRIEVAL METHODS =====

  /**
   * Query events with filters
   */
  async queryEvents(filters: Filter[]): Promise<NostrEvent[]> {
    return this.service.queryEvents(filters);
  }

  /**
   * Get events by IDs
   */
  async getEventsByIds(ids: string[]): Promise<NostrEvent[]> {
    return this.service.getEvents(ids);
  }

  /**
   * Get specific event by ID
   */
  async getEvent(eventId: string): Promise<NostrEvent | null> {
    const events = await this.service.getEvents([eventId]);
    return events.length > 0 ? events[0] : null;
  }

  /**
   * Get events by author
   */
  async getEventsByAuthor(pubkey: string, limit?: number): Promise<NostrEvent[]> {
    return this.service.queryEvents([{
      authors: [pubkey],
      kinds: [1], // text notes
      limit: limit || 50
    }]);
  }
}
