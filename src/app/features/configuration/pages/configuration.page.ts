import { Component } from "@angular/core";
import { TabsModule } from "primeng/tabs";
import { ButtonModule } from "primeng/button";

@Component({
    selector: 'app-configuration',
    template: `
    <div class="space-y-4">
            <button type="button" pButton (click)="value = 'tab2'">Go to Payment</button>
            <p-tabs [(value)]="value">
                <p-tablist>
                    @for (tab of tabs; track tab.id) {
                        <p-tab [value]="tab.id">{{ tab.title }}</p-tab>
                    }
                </p-tablist>
                <p-tabpanels>
                    @for (tab of tabs; track tab.id) {
                        <p-tabpanel [value]="tab.id">
                            <h2 class="text-lg font-bold">{{ tab.title }}</h2>
                            <p class="text-surface-500 mt-1">{{ tab.content }}</p>
                        </p-tabpanel>
                    }
                </p-tabpanels>
            </p-tabs>
        </div>
    `,
    styles: [],
    imports: [TabsModule, ButtonModule],
})
export class ConfigurationPage {
    value: string = 'tab1';
    tabs = [
        { id: 'tab1', title: 'Account Info', content: 'Update your personal information such as name, email address, and profile picture.' },
        { id: 'tab2', title: 'Payment', content: 'Manage your subscription plan, view invoices, and update your payment method.' },
        { id: 'tab3', title: 'Preferences', content: 'Customize how the application looks and behaves to match your personal preferences.' }
    ];
}