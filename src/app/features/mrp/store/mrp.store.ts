import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { LocalStorageService } from '../../../core/services/storage.service';
import { MRP_EJEMPLO } from '../data/mrp-ejemplo';
import {
  BomFila,
  ConversionUnidad,
  Demanda,
  Ejecucion,
  InventarioItem,
  Material,
  MrpPayload,
  MrpState,
  OpcionAbastecimiento,
  SuministroProgramado,
  crearEstadoInicial,
  esModelo,
} from '../models/mrp.model';
import { MrpService } from '../services/mrp.service';
import { buildPayload, validarPayload } from '../utils/mrp-payload';

const STORAGE_KEY = 'mrp_state';

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}

export const MrpStore = signalStore(
  { providedIn: 'root' },
  withState<MrpState>(() => {
    const storage = inject(LocalStorageService);
    const guardado = storage.get<Partial<MrpState>>(STORAGE_KEY);
    return guardado ? { ...crearEstadoInicial(), ...guardado } : crearEstadoInicial();
  }),
  withComputed((store) => ({
    modelos: computed(() => store.materiales().filter(esModelo)),
    insumos: computed(() => store.materiales().filter((material) => !esModelo(material))),
    totalDemanda: computed(() =>
      store.demandas().reduce((total, demanda) => total + Number(demanda.cantidad || 0), 0),
    ),
  })),
  withMethods(
    (store, storage = inject(LocalStorageService), mrpService = inject(MrpService)) => {
      function snapshot(): MrpState {
        return {
          version: store.version(),
          idEjecucion: store.idEjecucion(),
          ejecucion: store.ejecucion(),
          conversiones: store.conversiones(),
          materiales: store.materiales(),
          demandas: store.demandas(),
          bom: store.bom(),
          inventario: store.inventario(),
          suministros: store.suministros(),
          opciones: store.opciones(),
          ultimoPayload: store.ultimoPayload(),
          ultimaRespuesta: store.ultimaRespuesta(),
          loading: store.loading(),
          error: store.error(),
        };
      }

      function persistir(): void {
        storage.set(STORAGE_KEY, {
          version: store.version(),
          idEjecucion: store.idEjecucion(),
          ejecucion: store.ejecucion(),
          conversiones: store.conversiones(),
          materiales: store.materiales(),
          demandas: store.demandas(),
          bom: store.bom(),
          inventario: store.inventario(),
          suministros: store.suministros(),
          opciones: store.opciones(),
          ultimoPayload: store.ultimoPayload(),
          ultimaRespuesta: store.ultimaRespuesta(),
        });
      }

      function actualizar<T>(
        items: T[],
        predicate: (item: T) => boolean,
        reemplazo: T,
      ): T[] {
        return items.map((item) => (predicate(item) ? reemplazo : item));
      }

      return {
        snapshot,

        setGeneral(patch: { version?: string; idEjecucion?: string }): void {
          patchState(store, patch);
          persistir();
        },

        setEjecucion(patch: Partial<Ejecucion>): void {
          patchState(store, { ejecucion: { ...store.ejecucion(), ...patch } });
          persistir();
        },

        setConversiones(items: ConversionUnidad[]): void {
          patchState(store, { conversiones: items });
          persistir();
        },

        addConversion(item: ConversionUnidad): void {
          patchState(store, { conversiones: [...store.conversiones(), item] });
          persistir();
        },

        updateConversion(index: number, item: ConversionUnidad): void {
          patchState(store, {
            conversiones: store.conversiones().map((c, i) => (i === index ? item : c)),
          });
          persistir();
        },

        removeConversion(index: number): void {
          patchState(store, { conversiones: store.conversiones().filter((_, i) => i !== index) });
          persistir();
        },

        addMaterial(item: Material): void {
          patchState(store, { materiales: [...store.materiales(), item] });
          persistir();
        },

        updateMaterial(id: string, item: Material): void {
          patchState(store, {
            materiales: actualizar(store.materiales(), (m) => m.id_material === id, item),
            demandas: store.demandas().map((d) =>
              d.id_producto === id ? { ...d, id_producto: item.id_material } : d,
            ),
            bom: store.bom().map((b) =>
              b.id_producto === id
                ? { ...b, id_producto: item.id_material }
                : b.id_material === id
                  ? { ...b, id_material: item.id_material, unidad_medida_planeacion: item.unidad_medida_planeacion }
                  : b,
            ),
            inventario: store.inventario().map((i) =>
              i.id_material === id ? { ...i, id_material: item.id_material } : i,
            ),
            suministros: store.suministros().map((s) =>
              s.id_material === id ? { ...s, id_material: item.id_material } : s,
            ),
            opciones: store.opciones().map((o) =>
              o.id_material === id ? { ...o, id_material: item.id_material } : o,
            ),
          });
          persistir();
        },

        removeMaterial(id: string): void {
          patchState(store, {
            materiales: store.materiales().filter((m) => m.id_material !== id),
            demandas: store.demandas().filter((d) => d.id_producto !== id),
            bom: store.bom().filter((b) => b.id_producto !== id && b.id_material !== id),
            inventario: store.inventario().filter((i) => i.id_material !== id),
            suministros: store.suministros().filter((s) => s.id_material !== id),
            opciones: store.opciones().filter((o) => o.id_material !== id),
          });
          persistir();
        },

        addDemanda(item: Demanda): void {
          patchState(store, { demandas: [...store.demandas(), item] });
          persistir();
        },

        updateDemanda(id: string, item: Demanda): void {
          patchState(store, {
            demandas: actualizar(store.demandas(), (d) => d.id_demanda === id, item),
          });
          persistir();
        },

        removeDemanda(id: string): void {
          patchState(store, { demandas: store.demandas().filter((d) => d.id_demanda !== id) });
          persistir();
        },

        addBom(item: BomFila): void {
          patchState(store, { bom: [...store.bom(), item] });
          persistir();
        },

        updateBom(id: string, item: BomFila): void {
          patchState(store, {
            bom: actualizar(store.bom(), (b) => b.id_fila_origen === id, item),
          });
          persistir();
        },

        removeBom(id: string): void {
          patchState(store, { bom: store.bom().filter((b) => b.id_fila_origen !== id) });
          persistir();
        },

        addInventario(item: InventarioItem): void {
          patchState(store, { inventario: [...store.inventario(), item] });
          persistir();
        },

        updateInventario(id: string, item: InventarioItem): void {
          patchState(store, {
            inventario: actualizar(store.inventario(), (i) => i.id_material === id, item),
          });
          persistir();
        },

        removeInventario(id: string): void {
          patchState(store, { inventario: store.inventario().filter((i) => i.id_material !== id) });
          persistir();
        },

        addSuministro(item: SuministroProgramado): void {
          patchState(store, { suministros: [...store.suministros(), item] });
          persistir();
        },

        updateSuministro(id: string, item: SuministroProgramado): void {
          patchState(store, {
            suministros: actualizar(store.suministros(), (s) => s.id_suministro === id, item),
          });
          persistir();
        },

        removeSuministro(id: string): void {
          patchState(store, { suministros: store.suministros().filter((s) => s.id_suministro !== id) });
          persistir();
        },

        addOpcion(item: OpcionAbastecimiento): void {
          patchState(store, { opciones: [...store.opciones(), item] });
          persistir();
        },

        updateOpcion(id: string, item: OpcionAbastecimiento): void {
          patchState(store, {
            opciones: actualizar(
              store.opciones(),
              (o) => o.id_opcion_abastecimiento === id,
              item,
            ),
          });
          persistir();
        },

        removeOpcion(id: string): void {
          patchState(store, {
            opciones: store.opciones().filter((o) => o.id_opcion_abastecimiento !== id),
          });
          persistir();
        },

        cargarEjemplo(): void {
          const ejemplo = clonar(MRP_EJEMPLO);
          patchState(store, {
            version: ejemplo.version,
            idEjecucion: ejemplo.id_ejecucion,
            ejecucion: ejemplo.ejecucion,
            conversiones: ejemplo.conversiones_unidad,
            materiales: ejemplo.materiales,
            demandas: ejemplo.demandas,
            bom: ejemplo.bom_plano,
            inventario: ejemplo.inventario,
            suministros: ejemplo.suministros_programados,
            opciones: ejemplo.opciones_abastecimiento,
            ultimoPayload: null,
            ultimaRespuesta: null,
            error: null,
          });
          persistir();
        },

        limpiar(): void {
          patchState(store, crearEstadoInicial());
          storage.remove(STORAGE_KEY);
        },

        construirPayload(): MrpPayload {
          return buildPayload(snapshot());
        },

        validar(): string[] {
          return validarPayload(buildPayload(snapshot()));
        },

        async ejecutar(): Promise<boolean> {
          const payload = buildPayload(snapshot());
          const errores = validarPayload(payload);
          if (errores.length > 0) {
            patchState(store, { ultimoPayload: payload, error: errores[0] });
            return false;
          }

          patchState(store, {
            ultimoPayload: payload,
            loading: true,
            error: null,
          });
          persistir();

          try {
            const respuesta = await firstValueFrom(mrpService.ejecutar(payload));
            patchState(store, {
              ultimaRespuesta: respuesta ?? null,
              loading: false,
              error: null,
            });
            persistir();
            return true;
          } catch (error: any) {
            patchState(store, {
              loading: false,
              error:
                error?.error?.detail ||
                error?.error?.mensaje ||
                error?.message ||
                'No se pudo ejecutar el motor MRP.',
            });
            persistir();
            return false;
          }
        },
      };
    },
  ),
);
