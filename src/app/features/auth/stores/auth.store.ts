import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import { computed, inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { firstValueFrom } from "rxjs";
import { LocalStorageService } from "../../../core/services/storage.service";
import { IPermissionAuth, IUserAuth } from "../models/auth.model";

type AuthState = {
  user: IUserAuth | null;
  permissions: IPermissionAuth[] | null;
  token: string | null;
  loading: boolean;
  error: string | null;
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthState>(() => {
    const storageService = inject(LocalStorageService);
    return {
      user: storageService.get<IUserAuth>('user'),
      permissions: storageService.get<IPermissionAuth[]>('permissions') ?? null,
      token: storageService.get<string>('access_token') ?? null,
      loading: false,
      error: null,
    };
  }),
  withComputed(({ user, permissions, token }) => ({
    isAuthenticated: computed(() => !!user() && !!permissions() && !!token()),
  })),
  withMethods(
    (
      store,
      authService = inject(AuthService),
      storageService = inject(LocalStorageService),
    ) => ({
      setUser(user: IUserAuth) {
        patchState(store, {
          user,
        });
      },

      setToken(token: string) {
        patchState(store, { token });
      },
      setPermissions(permissions: IPermissionAuth[]) {
        patchState(store, { permissions });
      },
      logout() {
        patchState(store, { user: null, token: null, permissions: null });
        storageService.clear();
      },

      async login(username: string, password: string) {
        patchState(store, {
          loading: true,
          error: null,
        });

        try {
          const response = await firstValueFrom(
            authService.login({
              username,
              password,
            }),
          );
          this.setToken(response.token);
          storageService.set('access_token', response.token);
          patchState(store, {
            loading: false,
          });
        } catch (error: any) {
          patchState(store, {
            loading: false,
            error: error?.error?.mensaje || 'Usuario o contraseña incorrectos',
          });
        }
      },

      async me() {
        patchState(store, {
          loading: true,
          error: null,
        });

        try {
          const response = await firstValueFrom(authService.me());
          console.log({response});
          const user: IUserAuth = response.user;

          this.setUser(user);
          this.setPermissions(response.permissions);

          storageService.set('user', user);
          storageService.set('permissions', response.permissions);

          patchState(store, {
            loading: false,
          });
        } catch (error: any) {
          patchState(store, {
            loading: false,
            error: error?.error?.mensaje || 'No se ha podido restaurar la sesión',
          });
        }
      },
    }),
  ),
);
