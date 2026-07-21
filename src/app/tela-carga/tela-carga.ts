import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, inject, NgZone, OnInit, signal, viewChild, ViewChild, } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { PoUploadComponent, PoModule, PoUploadFile, PoTableColumn, PoTableModule, PoButtonModule, PoMenuItem, PoMenuModule, PoModalModule, PoPageModule, PoToolbarModule, PoTableAction, PoModalAction, PoDialogService, PoNotificationService, PoFieldModule, PoDividerModule, PoTableLiterals, PoTableComponent, PoUploadLiterals, PoModalComponent, } from '@po-ui/ng-components';
import { ServerTotvsService } from '../services/server-totvs.service';
import { ExcelService } from '../services/excel-service.service';
import { environment } from '../environments/environment'
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'tela-carga',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PoModalModule,
    PoTableModule,
    PoModule,
    PoFieldModule,
    PoDividerModule,
    PoButtonModule,
    PoToolbarModule,
    PoMenuModule,
    PoPageModule,
    HttpClientModule,
    NgxMaskDirective,
],
  templateUrl: './tela-carga.html',
  styleUrl: './tela-carga.css'
})


export class Telacarga {
  
  private srvTotvs = inject(ServerTotvsService);
  private srvNotification = inject(PoNotificationService);
  private srvExcel = inject(ExcelService);
  private srvDialog = inject(PoDialogService);
  private router = inject(Router);
  private formImport = inject(FormBuilder);
  private formB = inject(FormBuilder)
 
  //---Funcionar o visualizar PDF
  pdfUrl?: SafeResourceUrl | undefined

  constructor(private cdr:      ChangeDetectorRef,
              private zone:     NgZone,
              private sanitizer: DomSanitizer){}

  //Variaveis 
  labelLoadTela: string = ''
  loadTela: boolean = false
  loadExcel: boolean = false
  tituloTela!: string
  mudaCampos!: number | null
  pesquisa!: string
  nomeBotao: any
  linhaSelecionada: any = undefined
  lBotao: boolean = false
  alturaGrid: number = window.innerHeight - 270
  objSelecionado:any
  lDisable: boolean = false
  confirmarEfetivacao = false

  /*headersTotvs = {    
    'Authorization': 'Basic c3VwZXI6cHJvZGllYm9sZDEx',
    'CompanyId': '1'
  }*/
  
 //para nao fixar o Headers
  headersTotvs = environment.headersTotvsI
  
  //lista: any;
  tipoAcao: string = ''
  @ViewChild('poTable') poTable!: PoTableComponent;
  @ViewChild('upload') poUpload!: PoUploadComponent;
  @ViewChild('ttDadosImport') GridImportDados!: PoTableComponent;
  @ViewChild('telaAltera', { static: true }) telaAltera:  | PoModalComponent  | undefined;
  @ViewChild('modalEfetivar', { static: true }) modalEfetivar!: PoModalComponent

  //Para não fixar a URL
  _url = environment.totvs_url + "/addFiles";
  
  objSolic!: any[];

  //---Grid
  colunas!: PoTableColumn[]
  lista!: any[]

  customLiteralsupload: PoUploadLiterals = {
    dragFilesHere: 'Arraste o Arquivo aqui',
    selectFilesOnComputer: 'ou selecione o Arquivo no seu Computador',
    sentWithSuccess: 'Arquivo enviado com sucesso',
    startSending: 'Enviando Arquivo',
    errorOccurred: 'erro',
    selectFile: 'Buscar arquivo',
  };

  customLiterals: PoTableLiterals = {
    noData: 'Importe os dados do Arquivo [v 1.00.00]'
  };

  //Formulario
  public form = this.formImport.group({
    //codEstabel: ['', Validators.required],
    //codFilial: ['', Validators.required],
    //numRR: ['', Validators.required],
    //itCodigo: [''],
    //tpBusca: [2, Validators.required],
  });  

  public formAltera = this.formB.group({
    "pesoBru": [0, Validators.required],
    "pesoLiq": [0, Validators.required],
    "Altura":  [0, Validators.required],
    "Largura": [0, Validators.required],
    "Compri":  [0, Validators.required],
  });

  //--- Actions
  readonly opcoes: PoTableAction[] = [
    { label: 'Editar', icon: 'bi bi-pencil-square', action: this.onAlterarGrid.bind(this) },
  ];
  
  acaoConfirmarDialog = {
    label: 'Efetivar',
    action: () => this.onConfirmarDialog()
  };

  acaoCancelarDialog = {
    label: 'Cancelar',
    action: () => this.onCancelarDialog()
  }


  readonly acaoSalvar: PoModalAction = {
    label: 'Salvar',
    action: () => { this.onSalvar.bind(this) }
  }

  readonly acaoCancelar: PoModalAction = {
    label: 'Cancelar',
    action: () => { //this.cadModal?.close()
    }
  }

  formBuilder: any
  nomeEstabel: string | undefined
  valorForm:   any

  ngOnInit(): void {

    //Colunas do grid
    this.colunas = this.srvTotvs.obterColunasImpParam()

  }

  onManut(){

    this.router.navigate(['tela']) 

  }

  ConsultaItens() {

    this.router.navigate(['lista-itens'])

  }

  readonly acaoAlterarLinha: PoModalAction = {
    label: 'Salvar',
    action: () => {this.onSalvar()},
   
    disabled: !this.formAltera.valid,
  };

  readonly acaoCancelarLinha: PoModalAction = {
    label: 'Cancelar',
    action: () => {
      this.telaAltera?.close();
    },
  };

  // Método para selecionar programaticamente uma linha
  selecionarLinha(id: number) {
    const item = this.lista.find(i => i.ltFilial === id); // Localiza o item pelo ID
    if (item) {
      this.poTable.selectRowItem(item); // Seleciona o item na tabela
    }
    else {
      alert("error")
    }
  }

  onCustomActionClick(file: any) {
    console.log(file)
  }

  onObterArquivoImp() {

    this.labelLoadTela = "Carregando Arquivo..."
    this.loadTela = true
    //let paramsTela: any = { items: this.form.value }
    this.lista = []
    //Chamar o servico
    this.srvTotvs.ObterArquivoImp().subscribe({
      next: (response: any) => {
        this.srvNotification.success('Dados listados com sucesso !')
        
        this.lista = response.items
        this.poUpload.clear()
        this.lista.sort(this.srvTotvs.ordenarCampos(['iLinha']))
        this.lDisable = false
        this.loadTela = false
        this.cdr.detectChanges()


      },
      error: (e) => {
        this.srvNotification.error('Ocorreu um erro ObterArquivoImp: ' + e)
        this.loadTela = false
        this.cdr.detectChanges()
      },
    })
  }

  onChamaUpload() {

    //Chamar o servico
    this.srvTotvs.EfetivarArquivo().subscribe({
      next: (response: any) => {
        this.srvNotification.success('Arquivo Importado com sucesso !')
        
        this.lista = response.items.map((item: { lAtivo: string; }) => ({...item, lAtivo: this.normalizeAtivo(item.lAtivo)}))

        this.poUpload.clear()
        //this.lista = []
        this.loadTela = false
        this.cdr.detectChanges()

      },
      error: (e) => {
        this.srvNotification.error('Ocorreu um erro EfetivarArquivo: ' + e)
        this.loadTela = false
        this.cdr.detectChanges()
      },
    })

  }

  ChamaUploadOk(response: any) {

    this.srvNotification.success('Dados Carregados com sucesso !')
    
  }

  ChamaErro(event: any) {

    this.srvNotification.error("Erro ao Carregar o Arquivo ! ")

  }

  ChamaSucesso(response: any) {

    this.srvNotification.success('Arquivo Importado com sucesso ! : ')
    this.lista = response.items.map((item: { lAtivo: string; }) => ({...item, lAtivo: this.normalizeAtivo(item.lAtivo)}))
    
  }

  openPDF(){
    const fileUrl = 'assets/docs/LayoutTransbordo.pdf'
    
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl)
    this.pdfModal?.open()
  }

  @ViewChild('pdfModal', { static: true }) pdfModal: PoModalComponent | undefined;

  onEfetivarArquivo() {

    
    if (!this.GridImportDados.getSelectedRows().length) {
      this.srvNotification.error('Nenhum registro selecionado!')
      return
    }

    
    // ✅ abertura correta
    this.modalEfetivar.open()

  /*
  // ✅ Executa FORA do Angular
  this.zone.runOutsideAngular(() => {

    setTimeout(() => {

      this.srvDialog.confirm({

        title: 'Efetivar Importação?',
        message: 'Efetivar a Importação dos Dados do Arquivo ?',
        literals: { cancel: 'Cancelar', confirm: 'Efetivar' },

        confirm: () => {

          // ✅ volta para dentro do Angular
          this.zone.run(() => {

            this.labelLoadTela = 'Efetivando Arquivo...'
            this.loadTela = true

            const params: any = {
              items: registrosSelecionados
            }

            this.srvTotvs.EfetivarArquivo(params).subscribe({
              next: (response: any) => {

                this.srvNotification.success(
                  'Dados importados com sucesso !'
                )

                this.lista = response.items
                this.poUpload.clear()

                this.loadTela = false
                this.lDisable = true
              },

              error: (e) => {

                this.srvNotification.error(
                  'Ocorreu um erro EfetivarArquivo: ' + e
                )

                this.loadTela = false
              }
            })

          })
        },

        cancel: () => {
          this.zone.run(() => {
            this.srvNotification.error('Cancelado pelo usuário');
          })
        }

      })

    })

  })*/

}

  onConfirmarDialog() {
    
    this.modalEfetivar.close()

    this.labelLoadTela = 'Efetivando Arquivo...';
    this.loadTela = true;

    const params = {
      items: this.GridImportDados.getSelectedRows()
    };

    this.srvTotvs.EfetivarArquivo(params).subscribe({
      next: (response) => {
        this.srvNotification.success('Dados importados com sucesso!')
        this.lista = (response as any).items
        this.poUpload.clear()
        this.loadTela = false
        this.cdr.detectChanges()
      },
      error: (e) => {
        this.srvNotification.error('Erro: ' + e)
        this.loadTela = false
        this.cdr.detectChanges()
      }
    });
  }

  onCancelarDialog() {
    this.modalEfetivar.close()
  }

  onAlterarGrid(obj: any | null){

    this.objSolic = obj.codItem
    this.linhaSelecionada = obj

    this.telaAltera?.open();

    if ((obj !== null) && (obj['$showAction'] !== undefined))
       delete obj['$showAction']

    if (obj !== null) {
      this.formAltera.patchValue(obj)
    }

  }

  //---Salvar Registro
  onSalvar() {
    
    this.linhaSelecionada.pesoBru = this.formAltera.controls.pesoBru.value
    this.linhaSelecionada.pesoLiq = this.formAltera.controls.pesoLiq.value
    this.linhaSelecionada.Altura  = this.formAltera.controls.Altura.value
    this.linhaSelecionada.Largura = this.formAltera.controls.Largura.value
    this.linhaSelecionada.Compri  = this.formAltera.controls.Compri.value
    
    this.telaAltera?.close();
  }

  onAtualizar(){

    this.loadTela = true
    this.lista = []
    this.poUpload.clear()
    this.loadTela = false
    this.lDisable=false

  }

  /*changeBusca(event: any) {

    this.lista = []
    this.form.controls['tpBusca'].setValue(event)

    //alert (this.form.controls['tpBusca'].value)

    this.mudaCampos = this.form.controls['tpBusca'].value

    if (this.form.controls['tpBusca'].value == 1) { //Item
      this.form.reset()
      this.pesquisa = "ITEM " //+ this.form.controls['itCodigo'].value
    }
    else {
      this.form.reset()
      this.pesquisa = "REPARO " //+ this.form.controls['codEstabel'].value + ' - '+ this.form.controls['codFilial'].value + ' - ' + this.form.controls['numRR'].value
    }

  }*/

  

  /*public habilitaForm() {

    this.lBotao = false
    this.form.controls['tpBusca'].enable()

    this.form.controls['codEstabel'].enable()
    this.form.controls['codFilial'].enable()
    this.form.controls['numRR'].enable()
    this.form.controls['itCodigo'].enable()
  }

  public desabilitaForm() {

    this.lBotao = true
    this.form.controls['tpBusca'].disable()

    this.form.controls['codEstabel'].disable()
    this.form.controls['codFilial'].disable()
    this.form.controls['numRR'].disable()
    this.form.controls['itCodigo'].disable()
  }*/
  //---------------------------------------------------------------- Exportar lista detalhe para excel
  onExportarExcel(){
    let titulo = "IMPORTAÇÃO DE PARAMETROS DE ENVIO DE REPARO" //this.tituloTela.split(':')[0]
    let subTitulo = "LISTAGEM DE DADOS" //this.tituloTela.split(':')[1]
    this.loadExcel = true

    //let valorForm: any = { valorForm: this.form.value }
    
    const colunasNaoExportar = ['opcao', 'DtHrUsAlt']

    const colunasExcel = this.colunas.filter(
      col => col.property && !colunasNaoExportar.includes(col.property)
    )

    this.srvExcel.exportarParaExcel('HTMLPARAMENVIOREP: ' + titulo.toUpperCase(),
      subTitulo.toUpperCase(),
      colunasExcel,
      this.lista,
      'ImportParamEnvioRep',
      'Plan1')

    this.loadExcel = false
  }
  
  //---Listar registros grid
  /*
  listar() {
    this.loadTela = true

    this.srvTotvs.Obter().subscribe({
      next: (response: any) => {
        if (response === null) return
        this.lista = response.items.map((item: { lAtivo: string; }) => ({...item, lAtivo: this.normalizeAtivo(item.lAtivo)}))
        this.loadTela = false
      },
      error: (e) => {
        //this.srvNotification.error('Ocorreu um erro na requisição')
        this.srvNotification.error("Erro ao chamar Obter Lista:" + e)
        this.loadTela = false
        this.cdr.detectChanges()
      },
    });
  }
  */
  //Chama tela do TOTVS
  public AbrirTelaTOTVS(programa: string): void {
    let params: any = { program: programa, params: '' };
    this.srvTotvs.AbrirTelaTOTVS(params).subscribe({
      next: (response: any) => { },
      error: (e) => {
        this.loadTela = false;
        //mensagem pro usuario
        this.srvNotification.error("Erro ao chamar AbrirTelaTOTV:" + e)
      },
    });
  }

  //---Novo registro
  onNovo() {

    //Criar um registro novo passando 0 o ID
    this.router.navigate(['form/0'])

  }

  //---Editar registro
  onEditar(obj: any | null) {

    //Criar um registro novo passando 0 o ID

    this.router.navigate(['form/' + obj.codEstabel])

  }

  //---Deletar registro
  /*
  OLD_onDeletar(obj: any | null) {
    let paramTela: any = { codEstabel: obj.codEstabel }

    this.srvDialog.confirm({
      title: "DELETAR REGISTRO",
      message: `Confirma deleção do registro: ${obj.nomeEstabel} ?`,
      confirm: () => {
        this.loadTela = true
        this.srvTotvs.OLD_Deletar(paramTela).subscribe({
          next: (response: any) => {
            this.srvNotification.success('Registro eliminado com sucesso')
            this.listar()
          },
          // error: (e) => this.srvNotification.error('Ocorreu um erro na requisição'),
        })
      },
      cancel: () => this.srvNotification.error("Cancelada pelo usuário")
    })
  }*/
  
  normalizeAtivo(valor: string): string {
    return valor
      ?.replace('NÃ£o', 'Nao')
      ?.replace('NAO', 'Nao')
      ?.replace('Nao', 'Nao');
  }

}