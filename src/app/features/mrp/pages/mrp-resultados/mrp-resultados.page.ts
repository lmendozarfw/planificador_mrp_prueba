import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { JsonViewerDialogComponent } from '../../components/json-viewer-dialog/json-viewer-dialog.component';
import { MrpStore } from '../../store/mrp.store';
import { ResultadoPlanificacionComponent } from '../resultados_planificacion/resultados-planificacion';

@Component({
  selector: 'app-mrp-resultados',
  imports: [RouterLink, ButtonDirective, TabsModule, JsonViewerDialogComponent, ResultadoPlanificacionComponent],
  template: `
    <app-resultados-planificacion [resultado]="respuesta()!"></app-resultados-planificacion>
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
  readonly respuesta = computed(() => this.store.ultimaRespuesta());
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
