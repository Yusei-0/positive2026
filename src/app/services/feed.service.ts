import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { FeedItem } from '../models/app.models';

@Injectable({
  providedIn: 'root',
})
export class FeedService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Obtiene el feed inteligente con paginación
   * @param userId ID del usuario logueado
   * @param page Número de página (0-indexed)
   * @param pageSize Cantidad de items por página
   * @param seed Semilla para orden aleatorio (opcional, usa fecha si no se provee)
   */
  async getSmartFeed(
    userId: string,
    page: number = 0,
    pageSize: number = 20,
    seed?: string
  ): Promise<{ data: FeedItem[] | null; error: any }> {
    try {
      // Si no hay seed, usar fecha actual (YYYY-MM-DD)
      const finalSeed = seed || new Date().toISOString().split('T')[0];

      // Calcular offset para paginación
      const offset = page * pageSize;

      // Llamar a la función RPC de Supabase
      const { data, error } = await this.supabaseService.supabase.rpc(
        'get_smart_feed',
        {
          p_user_id: userId,
          p_limit: pageSize,
          p_offset: offset,
          p_seed: finalSeed,
        }
      );

      if (error) {
        console.error('Feed error:', error);
        return { data: null, error };
      }

      return { data: data as FeedItem[], error: null };
    } catch (e) {
      console.error('Feed service error:', e);
      return { data: null, error: e };
    }
  }

  /**
   * Genera un seed aleatorio para "mezclar" el feed
   */
  getShuffleSeed(): string {
    return `shuffle-${Date.now()}`;
  }

  /**
   * Genera un seed basado en la fecha actual
   */
  getDailySeed(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Genera un seed personalizado por usuario y fecha
   */
  getUserDailySeed(userId: string): string {
    const date = new Date().toISOString().split('T')[0];
    return `${userId}-${date}`;
  }
}
