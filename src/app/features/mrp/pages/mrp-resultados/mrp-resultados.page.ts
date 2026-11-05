import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { JsonViewerDialogComponent } from '../../components/json-viewer-dialog/json-viewer-dialog.component';
import { MrpStore } from '../../store/mrp.store';

@Component({
  selector: 'app-mrp-resultados',
  imports: [RouterLink, ButtonDirective, TabsModule, JsonViewerDialogComponent],
  template: `
    <div class="flex flex-col gap-4">
      <header class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-slate-800">Resultados del MRP</h1>
          <p class="text-sm text-slate-500">
            Payload enviado al motor y respuesta recibida desde el servicio de planificación.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a pButton severity="secondary" size="small" routerLink="/app/mrp">Volver a planificación</a>
          <button pButton type="button" severity="secondary" size="small" (click)="verPayload()">
            Ver payload
          </button>
          <button pButton type="button" severity="secondary" size="small" (click)="verRespuesta()">
            Ver respuesta
          </button>
        </div>
      </header>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-xs text-slate-500">ID ejecución</p>
          <p class="truncate text-sm font-semibold text-slate-800">{{ payload()?.id_ejecucion ?? '—' }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-xs text-slate-500">Fecha planificación</p>
          <p class="text-sm font-semibold text-slate-800">{{ payload()?.ejecucion?.fecha_planificacion ?? '—' }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-xs text-slate-500">Fin horizonte</p>
          <p class="text-sm font-semibold text-slate-800">{{ payload()?.ejecucion?.fecha_fin_horizonte ?? '—' }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-xs text-slate-500">Estado</p>
          <p class="text-sm font-semibold" [class]="estadoClase()">{{ estadoTexto() }}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-6">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-xs text-slate-500">Materiales</p>
          <p class="text-lg font-semibold text-slate-800">{{ payload()?.materiales?.length ?? 0 }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-xs text-slate-500">Demandas</p>
          <p class="text-lg font-semibold text-slate-800">{{ payload()?.demandas?.length ?? 0 }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-xs text-slate-500">Filas BOM</p>
          <p class="text-lg font-semibold text-slate-800">{{ payload()?.bom_plano?.length ?? 0 }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-xs text-slate-500">Inventario</p>
          <p class="text-lg font-semibold text-slate-800">{{ payload()?.inventario?.length ?? 0 }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-xs text-slate-500">Suministros</p>
          <p class="text-lg font-semibold text-slate-800">{{ payload()?.suministros_programados?.length ?? 0 }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-xs text-slate-500">Opciones</p>
          <p class="text-lg font-semibold text-slate-800">{{ payload()?.opciones_abastecimiento?.length ?? 0 }}</p>
        </div>
      </div>

      @if (!payload() && !store.ultimaRespuesta()) {
        <div class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p class="text-sm font-medium text-slate-700">Todavía no hay una ejecución registrada.</p>
          <p class="mt-1 text-xs text-slate-500">
            Ve a la pantalla de planificación, carga los datos y presiona “Ejecutar MRP”.
          </p>
        </div>
      } @else {
        <p-tabs [(value)]="activeTab">
          <p-tablist>
            <p-tab value="payload">Payload enviado</p-tab>
            <p-tab value="respuesta">Respuesta del motor</p-tab>
          </p-tablist>
          <p-tabpanels>
            <p-tabpanel value="payload">
              <pre class="max-h-[60vh] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-emerald-200">{{
                payloadJson()
              }}</pre>
            </p-tabpanel>
            <p-tabpanel value="respuesta">
              @if (store.ultimaRespuesta()) {
                <pre class="max-h-[60vh] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-sky-200">{{
                  respuestaJson()
                }}</pre>
              } @else {
                <div class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                  <p class="text-sm font-medium text-slate-700">Sin respuesta del motor.</p>
                  <p class="mt-1 text-xs text-slate-500">
                    Cuando el endpoint <code>POST /planificaciones</code> responda, aquí se mostrará el JSON crudo.
                    El esquema de resultados se definirá después.
                  </p>
                </div>
              }
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      }

      <app-json-viewer-dialog
        [(visible)]="payloadDialogVisible"
        title="Payload enviado"
        [data]="payload()"
        nombreArchivo="mrp-payload.json"
      />
      <app-json-viewer-dialog
        [(visible)]="respuestaDialogVisible"
        title="Respuesta del motor"
        [data]="store.ultimaRespuesta()"
        nombreArchivo="mrp-respuesta.json"
      />
    </div>
  `,
})
export class MrpResultadosPage {
  readonly store = inject(MrpStore);

  activeTab = 'payload';
  readonly payloadDialogVisible = signal(false);
  readonly respuestaDialogVisible = signal(false);
  readonly payload = computed(() => this.store.ultimoPayload() ?? this.store.construirPayload());
  readonly payloadJson = computed(() => JSON.stringify(this.payload(), null, 2));
  readonly respuestaJson = computed(() => JSON.stringify(this.store.ultimaRespuesta(), null, 2));
  readonly estadoTexto = computed(() => {
    if (this.store.loading()) return 'Ejecutando…';
    if (this.store.error()) return 'Error';
    if (this.store.ultimaRespuesta()) return 'Completado';
    return 'Pendiente';
  });
  readonly estadoClase = computed(() => {
    if (this.store.error()) return 'text-rose-600';
    if (this.store.ultimaRespuesta()) return 'text-emerald-600';
    if (this.store.loading()) return 'text-sky-600';
    return 'text-slate-500';
  });

  verPayload(): void {
    this.payloadDialogVisible.set(true);
  }

  verRespuesta(): void {
    this.respuestaDialogVisible.set(true);
  }
}
