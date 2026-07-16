import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { PoMenuItem, PoMenuModule, PoPageModule, PoToolbarModule } from '@po-ui/ng-components';
import { RouterOutlet } from "@angular/router";

import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-root',
  imports: [CommonModule, PoToolbarModule, PoMenuModule, PoPageModule, RouterOutlet, NgxExtendedPdfViewerModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  readonly menus: Array<PoMenuItem> = [{ label: 'Home', action: this.onClick.bind(this) }];

  private onClick() {
    alert('Clicked in menu item');
  }
}
