import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { CheckCircle, Qrcode, ChartBar } from "@primeicons/angular";

@Component({
  selector: 'auth-template',
  imports: [RouterOutlet, CheckCircle, Qrcode, ChartBar],
  styles: [],
  template: `
  <div class="auth-layout min-h-screen flex bg-slate-50">
    <!-- Panel izquierdo: Branding -->
    <div class="auth-brand hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center
                bg-gradient-to-br from-[#052e16] via-[#15803d] to-[#22c55e] text-white p-12">
      <div class="auth-decor auth-decor-1"></div>
      <div class="auth-decor auth-decor-2"></div>
      <div class="auth-decor auth-decor-3"></div>

      <div class="relative z-10 max-w-md">
        <div class="flex justify-center mb-8">
          <div class="bg-white rounded-xl shadow-lg p-4 w-36 h-24 flex items-center justify-center">
            <img src="/assets/images/raudal.png" alt="Raudal Footwear" class="w-full h-full object-contain" />
          </div>
        </div>

        <h1 class="text-3xl font-bold text-center leading-tight text-white">Gestión de Activos Fijos</h1>
        <p class="text-center text-white/80 mt-3 mb-10">
          Administra y controla cada activo de la empresa en un solo lugar.
        </p>

        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <span class="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm shrink-0">
              <svg data-p-icon="check-circle" [size]="20"></svg>
            </span>
            <p class="m-0 text-sm">Inventario de activos fijos claro y trazable</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm shrink-0">
              <svg data-p-icon="qrcode" [size]="20"></svg>
            </span>
            <p class="m-0 text-sm">Identificación por código QR para un registro ágil</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm shrink-0">
              <svg data-p-icon="chart-bar" [size]="20"></svg>
            </span>
            <p class="m-0 text-sm">Reportes y valorización de activos al alcance de un clic</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel derecho: Contenido -->
    <div class="auth-form w-full lg:w-1/2 flex items-center justify-center p-6">
      <router-outlet />
    </div>
</div>

  `,
})
export class AuthTemplate {}