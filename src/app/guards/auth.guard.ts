import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    // Check if user is authenticated (using session check from service)
    return from(this.supabaseService.getUser()).pipe(
      map(({ data: { user } }) => {
        if (user) {
          // User is authenticated -> Redirect to HOME (Feed)
          return this.router.createUrlTree(['/home']);
        } else {
          // User is NOT authenticated -> Redirect to LOGIN
          return this.router.createUrlTree(['/login']);
        }
      })
    );
  }
}
