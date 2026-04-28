export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface DailyQuote {
  id: string;
  quote: string;
  author?: string;
  date: string;
  category?: string;
}

export interface UserQuote {
  id: string;
  user_id: string;
  quote: string;
  likes_count: number;
  created_at: string;
  is_public: boolean;

  // Optional fields for UI/Joins
  author_name?: string; // To display who posted it without full profile fetch if flattened
  profile?: Profile; // For joined profile data
  liked_by_me?: boolean; // For UI state
}

export interface Like {
  id: string;
  user_id: string;
  quote_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  quote_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Pick<Profile, 'username' | 'avatar_url'>;
  is_owner?: boolean;
}

export interface FeedItem {
  id: string;
  quote: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
  created_at: string;
  is_owner: boolean;
  score: number;
}
