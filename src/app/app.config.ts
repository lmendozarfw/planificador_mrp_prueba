import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';

const AppTheme = {
  ...Aura,
  semantic: {
    ...Aura.semantic,
    primary: {
      ...Aura.semantic?.primary,
      50: '{green.50}',
      100: '{green.100}',
      200: '{green.200}',
      300: '{green.300}',
      400: '{green.400}',
      500: '{green.500}',
      600: '{green.600}',
      700: '{green.700}',
      800: '{green.800}',
      900: '{green.900}',
      950: '{green.950}',
    },
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    providePrimeNG({
            theme: {
                preset: AppTheme,
                options: {
                    darkModeSelector: 'none',
                },
            },
            license: 'eyJpZCI6IjhjY2MwMWZjLTAxMzgtNGYxZC1iMDlkLTQ2MGYyN2Q0ZTk0NSIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODI4NTMzODQsImV4cCI6MTgxNDM4OTM4NH0.5X1GwjVS-s0_fDC5XCzABHltbeIeRXqYFiQyrIuL6CK2mdQe8bA_c6CF6xQtxxwFzjztmAW_RlHBw-8IRxf7CA'
        }),
        MessageService,
  ]
};
