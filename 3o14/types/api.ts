export interface Account {
  id: string;
  username: string;
  display_name: string;
  avatar: string;
  acct?: string;
  header: string;
  note: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  locked: boolean;
  bot: boolean;
  discoverable?: boolean;
  fields?: Array<{
    name: string;
    value: string;
    verified_at: string | null;
  }>;
  source?: {
    privacy: string;
    sensitive: boolean;
    language: string | null;
    note: string;
    fields: Array<{
      name: string;
      value: string;
      verified_at: string | null;
    }>;
  };
}

export interface Relationship {
  id: string;
  following: boolean;
  followed_by: boolean;
  requested: boolean;
  endorsed: boolean;
  blocking: boolean;
  muting: boolean;
  muting_notifications: boolean;
  domain_blocking: boolean;
  showing_reblogs: boolean;
  notifying: boolean;
  note: string;
  languages: string[] | null;
}

export interface Context {
  ancestors: Post[];
  descendants: Post[];
}

export interface StatusResponse {
  status: Post;
  context: Context;
}

export interface ProfileResponse {
  account: Account;
  posts: Post[];
  maxId: string | null;
}

export interface FollowersResponse {
  accounts: Account[];
  next_page?: string;
}

export interface FollowingResponse {
  accounts: Account[];
  next_page?: string;
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'gifv' | 'audio';
  url: string;
  preview_url: string;
  meta: Record<string, any>;
}

export interface Poll {
  id: string;
  expires_at: string;
  expired: boolean;
  multiple: boolean;
  voted: boolean;
  votes_count: number;
  options: { title: string; votes_count: number }[];
}

export interface Post {
  id: string;
  content: string;
  created_at: string;
  account: Account;
  media_attachments: MediaAttachment[];
  poll?: Poll;
  reblogs_count: number;
  favourites_count: number;
  replies?: Post[];
  replies_count: number;
  reblog?: Post;
  favourited?: boolean;
  reblogged?: boolean;
  visibility: 'public' | 'private' | 'unlisted' | 'direct';
  in_reply_to_id: string | null;
  in_reply_to_account_id: string | null;
  mentions: Mention[];
}

interface Mention {
  id: string;
  username: string;
  url: string;
  acct: string;
}

export interface Visibility {
  type: 'public' | 'unlisted' | 'private' | 'direct';
  label: string;
  icon: 'globe' | 'lock-closed' | 'mail' | 'people';
}

export interface CreatePostParams {
  status: string;
  in_reply_to_id?: string;
  media_ids?: string[];
  poll?: null;
  sensitive?: boolean;
  spoiler_text?: string;
  visibility?: 'public' | 'unlisted' | 'private' | 'direct';
  language?: string;
}

export interface MediaUploadResponse {
  id: string;
  type: 'image' | 'video' | 'gifv' | 'audio';
  url: string;
  preview_url: string;
  description: string | null;
}

export interface UpdateProfileParams {
  display_name?: string;
  note?: string;
  avatar?: string;
  header?: string;
  locked?: boolean;
  bot?: boolean;
  discoverable?: boolean;
  fields_attributes?: Array<{
    name: string;
    value: string;
  }>;
}

export interface UpdateProfileResponse {
  id: string;
  username: string;
  display_name: string;
  note: string;
  avatar: string;
  header: string;
  locked: boolean;
  bot: boolean;
  discoverable: boolean;
  created_at: string;
  followers_count: number;
  following_count: number;
  statuses_count: number;
  fields: Array<{
    name: string;
    value: string;
    verified_at: string | null;
  }>;
}

export interface Notification {
  id: string;
  type: 'mention' | 'reblog' | 'favourite' | 'follow' | 'poll' | 'follow_request';
  created_at: string;
  account: Account;
  status?: Post;
}

export interface NotificationsResponse {
  notifications: Notification[];
  max_id?: string;
  min_id?: string;
}
