
import React, { memo } from 'react';
import { NostrEvent } from '@/lib/nostr';
import NewNoteCard from './NewNoteCard';

export interface NoteCardProps {
  event: NostrEvent;
  profileData?: any;
  isExpanded?: boolean;
  repostData?: {
    reposterPubkey: string;
    reposterProfile?: any;
  };
}

const MemoizedNoteCard = memo(function MemoizedNoteCard(props: NoteCardProps) {
  return <NewNoteCard {...props} />;
});

export default MemoizedNoteCard;
