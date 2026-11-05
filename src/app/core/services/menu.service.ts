import { computed, inject, Injectable, signal } from '@angular/core';

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  route?: string;
  visible?: boolean;
  disabled?: boolean;
  allowedRoles?: string | string[] | null | undefined;
}

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly allItems = signal<MenuItem[]>([
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/o/dashboard',
      allowedRoles: [],
    },
    {
      key: 'authorization-codes',
      label: 'Códigos de autorización',
      icon: 'safety',
      route: '/o/authorization-codes',
      allowedRoles: [],
    },
    {
      key: 'registers',
      label: 'Bitácora de defectos',
      icon: 'solution',
      route: '/o/inspection-logs',
      allowedRoles: [],
    },
    {
      key: 'report',
      label: 'Reportes',
      icon: 'bar-chart',
      route: '/o/reports',
      allowedRoles: [],
    },
    {
      key: 'settings',
      label: 'Configuración',
      icon: 'setting',
      route: '/o/settings',
      allowedRoles: [],
    },
    {
      key: 'users',
      label: 'Usuarios',
      icon: 'user',
      route: '/o/users',
      allowedRoles: [],
    },
  ]);

  readonly items = computed<MenuItem[]>(() =>
    this.allItems()
  );

  setItems(items: MenuItem[]): void {
    this.allItems.set(items);
  }

  addItem(item: MenuItem): void {
    this.allItems.update((items) => [...items, item]);
  }

  removeItem(key: string): void {
    this.allItems.update((items) => items.filter((i) => i.key !== key));
  }

  updateItem(key: string, partial: Partial<MenuItem>): void {
    this.allItems.update((items) => items.map((i) => (i.key === key ? { ...i, ...partial } : i)));
  }

  setVisible(key: string, visible: boolean): void {
    this.updateItem(key, { visible });
  }

  setDisabled(key: string, disabled: boolean): void {
    this.updateItem(key, { disabled });
  }
}
