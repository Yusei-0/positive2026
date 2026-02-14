import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  public supabase: SupabaseClient;
  private _currentUser = new BehaviorSubject<User | null>(null);

  constructor() {
    this.supabase = createClient(
      environment.supabase_url,
      environment.supabase_anon
    );

    // Check initial session
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this._currentUser.next(session?.user ?? null);
    });

    // Listen to changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._currentUser.next(session?.user ?? null);
    });
  }

  get currentUser() {
    return this._currentUser.asObservable();
  }

  async signInWithOtp(email: string) {
    return this.supabase.auth.signInWithOtp({
      email,
    });
  }

  async verifyOtp(email: string, token: string) {
    return this.supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
  }

  async signOut() {
    const {
      data: { user },
    } = await this.getUser();
    if (user) {
      localStorage.removeItem(`profile_${user.id}`);
    }
    return this.supabase.auth.signOut();
  }

  async getDailyQuote(date: string) {
    // Select the quote for the specific date
    return this.supabase
      .from('daily_quotes')
      .select('*')
      .eq('date', date)
      .eq('date', date)
      .single();
  }

  async getProfile(userId: string) {
    // 1. Try Cache
    const cached = localStorage.getItem(`profile_${userId}`);
    if (cached) {
      return { data: JSON.parse(cached), error: null };
    }

    // 2. Fetch from DB
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // 3. Save to Cache if success
    if (data) {
      localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
    }

    return { data, error };
  }

  async updateProfile(profile: any) {
    const { data, error } = await this.supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();
    if (data) {
      // Update cache on mutation
      localStorage.setItem(`profile_${profile.id}`, JSON.stringify(data));
    }
    return { data, error };
  }

  async getUser() {
    // Return the BehaviorSubject value if available to avoid async call if possible,
    // but auth.getUser() verifies the token validity, so it's safer.
    // However, for pure UI display purposes, we can rely on session state or current user subject.
    const currentUser = this._currentUser.value;
    if (currentUser) {
      return { data: { user: currentUser }, error: null };
    }
    return this.supabase.auth.getUser();
  }

  async getCommunityQuotes(limit = 20, userId?: string) {
    const query = this.supabase
      .from('user_quotes')
      .select(
        `
        *,
        profiles (username)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data: quotes, error } = await query;

    if (error || !quotes) return { data: quotes, error };

    // If userId provided, fetch user's likes
    if (userId) {
      const { data: userLikes } = await this.supabase
        .from('likes')
        .select('quote_id')
        .eq('user_id', userId);

      const likedQuoteIds = new Set(userLikes?.map((l) => l.quote_id) || []);

      // Add liked status to quotes
      const quotesWithLikes = quotes.map((q) => ({
        ...q,
        liked_by_user: likedQuoteIds.has(q.id),
      }));

      return { data: quotesWithLikes, error: null };
    }

    return { data: quotes, error };
  }

  async createQuote(content: string, userId: string) {
    return this.supabase
      .from('user_quotes')
      .insert({
        quote: content,
        user_id: userId,
      })
      .select()
      .single();
  }

  async likeQuote(quoteId: string, userId: string) {
    return this.supabase.from('likes').insert({
      quote_id: quoteId,
      user_id: userId,
    });
  }

  async unlikeQuote(quoteId: string, userId: string) {
    return this.supabase
      .from('likes')
      .delete()
      .eq('quote_id', quoteId)
      .eq('user_id', userId);
  }

  async getUserQuotes(userId: string) {
    return this.supabase
      .from('user_quotes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  }

  async deleteQuote(quoteId: string) {
    return this.supabase.from('user_quotes').delete().eq('id', quoteId);
  }

  async reportQuote(quoteId: string, userId: string) {
    return this.supabase.from('reports').insert({
      quote_id: quoteId,
      user_id: userId,
    });
  }
  async getConfig(key: string) {
    return this.supabase
      .from('config')
      .select('value')
      .eq('key', key)
      .single();
  }
}
