import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastService } from '../../../../core/services/toast.service';
import { FormLabelComponent } from '../../../../shared/components/form-label/form-label.component';
import {
  CapacidadPeriodo,
  METODOS_LOTE,
  MetodoLote,
  OpcionAbastecimiento,
  TIPOS_ABASTECIMIENTO,
  TipoAbastecimiento,
  UNIDADES_MEDIDA,
} from '../../models/mrp.model';
import { MrpStore } from '../../store/mrp.store';
import { nextId } from '../../utils/mrp-ids';

@Component({
  selector: 'app-abastecimiento-tab',
  imports: [
    DecimalPipe,
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
          <h3 class="text-sm font-semibold text-slate-800">Proveedores y opciones de abastecimiento</h3>
          <p class="text-xs text-slate-500">Precio, lead time, lote y capacidad por periodo de cada fuente.</p>
        </div>
        <button pButton type="button" size="small" severity="success" (click)="abrirNueva()">
          Nueva opción
        </button>
      </div>

      <p-table [value]="store.opciones()" [paginator]="true" [rows]="10" [tableStyle]="{ 'min-width': '70rem' }">
        <ng-template #header>
          <tr>
            <th>ID</th>
            <th>Material</th>
            <th>Proveedor / fuente</th>
            <th>Tipo</th>
            <th>Precio</th>
            <th>Lead time</th>
            <th>Vigencia</th>
            <th>Lote</th>
            <th>Periodos</th>
            <th class="w-32"></th>
          </tr>
        </ng-template>
        <ng-template #body let-opcion>
          <tr>
            <td class="font-mono text-xs">{{ opcion.id_opcion_abastecimiento }}</td>
            <td>
              <span class="font-mono text-xs">{{ opcion.id_material }}</span>
              <div class="text-xs text-slate-500">{{ nombreMaterial(opcion.id_material) }}</div>
            </td>
            <td>{{ opcion.id_fuente }}</td>
            <td>
              <p-tag [value]="opcion.tipo" [severity]="opcion.tipo === 'COMPRA' ? 'info' : 'success'" />
            </td>
            <td>{{ opcion.precio_unitario | number: '1.2-4' }} {{ opcion.moneda }}</td>
            <td>{{ opcion.lead_time_dias }} días</td>
            <td class="text-xs">{{ opcion.vigencia_inicio }} → {{ opcion.vigencia_fin }}</td>
            <td class="text-xs">{{ etiquetaMetodo(opcion.tamano_lote.metodo) }}</td>
            <td>{{ opcion.capacidad.length }}</td>
            <td>
              <div class="flex justify-end gap-1">
                <button pButton type="button" text size="small" (click)="editar(opcion)">Editar</button>
                <button pButton type="button" text size="small" severity="danger" (click)="eliminar(opcion)">
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="10" class="py-8 text-center text-sm text-slate-500">
              No hay opciones de abastecimiento registradas.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </section>

    <p-dialog
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="{ width: '56rem' }"
      [header]="editando() ? 'Editar opción de abastecimiento' : 'Nueva opción de abastecimiento'"
    >
      <form [formGroup]="form" class="grid gap-3 sm:grid-cols-3" (ngSubmit)="guardar()">
        <div>
          <app-form-label required>ID opción</app-form-label>
          <input pInputText formControlName="id_opcion_abastecimiento" class="w-full" />
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
        <div>
          <app-form-label required>Proveedor / fuente</app-form-label>
          <input pInputText formControlName="id_fuente" class="w-full" placeholder="PROV-..." />
        </div>
        <div>
          <app-form-label required>Tipo</app-form-label>
          <p-select formControlName="tipo" [options]="tipos" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div>
          <app-form-label required>Precio unitario</app-form-label>
          <input pInputText type="number" step="any" formControlName="precio_unitario" class="w-full" />
        </div>
        <div>
          <app-form-label>Moneda</app-form-label>
          <input pInputText formControlName="moneda" class="w-full" />
        </div>
        <div>
          <app-form-label required>Lead time (días)</app-form-label>
          <input pInputText type="number" formControlName="lead_time_dias" class="w-full" />
        </div>
        <div>
          <app-form-label required>Vigencia inicio</app-form-label>
          <input pInputText type="date" formControlName="vigencia_inicio" class="w-full" />
        </div>
        <div>
          <app-form-label required>Vigencia fin</app-form-label>
          <input pInputText type="date" formControlName="vigencia_fin" class="w-full" />
        </div>

        <div class="sm:col-span-3 mt-2 border-t border-slate-100 pt-3">
          <h4 class="mb-2 text-sm font-semibold text-slate-700">Tamaño de lote</h4>
          <div class="grid gap-3 sm:grid-cols-4">
            <div>
              <app-form-label required>Método</app-form-label>
              <p-select formControlName="metodo" [options]="metodos" optionLabel="label" optionValue="value" class="w-full" />
            </div>
            @if (metodoSeleccionado() === 'LOTE_FIJO') {
              <div>
                <app-form-label required>Cantidad fija</app-form-label>
                <input pInputText type="number" step="any" formControlName="cantidad_fija" class="w-full" />
              </div>
            }
            @if (metodoSeleccionado() === 'LOTE_MINIMO' || metodoSeleccionado() === 'LOTE_MULTIPLO') {
              <div>
                <app-form-label required>Lote mínimo</app-form-label>
                <input pInputText type="number" step="any" formControlName="tamano_lote_minimo" class="w-full" />
              </div>
              <div>
                <app-form-label required>Lote máximo</app-form-label>
                <input pInputText type="number" step="any" formControlName="tamano_lote_maximo" class="w-full" />
              </div>
            }
            @if (metodoSeleccionado() === 'LOTE_MULTIPLO') {
              <div>
                <app-form-label required>Múltiplo</app-form-label>
                <input pInputText type="number" step="any" formControlName="multiplo_lote" class="w-full" />
              </div>
            }
            <div>
              <app-form-label required>UM lote</app-form-label>
              <p-select formControlName="unidad_lote" [options]="unidades" [editable]="true" class="w-full" />
            </div>
          </div>
        </div>

        <div class="sm:col-span-3 mt-2 border-t border-slate-100 pt-3">
          <div class="mb-2 flex items-center justify-between">
            <h4 class="text-sm font-semibold text-slate-700">Capacidad por periodo</h4>
            <button pButton type="button" size="small" severity="secondary" (click)="agregarCapacidad()">
              Agregar periodo
            </button>
          </div>

          <div formArrayName="capacidades" class="flex flex-col gap-2">
            @for (capacidad of capacidades.controls; track capacidad; let i = $index) {
              <div [formGroupName]="i" class="grid items-end gap-2 rounded-lg bg-slate-50 p-2 sm:grid-cols-[1fr_1fr_1fr_6rem_auto]">
                <div>
                  <app-form-label required>Inicio</app-form-label>
                  <input pInputText type="date" formControlName="periodo_inicio" class="w-full" />
                </div>
                <div>
                  <app-form-label required>Fin</app-form-label>
                  <input pInputText type="date" formControlName="periodo_fin" class="w-full" />
                </div>
                <div>
                  <app-form-label required>Cantidad</app-form-label>
                  <input pInputText type="number" step="any" formControlName="cantidad" class="w-full" />
                </div>
                <div>
                  <app-form-label required>UM</app-form-label>
                  <input pInputText formControlName="unidad_medida" class="w-full" />
                </div>
                <button pButton type="button" text severity="danger" (click)="quitarCapacidad(i)">Quitar</button>
              </div>
            }
          </div>

          @if (error()) {
            <p class="mt-2 text-xs text-rose-600">{{ error() }}</p>
          }
        </div>

        <div class="mt-2 flex justify-end gap-2 sm:col-span-3">
          <button pButton type="button" text severity="secondary" (click)="dialogVisible = false">Cancelar</button>
          <button pButton type="submit" severity="success">Guardar</button>
        </div>
      </form>
    </p-dialog>
  `,
})
export class AbastecimientoTabComponent {
  readonly store = inject(MrpStore);
  private readonly toast = inject(ToastService);

  readonly tipos = TIPOS_ABASTECIMIENTO;
  readonly metodos = METODOS_LOTE;
  readonly unidades = UNIDADES_MEDIDA;

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
    id_opcion_abastecimiento: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    id_material: new FormControl<string | null>(null, { validators: [Validators.required] }),
    id_fuente: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipo: new FormControl<TipoAbastecimiento>('COMPRA', { nonNullable: true }),
    precio_unitario: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    moneda: new FormControl('MXN', { nonNullable: true }),
    lead_time_dias: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    vigencia_inicio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    vigencia_fin: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    metodo: new FormControl<MetodoLote>('LOTE_MINIMO', { nonNullable: true }),
    tamano_lote_minimo: new FormControl<number | null>(null),
    tamano_lote_maximo: new FormControl<number | null>(null),
    multiplo_lote: new FormControl<number | null>(null),
    cantidad_fija: new FormControl<number | null>(null),
    unidad_lote: new FormControl('PCS', { nonNullable: true, validators: [Validators.required] }),
    capacidades: new FormArray<FormGroup>([]),
  });

  get capacidades(): FormArray {
    return this.form.get('capacidades') as FormArray;
  }

  metodoSeleccionado(): MetodoLote {
    return this.form.controls.metodo.value;
  }

  nombreMaterial(idMaterial: string): string {
    return this.store.materiales().find((material) => material.id_material === idMaterial)?.descripcion ?? idMaterial;
  }

  etiquetaMetodo(metodo: MetodoLote): string {
    return METODOS_LOTE.find((item) => item.value === metodo)?.label ?? metodo;
  }

  private crearCapacidadForm(periodo?: CapacidadPeriodo): FormGroup {
    return new FormGroup({
      periodo_inicio: new FormControl(periodo?.periodo_inicio ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      periodo_fin: new FormControl(periodo?.periodo_fin ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      cantidad: new FormControl<number | null>(periodo?.cantidad ?? null, {
        validators: [Validators.required, Validators.min(0.000001)],
      }),
      unidad_medida: new FormControl(periodo?.unidad_medida ?? this.form.controls.unidad_lote.value, {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }

  abrirNueva(): void {
    this.editingId = null;
    this.editando.set(false);
    this.error.set(null);
    const id = nextId(
      'SRC',
      this.store.opciones().map((opcion) => opcion.id_opcion_abastecimiento),
    );
    this.form.reset({
      id_opcion_abastecimiento: id,
      id_material: null,
      id_fuente: '',
      tipo: 'COMPRA',
      precio_unitario: null,
      moneda: 'MXN',
      lead_time_dias: null,
      vigencia_inicio: '',
      vigencia_fin: '',
      metodo: 'LOTE_MINIMO',
      tamano_lote_minimo: null,
      tamano_lote_maximo: null,
      multiplo_lote: null,
      cantidad_fija: null,
      unidad_lote: 'PCS',
    });
    this.capacidades.clear();
    this.capacidades.push(this.crearCapacidadForm());
    this.dialogVisible = true;
  }

  editar(opcion: OpcionAbastecimiento): void {
    this.editingId = opcion.id_opcion_abastecimiento;
    this.editando.set(true);
    this.error.set(null);
    this.form.reset({
      id_opcion_abastecimiento: opcion.id_opcion_abastecimiento,
      id_material: opcion.id_material,
      id_fuente: opcion.id_fuente,
      tipo: opcion.tipo,
      precio_unitario: opcion.precio_unitario,
      moneda: opcion.moneda,
      lead_time_dias: opcion.lead_time_dias,
      vigencia_inicio: opcion.vigencia_inicio,
      vigencia_fin: opcion.vigencia_fin,
      metodo: opcion.tamano_lote.metodo,
      tamano_lote_minimo: opcion.tamano_lote.tamano_lote_minimo ?? null,
      tamano_lote_maximo: opcion.tamano_lote.tamano_lote_maximo ?? null,
      multiplo_lote: opcion.tamano_lote.multiplo_lote ?? null,
      cantidad_fija: opcion.tamano_lote.cantidad_fija ?? null,
      unidad_lote: opcion.tamano_lote.unidad_medida,
    });
    this.capacidades.clear();
    for (const periodo of opcion.capacidad) {
      this.capacidades.push(this.crearCapacidadForm(periodo));
    }
    this.dialogVisible = true;
  }

  aplicarUnidad(idMaterial: string | null): void {
    if (!idMaterial) return;
    const material = this.store.materiales().find((item) => item.id_material === idMaterial);
    if (!material) return;
    this.form.patchValue({ unidad_lote: material.unidad_medida_planeacion });
    for (const control of this.capacidades.controls) {
      control.patchValue({ unidad_medida: material.unidad_medida_planeacion });
    }
  }

  agregarCapacidad(): void {
    this.capacidades.push(this.crearCapacidadForm());
  }

  quitarCapacidad(index: number): void {
    this.capacidades.removeAt(index);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Completa los campos obligatorios.');
      return;
    }

    const value = this.form.getRawValue();
    if (!value.id_material) {
      this.error.set('Selecciona un material.');
      return;
    }
    if (value.vigencia_inicio > value.vigencia_fin) {
      this.error.set('La vigencia fin debe ser posterior a la vigencia inicio.');
      return;
    }
    if (value.metodo === 'LOTE_FIJO' && !value.cantidad_fija) {
      this.error.set('Indica la cantidad fija del lote.');
      return;
    }
    if (value.metodo === 'LOTE_MINIMO' && !value.tamano_lote_minimo) {
      this.error.set('Indica el tamaño de lote mínimo.');
      return;
    }
    if (value.metodo === 'LOTE_MULTIPLO' && (!value.tamano_lote_minimo || !value.multiplo_lote)) {
      this.error.set('Indica el lote mínimo y el múltiplo.');
      return;
    }
    const capacidades = value.capacidades as CapacidadPeriodo[];
    if (capacidades.length === 0) {
      this.error.set('Agrega al menos un periodo de capacidad.');
      return;
    }
    if (capacidades.some((periodo) => !periodo.periodo_inicio || !periodo.periodo_fin)) {
      this.error.set('Completa las fechas de cada periodo de capacidad.');
      return;
    }

    const opcion: OpcionAbastecimiento = {
      id_opcion_abastecimiento: value.id_opcion_abastecimiento.trim(),
      id_material: value.id_material,
      tipo: value.tipo,
      id_fuente: value.id_fuente.trim(),
      precio_unitario: Number(value.precio_unitario ?? 0),
      moneda: value.moneda || 'MXN',
      lead_time_dias: Number(value.lead_time_dias ?? 0),
      vigencia_inicio: value.vigencia_inicio,
      vigencia_fin: value.vigencia_fin,
      tamano_lote: {
        metodo: value.metodo,
        unidad_medida: value.unidad_lote,
      },
      capacidad: capacidades.map((periodo) => ({
        periodo_inicio: periodo.periodo_inicio,
        periodo_fin: periodo.periodo_fin,
        cantidad: Number(periodo.cantidad ?? 0),
        unidad_medida: periodo.unidad_medida,
      })),
    };

    if (value.metodo === 'LOTE_FIJO') {
      opcion.tamano_lote.cantidad_fija = Number(value.cantidad_fija ?? 0);
    } else if (value.metodo === 'LOTE_MINIMO') {
      opcion.tamano_lote.tamano_lote_minimo = Number(value.tamano_lote_minimo ?? 0);
      opcion.tamano_lote.tamano_lote_maximo = Number(value.tamano_lote_maximo ?? 0);
    } else {
      opcion.tamano_lote.tamano_lote_minimo = Number(value.tamano_lote_minimo ?? 0);
      opcion.tamano_lote.tamano_lote_maximo = Number(value.tamano_lote_maximo ?? 0);
      opcion.tamano_lote.multiplo_lote = Number(value.multiplo_lote ?? 0);
    }

    if (this.editingId) {
      this.store.updateOpcion(this.editingId, opcion);
      this.toast.success('Opción actualizada');
    } else {
      this.store.addOpcion(opcion);
      this.toast.success('Opción agregada');
    }
    this.dialogVisible = false;
  }

  eliminar(opcion: OpcionAbastecimiento): void {
    this.store.removeOpcion(opcion.id_opcion_abastecimiento);
    this.toast.info('Opción eliminada');
  }
}
