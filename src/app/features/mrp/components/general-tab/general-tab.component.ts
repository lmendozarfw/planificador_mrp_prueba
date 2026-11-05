import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastService } from '../../../../core/services/toast.service';
import { FormLabelComponent } from '../../../../shared/components/form-label/form-label.component';
import { ConversionUnidad, MODOS_PLANIFICACION, ModoPlanificacion } from '../../models/mrp.model';
import { MrpStore } from '../../store/mrp.store';

@Component({
  selector: 'app-general-tab',
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
    <div class="grid gap-4 lg:grid-cols-2">
      <form [formGroup]="form" class="rounded-xl border border-slate-200 bg-white p-4" (ngSubmit)="guardar()">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-slate-800">Datos de la ejecución</h3>
          <button pButton type="submit" size="small" severity="success">
            <span class="flex items-center gap-1.5">Guardar datos</span>
          </button>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <app-form-label required>ID de ejecución</app-form-label>
            <input pInputText formControlName="idEjecucion" class="w-full" placeholder="MRP-2026-11-10-0001" />
          </div>
          <div>
            <app-form-label>Versión</app-form-label>
            <input pInputText formControlName="version" class="w-full" />
          </div>
          <div>
            <app-form-label required>Fecha de planificación</app-form-label>
            <input pInputText type="date" formControlName="fechaPlanificacion" class="w-full" />
          </div>
          <div>
            <app-form-label required>Fin del horizonte</app-form-label>
            <input pInputText type="date" formControlName="fechaFin" class="w-full" />
          </div>
          <div>
            <app-form-label required>Modo de planificación</app-form-label>
            <p-select
              formControlName="modo"
              [options]="modos"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
          <div class="sm:col-span-2">
            <app-form-label>Descripción</app-form-label>
            <textarea
              pInputText
              formControlName="descripcion"
              rows="3"
              class="w-full"
              placeholder="Describe la planificación"
            ></textarea>
          </div>
        </div>
      </form>

      <section class="rounded-xl border border-slate-200 bg-white p-4">
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-slate-800">Conversiones de unidad</h3>
            <p class="text-xs text-slate-500">Factores aplicados por el motor MRP.</p>
          </div>
          <button pButton type="button" size="small" severity="secondary" (click)="abrirNueva()">
            Nueva
          </button>
        </div>

        <p-table [value]="store.conversiones()" [tableStyle]="{ 'min-width': '24rem' }">
          <ng-template #header>
            <tr>
              <th>Origen</th>
              <th>Destino</th>
              <th>Factor</th>
              <th class="w-24"></th>
            </tr>
          </ng-template>
          <ng-template #body let-conversion let-i="index">
            <tr>
              <td>{{ conversion.unidad_origen }}</td>
              <td>{{ conversion.unidad_destino }}</td>
              <td>{{ conversion.factor }}</td>
              <td>
                <div class="flex justify-end gap-1">
                  <button pButton type="button" text size="small" (click)="editar(conversion, i)">Editar</button>
                  <button pButton type="button" text size="small" severity="danger" (click)="eliminar(i)">Eliminar</button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="4" class="py-6 text-center text-sm text-slate-500">Sin conversiones registradas.</td>
            </tr>
          </ng-template>
        </p-table>
      </section>
    </div>

    <p-dialog
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="{ width: '28rem' }"
      [header]="editIndex() === null ? 'Nueva conversión' : 'Editar conversión'"
    >
      <form [formGroup]="convForm" class="grid gap-3" (ngSubmit)="guardarConversion()">
        <div>
          <app-form-label required>Unidad origen</app-form-label>
          <input pInputText formControlName="unidad_origen" class="w-full" placeholder="CM" />
        </div>
        <div>
          <app-form-label required>Unidad destino</app-form-label>
          <input pInputText formControlName="unidad_destino" class="w-full" placeholder="M" />
        </div>
        <div>
          <app-form-label required>Factor</app-form-label>
          <input pInputText type="number" step="any" formControlName="factor" class="w-full" placeholder="0.01" />
        </div>
        <div class="mt-2 flex justify-end gap-2">
          <button pButton type="button" text severity="secondary" (click)="dialogVisible = false">Cancelar</button>
          <button pButton type="submit" severity="success">Guardar</button>
        </div>
      </form>
    </p-dialog>
  `,
})
export class GeneralTabComponent {
  readonly store = inject(MrpStore);
  private readonly toast = inject(ToastService);

  readonly modos = MODOS_PLANIFICACION;
  dialogVisible = false;
  readonly editIndex = signal<number | null>(null);

  readonly form = new FormGroup({
    version: new FormControl(this.store.version(), { nonNullable: true }),
    idEjecucion: new FormControl(this.store.idEjecucion(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    fechaPlanificacion: new FormControl(this.store.ejecucion().fecha_planificacion, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    fechaFin: new FormControl(this.store.ejecucion().fecha_fin_horizonte, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    modo: new FormControl<ModoPlanificacion>(this.store.ejecucion().modo_planificacion, {
      nonNullable: true,
    }),
    descripcion: new FormControl(this.store.ejecucion().descripcion, { nonNullable: true }),
  });

  readonly convForm = new FormGroup({
    unidad_origen: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    unidad_destino: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    factor: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.000001)],
    }),
  });

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.store.setGeneral({ version: value.version, idEjecucion: value.idEjecucion });
    this.store.setEjecucion({
      fecha_planificacion: value.fechaPlanificacion,
      fecha_fin_horizonte: value.fechaFin,
      modo_planificacion: value.modo,
      descripcion: value.descripcion,
    });
    this.toast.success('Datos de la ejecución guardados');
  }

  abrirNueva(): void {
    this.editIndex.set(null);
    this.convForm.reset({ unidad_origen: '', unidad_destino: '', factor: null });
    this.dialogVisible = true;
  }

  editar(conversion: ConversionUnidad, index: number): void {
    this.editIndex.set(index);
    this.convForm.reset(conversion);
    this.dialogVisible = true;
  }

  guardarConversion(): void {
    if (this.convForm.invalid) {
      this.convForm.markAllAsTouched();
      return;
    }
    const value = this.convForm.getRawValue();
    const conversion: ConversionUnidad = {
      unidad_origen: value.unidad_origen.trim().toUpperCase(),
      unidad_destino: value.unidad_destino.trim().toUpperCase(),
      factor: Number(value.factor ?? 0),
    };
    const index = this.editIndex();
    if (index === null) {
      this.store.addConversion(conversion);
      this.toast.success('Conversión agregada');
    } else {
      this.store.updateConversion(index, conversion);
      this.toast.success('Conversión actualizada');
    }
    this.dialogVisible = false;
  }

  eliminar(index: number): void {
    this.store.removeConversion(index);
    this.toast.info('Conversión eliminada');
  }
}
