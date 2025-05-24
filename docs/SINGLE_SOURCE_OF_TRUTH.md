# Single Source of Truth Architecture

## Overview

The Profile system in BlockNostr follows a strict **single source of truth** architecture to ensure data consistency, eliminate redundancy, and improve maintainability. All profile operations flow through a single data manager with clear layer responsibilities.

## Architecture Flow

```
ProfileDataService (Data Manager) 
    ↓
ProfileAdapter (Interface Layer)
    ↓  
useProfile Hook (State Management)
    ↓
Profile Component (UI Layer)
```

## Layer Responsibilities

### 1. ProfileDataService (Data Manager) - SINGLE SOURCE OF TRUTH

**Location**: `src/lib/services/ProfileDataService.ts`

**Responsibilities**:
- **All** profile data operations
- **All** nostr service interactions  
- **All** utility functions (npub/hex conversions)
- Cache management
- Event emissions
- Error handling
- Retry logic

**Key Methods**:
```typescript
// Main entry points
loadCompleteProfile(npub?: string, currentUserPubkey?: string): Promise<ProfileLoadResult>
refreshCompleteProfile(npub?: string, currentUserPubkey?: string): Promise<void>

// Utility functions (single source of truth)
convertNpubToHex(npub: string): string
convertHexToNpub(hexPubkey: string): string
parseProfileIdentifiers(npub?: string, currentUserPubkey?: string): ParsedIdentifiers

// Status and subscriptions
getLoadingStatus(pubkey: string): ProfileLoadingState | null
on(event: string, callback: Function): void
off(event: string, callback: Function): void
```

**Critical Rule**: NO other layer should directly call `nostrService` or perform data operations.

### 2. ProfileAdapter (Interface Layer)

**Location**: `src/lib/adapters/ProfileAdapter.ts`

**Responsibilities**:
- Thin interface between hook and data service
- **ONLY** calls ProfileDataService methods
- No direct service calls
- No data manipulation
- Simple pass-through operations

**Key Methods**:
```typescript
// All methods delegate to ProfileDataService
async loadProfile(npub?: string, currentUserPubkey?: string): Promise<ProfileLoadResult>
async refreshProfile(npub?: string, currentUserPubkey?: string): Promise<void>
convertNpubToHex(npub: string): string
convertHexToNpub(hexPubkey: string): string
subscribeToProfileUpdates(callback: Function): () => void
```

**Critical Rule**: Adapter must NEVER call `nostrService` or other services directly.

### 3. useProfile Hook (State Management)

**Location**: `src/hooks/useProfile.tsx`

**Responsibilities**:
- React state management
- Loading and error states
- Debug information tracking
- Effect handling
- **ONLY** calls ProfileAdapter methods

**State Management**:
```typescript
interface ProfileState {
  profile: ProfileMetadata | null;
  npub: string;
  pubkeyHex: string;
  isOwnProfile: boolean;
  loading: boolean;
  error: string | null;
  debugInfo: string[];
}
```

**Critical Rule**: Hook must NEVER call services directly, only through ProfileAdapter.

### 4. Profile Component (UI Layer)

**Location**: `src/pages/Profile.tsx`

**Responsibilities**:
- UI rendering only
- Uses useProfile hook for data
- Minimal direct service calls (only for utility functions when needed)
- User interaction handling

**Critical Rule**: Component should primarily use the hook, with exceptions only for utility functions from ProfileDataService.

## Data Flow Examples

### Loading a Profile

```typescript
// 1. Component calls hook
const [profileState, profileActions] = useProfile(npub);

// 2. Hook calls adapter
const result = await profileAdapter.loadProfile(npub, publicKey);

// 3. Adapter calls data service
return this.profileDataService.loadCompleteProfile(npub, currentUserPubkey);

// 4. Data service handles everything
const identifiers = this.parseProfileIdentifiers(npub, currentUserPubkey);
const profileData = await this.loadProfileData(npub, currentUserPubkey);
// ... processing and caching
```

### Converting npub to hex

```typescript
// ❌ WRONG - Multiple sources of truth
const hex1 = nostrService.getHexFromNpub(npub);        // Direct service call
const hex2 = profileAdapter.convertNpubToHex(npub);    // Through adapter
const hex3 = profileDataService.convertNpubToHex(npub); // Through data service

// ✅ CORRECT - Single source of truth
const hex = profileDataService.convertNpubToHex(npub); // Only this
```

## Benefits of Single Source of Truth

### 1. Data Consistency
- All profile operations use the same logic
- No duplicate implementations
- Centralized error handling

### 2. Maintainability  
- Changes only need to be made in one place
- Clear dependency chain
- Easier debugging

### 3. Performance
- Centralized caching
- Consistent optimization strategies
- Reduced redundant operations

### 4. Testing
- Single place to mock/stub data operations
- Easier to test edge cases
- Clearer test boundaries

## Implementation Guidelines

### DO ✅

1. **Always use ProfileDataService for data operations**
   ```typescript
   const result = await profileDataService.loadCompleteProfile(npub, userPubkey);
   ```

2. **Follow the layer hierarchy**
   ```typescript
   Component → Hook → Adapter → DataService
   ```

3. **Use proper interfaces**
   ```typescript
   const [state, actions] = useProfile(npub);
   ```

4. **Centralize utility functions**
   ```typescript
   const npub = profileDataService.convertHexToNpub(hex);
   ```

### DON'T ❌

1. **Never bypass the data service**
   ```typescript
   // ❌ Don't do this
   const hex = nostrService.getHexFromNpub(npub);
   ```

2. **Never duplicate data operations**
   ```typescript
   // ❌ Don't implement profile loading elsewhere
   const profile = await someOtherService.loadProfile();
   ```

3. **Never skip layers unnecessarily**
   ```typescript
   // ❌ Don't call data service directly from component
   const profile = await profileDataService.loadCompleteProfile();
   ```

## Migration Checklist

When implementing single source of truth:

- [ ] Move all data operations to ProfileDataService
- [ ] Remove direct service calls from other layers  
- [ ] Update interfaces to use data service methods
- [ ] Add comprehensive utility methods to data service
- [ ] Update documentation and type definitions
- [ ] Test all data flows
- [ ] Verify no duplicate implementations exist

## Monitoring and Debugging

The ProfileDataService includes comprehensive logging:

```typescript
// Debug information tracks data flow
addDebugInfo('Loading profile via ProfileDataService');
addDebugInfo('Profile loaded successfully');
addDebugInfo('Error: Failed to load profile');
```

Use the debug panel in development to monitor data flow and ensure all operations go through the single source of truth.

---

**Remember**: ProfileDataService is the ONLY place where profile data operations should occur. All other layers are interfaces to this single source of truth. 