import { Component, computed, inject, input, model } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-json-viewer-dialog',
  imports: [ButtonDirective, DialogModule],
  template: `
    <p-dialog [(visible)]="visible" [modal]="true" [style]="{ width: '64rem' }" [header]="title()">
      <pre
        class="max-h-[60vh] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-emerald-200"
      >{{ json() }}</pre>

      <ng-template #footer>
        <div class="flex justify-end gap-2">
          <button pButton type="button" text severity="secondary" (click)="visible.set(false)">Cerrar</button>
          <button pButton type="button" severity="secondary" (click)="copiar()">Copiar</button>
          <button pButton type="button" severity="success" (click)="descargar()">Descargar JSON</button>
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class JsonViewerDialogComponent {
  private readonly toast = inject(ToastService);

  readonly visible = model(false);
  readonly title = input('JSON');
  readonly data = input<unknown>(null);
  readonly nombreArchivo = input('mrp-payload.json');

  readonly json = computed(() => JSON.stringify(this.data(), null, 2) ?? 'null');

  copiar(): void {
    navigator.clipboard
      .writeText(this.json())
      .then(() => this.toast.success('JSON copiado al portapapeles'))
      .catch(() => this.toast.error('No se pudo copiar el JSON'));
  }

  descargar(): void {
    const blob = new Blob([this.json()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = this.nombreArchivo();
    anchor.click();
    URL.revokeObjectURL(url);
    this.toast.success('JSON descargado');
  }
}
