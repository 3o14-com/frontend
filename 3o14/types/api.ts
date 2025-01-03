export interface Account {
  id: string;
  username: string;
  display_name: string;
  avatar: string;
  acct?: string;
}

export interface Context {
  ancestors: Post[];
  descendants: Post[];
}

export interface StatusResponse {
  status: Post;
  context: Context;
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'gifv' | 'audio';
  url: string;
  preview_url: string;
  description: string | null;
}

export interface Poll {
  id: string;
  expires_at: string;
  expired: boolean;
  multiple: boolean;
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
}
