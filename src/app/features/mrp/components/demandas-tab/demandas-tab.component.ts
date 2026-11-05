import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastService } from '../../../../core/services/toast.service';
import { FormLabelComponent } from '../../../../shared/components/form-label/form-label.component';
import {
  Demanda,
  TIPOS_ORIGEN_DEMANDA,
  TipoOrigenDemanda,
} from '../../models/mrp.model';
import { MrpStore } from '../../store/mrp.store';
import { nextId } from '../../utils/mrp-ids';

@Component({
  selector: 'app-demandas-tab',
  imports: [
    ReactiveFormsModule,
    ButtonDirective,
    DialogModule,
    InputText,
    SelectModule,
    TableModule,
    TagModule,
    FormLabelComponent,
  ],
  template: `
    <section class="rounded-xl border border-slate-200 bg-white p-4">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 class="text-sm font-semibold text-slate-800">Demandas</h3>
          <p class="text-xs text-slate-500">Pedidos, pronósticos y reposiciones por producto y fecha.</p>
        </div>
        <button pButton type="button" size="small" severity="success" (click)="abrirNueva()">Nueva demanda</button>
      </div>

      <p-table [value]="store.demandas()" [paginator]="true" [rows]="10" [tableStyle]="{ 'min-width': '54rem' }">
        <ng-template #header>
          <tr>
            <th>ID</th>
            <th>Tipo</th>
            <th>Fuente</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Fecha requerida</th>
            <th class="w-32"></th>
          </tr>
        </ng-template>
        <ng-template #body let-demanda>
          <tr>
            <td class="font-mono text-xs">{{ demanda.id_demanda }}</td>
            <td><p-tag [value]="etiquetaOrigen(demanda.tipo_origen)" [severity]="severidadOrigen(demanda.tipo_origen)" /></td>
            <td>{{ demanda.id_fuente }}</td>
            <td>
              <span class="font-mono text-xs">{{ demanda.id_producto }}</span>
              <div class="text-xs text-slate-500">{{ nombreProducto(demanda.id_producto) }}</div>
            </td>
            <td>{{ demanda.cantidad }} {{ demanda.unidad_medida }}</td>
            <td>{{ demanda.fecha_requerida }}</td>
            <td>
              <div class="flex justify-end gap-1">
                <button pButton type="button" text size="small" (click)="editar(demanda)">Editar</button>
                <button pButton type="button" text size="small" severity="danger" (click)="eliminar(demanda)">Eliminar</button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="7" class="py-8 text-center text-sm text-slate-500">No hay demandas registradas.</td>
          </tr>
        </ng-template>
      </p-table>
    </section>

    <p-dialog
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="{ width: '38rem' }"
      [header]="editando() ? 'Editar demanda' : 'Nueva demanda'"
    >
      <form [formGroup]="form" class="grid gap-3 sm:grid-cols-2" (ngSubmit)="guardar()">
        <div>
          <app-form-label required>ID demanda</app-form-label>
          <input pInputText formControlName="id_demanda" class="w-full" />
        </div>
        <div>
          <app-form-label required>Tipo de origen</app-form-label>
          <p-select formControlName="tipo_origen" [options]="tipos" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div class="sm:col-span-2">
          <app-form-label required>Fuente</app-form-label>
          <input pInputText formControlName="id_fuente" class="w-full" placeholder="PED-..., FORECAST-..." />
        </div>
        <div class="sm:col-span-2">
          <app-form-label required>Producto</app-form-label>
          <p-select
            formControlName="id_producto"
            [options]="productosOptions()"
            optionLabel="label"
            optionValue="value"
            [filter]="true"
            class="w-full"
            (onChange)="aplicarUnidad($event.value)"
          />
        </div>
        <div>
          <app-form-label required>Cantidad</app-form-label>
          <input pInputText type="number" step="any" formControlName="cantidad" class="w-full" />
        </div>
        <div>
          <app-form-label>Unidad de medida</app-form-label>
          <input pInputText formControlName="unidad_medida" class="w-full" readonly />
        </div>
        <div class="sm:col-span-2">
          <app-form-label required>Fecha requerida</app-form-label>
          <input pInputText type="date" formControlName="fecha_requerida" class="w-full" />
        </div>
        <div class="mt-2 flex justify-end gap-2 sm:col-span-2">
          <button pButton type="button" text severity="secondary" (click)="dialogVisible = false">Cancelar</button>
          <button pButton type="submit" severity="success">Guardar</button>
        </div>
      </form>
    </p-dialog>
  `,
})
export class DemandasTabComponent {
  readonly store = inject(MrpStore);
  private readonly toast = inject(ToastService);

  readonly tipos = TIPOS_ORIGEN_DEMANDA;

  readonly productosOptions = computed(() =>
    this.store.modelos().map((modelo) => ({
      label: `${modelo.id_material} — ${modelo.descripcion}`,
      value: modelo.id_material,
    })),
  );

  dialogVisible = false;
  readonly editando = signal(false);
  private editingId: string | null = null;

  readonly form = new FormGroup({
    id_demanda: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipo_origen: new FormControl<TipoOrigenDemanda>('PEDIDO', { nonNullable: true }),
    id_fuente: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    id_producto: new FormControl<string | null>(null, { validators: [Validators.required] }),
    cantidad: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.000001)],
    }),
    unidad_medida: new FormControl('', { nonNullable: true }),
    fecha_requerida: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  nombreProducto(idProducto: string): string {
    return this.store.materiales().find((material) => material.id_material === idProducto)?.descripcion ?? idProducto;
  }

  etiquetaOrigen(tipo: TipoOrigenDemanda): string {
    return TIPOS_ORIGEN_DEMANDA.find((item) => item.value === tipo)?.label ?? tipo;
  }

  severidadOrigen(tipo: TipoOrigenDemanda): 'success' | 'info' | 'warn' {
    if (tipo === 'PEDIDO') return 'success';
    if (tipo === 'PRONOSTICO') return 'info';
    return 'warn';
  }

  abrirNueva(): void {
    this.editingId = null;
    this.editando.set(false);
    const id = nextId(
      'DEM',
      this.store.demandas().map((demanda) => demanda.id_demanda),
    );
    this.form.reset({
      id_demanda: id,
      tipo_origen: 'PEDIDO',
      id_fuente: '',
      id_producto: null,
      cantidad: null,
      unidad_medida: '',
      fecha_requerida: '',
    });
    this.dialogVisible = true;
  }

  editar(demanda: Demanda): void {
    this.editingId = demanda.id_demanda;
    this.editando.set(true);
    this.form.reset(demanda);
    this.dialogVisible = true;
  }

  aplicarUnidad(idProducto: string | null): void {
    if (!idProducto) return;
    const producto = this.store.materiales().find((material) => material.id_material === idProducto);
    this.form.patchValue({ unidad_medida: producto?.unidad_medida_planeacion ?? '' });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (!value.id_producto) return;

    const demanda: Demanda = {
      id_demanda: value.id_demanda.trim(),
      tipo_origen: value.tipo_origen,
      id_fuente: value.id_fuente.trim(),
      id_producto: value.id_producto,
      cantidad: Number(value.cantidad ?? 0),
      unidad_medida: value.unidad_medida,
      fecha_requerida: value.fecha_requerida,
    };

    if (this.editingId) {
      this.store.updateDemanda(this.editingId, demanda);
      this.toast.success('Demanda actualizada');
    } else {
      this.store.addDemanda(demanda);
      this.toast.success('Demanda agregada');
    }
    this.dialogVisible = false;
  }

  eliminar(demanda: Demanda): void {
    this.store.removeDemanda(demanda.id_demanda);
    this.toast.info('Demanda eliminada');
  }
}
