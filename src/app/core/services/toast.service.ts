import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messageService = inject(MessageService);

  success(summary: string, detail?: string): void {
    this.add('success', summary, detail);
  }

  info(summary: string, detail?: string): void {
    this.add('info', summary, detail);
  }

  warning(summary: string, detail?: string): void {
    this.add('warn', summary, detail);
  }

  error(summary: string, detail?: string): void {
    this.add('error', summary, detail);
  }

  clear(key?: string): void {
    if (key === undefined) {
      this.messageService.clear();
      return;
    }
    this.messageService.clear(key);
  }

  private add(severity: ToastSeverity, summary: string, detail?: string): void {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}
