export type TipoMaterial = 'MATERIA_PRIMA' | 'COMPONENTE' | 'PRODUCTO_TERMINADO';
export type CriterioSeleccion = 'PRECIO_MAS_BAJO' | 'LEAD_TIME_MAS_CORTO';
export type ModoPlanificacion = 'CONJUNTA' | 'INDEPENDIENTE';
export type TipoOrigenDemanda = 'PEDIDO' | 'PRONOSTICO' | 'REPOSICION';
export type TipoAbastecimiento = 'COMPRA' | 'FABRICACION';
export type MetodoLote = 'LOTE_FIJO' | 'LOTE_MINIMO' | 'LOTE_MULTIPLO';

export interface ConversionUnidad {
  unidad_origen: string;
  unidad_destino: string;
  factor: number;
}

export interface Material {
  id_material: string;
  descripcion: string;
  unidad_medida_planeacion: string;
  unidad_medida_compra?: string;
  factor_conversion_compra?: number;
  tipo_material: TipoMaterial;
  planeacion_habilitada: boolean;
  criterio_seleccion: CriterioSeleccion;
}

export interface Demanda {
  id_demanda: string;
  tipo_origen: TipoOrigenDemanda;
  id_fuente: string;
  id_producto: string;
  cantidad: number;
  unidad_medida: string;
  fecha_requerida: string;
}

export interface BomFila {
  id_fila_origen: string;
  id_producto: string;
  id_material: string;
  cantidad: number;
  unidad_medida: string;
  unidad_medida_planeacion: string;
}

export interface InventarioItem {
  id_material: string;
  cantidad_existente: number;
  cantidad_reservada: number;
  cantidad_stock_seguridad: number;
  unidad_medida: string;
}

export interface SuministroProgramado {
  id_suministro: string;
  id_material: string;
  tipo: TipoAbastecimiento;
  id_fuente: string;
  cantidad: number;
  unidad_medida: string;
  fecha_esperada: string;
}

export interface TamanoLote {
  metodo: MetodoLote;
  tamano_lote_minimo?: number;
  tamano_lote_maximo?: number;
  multiplo_lote?: number;
  cantidad_fija?: number;
  unidad_medida: string;
}

export interface CapacidadPeriodo {
  periodo_inicio: string;
  periodo_fin: string;
  cantidad: number;
  unidad_medida: string;
}

export interface OpcionAbastecimiento {
  id_opcion_abastecimiento: string;
  id_material: string;
  tipo: TipoAbastecimiento;
  id_fuente: string;
  precio_unitario: number;
  moneda: string;
  lead_time_dias: number;
  vigencia_inicio: string;
  vigencia_fin: string;
  tamano_lote: TamanoLote;
  capacidad: CapacidadPeriodo[];
}

export interface Ejecucion {
  fecha_planificacion: string;
  fecha_fin_horizonte: string;
  modo_planificacion: ModoPlanificacion;
  descripcion: string;
}

export interface MrpPayload {
  version: string;
  id_ejecucion: string;
  ejecucion: Ejecucion;
  conversiones_unidad: ConversionUnidad[];
  materiales: Material[];
  demandas: Demanda[];
  bom_plano: BomFila[];
  inventario: InventarioItem[];
  suministros_programados: SuministroProgramado[];
  opciones_abastecimiento: OpcionAbastecimiento[];
}

export interface MrpState {
  version: string;
  idEjecucion: string;
  ejecucion: Ejecucion;
  conversiones: ConversionUnidad[];
  materiales: Material[];
  demandas: Demanda[];
  bom: BomFila[];
  inventario: InventarioItem[];
  suministros: SuministroProgramado[];
  opciones: OpcionAbastecimiento[];
  ultimoPayload: MrpPayload | null;
  ultimaRespuesta: unknown | null;
  loading: boolean;
  error: string | null;
}

export const TIPOS_MATERIAL: { label: string; value: TipoMaterial }[] = [
  { label: 'Materia prima', value: 'MATERIA_PRIMA' },
  { label: 'Componente', value: 'COMPONENTE' },
  { label: 'Producto terminado', value: 'PRODUCTO_TERMINADO' },
];

export const CRITERIOS_SELECCION: { label: string; value: CriterioSeleccion }[] = [
  { label: 'Precio más bajo', value: 'PRECIO_MAS_BAJO' },
  { label: 'Lead time más corto', value: 'LEAD_TIME_MAS_CORTO' },
];

export const MODOS_PLANIFICACION: { label: string; value: ModoPlanificacion }[] = [
  { label: 'Conjunta', value: 'CONJUNTA' },
  { label: 'Independiente', value: 'INDEPENDIENTE' },
];

export const TIPOS_ORIGEN_DEMANDA: { label: string; value: TipoOrigenDemanda }[] = [
  { label: 'Pedido', value: 'PEDIDO' },
  { label: 'Pronóstico', value: 'PRONOSTICO' },
  { label: 'Reposición', value: 'REPOSICION' },
];

export const TIPOS_ABASTECIMIENTO: { label: string; value: TipoAbastecimiento }[] = [
  { label: 'Compra', value: 'COMPRA' },
  { label: 'Fabricación', value: 'FABRICACION' },
];

export const METODOS_LOTE: { label: string; value: MetodoLote }[] = [
  { label: 'Lote fijo', value: 'LOTE_FIJO' },
  { label: 'Lote mínimo', value: 'LOTE_MINIMO' },
  { label: 'Lote múltiplo', value: 'LOTE_MULTIPLO' },
];

export const UNIDADES_MEDIDA = [
  'PAR',
  'PCS',
  'M2',
  'M',
  'KG',
  'L',
  'ML',
  'CM',
  'MM',
  'G',
  'DM2',
  'PIEZA',
  'ROLLO',
  'CAJA',
  'PAQUETE',
  'CONO',
  'BOLSA',
  'CUBETA',
];

export function esModelo(material: Material): boolean {
  return material.tipo_material === 'PRODUCTO_TERMINADO';
}

export function crearEstadoInicial(): MrpState {
  const hoy = new Date();
  const fecha = hoy.toISOString().slice(0, 10);
  const fin = new Date(hoy);
  fin.setMonth(fin.getMonth() + 3);

  return {
    version: '1.0',
    idEjecucion: `MRP-${fecha.replaceAll('-', '')}-0001`,
    ejecucion: {
      fecha_planificacion: fecha,
      fecha_fin_horizonte: fin.toISOString().slice(0, 10),
      modo_planificacion: 'CONJUNTA',
      descripcion: '',
    },
    conversiones: [],
    materiales: [],
    demandas: [],
    bom: [],
    inventario: [],
    suministros: [],
    opciones: [],
    ultimoPayload: null,
    ultimaRespuesta: null,
    loading: false,
    error: null,
  };
}
