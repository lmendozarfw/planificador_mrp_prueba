import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastService } from '../../../../core/services/toast.service';
import { FormLabelComponent } from '../../../../shared/components/form-label/form-label.component';
import { InventarioItem } from '../../models/mrp.model';
import { MrpStore } from '../../store/mrp.store';

@Component({
  selector: 'app-inventario-tab',
  imports: [
    ReactiveFormsModule,
    ButtonDirective,
    DialogModule,
    InputText,
    SelectModule,
    TableModule,
    FormLabelComponent,
  ],
  template: `
    <section class="rounded-xl border border-slate-200 bg-white p-4">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 class="text-sm font-semibold text-slate-800">Inventario</h3>
          <p class="text-xs text-slate-500">Existencias, reservas y stock de seguridad por material.</p>
        </div>
        <button pButton type="button" size="small" severity="success" (click)="abrirNuevo()">Nuevo registro</button>
      </div>

      <p-table [value]="store.inventario()" [paginator]="true" [rows]="10" [tableStyle]="{ 'min-width': '48rem' }">
        <ng-template #header>
          <tr>
            <th>Material</th>
            <th>Existente</th>
            <th>Reservada</th>
            <th>Stock seguridad</th>
            <th>UM</th>
            <th class="w-32"></th>
          </tr>
        </ng-template>
        <ng-template #body let-item>
          <tr>
            <td>
              <span class="font-mono text-xs">{{ item.id_material }}</span>
              <div class="text-xs text-slate-500">{{ nombreMaterial(item.id_material) }}</div>
            </td>
            <td>{{ item.cantidad_existente }}</td>
            <td>{{ item.cantidad_reservada }}</td>
            <td>{{ item.cantidad_stock_seguridad }}</td>
            <td>{{ item.unidad_medida }}</td>
            <td>
              <div class="flex justify-end gap-1">
                <button pButton type="button" text size="small" (click)="editar(item)">Editar</button>
                <button pButton type="button" text size="small" severity="danger" (click)="eliminar(item)">Eliminar</button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="6" class="py-8 text-center text-sm text-slate-500">No hay inventario registrado.</td>
          </tr>
        </ng-template>
      </p-table>
    </section>

    <p-dialog
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="{ width: '34rem' }"
      [header]="editando() ? 'Editar inventario' : 'Nuevo inventario'"
    >
      <form [formGroup]="form" class="grid gap-3 sm:grid-cols-2" (ngSubmit)="guardar()">
        <div class="sm:col-span-2">
          <app-form-label required>Material</app-form-label>
          <p-select
            formControlName="id_material"
            [options]="materialesOptions()"
            optionLabel="label"
            optionValue="value"
            [filter]="true"
            class="w-full"
            (onChange)="aplicarUnidad($event.value)"
          />
        </div>
        <div>
          <app-form-label required>Cantidad existente</app-form-label>
          <input pInputText type="number" step="any" formControlName="cantidad_existente" class="w-full" />
        </div>
        <div>
          <app-form-label required>Cantidad reservada</app-form-label>
          <input pInputText type="number" step="any" formControlName="cantidad_reservada" class="w-full" />
        </div>
        <div>
          <app-form-label required>Stock de seguridad</app-form-label>
          <input pInputText type="number" step="any" formControlName="cantidad_stock_seguridad" class="w-full" />
        </div>
        <div>
          <app-form-label>Unidad de medida</app-form-label>
          <input pInputText formControlName="unidad_medida" class="w-full" readonly />
        </div>
        @if (error()) {
          <p class="text-xs text-rose-600 sm:col-span-2">{{ error() }}</p>
        }
        <div class="mt-2 flex justify-end gap-2 sm:col-span-2">
          <button pButton type="button" text severity="secondary" (click)="dialogVisible = false">Cancelar</button>
          <button pButton type="submit" severity="success">Guardar</button>
        </div>
      </form>
    </p-dialog>
  `,
})
export class InventarioTabComponent {
  readonly store = inject(MrpStore);
  private readonly toast = inject(ToastService);

  readonly materialesOptions = computed(() =>
    this.store.materiales().map((material) => ({
      label: `${material.id_material} — ${material.descripcion}`,
      value: material.id_material,
    })),
  );

  dialogVisible = false;
  readonly editando = signal(false);
  readonly error = signal<string | null>(null);
  private editingId: string | null = null;

  readonly form = new FormGroup({
    id_material: new FormControl<string | null>(null, { validators: [Validators.required] }),
    cantidad_existente: new FormControl<number | null>(0, {
      validators: [Validators.required, Validators.min(0)],
    }),
    cantidad_reservada: new FormControl<number | null>(0, {
      validators: [Validators.required, Validators.min(0)],
    }),
    cantidad_stock_seguridad: new FormControl<number | null>(0, {
      validators: [Validators.required, Validators.min(0)],
    }),
    unidad_medida: new FormControl('', { nonNullable: true }),
  });

  nombreMaterial(idMaterial: string): string {
    return this.store.materiales().find((material) => material.id_material === idMaterial)?.descripcion ?? idMaterial;
  }

  abrirNuevo(): void {
    this.editingId = null;
    this.editando.set(false);
    this.error.set(null);
    this.form.reset({
      id_material: null,
      cantidad_existente: 0,
      cantidad_reservada: 0,
      cantidad_stock_seguridad: 0,
      unidad_medida: '',
    });
    this.dialogVisible = true;
  }

  editar(item: InventarioItem): void {
    this.editingId = item.id_material;
    this.editando.set(true);
    this.error.set(null);
    this.form.reset(item);
    this.dialogVisible = true;
  }

  aplicarUnidad(idMaterial: string | null): void {
    if (!idMaterial) return;
    const material = this.store.materiales().find((item) => item.id_material === idMaterial);
    this.form.patchValue({ unidad_medida: material?.unidad_medida_planeacion ?? '' });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (!value.id_material) return;

    const item: InventarioItem = {
      id_material: value.id_material,
      cantidad_existente: Number(value.cantidad_existente ?? 0),
      cantidad_reservada: Number(value.cantidad_reservada ?? 0),
      cantidad_stock_seguridad: Number(value.cantidad_stock_seguridad ?? 0),
      unidad_medida: value.unidad_medida,
    };

    if (!this.editingId && this.store.inventario().some((registro) => registro.id_material === item.id_material)) {
      this.error.set('Ya existe inventario para ese material.');
      return;
    }

    if (this.editingId) {
      this.store.updateInventario(this.editingId, item);
      this.toast.success('Inventario actualizado');
    } else {
      this.store.addInventario(item);
      this.toast.success('Inventario agregado');
    }
    this.dialogVisible = false;
  }

  eliminar(item: InventarioItem): void {
    this.store.removeInventario(item.id_material);
    this.toast.info('Registro de inventario eliminado');
  }
}
