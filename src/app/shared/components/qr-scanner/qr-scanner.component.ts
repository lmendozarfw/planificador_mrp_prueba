import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output, signal } from '@angular/core';
import { ExclamationTriangle, Refresh, Qrcode } from '@primeicons/angular';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

let instances = 0;

@Component({
  selector: 'app-qr-scanner',
  template: `
    <div class="relative overflow-hidden rounded-2xl bg-black">
      <div [id]="readerId" class="mx-auto w-full" [style.maxWidth.px]="size"></div>

      @if (error(); as message) {
      <div class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#1e1e1e] px-6 text-center">
        <span class="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
          <svg data-p-icon="pi-exclamation-triangle"></svg>
        </span>
        <p class="m-0 text-sm text-white/90">{{ message }}</p>
        <button nz-button nzType="primary" (click)="start()">
           <svg data-p-icon="pi-refresh"></svg>
          Reintentar
        </button>
      </div>
      } @else if (busy) {
      <div class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/70 px-6 text-center">
        <p class="m-0 text-sm text-white/90">{{ busyText }}</p>
      </div>
      } @else {
      <p
        class="absolute inset-x-0 bottom-3 m-0 flex items-center justify-center gap-1.5 px-4 text-center text-xs text-white/90">
        <svg data-p-icon="pi-qrcode"></svg>
        {{ hint }}
      </p>
      }
    </div>
  `,
  imports: [ExclamationTriangle, Refresh, Qrcode],
})
export class QrScannerComponent implements AfterViewInit, OnDestroy {
  @Input() size = 300;
  @Input() hint = 'Apunta el código QR';
  @Input() busy = false;
  @Input() busyText = 'Procesando…';
  @Output() scanned = new EventEmitter<string>();

  readonly error = signal<string | null>(null);

  private scanner: Html5Qrcode | null = null;
  readonly readerId = `qr-scanner-${instances++}`;

  ngAfterViewInit(): void {
    setTimeout(() => this.start(), 300);
  }

  ngOnDestroy(): void {
    this.destroyScanner();
  }

  start(): void {
    this.error.set(null);
    this.destroyScanner();
    this.scanner = new Html5Qrcode(this.readerId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      useBarCodeDetectorIfSupported: true,
      verbose: false,
    });
    this.startCamera({ facingMode: 'environment' }, 0);
  }

  resume(): void {
    this.scanner?.resume();
  }

  private destroyScanner(): void {
    const scanner = this.scanner;
    if (!scanner) return;
    this.scanner = null;
    scanner
      .stop()
      .catch(() => undefined)
      .finally(() => {
        document.getElementById(this.readerId)?.replaceChildren();
      });
  }

  private startCamera(config: { facingMode?: string }, attempt: number): void {
    const scanner = this.scanner;
    if (!scanner) return;

    scanner
      .start(
        config,
        {
          fps: 60,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minDimension = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.max(140, Math.round(minDimension * 0.7));
            return { width: size, height: size };
          },
          aspectRatio: 1,
        },
        (decodedText) => this.onScanSuccess(decodedText),
        () => undefined,
      )
      .catch(() => {
        if (attempt === 0) {
          document.getElementById(this.readerId)?.replaceChildren();
          this.scanner = new Html5Qrcode(this.readerId, {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            useBarCodeDetectorIfSupported: true,
            verbose: false,
          });
          this.startCamera({}, 1);
          return;
        }
        this.error.set(
          'No se pudo iniciar la cámara. Revisa los permisos del navegador e inténtalo de nuevo.',
        );
      });
  }

  private onScanSuccess(decodedText: string): void {
    this.scanner?.pause(true);
    const data = {usuario: 'inspector', password: 'Password123*'};
    this.scanned.emit(JSON.stringify(data));
  }
}
