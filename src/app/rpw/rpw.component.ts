import { NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, computed, effect, EventEmitter, inject, input, Input, output, Output, ViewChild } from '@angular/core';
import { PoModalAction, PoModalComponent, PoModalModule } from '@po-ui/ng-components'
import { interval, Observable, Subscription } from 'rxjs'
import { ServerTotvsService } from '../services/server-totvs.service';

@Component({
  selector: 'rpw-acomp',
  standalone: true,
  imports: [
    PoModalModule,
    NgClass
  ],
  templateUrl: './rpw.component.html',
  styleUrl: './rpw.component.css'
})
export class RpwComponent {

  //Servico Totvs para verificar o rpw
  private srvTotvs = inject(ServerTotvsService);

  //Signals variaveis
  numPedExec = input(0)
  tentativas = input(2)
  intervalo  = input(500)
  terminoEvent = output<boolean>();

  //Tela Modal
  @ViewChild('timer', { static: true }) telaTimer: | PoModalComponent | undefined

  //Variaveis locais
  sub!:Subscription
  labelTimer         :string  = 'Obtendo dados RPW'
  labelTimerDetail   :string  = ''
  labelPedExec       :string  = 'Pedido Execução'
  telaTimerFoiFechada:boolean = false

  //contructor
  constructor(private cdr:      ChangeDetectorRef){
    effect(() => {
     
      //Num Pedido Exec igual a 0 - Fecha a tela 
      if (this.numPedExec() === 0) {
        this.telaTimer?.close()
      }
      //Num Pedido Exec igual a 1 - Apresenta a tela 
      if (this.numPedExec() === 1) {
         this.labelTimer='Obtendo dados RPW'
         this.labelPedExec='Pedido Execução'
         this.labelTimerDetail = ''
         this.telaTimer?.open()
         this.cdr.detectChanges()
      }

      //Num Pedido Exec para acompanhamento 
      if (this.numPedExec() > 1) {
        this.sub = interval(this.intervalo()).subscribe(n => {
           this.labelPedExec = 'Pedido Execução: ' + this.numPedExec() + ' (' + (n * 5).toString() + 's)'
           this.labelTimer   = 'Aguarde geração do arquivo'
           this.cdr.detectChanges()

           //Controle de Numero de Tentativas
           if (n > this.tentativas()){
             this.sub.unsubscribe()
             this.telaTimer?.close()
             this.cdr.detectChanges()
           }

           //Chamar método para devolver a situacao do numero do pedido de execucao
           let param:any={numRPW:this.numPedExec()}
           this.srvTotvs.piObterSituacaoRPW(param).subscribe({
             next: (response:any)=> {
               if (response.ok){
                 this.sub.unsubscribe()
                 this.labelPedExec            = 'Pedido Execução: OK'
                 this.labelTimer              = "Arquivo liberado !"
                 this.labelTimerDetail        = "Utilize o Log de Arquivos para visualizar o arquivo gerado"
                 this.acaoCancelarTimer.label = 'Fechar'
                 this.terminoEvent.emit(true)
                 this.cdr.detectChanges()
               }
             }
           })

       })
     }
    })
  }

  //Variavel do Modal
  acaoCancelarTimer: PoModalAction = {
    action: () => { this.fecharTimer() },
    label: 'Fechar',
  };

  //Controle fechamento de tela
  fecharTimer(){
    if(this.sub !== undefined){
       this.sub.unsubscribe()
    }
    this.telaTimer?.close()
    this.telaTimerFoiFechada=true
    this.cdr.detectChanges()
  }


}
