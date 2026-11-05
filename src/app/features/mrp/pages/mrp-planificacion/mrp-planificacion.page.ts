import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { ToastService } from '../../../../core/services/toast.service';
import { AbastecimientoTabComponent } from '../../components/abastecimiento-tab/abastecimiento-tab.component';
import { DemandasTabComponent } from '../../components/demandas-tab/demandas-tab.component';
import { GeneralTabComponent } from '../../components/general-tab/general-tab.component';
import { InventarioTabComponent } from '../../components/inventario-tab/inventario-tab.component';
import { JsonViewerDialogComponent } from '../../components/json-viewer-dialog/json-viewer-dialog.component';
import { MaterialesTabComponent } from '../../components/materiales-tab/materiales-tab.component';
import { ModelosTabComponent } from '../../components/modelos-tab/modelos-tab.component';
import { SuministrosTabComponent } from '../../components/suministros-tab/suministros-tab.component';
import { MrpStore } from '../../store/mrp.store';

@Component({
  selector: 'app-mrp-planificacion',
  imports: [
    ButtonDirective,
    TabsModule,
    GeneralTabComponent,
    MaterialesTabComponent,
    ModelosTabComponent,
    AbastecimientoTabComponent,
    DemandasTabComponent,
    InventarioTabComponent,
    SuministrosTabComponent,
    JsonViewerDialogComponent,
  ],
  template: `
    <div class="flex flex-col gap-4">
      <header class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-slate-800">Planificador MRP</h1>
          <p class="text-sm text-slate-500">
            Captura la estructura de productos, materiales, proveedores y demanda para el motor MRP.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button pButton type="button" severity="secondary" size="small" (click)="cargarEjemplo()">
            Cargar ejemplo
          </button>
          <button pButton type="button" severity="secondary" size="small" (click)="verJson()">
            Ver JSON
          </button>
          <button pButton type="button" severity="secondary" size="small" (click)="descargarJson()">
            Descargar JSON
          </button>
          <button
            pButton
            type="button"
            severity="success"
            size="small"
            [loading]="store.loading()"
            (click)="ejecutar()"
          >
            Ejecutar MRP
          </button>
        </div>
      </header>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-6">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-xs text-slate-500">Materiales</p>
          <p class="text-lg font-semibold text-slate-800">{{ store.materiales().length }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-xs text-slate-500">Modelos</p>
          <p class="text-lg font-semibold text-slate-800">{{ store.modelos().length }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-xs text-slate-500">BOM</p>
          <p class="text-lg font-semibold text-slate-800">{{ store.bom().length }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-xs text-slate-500">Demandas</p>
          <p class="text-lg font-semibold text-slate-800">{{ store.demandas().length }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-xs text-slate-500">Opciones</p>
          <p class="text-lg font-semibold text-slate-800">{{ store.opciones().length }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-xs text-slate-500">Periodos capacidad</p>
          <p class="text-lg font-semibold text-slate-800">{{ totalCapacidades() }}</p>
        </div>
      </div>

      @if (store.error()) {
        <div class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {{ store.error() }}
        </div>
      }

      <p-tabs [(value)]="activeTab">
        <p-tablist>
          <p-tab value="general">General</p-tab>
          <p-tab value="materiales">Materiales</p-tab>
          <p-tab value="modelos">Modelos</p-tab>
          <p-tab value="abastecimiento">Proveedores</p-tab>
          <p-tab value="demandas">Demandas</p-tab>
          <p-tab value="inventario">Inventario</p-tab>
          <p-tab value="suministros">Suministros</p-tab>
        </p-tablist>
        <p-tabpanels>
          <p-tabpanel value="general"><app-general-tab /></p-tabpanel>
          <p-tabpanel value="materiales"><app-materiales-tab /></p-tabpanel>
          <p-tabpanel value="modelos"><app-modelos-tab /></p-tabpanel>
          <p-tabpanel value="abastecimiento"><app-abastecimiento-tab /></p-tabpanel>
          <p-tabpanel value="demandas"><app-demandas-tab /></p-tabpanel>
          <p-tabpanel value="inventario"><app-inventario-tab /></p-tabpanel>
          <p-tabpanel value="suministros"><app-suministros-tab /></p-tabpanel>
        </p-tabpanels>
      </p-tabs>

      <app-json-viewer-dialog
        [(visible)]="jsonDialogVisible"
        title="JSON de entrada del MRP"
        [data]="jsonPreview()"
        nombreArchivo="mrp-payload.json"
      />
    </div>
  `,
})
export class MrpPlanificacionPage {
  readonly store = inject(MrpStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  activeTab = 'general';
  readonly jsonDialogVisible = signal(false);
  readonly jsonPreview = computed(() => this.store.construirPayload());
  readonly totalCapacidades = computed(() =>
    this.store.opciones().reduce((total, opcion) => total + opcion.capacidad.length, 0),
  );

  cargarEjemplo(): void {
    this.store.cargarEjemplo();
    this.toast.success('Datos de ejemplo cargados');
  }

  verJson(): void {
    this.jsonDialogVisible.set(true);
  }

  descargarJson(): void {
    const blob = new Blob([JSON.stringify(this.jsonPreview(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'mrp-payload.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async ejecutar(): Promise<void> {
    const ok = await this.store.ejecutar();
    if (ok) {
      this.toast.success('Planificación ejecutada correctamente');
      await this.router.navigate(['/app/mrp/resultados']);
      return;
    }
    this.toast.error(this.store.error() ?? 'No se pudo ejecutar el motor MRP');
  }
}
