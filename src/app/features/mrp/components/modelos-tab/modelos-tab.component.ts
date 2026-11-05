import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastService } from '../../../../core/services/toast.service';
import { FormLabelComponent } from '../../../../shared/components/form-label/form-label.component';
import {
  BomFila,
  CRITERIOS_SELECCION,
  CriterioSeleccion,
  Material,
  UNIDADES_MEDIDA,
} from '../../models/mrp.model';
import { MrpStore } from '../../store/mrp.store';
import { nextId } from '../../utils/mrp-ids';

@Component({
  selector: 'app-modelos-tab',
  imports: [
    ReactiveFormsModule,
    ButtonDirective,
    CheckboxModule,
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
          <h3 class="text-sm font-semibold text-slate-800">Modelos / productos terminados</h3>
          <p class="text-xs text-slate-500">Cada modelo tiene una lista de materiales (BOM) con cantidades.</p>
        </div>
        <button pButton type="button" size="small" severity="success" (click)="abrirNuevoModelo()">
          Nuevo modelo
        </button>
      </div>

      <p-table [value]="store.modelos()" [paginator]="true" [rows]="10" [tableStyle]="{ 'min-width': '48rem' }">
        <ng-template #header>
          <tr>
            <th>ID</th>
            <th>Descripción</th>
            <th>UM</th>
            <th>Criterio</th>
            <th>Materiales</th>
            <th class="w-52"></th>
          </tr>
        </ng-template>
        <ng-template #body let-modelo>
          <tr>
            <td class="font-mono text-xs">{{ modelo.id_material }}</td>
            <td>{{ modelo.descripcion }}</td>
            <td>{{ modelo.unidad_medida_planeacion }}</td>
            <td>{{ etiquetaCriterio(modelo.criterio_seleccion) }}</td>
            <td>{{ filasBom(modelo.id_material).length }} materiales</td>
            <td>
              <div class="flex justify-end gap-1">
                <button pButton type="button" text size="small" (click)="abrirBom(modelo)">BOM</button>
                <button pButton type="button" text size="small" (click)="editarModelo(modelo)">Editar</button>
                <button pButton type="button" text size="small" severity="danger" (click)="eliminarModelo(modelo)">
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="6" class="py-8 text-center text-sm text-slate-500">
              No hay modelos. Crea el primero o carga el ejemplo.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </section>

    <p-dialog
      [(visible)]="modeloDialogVisible"
      [modal]="true"
      [style]="{ width: '38rem' }"
      [header]="editandoModelo() ? 'Editar modelo' : 'Nuevo modelo'"
    >
      <form [formGroup]="modeloForm" class="grid gap-3 sm:grid-cols-2" (ngSubmit)="guardarModelo()">
        <div>
          <app-form-label required>ID modelo</app-form-label>
          <input pInputText formControlName="id_material" class="w-full" />
        </div>
        <div>
          <app-form-label required>UM planeación</app-form-label>
          <p-select formControlName="unidad_medida_planeacion" [options]="unidades" [editable]="true" class="w-full" />
        </div>
        <div class="sm:col-span-2">
          <app-form-label required>Descripción</app-form-label>
          <input pInputText formControlName="descripcion" class="w-full" />
        </div>
        <div>
          <app-form-label required>Criterio de selección</app-form-label>
          <p-select formControlName="criterio_seleccion" [options]="criterios" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div class="flex items-center gap-2 pt-6">
          <p-checkbox formControlName="planeacion_habilitada" [binary]="true" inputId="modeloHabilitado" />
          <label for="modeloHabilitado" class="text-sm text-slate-700">Planeación habilitada</label>
        </div>
        <div class="mt-2 flex justify-end gap-2 sm:col-span-2">
          <button pButton type="button" text severity="secondary" (click)="modeloDialogVisible = false">Cancelar</button>
          <button pButton type="submit" severity="success">Guardar</button>
        </div>
      </form>
    </p-dialog>

    <p-dialog
      [(visible)]="bomDialogVisible"
      [modal]="true"
      [style]="{ width: '52rem' }"
      [header]="'BOM · ' + (modeloSeleccionado()?.descripcion ?? '')"
    >
      <form [formGroup]="bomForm" class="grid items-end gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]" (ngSubmit)="guardarBom()">
        <div>
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
          <app-form-label required>Cantidad</app-form-label>
          <input pInputText type="number" step="any" formControlName="cantidad" class="w-full" />
        </div>
        <div>
          <app-form-label>UM</app-form-label>
          <input pInputText formControlName="unidad_medida" class="w-full" readonly />
        </div>
        <button pButton type="submit" severity="success">
          {{ editandoBom() ? 'Actualizar' : 'Agregar' }}
        </button>
      </form>

      @if (errorBom()) {
        <p class="mt-2 text-xs text-rose-600">{{ errorBom() }}</p>
      }

      <p-table class="mt-4" [value]="filasBom(modeloSeleccionado()?.id_material ?? '')" [tableStyle]="{ 'min-width': '34rem' }">
        <ng-template #header>
          <tr>
            <th>Material</th>
            <th>Cantidad</th>
            <th>UM</th>
            <th class="w-32"></th>
          </tr>
        </ng-template>
        <ng-template #body let-fila>
          <tr>
            <td>
              <span class="font-mono text-xs">{{ fila.id_material }}</span>
              <span class="ml-2 text-sm">{{ nombreMaterial(fila.id_material) }}</span>
            </td>
            <td>{{ fila.cantidad }}</td>
            <td>{{ fila.unidad_medida }}</td>
            <td>
              <div class="flex justify-end gap-1">
                <button pButton type="button" text size="small" (click)="editarBom(fila)">Editar</button>
                <button pButton type="button" text size="small" severity="danger" (click)="eliminarBom(fila)">Quitar</button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="4" class="py-6 text-center text-sm text-slate-500">Este modelo aún no tiene materiales.</td>
          </tr>
        </ng-template>
      </p-table>

      <div class="mt-4 flex justify-end">
        <button pButton type="button" severity="secondary" (click)="bomDialogVisible = false">Cerrar</button>
      </div>
    </p-dialog>
  `,
})
export class ModelosTabComponent {
  readonly store = inject(MrpStore);
  private readonly toast = inject(ToastService);

  readonly criterios = CRITERIOS_SELECCION;
  readonly unidades = UNIDADES_MEDIDA;

  readonly materialesOptions = computed(() =>
    this.store.insumos().map((material) => ({
      label: `${material.id_material} — ${material.descripcion}`,
      value: material.id_material,
    })),
  );

  modeloDialogVisible = false;
  bomDialogVisible = false;
  readonly editandoModelo = signal(false);
  readonly editandoBom = signal(false);
  readonly modeloSeleccionado = signal<Material | null>(null);
  readonly errorBom = signal<string | null>(null);
  private editingModeloId: string | null = null;
  private editingBomId: string | null = null;

  readonly modeloForm = new FormGroup({
    id_material: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    unidad_medida_planeacion: new FormControl('PAR', { nonNullable: true, validators: [Validators.required] }),
    criterio_seleccion: new FormControl<CriterioSeleccion>('LEAD_TIME_MAS_CORTO', { nonNullable: true }),
    planeacion_habilitada: new FormControl(true, { nonNullable: true }),
  });

  readonly bomForm = new FormGroup({
    id_material: new FormControl<string | null>(null, { validators: [Validators.required] }),
    cantidad: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.000001)],
    }),
    unidad_medida: new FormControl('', { nonNullable: true }),
  });

  filasBom(idProducto: string): BomFila[] {
    return this.store.bom().filter((fila) => fila.id_producto === idProducto);
  }

  nombreMaterial(idMaterial: string): string {
    return this.store.materiales().find((material) => material.id_material === idMaterial)?.descripcion ?? idMaterial;
  }

  abrirNuevoModelo(): void {
    this.editingModeloId = null;
    this.editandoModelo.set(false);
    const id = nextId(
      'PROD',
      this.store.materiales().map((material) => material.id_material),
    );
    this.modeloForm.reset({
      id_material: id,
      descripcion: '',
      unidad_medida_planeacion: 'PAR',
      criterio_seleccion: 'LEAD_TIME_MAS_CORTO',
      planeacion_habilitada: true,
    });
    this.modeloDialogVisible = true;
  }

  editarModelo(modelo: Material): void {
    this.editingModeloId = modelo.id_material;
    this.editandoModelo.set(true);
    this.modeloForm.reset({
      id_material: modelo.id_material,
      descripcion: modelo.descripcion,
      unidad_medida_planeacion: modelo.unidad_medida_planeacion,
      criterio_seleccion: modelo.criterio_seleccion,
      planeacion_habilitada: modelo.planeacion_habilitada,
    });
    this.modeloDialogVisible = true;
  }

  guardarModelo(): void {
    if (this.modeloForm.invalid) {
      this.modeloForm.markAllAsTouched();
      return;
    }
    const value = this.modeloForm.getRawValue();
    const modelo: Material = {
      id_material: value.id_material.trim(),
      descripcion: value.descripcion.trim(),
      unidad_medida_planeacion: value.unidad_medida_planeacion,
      tipo_material: 'PRODUCTO_TERMINADO',
      criterio_seleccion: value.criterio_seleccion,
      planeacion_habilitada: value.planeacion_habilitada,
    };

    if (this.editingModeloId) {
      this.store.updateMaterial(this.editingModeloId, modelo);
      this.toast.success('Modelo actualizado');
    } else {
      this.store.addMaterial(modelo);
      this.toast.success('Modelo agregado');
    }
    this.modeloDialogVisible = false;
  }

  eliminarModelo(modelo: Material): void {
    this.store.removeMaterial(modelo.id_material);
    this.toast.info('Modelo eliminado junto con su BOM');
  }

  abrirBom(modelo: Material): void {
    this.modeloSeleccionado.set(modelo);
    this.editandoBom.set(false);
    this.editingBomId = null;
    this.errorBom.set(null);
    this.bomForm.reset({ id_material: null, cantidad: null, unidad_medida: '' });
    this.bomDialogVisible = true;
  }

  aplicarUnidad(idMaterial: string | null): void {
    if (!idMaterial) return;
    const material = this.store.materiales().find((item) => item.id_material === idMaterial);
    this.bomForm.patchValue({ unidad_medida: material?.unidad_medida_planeacion ?? '' });
  }

  editarBom(fila: BomFila): void {
    this.editingBomId = fila.id_fila_origen;
    this.editandoBom.set(true);
    this.errorBom.set(null);
    this.bomForm.reset({
      id_material: fila.id_material,
      cantidad: fila.cantidad,
      unidad_medida: fila.unidad_medida,
    });
  }

  guardarBom(): void {
    if (this.bomForm.invalid) {
      this.bomForm.markAllAsTouched();
      return;
    }
    const modelo = this.modeloSeleccionado();
    if (!modelo) return;

    const value = this.bomForm.getRawValue();
    const idMaterial = value.id_material!;
    const material = this.store.materiales().find((item) => item.id_material === idMaterial);

    const fila: BomFila = {
      id_fila_origen:
        this.editingBomId ??
        nextId(
          'BOM',
          this.store.bom().map((item) => item.id_fila_origen),
        ),
      id_producto: modelo.id_material,
      id_material: idMaterial,
      cantidad: Number(value.cantidad ?? 0),
      unidad_medida: value.unidad_medida || material?.unidad_medida_planeacion || '',
      unidad_medida_planeacion: material?.unidad_medida_planeacion ?? value.unidad_medida,
    };

    const duplicado = this.store
      .bom()
      .some(
        (item) =>
          item.id_producto === modelo.id_material &&
          item.id_material === idMaterial &&
          item.id_fila_origen !== this.editingBomId,
      );
    if (duplicado) {
      this.errorBom.set('Ese material ya está asignado al modelo.');
      return;
    }

    if (this.editingBomId) {
      this.store.updateBom(this.editingBomId, fila);
      this.toast.success('Material actualizado en el BOM');
    } else {
      this.store.addBom(fila);
      this.toast.success('Material agregado al BOM');
    }

    this.editingBomId = null;
    this.editandoBom.set(false);
    this.errorBom.set(null);
    this.bomForm.reset({ id_material: null, cantidad: null, unidad_medida: '' });
  }

  eliminarBom(fila: BomFila): void {
    this.store.removeBom(fila.id_fila_origen);
    this.toast.info('Material quitado del BOM');
  }

  etiquetaCriterio(criterio: CriterioSeleccion): string {
    return CRITERIOS_SELECCION.find((item) => item.value === criterio)?.label ?? criterio;
  }
}
