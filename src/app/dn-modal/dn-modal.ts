import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core'

@Component({
  
  standalone: true,
  selector: 'app-dn-modal',
  imports: [CommonModule],
  templateUrl: './dn-modal.html',
  styleUrl: './dn-modal.css',
})
export class DnModal {

  
@Input() visible = false;
  
  @Input() title   = 'Confirmação'
  @Input() message = ''

  @Output() confirm = new EventEmitter<boolean>();

  fechar(resposta: boolean) {
    this.confirm.emit(resposta);
  }

}
