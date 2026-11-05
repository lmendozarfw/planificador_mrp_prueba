
import { CommonModule } from '@angular/common';
import {
    Component,
    computed,
    input,
    signal
} from '@angular/core';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';

export interface ResultadoPlanificacionMrp {
    mensaje: string;
    idejecucion: string;
    modoPlanificacion: string;
    estado: string;
    resultadoEjecucion: {
        estado: string;
        totalMateriales: number;
        cubiertosTotalmente: number;
        cubiertosParcialmente: number;
        retrasados: number;
        noCumplidos: number;
    };
    resultadosMateriales: MaterialMrp[];
    ordenesSugeridas: OrdenSugeridaMrp[];
    advertencias: string[];
    errores: string[];
}

export interface MaterialMrp {
    idMaterial: string;
    estado: string;
    razon: string[];
    cantidadRequerida: string;
    cantidadRequeridaTotal: string;
    unidadMedida: string;
    cantidadDisponible: string;
    cantidadCubiertaInventario: string;
    cantidadCubiertaSuministroProgramado: string;
    cantidadPropuesta: string;
    cantidadCubiertaATiempo: string;
    cantidadRetrasada: string;
    cantidadNoCumplida: string;
    requiereAbastecimiento: boolean;
    abastecimientos: AbastecimientoMrp[];
    origenes: {
        idDemanda: string;
        idProducto: string;
        cantidad: string;
        unidadMedida: string;
    }[];
}

export interface AbastecimientoMrp {
    tipo: string;
    idFuente: string | null;
    idOpcionAbastecimiento: string | null;
    idSuministro: string | null;
    idOrdenSugerida: string | null;
    cantidad: string;
    unidadMedida: string;
    cantidadOrden: string | null;
    unidadMedidaOrden: string | null;
    fechaSolicitud: string | null;
    fechaDisponibilidad: string;
    esSuministroProgramado: boolean;
    esATiempo: boolean;
    estado: string;
}

export interface OrdenSugeridaMrp {
    idOrdenSugerida: string;
    idMaterial: string;
    tipo: string;
    idFuente: string;
    idOpcionAbastecimiento: string;
    cantidad: string;
    unidadMedida: string;
    fechaRequerida: string;
    fechaDisponibilidadEsperada: string;
    criterioSeleccion: string;
    metodoLotificacion: string;
}

type SeveridadTag =
    | 'success'
    | 'info'
    | 'warn'
    | 'danger'
    | 'secondary';

@Component({
    selector: 'app-resultados-planificacion',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        TableModule,
        TagModule,
        ProgressBarModule,
        InputTextModule,
        DividerModule
    ],
    templateUrl: './resultados-planificacion.html',
    styleUrls: ['./resultados-planificacion.scss']
})
export class ResultadoPlanificacionComponent {

    // INPUTS

    readonly resultado = input.required<any>();

    // SIGNALS

    readonly busquedaMaterial = signal('');
    readonly busquedaOrden = signal('');

    // COMPUTED

    readonly resumen = computed(
        () => this.resultado().resultadoEjecucion
    );

    readonly porcentajeCobertura = computed(() => {
        const total = this.resumen().totalMateriales;

        if (total === 0) {
            return 0;
        }

        return Math.round(
            (this.resumen().cubiertosTotalmente / total) * 100
        );
    });

    readonly totalOrdenes = computed(
        () => this.resultado().ordenesSugeridas.length
    );

    readonly materialesQueRequierenAbastecimiento = computed(
        () => this.resultado().resultadosMateriales
            .filter((material: any) => material.requiereAbastecimiento).length
    );

    readonly totalSuministrosProgramados = computed(
        () => this.resultado().resultadosMateriales
            .reduce((total: any, material: any) => {
                return total + material.abastecimientos
                    .filter(
                        (abastecimiento: any) =>
                            abastecimiento.tipo === 'SUMINISTRO_PROGRAMADO'
                    ).length;
            }, 0)
    );

    // BÚSQUEDAS

    actualizarBusquedaMaterial(valor: string): void {
        this.busquedaMaterial.set(valor);
    }

    actualizarBusquedaOrden(valor: string): void {
        this.busquedaOrden.set(valor);
    }

    // ESTADOS

    severidadEstado(estado: string): SeveridadTag {
        switch (estado) {
            case 'COMPLETAMENTE_CUBIERTO':
            case 'CUBIERTO_A_TIEMPO':
            case 'COMPLETADO':
                return 'success';

            case 'PARCIALMENTE_CUBIERTO':
                return 'warn';

            case 'RETRASADO':
            case 'NO_CUMPLIDO':
            case 'FALLIDO':
                return 'danger';

            default:
                return 'secondary';
        }
    }

    severidadAbastecimiento(tipo: string): SeveridadTag {
        switch (tipo) {
            case 'INVENTARIO':
                return 'info';

            case 'ORDEN_PLANIFICADA':
                return 'warn';

            case 'SUMINISTRO_PROGRAMADO':
                return 'success';

            default:
                return 'secondary';
        }
    }

    nombreAbastecimiento(tipo: string): string {
        switch (tipo) {
            case 'INVENTARIO':
                return 'Inventario';

            case 'ORDEN_PLANIFICADA':
                return 'Orden planificada';

            case 'SUMINISTRO_PROGRAMADO':
                return 'Suministro programado';

            default:
                return tipo;
        }
    }

    nombreEstado(estado: string): string {
        switch (estado) {
            case 'COMPLETAMENTE_CUBIERTO':
                return 'Completamente cubierto';

            case 'PARCIALMENTE_CUBIERTO':
                return 'Parcialmente cubierto';

            case 'CUBIERTO_A_TIEMPO':
                return 'Cubierto a tiempo';

            case 'RETRASADO':
                return 'Retrasado';

            case 'NO_CUMPLIDO':
                return 'No cumplido';

            case 'COMPLETADO':
                return 'Completado';

            default:
                return estado?.replaceAll('_', ' ');
        }
    }

    // FORMATOS

    formatoCantidad(valor: string | number | null): string {
        if (valor === null || valor === undefined) {
            return '—';
        }

        const numero = Number(valor);

        if (!Number.isFinite(numero)) {
            return String(valor);
        }

        return new Intl.NumberFormat('es-MX', {
            maximumFractionDigits: 3
        }).format(numero);
    }

    formatoFecha(fecha: string | null): string {
        if (!fecha) {
            return '—';
        }

        const [anio, mes, dia] = fecha.split('-');

        if (!anio || !mes || !dia) {
            return fecha;
        }

        return `${dia}/${mes}/${anio}`;
    }

    porcentajeMaterial(material: MaterialMrp): number {
        const requerido = Number(material.cantidadRequeridaTotal);
        const cubierto = Number(material.cantidadCubiertaATiempo);

        if (!Number.isFinite(requerido) || requerido <= 0) {
            return 0;
        }

        return Math.min(
            100,
            Math.round((cubierto / requerido) * 100)
        );
    }

    // TRACKING

    trackByMaterial(
        index: number,
        material: MaterialMrp
    ): string {
        return material.idMaterial;
    }

    trackByOrden(
        index: number,
        orden: OrdenSugeridaMrp
    ): string {
        return orden.idOrdenSugerida;
    }
}
