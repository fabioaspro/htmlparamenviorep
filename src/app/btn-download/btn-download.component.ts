import { booleanAttribute, ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { environment } from '../environments/environment'
import { NgIf } from '@angular/common';
import { ServerTotvsService } from '../services/server-totvs.service';

@Component({
    selector: 'btnDownload',
    templateUrl: './btn-download.component.html',
    styleUrl: './btn-download.component.css',
    standalone: true,
    imports: [NgIf]
})
export class BtnDownloadComponent {
  private srvTotvs = inject(ServerTotvsService)
  
  constructor(private cdr:      ChangeDetectorRef) {}

  @Input() nomeArquivo: string='';
  @Input({transform: booleanAttribute}) mostrarNomeArquivo: boolean=true;
  
  urlSpool:string=''

  ngOnInit(): void {
    this.srvTotvs.ObterCadastro({tabela: 'spool', codigo: ''}).subscribe({next: (response: any) => {
      this.urlSpool = response.desc
      this.cdr.detectChanges()
    }})
  }
}
