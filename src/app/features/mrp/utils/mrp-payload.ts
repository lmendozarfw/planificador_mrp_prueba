import {
  BomFila,
  CapacidadPeriodo,
  ConversionUnidad,
  Demanda,
  InventarioItem,
  Material,
  MrpPayload,
  MrpState,
  OpcionAbastecimiento,
  SuministroProgramado,
  TamanoLote,
} from '../models/mrp.model';

function limpiarMaterial(material: Material): Material {
  const salida: Material = {
    id_material: material.id_material.trim(),
    descripcion: material.descripcion.trim(),
    unidad_medida_planeacion: material.unidad_medida_planeacion,
    tipo_material: material.tipo_material,
    planeacion_habilitada: material.planeacion_habilitada,
    criterio_seleccion: material.criterio_seleccion,
  };

  if (material.unidad_medida_compra?.trim()) {
    salida.unidad_medida_compra = material.unidad_medida_compra.trim();
  }
  if (material.factor_conversion_compra !== undefined && material.factor_conversion_compra !== null) {
    salida.factor_conversion_compra = Number(material.factor_conversion_compra);
  }

  return salida;
}

function limpiarLote(lote: TamanoLote): TamanoLote {
  const salida: TamanoLote = {
    metodo: lote.metodo,
    unidad_medida: lote.unidad_medida,
  };

  if (lote.metodo === 'LOTE_FIJO') {
    salida.cantidad_fija = Number(lote.cantidad_fija ?? 0);
  }
  if (lote.metodo === 'LOTE_MINIMO' || lote.metodo === 'LOTE_MULTIPLO') {
    salida.tamano_lote_minimo = Number(lote.tamano_lote_minimo ?? 0);
    salida.tamano_lote_maximo = Number(lote.tamano_lote_maximo ?? 0);
  }
  if (lote.metodo === 'LOTE_MULTIPLO') {
    salida.multiplo_lote = Number(lote.multiplo_lote ?? 0);
  }

  return salida;
}

function limpiarOpcion(opcion: OpcionAbastecimiento): OpcionAbastecimiento {
  return {
    id_opcion_abastecimiento: opcion.id_opcion_abastecimiento.trim(),
    id_material: opcion.id_material,
    tipo: opcion.tipo,
    id_fuente: opcion.id_fuente.trim(),
    precio_unitario: Number(opcion.precio_unitario ?? 0),
    moneda: opcion.moneda || 'MXN',
    lead_time_dias: Number(opcion.lead_time_dias ?? 0),
    vigencia_inicio: opcion.vigencia_inicio,
    vigencia_fin: opcion.vigencia_fin,
    tamano_lote: limpiarLote(opcion.tamano_lote),
    capacidad: opcion.capacidad.map(
      (periodo): CapacidadPeriodo => ({
        periodo_inicio: periodo.periodo_inicio,
        periodo_fin: periodo.periodo_fin,
        cantidad: Number(periodo.cantidad ?? 0),
        unidad_medida: periodo.unidad_medida,
      }),
    ),
  };
}

export function buildPayload(state: MrpState): MrpPayload {
  return {
    version: state.version || '1.0',
    id_ejecucion: state.idEjecucion.trim(),
    ejecucion: {
      fecha_planificacion: state.ejecucion.fecha_planificacion,
      fecha_fin_horizonte: state.ejecucion.fecha_fin_horizonte,
      modo_planificacion: state.ejecucion.modo_planificacion,
      descripcion: state.ejecucion.descripcion.trim(),
    },
    conversiones_unidad: state.conversiones.map(
      (conversion): ConversionUnidad => ({
        unidad_origen: conversion.unidad_origen.trim().toUpperCase(),
        unidad_destino: conversion.unidad_destino.trim().toUpperCase(),
        factor: Number(conversion.factor ?? 0),
      }),
    ),
    materiales: state.materiales.map(limpiarMaterial),
    demandas: state.demandas.map(
      (demanda): Demanda => ({
        id_demanda: demanda.id_demanda.trim(),
        tipo_origen: demanda.tipo_origen,
        id_fuente: demanda.id_fuente.trim(),
        id_producto: demanda.id_producto,
        cantidad: Number(demanda.cantidad ?? 0),
        unidad_medida: demanda.unidad_medida,
        fecha_requerida: demanda.fecha_requerida,
      }),
    ),
    bom_plano: state.bom.map(
      (fila): BomFila => ({
        id_fila_origen: fila.id_fila_origen.trim(),
        id_producto: fila.id_producto,
        id_material: fila.id_material,
        cantidad: Number(fila.cantidad ?? 0),
        unidad_medida: fila.unidad_medida,
        unidad_medida_planeacion: fila.unidad_medida_planeacion,
      }),
    ),
    inventario: state.inventario.map(
      (item): InventarioItem => ({
        id_material: item.id_material,
        cantidad_existente: Number(item.cantidad_existente ?? 0),
        cantidad_reservada: Number(item.cantidad_reservada ?? 0),
        cantidad_stock_seguridad: Number(item.cantidad_stock_seguridad ?? 0),
        unidad_medida: item.unidad_medida,
      }),
    ),
    suministros_programados: state.suministros.map(
      (suministro): SuministroProgramado => ({
        id_suministro: suministro.id_suministro.trim(),
        id_material: suministro.id_material,
        tipo: suministro.tipo,
        id_fuente: suministro.id_fuente.trim(),
        cantidad: Number(suministro.cantidad ?? 0),
        unidad_medida: suministro.unidad_medida,
        fecha_esperada: suministro.fecha_esperada,
      }),
    ),
    opciones_abastecimiento: state.opciones.map(limpiarOpcion),
  };
}

export function validarPayload(payload: MrpPayload): string[] {
  const errores: string[] = [];

  if (!payload.id_ejecucion) errores.push('El id de ejecución es obligatorio.');
  if (!payload.ejecucion.fecha_planificacion) errores.push('La fecha de planificación es obligatoria.');
  if (!payload.ejecucion.fecha_fin_horizonte) errores.push('La fecha fin de horizonte es obligatoria.');
  if (payload.ejecucion.fecha_planificacion > payload.ejecucion.fecha_fin_horizonte) {
    errores.push('La fecha fin de horizonte debe ser posterior a la fecha de planificación.');
  }
  if (payload.materiales.length === 0) errores.push('Debes registrar al menos un material.');

  const ids = new Set(payload.materiales.map((m) => m.id_material));
  if (ids.size !== payload.materiales.length) {
    errores.push('Existen materiales con id duplicado.');
  }

  const productos = new Set(
    payload.materiales.filter((m) => m.tipo_material === 'PRODUCTO_TERMINADO').map((m) => m.id_material),
  );
  if (productos.size === 0) errores.push('Debes registrar al menos un modelo (producto terminado).');

  for (const demanda of payload.demandas) {
    if (!productos.has(demanda.id_producto)) {
      errores.push(`La demanda ${demanda.id_demanda} referencia un producto inexistente.`);
    }
  }

  for (const fila of payload.bom_plano) {
    if (!productos.has(fila.id_producto)) {
      errores.push(`La fila BOM ${fila.id_fila_origen} referencia un producto inexistente.`);
    }
    if (!ids.has(fila.id_material)) {
      errores.push(`La fila BOM ${fila.id_fila_origen} referencia un material inexistente.`);
    }
  }

  for (const opcion of payload.opciones_abastecimiento) {
    if (!ids.has(opcion.id_material)) {
      errores.push(`La opción ${opcion.id_opcion_abastecimiento} referencia un material inexistente.`);
    }
    if (opcion.capacidad.length === 0) {
      errores.push(`La opción ${opcion.id_opcion_abastecimiento} no tiene capacidades registradas.`);
    }
  }

  return errores;
}
