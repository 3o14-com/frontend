import type { Post } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';

export type VisibilityType = 'public' | 'unlisted' | 'private' | 'direct';

export interface Visibility {
  type: VisibilityType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface ComposeToolbarProps {
  onPickImage: () => void;
  onToggleContentWarning: () => void;
  onSelectVisibility: () => void;
  onSubmit: () => void;
  showContentWarning: boolean;
  visibility: Visibility;
  isSubmitting: boolean;
  hasContent: boolean;
  mediaCount: number;
  theme: any;
}

export interface ComposeProps {
  initialContent?: string;
  onSubmit: () => void;
  onClose: () => void;
  replyToPost?: Post;
  isReply?: boolean;
}
