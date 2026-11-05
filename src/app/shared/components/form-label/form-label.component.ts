import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-form-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="block text-sm font-medium text-slate-700 mb-1" [attr.title]="required() ? 'Campo requerido' : null">
      <ng-content></ng-content>
      @if (required()) {
        <span class="ml-0.5 text-rose-500 select-none" aria-hidden="true">*</span>
      }
    </label>
  `,
})
export class FormLabelComponent {
  readonly required = input(false, { transform: booleanAttribute });
}