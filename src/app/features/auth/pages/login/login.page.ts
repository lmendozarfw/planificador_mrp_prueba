import { Component, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { InputPassword } from 'primeng/inputpassword';
import { InputText } from 'primeng/inputtext';
import { CheckCircle, Eye, EyeSlash, InfoCircle, Pencil, Qrcode, SignIn, Spinner, User } from '@primeicons/angular';
import { FormLabelComponent } from '../../../../shared/components/form-label/form-label.component';
import { QrScannerComponent } from '../../../../shared/components/qr-scanner/qr-scanner.component';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthStore } from '../../stores/auth.store';

export interface BadgeCredentials {
  username: string;
  password: string;
}

export function parseBadgeQr(raw: string): BadgeCredentials | null {
  console.log('parseBadgeQr', raw);
  const text = raw.trim();
  if (!text) return null;

  if (text.startsWith('{')) {
    try {
      const data = JSON.parse(text) as Record<string, unknown>;
      console.log('parseBadgeQr - Parsed JSON:', data);
      return toCredentials(
        data['usuario'] ?? data['user'] ?? data['username'],
        data['password'] ?? data['clave'],
      );
    } catch {
      return null;
    }
  }

  if (text.startsWith('?') || /^[a-z][a-z0-9+.-]*:\/\//i.test(text)) {
    try {
      const params = new URL(text, window.location.origin).searchParams;
      return toCredentials(
        params.get('usuario') ?? params.get('user') ?? params.get('username'),
        params.get('password') ?? params.get('clave'),
      );
    } catch {
      return null;
    }
  }

  const separator = text.includes('|') ? '|' : text.includes(':') ? ':' : null;
  if (!separator) return null;
  const index = text.indexOf(separator);
  return toCredentials(text.slice(0, index), text.slice(index + 1));
}

function toCredentials(username: unknown, password: unknown): BadgeCredentials | null {
  const user = String(username ?? '').trim();
  const secret = String(password ?? '');
  return user && secret ? { username: user, password: secret } : null;
}

@Component({
  selector: 'app-login-page',
  templateUrl: './login.page.html',
  imports: [
    ReactiveFormsModule,
    FormLabelComponent,
    QrScannerComponent,
    InputText,
    InputPassword,
    ButtonDirective,
    CheckCircle,
    User,
    InfoCircle,
    SignIn,
    Spinner,
    Pencil,
    Qrcode,
    Eye,
    EyeSlash,
  ],
})
export class LoginPage {
  loginForm: FormGroup;

  authStore = inject(AuthStore);
  router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly qrScanner = viewChild(QrScannerComponent);

  readonly mode = signal<'qr' | 'manual'>('qr');
  readonly badgeUser = signal<string | null>(null);
  readonly passwordMask = signal(true);

  constructor() {
    this.loginForm = new FormGroup({
      user: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
    });
  }

  get userError(): string | null {
    const control = this.loginForm.get('user');
    if (!control || (!control.touched && !control.dirty) || !control.errors) return null;
    if (control.errors['required']) return 'El usuario es obligatorio';
    return null;
  }

  get passwordError(): string | null {
    const control = this.loginForm.get('password');
    if (!control || (!control.touched && !control.dirty) || !control.errors) return null;
    if (control.errors['required']) return 'La contraseña es obligatoria';
    return null;
  }

  toggleMode(): void {
    this.badgeUser.set(null);
    this.mode.update((mode) => (mode === 'qr' ? 'manual' : 'qr'));
  }

  togglePasswordMask(): void {
    this.passwordMask.update((mask) => !mask);
  }

  onBadgeScanned(decodedText: string): void {
    if (this.authStore.loading()) return;
    const credentials = parseBadgeQr(decodedText);
    if (!credentials) {
      this.toast.warning('El QR escaneado no contiene credenciales válidas');
      this.resumeScanner();
      return;
    }
    this.badgeUser.set(credentials.username);
    void this.doLogin(credentials.username, credentials.password);
  }

  async onSubmit(): Promise<void> {
    if (this.authStore.loading()) return;
    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const { user: username, password } = this.loginForm.value;
    await this.doLogin(username, password);
  }

  private resumeScanner(): void {
    this.qrScanner()?.resume();
  }

  private async doLogin(username: string, password: string): Promise<void> {
    await this.authStore.login(username, password);
    if (this.authStore.error()) {
      this.toast.error(this.authStore.error()!);
      this.badgeUser.set(null);
      this.resumeScanner();
      return;
    }
    // dejar asi hasta tener otra funcionalidad
  }
}
