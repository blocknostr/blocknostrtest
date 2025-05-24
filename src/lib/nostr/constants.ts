// Event kinds based on NIPs
export const EVENT_KINDS = {
  METADATA: 0,           // User metadata (NIP-01)
  TEXT_NOTE: 1,          // Short text note (NIP-01)
  RECOMMEND_RELAY: 2,    // Recommend relay (NIP-01)
  CONTACT_LIST: 3,       // Contact list (NIP-02)
  DM: 4,                 // Direct/private message (NIP-04)
  DELETE: 5,             // Deletion (NIP-09)
  REPOST: 6,             // Repost/quote (NIP-18)
  REACTION: 7,           // Reaction (NIP-25)
  POLL: 6001,            // Poll (Custom)
  ARTICLE: 30023,        // Long-form content (NIP-23)
  PROFILE_BADGES: 30008, // Profile badges (NIP-58)
  COMMUNITY_DEFINITION: 34550, // Community definition (NIP-72)
  COMMUNITY_POST: 1,     // Community post (same as text note)
  BADGE_AWARD: 8,        // Badge award (NIP-58)
  PUBLIC_CHAT_MESSAGE: 9 // Public chat message (Custom)
};

// Relay categories
export const RELAY_CATEGORIES = {
  READ: 'read',
  WRITE: 'write',
  BOTH: 'both'
};

// Default relay list
export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://nostr.wine',
  'wss://relay.nostr.info'
];

// Time constants
export const TIME_CONSTANTS = {
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000
};

// Rate limiting
export const RATE_LIMITS = {
  FOLLOW_REQUESTS_PER_MINUTE: 5,
  POSTS_PER_MINUTE: 10,
  REACTIONS_PER_MINUTE: 30
};
