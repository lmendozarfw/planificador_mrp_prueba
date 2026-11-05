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
  SuministroProgramado,
  TIPOS_ABASTECIMIENTO,
  TipoAbastecimiento,
} from '../../models/mrp.model';
import { MrpStore } from '../../store/mrp.store';
import { nextId } from '../../utils/mrp-ids';

@Component({
  selector: 'app-suministros-tab',
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
          <h3 class="text-sm font-semibold text-slate-800">Suministros programados</h3>
          <p class="text-xs text-slate-500">Compras y fabricaciones ya comprometidas con fecha esperada.</p>
        </div>
        <button pButton type="button" size="small" severity="success" (click)="abrirNuevo()">Nuevo suministro</button>
      </div>

      <p-table [value]="store.suministros()" [paginator]="true" [rows]="10" [tableStyle]="{ 'min-width': '52rem' }">
        <ng-template #header>
          <tr>
            <th>ID</th>
            <th>Material</th>
            <th>Tipo</th>
            <th>Fuente</th>
            <th>Cantidad</th>
            <th>Fecha esperada</th>
            <th class="w-32"></th>
          </tr>
        </ng-template>
        <ng-template #body let-suministro>
          <tr>
            <td class="font-mono text-xs">{{ suministro.id_suministro }}</td>
            <td>
              <span class="font-mono text-xs">{{ suministro.id_material }}</span>
              <div class="text-xs text-slate-500">{{ nombreMaterial(suministro.id_material) }}</div>
            </td>
            <td>
              <p-tag [value]="suministro.tipo" [severity]="suministro.tipo === 'COMPRA' ? 'info' : 'success'" />
            </td>
            <td>{{ suministro.id_fuente }}</td>
            <td>{{ suministro.cantidad }} {{ suministro.unidad_medida }}</td>
            <td>{{ suministro.fecha_esperada }}</td>
            <td>
              <div class="flex justify-end gap-1">
                <button pButton type="button" text size="small" (click)="editar(suministro)">Editar</button>
                <button pButton type="button" text size="small" severity="danger" (click)="eliminar(suministro)">Eliminar</button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="7" class="py-8 text-center text-sm text-slate-500">No hay suministros programados.</td>
          </tr>
        </ng-template>
      </p-table>
    </section>

    <p-dialog
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="{ width: '38rem' }"
      [header]="editando() ? 'Editar suministro' : 'Nuevo suministro'"
    >
      <form [formGroup]="form" class="grid gap-3 sm:grid-cols-2" (ngSubmit)="guardar()">
        <div>
          <app-form-label required>ID suministro</app-form-label>
          <input pInputText formControlName="id_suministro" class="w-full" />
        </div>
        <div>
          <app-form-label required>Tipo</app-form-label>
          <p-select formControlName="tipo" [options]="tipos" optionLabel="label" optionValue="value" class="w-full" />
        </div>
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
        <div class="sm:col-span-2">
          <app-form-label required>Fuente</app-form-label>
          <input pInputText formControlName="id_fuente" class="w-full" placeholder="PROV-..., PLANTA-..." />
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
          <app-form-label required>Fecha esperada</app-form-label>
          <input pInputText type="date" formControlName="fecha_esperada" class="w-full" />
        </div>
        <div class="mt-2 flex justify-end gap-2 sm:col-span-2">
          <button pButton type="button" text severity="secondary" (click)="dialogVisible = false">Cancelar</button>
          <button pButton type="submit" severity="success">Guardar</button>
        </div>
      </form>
    </p-dialog>
  `,
})
export class SuministrosTabComponent {
  readonly store = inject(MrpStore);
  private readonly toast = inject(ToastService);

  readonly tipos = TIPOS_ABASTECIMIENTO;

  readonly materialesOptions = computed(() =>
    this.store.materiales().map((material) => ({
      label: `${material.id_material} — ${material.descripcion}`,
      value: material.id_material,
    })),
  );

  dialogVisible = false;
  readonly editando = signal(false);
  private editingId: string | null = null;

  readonly form = new FormGroup({
    id_suministro: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipo: new FormControl<TipoAbastecimiento>('COMPRA', { nonNullable: true }),
    id_material: new FormControl<string | null>(null, { validators: [Validators.required] }),
    id_fuente: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cantidad: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.000001)],
    }),
    unidad_medida: new FormControl('', { nonNullable: true }),
    fecha_esperada: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  nombreMaterial(idMaterial: string): string {
    return this.store.materiales().find((material) => material.id_material === idMaterial)?.descripcion ?? idMaterial;
  }

  abrirNuevo(): void {
    this.editingId = null;
    this.editando.set(false);
    const id = nextId(
      'SUP',
      this.store.suministros().map((suministro) => suministro.id_suministro),
    );
    this.form.reset({
      id_suministro: id,
      tipo: 'COMPRA',
      id_material: null,
      id_fuente: '',
      cantidad: null,
      unidad_medida: '',
      fecha_esperada: '',
    });
    this.dialogVisible = true;
  }

  editar(suministro: SuministroProgramado): void {
    this.editingId = suministro.id_suministro;
    this.editando.set(true);
    this.form.reset(suministro);
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

    const suministro: SuministroProgramado = {
      id_suministro: value.id_suministro.trim(),
      tipo: value.tipo,
      id_material: value.id_material,
      id_fuente: value.id_fuente.trim(),
      cantidad: Number(value.cantidad ?? 0),
      unidad_medida: value.unidad_medida,
      fecha_esperada: value.fecha_esperada,
    };

    if (this.editingId) {
      this.store.updateSuministro(this.editingId, suministro);
      this.toast.success('Suministro actualizado');
    } else {
      this.store.addSuministro(suministro);
      this.toast.success('Suministro agregado');
    }
    this.dialogVisible = false;
  }

  eliminar(suministro: SuministroProgramado): void {
    this.store.removeSuministro(suministro.id_suministro);
    this.toast.info('Suministro eliminado');
  }
}
