import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'auth',
        loadComponent: () => import('./shared/templates/auth.tempalte').then(t => t.AuthTemplate),
        children: [
            {
                path: 'login',
                loadComponent: () => import('./features/auth/pages/login/login.page').then(p => p.LoginPage),
            }
        ]
    },
    {
        path: 'app',
        loadComponent: () => import('./shared/templates/main.template').then(t => t.MainTemplate),
        children: [
            {
                path: '',
                redirectTo: 'mrp',
                pathMatch: 'full',
            },
            {
                path: 'mrp',
                loadComponent: () => import('./features/mrp/pages/mrp-planificacion/mrp-planificacion.page').then(p => p.MrpPlanificacionPage),
            },
            {
                path: 'mrp/resultados',
                loadComponent: () => import('./features/mrp/pages/mrp-resultados/mrp-resultados.page').then(p => p.MrpResultadosPage),
            },
            {
                path: 'configuration',
                loadComponent: () => import('./features/configuration/pages/configuration.page').then(p => p.ConfigurationPage),
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'auth/login',
    }
];
