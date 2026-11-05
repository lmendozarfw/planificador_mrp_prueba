import { Component, signal } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { Home } from '@primeicons/angular/home';
import { Inbox } from '@primeicons/angular/inbox';
import { Search } from '@primeicons/angular/search';
import { Users } from '@primeicons/angular/users';
import { Bell } from '@primeicons/angular/bell';
import { Cog } from '@primeicons/angular/cog';
import { Sidebar } from '@primeicons/angular/sidebar';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { ChevronDown } from '@primeicons/angular';
import { MenuModule } from 'primeng/menu';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'main-template',
    template: `
        <div class="overflow-hidden">
            <p-sidebar-layout class="relative!">
                @if (isMobile()) {
                    <p-sidebar-backdrop class="absolute!" />
                }
                <p-sidebar id="mobile-nav" [collapsible]="isMobile() ? 'offcanvas' : 'icon'" [overlay]="isMobile()" [open]="!isMobile()" width="14rem">
                    <p-sidebar-spacer />
                    <p-sidebar-aside>
                        <p-sidebar-panel>
                            <p-sidebar-header>
                                <p-sidebar-menu>
                                    <p-sidebar-menu-item>
                                        <button pSidebarMenuButton class="p-1!">
                                            <div class="flex size-6 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-red-500 to-red-800 text-white text-xs font-bold leading-none">R</div>
                                            <span class="font-semibold text-sm">Raudal Footwear</span>
                                        </button>
                                    </p-sidebar-menu-item>
                                </p-sidebar-menu>
                            </p-sidebar-header>
                            <p-sidebar-content>
                                <p-sidebar-group>
                                    <p-sidebar-group-label>Menu</p-sidebar-group-label>
                                    <p-sidebar-group-content>
                                        <p-sidebar-menu>
                                            <p-sidebar-menu-item>
                                                <button pSidebarMenuButton [isActive]="true">
                                                    <svg data-p-icon="home"></svg>
                                                    <span>Home</span>
                                                </button>
                                            </p-sidebar-menu-item>
                                            <p-sidebar-menu-item>
                                                <button pSidebarMenuButton>
                                                    <svg data-p-icon="inbox"></svg>
                                                    <span>Inbox</span>
                                                </button>
                                                <p-sidebar-menu-badge>3</p-sidebar-menu-badge>
                                            </p-sidebar-menu-item>
                                            <p-sidebar-menu-item>
                                                <button pSidebarMenuButton>
                                                    <svg data-p-icon="search"></svg>
                                                    <span>Search</span>
                                                </button>
                                            </p-sidebar-menu-item>
                                            <p-sidebar-menu-item>
                                                <button pSidebarMenuButton>
                                                    <svg data-p-icon="users"></svg>
                                                    <span>Team</span>
                                                </button>
                                            </p-sidebar-menu-item>
                                            <p-sidebar-menu-item>
                                                <button pSidebarMenuButton>
                                                    <svg data-p-icon="bell"></svg>
                                                    <span>Notifications</span>
                                                </button>
                                            </p-sidebar-menu-item>
                                            <p-sidebar-menu-item>
                                                <button pSidebarMenuButton>
                                                    <svg data-p-icon="cog"></svg>
                                                    <span>Settings</span>
                                                </button>
                                            </p-sidebar-menu-item>
                                        </p-sidebar-menu>
                                    </p-sidebar-group-content>
                                </p-sidebar-group>
                            </p-sidebar-content>
                            <p-sidebar-footer>
                                <p-sidebar-menu>
                                    <p-sidebar-menu-item>
                                        <button pSidebarMenuButton class="p-1!" (click)="userMenu.toggle($event)">
                                            <span>Luis Angel Mendoza Lucio</span>
                                            <svg data-p-icon="chevron-down" class="ml-auto"></svg>
                                        </button>
                                        <p-menu #userMenu [model]="userItems" [popup]="true" appendTo="body" />
                                    </p-sidebar-menu-item>
                                </p-sidebar-menu>
                            </p-sidebar-footer>
                        </p-sidebar-panel>
                    </p-sidebar-aside>
                </p-sidebar>
                <p-sidebar-main>
                    <header class="flex h-12 items-center gap-2 border-b border-slate-200 px-4">
                        <button pButton pSidebarTrigger target="mobile-nav" severity="secondary" text size="small">
                            <svg data-p-icon="sidebar"></svg>
                        </button>
                        <span class="text-sm font-medium">Configuración</span>
                        <span class="ml-auto text-xs text-slate-900 rounded-md bg-slate-100 px-2 py-1"> <span class="text-xs text-slate-600">Empleado</span> {{ '#5366' }}</span>
                    </header>
                    <div class="flex-1 p-4 flex flex-col gap-4">
                        <router-outlet />
                    </div>
                </p-sidebar-main>
            </p-sidebar-layout>
        </div>
    `,
    standalone: true,
    imports: [AvatarModule, SidebarModule, ButtonModule, Home, Inbox, Search, Users, Bell, Cog, Sidebar, Menu, ChevronDown, MenuModule, RouterOutlet],
})
export class MainTemplate {
    isMobile = signal(false);
     userItems: MenuItem[] = [
        {
            label: 'Menú',
            items: [{ label: 'Cerrar sesión', icon: 'pi pi-sign-out' }]
        }
    ];
    constructor() {
        if (typeof window === 'undefined') return;
        const mql = window.matchMedia('(max-width: 1023px)');
        this.isMobile.set(mql.matches);
        mql.addEventListener('change', (e) => this.isMobile.set(e.matches));
    }
}