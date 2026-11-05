import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastService } from '../../../../core/services/toast.service';
import { FormLabelComponent } from '../../../../shared/components/form-label/form-label.component';
import {
  CRITERIOS_SELECCION,
  CriterioSeleccion,
  Material,
  TIPOS_MATERIAL,
  TipoMaterial,
  UNIDADES_MEDIDA,
} from '../../models/mrp.model';
import { MrpStore } from '../../store/mrp.store';
import { nextId } from '../../utils/mrp-ids';

@Component({
  selector: 'app-materiales-tab',
  imports: [
    ReactiveFormsModule,
    ButtonDirective,
    CheckboxModule,
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
          <h3 class="text-sm font-semibold text-slate-800">Materiales e insumos</h3>
          <p class="text-xs text-slate-500">Materias primas y componentes que consumen los modelos.</p>
        </div>
        <button pButton type="button" size="small" severity="success" (click)="abrirNuevo()">
          Nuevo material
        </button>
      </div>

      <p-table [value]="store.insumos()" [paginator]="true" [rows]="10" [tableStyle]="{ 'min-width': '64rem' }">
        <ng-template #header>
          <tr>
            <th>ID</th>
            <th>Descripción</th>
            <th>Tipo</th>
            <th>UM planeación</th>
            <th>UM compra</th>
            <th>Factor</th>
            <th>Criterio</th>
            <th>Habilitado</th>
            <th class="w-32"></th>
          </tr>
        </ng-template>
        <ng-template #body let-material>
          <tr>
            <td class="font-mono text-xs">{{ material.id_material }}</td>
            <td>{{ material.descripcion }}</td>
            <td>
              <p-tag [value]="etiquetaTipo(material.tipo_material)" [severity]="severidadTipo(material.tipo_material)" />
            </td>
            <td>{{ material.unidad_medida_planeacion }}</td>
            <td>{{ material.unidad_medida_compra || '—' }}</td>
            <td>{{ material.factor_conversion_compra ?? '—' }}</td>
            <td>{{ etiquetaCriterio(material.criterio_seleccion) }}</td>
            <td>{{ material.planeacion_habilitada ? 'Sí' : 'No' }}</td>
            <td>
              <div class="flex justify-end gap-1">
                <button pButton type="button" text size="small" (click)="editar(material)">Editar</button>
                <button pButton type="button" text size="small" severity="danger" (click)="eliminar(material)">
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="9" class="py-8 text-center text-sm text-slate-500">
              No hay materiales. Agrega el primero o carga el ejemplo.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </section>

    <p-dialog
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="{ width: '38rem' }"
      [header]="editando() ? 'Editar material' : 'Nuevo material'"
    >
      <form [formGroup]="form" class="grid gap-3 sm:grid-cols-2" (ngSubmit)="guardar()">
        <div>
          <app-form-label required>ID material</app-form-label>
          <input pInputText formControlName="id_material" class="w-full" />
        </div>
        <div>
          <app-form-label required>Tipo</app-form-label>
          <p-select formControlName="tipo_material" [options]="tipos" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div class="sm:col-span-2">
          <app-form-label required>Descripción</app-form-label>
          <input pInputText formControlName="descripcion" class="w-full" />
        </div>
        <div>
          <app-form-label required>UM planeación</app-form-label>
          <p-select formControlName="unidad_medida_planeacion" [options]="unidades" [editable]="true" class="w-full" />
        </div>
        <div>
          <app-form-label>UM compra</app-form-label>
          <p-select formControlName="unidad_medida_compra" [options]="unidades" [editable]="true" [showClear]="true" class="w-full" />
        </div>
        <div>
          <app-form-label>Factor de conversión compra</app-form-label>
          <input pInputText type="number" step="any" formControlName="factor_conversion_compra" class="w-full" />
        </div>
        <div>
          <app-form-label required>Criterio de selección</app-form-label>
          <p-select formControlName="criterio_seleccion" [options]="criterios" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div class="flex items-center gap-2 pt-6">
          <p-checkbox formControlName="planeacion_habilitada" [binary]="true" inputId="habilitado" />
          <label for="habilitado" class="text-sm text-slate-700">Planeación habilitada</label>
        </div>
        <div class="mt-2 flex justify-end gap-2 sm:col-span-2">
          <button pButton type="button" text severity="secondary" (click)="dialogVisible = false">Cancelar</button>
          <button pButton type="submit" severity="success">Guardar</button>
        </div>
      </form>
    </p-dialog>
  `,
})
export class MaterialesTabComponent {
  readonly store = inject(MrpStore);
  private readonly toast = inject(ToastService);

  readonly tipos = TIPOS_MATERIAL;
  readonly criterios = CRITERIOS_SELECCION;
  readonly unidades = UNIDADES_MEDIDA;

  dialogVisible = false;
  readonly editando = () => this.editingId !== null;
  private editingId: string | null = null;

  readonly form = new FormGroup({
    id_material: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipo_material: new FormControl<TipoMaterial>('MATERIA_PRIMA', { nonNullable: true }),
    unidad_medida_planeacion: new FormControl('PCS', { nonNullable: true, validators: [Validators.required] }),
    unidad_medida_compra: new FormControl<string | null>(null),
    factor_conversion_compra: new FormControl<number | null>(null),
    criterio_seleccion: new FormControl<CriterioSeleccion>('PRECIO_MAS_BAJO', { nonNullable: true }),
    planeacion_habilitada: new FormControl(true, { nonNullable: true }),
  });

  abrirNuevo(): void {
    this.editingId = null;
    const id = nextId(
      'MAT',
      this.store.materiales().map((material) => material.id_material),
    );
    this.form.reset({
      id_material: id,
      descripcion: '',
      tipo_material: 'MATERIA_PRIMA',
      unidad_medida_planeacion: 'PCS',
      unidad_medida_compra: null,
      factor_conversion_compra: null,
      criterio_seleccion: 'PRECIO_MAS_BAJO',
      planeacion_habilitada: true,
    });
    this.dialogVisible = true;
  }

  editar(material: Material): void {
    this.editingId = material.id_material;
    this.form.reset({
      ...material,
      unidad_medida_compra: material.unidad_medida_compra ?? null,
      factor_conversion_compra: material.factor_conversion_compra ?? null,
    });
    this.dialogVisible = true;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const material: Material = {
      id_material: value.id_material.trim(),
      descripcion: value.descripcion.trim(),
      tipo_material: value.tipo_material,
      unidad_medida_planeacion: value.unidad_medida_planeacion,
      criterio_seleccion: value.criterio_seleccion,
      planeacion_habilitada: value.planeacion_habilitada,
    };
    if (value.unidad_medida_compra?.trim()) {
      material.unidad_medida_compra = value.unidad_medida_compra.trim();
    }
    if (value.factor_conversion_compra !== null && value.factor_conversion_compra !== undefined) {
      material.factor_conversion_compra = Number(value.factor_conversion_compra);
    }

    if (this.editingId) {
      this.store.updateMaterial(this.editingId, material);
      this.toast.success('Material actualizado');
    } else {
      this.store.addMaterial(material);
      this.toast.success('Material agregado');
    }
    this.dialogVisible = false;
  }

  eliminar(material: Material): void {
    this.store.removeMaterial(material.id_material);
    this.toast.info('Material eliminado');
  }

  etiquetaTipo(tipo: TipoMaterial): string {
    return TIPOS_MATERIAL.find((item) => item.value === tipo)?.label ?? tipo;
  }

  severidadTipo(tipo: TipoMaterial): 'success' | 'info' | 'warn' {
    if (tipo === 'MATERIA_PRIMA') return 'success';
    if (tipo === 'COMPONENTE') return 'info';
    return 'warn';
  }

  etiquetaCriterio(criterio: CriterioSeleccion): string {
    return CRITERIOS_SELECCION.find((item) => item.value === criterio)?.label ?? criterio;
  }
}
