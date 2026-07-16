import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AfterViewInit, NgZone, ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChild, signal, } from '@angular/core';
import { RouterOutlet, Router, ɵEmptyOutletComponent } from '@angular/router';
import { finalize, map, Subscription, timeInterval } from 'rxjs';
import { FormBuilder, FormGroup, UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PoWidgetModule, PoUploadComponent, PoModule, PoUploadFile, PoTableColumn, PoTableModule, PoButtonModule, PoMenuItem, PoMenuModule, PoModalModule, PoPageModule, PoToolbarModule, PoTableAction, PoModalAction, PoDialogService, PoNotificationService, PoFieldModule, PoDividerModule, PoTableLiterals, PoTableComponent, PoUploadLiterals, PoModalComponent, PoInputComponent, PoComboModule, PoIconModule, PoLoadingModule, PoDialogModule, PoDialogAlertLiterals, PoDialogConfirmLiterals, PoAccordionModule, PoTooltipModule, PoToolbarAction } from '@po-ui/ng-components';
import { environment } from '../environments/environment'
import { ServerTotvsService } from '../services/server-totvs.service'
import { ExcelService } from '../services/excel-service.service'
import { DnRangeComponent } from "../dn-range/dn-range.component"
import { DnModal } from "../dn-modal/dn-modal"
import { RpwComponent } from '../rpw/rpw.component';
import { BtnDownloadComponent } from '../btn-download/btn-download.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

interface TransbordoForm {
  codEstabel: string | null
  codEmitente: string | null
  codItem: string | null
  descItem: string | null
  dtValidade: Date | string | null
  lAtivo: string | null
}

interface ValidacaoResultado {
  valido: boolean
  mensagens: string[]
}

@Component({
  standalone: true,
  selector: 'app-tela-transbordo',
  imports: [PoToolbarModule, ReactiveFormsModule, PoWidgetModule, FormsModule, PoPageModule, PoButtonModule,
    PoComboModule, PoIconModule, PoTableModule, PoModalModule, PoFieldModule, PoDividerModule, PoLoadingModule,
    PoModule, CommonModule, PoDialogModule, DnRangeComponent, CommonModule, PoAccordionModule, ReactiveFormsModule,
    FormsModule,  PoTableModule, PoModule, PoFieldModule,  
    PoToolbarModule, PoMenuModule, PoPageModule, HttpClientModule, DnModal,RpwComponent, BtnDownloadComponent , PoTooltipModule,
    NgxExtendedPdfViewerModule
],
  templateUrl: './tela-transbordo.html',
  styleUrl: './tela-transbordo.css',
})
export class TelaTransbordo {

  constructor(private cdr:      ChangeDetectorRef,
              private sanitizer: DomSanitizer) {}

  private srvDialog       = inject(PoDialogService)
  private srvTotvs        = inject(ServerTotvsService)
  private srvExcel        = inject(ExcelService)
  private srvNotification = inject(PoNotificationService)
  private formBuilder     = inject(FormBuilder)
  private router          = inject(Router)

  @ViewChild('telaFiltroAvancado', { static: true }) telaFiltroAvancado:  | PoModalComponent  | undefined
  @ViewChild('telaRPW', { static: true }) telaRPW:  | PoModalComponent  | undefined  
  @ViewChild('ChamaCadastro') telaCadastro!: PoModalComponent
  @ViewChild('ttDados') GridCadastro!: PoTableComponent
  @ViewChild('abrirArquivo', { static: true }) abrirArquivo: | PoModalComponent | undefined

  labelLoadTela: string = ''
  loadTela:  boolean = false
  loadExcel: boolean = false
  
  //--- Controle do acompanhamento RPW
  numPedExec         = signal(0)
  labelTimer         : string='Aguarde a liberação do arquivo...'
  labelTimerDetail   : string=''
  labelPedExec       : string=''
  telaTimerFoiFechada: boolean=false
  cMensagemErroRPW   = ''
  
  //Abertura de Arquivo
  conteudoArquivo: string = ''
  mostrarInfo: boolean = false
  nomeArquivo: string = ''
  arquivoTransbordo: string = ''

  //paginação do grid
  itensPaginados = []
  page = 1
  pageSize = 20
  disableShowMore = false

  //---ComboEstabelecimento
  codEstabelecimento: any
  placeHolderEstabelecimento!: string

  //---ComboItem
  codItem: any
  placeHolderItem!: string

  //---ComboEmitente
  codEmitente: any
  placeHolderEmitente!: string
  listaEmitente!: any[]
  loadEmitente: string = ''

  //--- Filtro Seleção
  estabelecimentoSelecionado:string = ''
  emitenteSelecionado:       string = ''
  ItemSelecionado:           string = ''

  codTecnico:     any
  listaTecnicos!: any[]
  loadTecnico:    string = ''  
  
  listaItens!:           any[]
  loadItem: string =''

  //ListasCombo
  listaEstabelecimentos!: any[]
  listaTransp!: any[]

  //---Grid
  colunas!: PoTableColumn[]
  lista!: any[]
  sub!: Subscription
  alturaGrid: number = window.innerHeight - 270
  listaSelecaoFiltrada:         any[] = []
  itensSelecionados: any[] = []

  //--Variáveis
  objSolic!: any[]
  showLoading = false
  cItCodigo!: string
  cDescItem!: string
  registroSelecionado: any = {}
  modoAlteracao = false
  modoInclusao  = false
  mostrarModal  = false
  linhaSelecionada: any
  mensagemModal = ''
  loadModal = false
  urlSpool: string = ''

  //---Funcionar o visualizar PDF
  pdfUrl?: SafeResourceUrl | undefined
  
  //Filtros Avançados
  filtro = {
    
    valEstabIni: "",
    valEstabFim: "ZZZ",
    cLabelCodEstabel: "Estabelecimento",

    valEmitIni: "0",
    valEmitFim: "999999999",
    cLabelCodEmit: 'Destino',

    valItemIni: "",
    valItemFim: "ZZZZZZZZZZZZZZZZ",
    cLabelItem: "Item",    
    
  }

  filtroPadrao = {
    
    valEstabIni: "",
    valEstabFim: "ZZZ",
    cLabelCodEstabel: "Estabelecimento",

    valEmitIni: "0",
    valEmitFim: "999999999",
    cLabelCodEmit: 'Destino',

    valItemIni: "",
    valItemFim: "ZZZZZZZZZZZZZZZZ",
    cLabelItem: "Item",    
    
  }

  get filtrosAlterados(): boolean {
    return JSON.stringify(this.filtro) !== JSON.stringify(this.filtroPadrao);
  }


  //Formulario
   public form = this.formBuilder.group({
    codEstabel:  [''],
    codEmit:     [''],
    codItem:     [''],    
  })

  //--- Actions
  readonly toolbarActions: Array<PoToolbarAction> = [
      {
        icon: 'bi bi-book',
        label: 'Manual do Usuário',
        action: this.abrirAjuda.bind(this)
      },
      {
        icon: 'bi bi-file-earmark-code',
        label: 'Documentação Técnica',
        action: this.abrirDocto.bind(this)
      }
    ];

    abrirAjuda() {
      const fileUrl = 'assets/docs/ManualTransbordo.pdf'
    
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl)
      this.pdfModal?.open()
    }

    abrirDocto() {
      const fileUrl = 'assets/docs/TecnicoTransbordo.pdf'
    
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl)
      this.pdfModal?.open()
    }

    @ViewChild('pdfModal', { static: true }) pdfModal: PoModalComponent | undefined

  acaoImprimir: PoModalAction = {
    action: () => {
      this.onImprimirConteudoArquivo();
    },
    label: 'Gerar PDF',
  };

  acaoSair: PoModalAction = {
    action: () => {
      this.abrirArquivo?.close();
    },
    label: 'Sair',
  }
  readonly opcoes: PoTableAction[] = [
    {
      label: 'Alterar',
      icon: 'po-icon po-icon po-icon-edit',
      //action: this.onEditar.bind(this),
    },
    {
      label: 'Excluir',
      icon: 'bi bi-trash',
      //action: this.onEditar.bind(this),
    }];

  
  readonly acaoSalvar: PoModalAction = {
    label: 'Salvar',
    action: () => { //this.onSalvar() 
      }
  }

  readonly acaoCancelar: PoModalAction = {
    label: 'Cancelar',
    action: () => { //this.cadModal?.close()
       }
  }

  readonly acaoConfirmarFiltro: PoModalAction = {
    label: 'Aplicar',
    action: () => {
      this.telaFiltroAvancado?.close()
      this.ChamaObterDadosPag() //1
    },
   
    //disabled: !this.formAltera.valid,
  }

  readonly acaoCancelarFiltro: PoModalAction = {
    label: 'Cancelar',
    action: () => {
      this.telaFiltroAvancado?.close()
    },
  }

  readonly acaoConfirmarRPW: PoModalAction = {
    label: 'Executar',
    action: () => {
      this.telaRPW?.close()
      this.ChamaObterRPW() //2
    },
   
  }

  readonly acaoCancelarRPW: PoModalAction = {
    label: 'Cancelar',
    action: () => {
      this.telaRPW?.close()
    },
  }

  customLiterals: PoTableLiterals = {
    noData: 'Infome os filtros para Buscar os Dados',
    loadMoreData: 'Carregar mais',
    loadingData: 'Buscar '
  }





private montarFormularioTransbordo(): TransbordoForm {
  return {
    
    codEstabel: this.registroSelecionado.codEstabel,
    codEmitente: this.registroSelecionado.codEmitente,
    codItem: this.registroSelecionado.codItem,
    descItem: this.registroSelecionado.descItem,
    
    // ✅ Date na tela → string no envio
    dtValidade: this.formatarDataDDMMYYYY(
      this.registroSelecionado.dtValidade as Date | null
    ),

    lAtivo: this.booleanParaString(this.registroSelecionado.lAtivo)
  }
}


onConfirmar(){
  
  this.loadModal             = true
    const formulario = this.montarFormularioTransbordo()
    const resultado  = this.validarFormularioTransbordo(formulario)

    if (!resultado.valido) {
      resultado.mensagens.forEach(mensagem => {
        this.srvNotification.error(mensagem);
      })
      return
    }

    // ✅ Frontend validado
    this.telaCadastro.close()
    this.loadTela = true
    let paramsTela: any = { items: [formulario] }

    this.srvTotvs.onSalvarTransbordo(paramsTela).subscribe({ 
      next: (response: any) => {        

        this.srvNotification.success('Transbordo salvo com sucesso.')
        this.loadModal = false
        
        this.ChamaObterDadosPag() //3
        setTimeout(() => {
          this.loadTela = false
          this.cdr.detectChanges()
        })
      },
      error: (e) => {
        
        setTimeout(() => {

          this.loadTela  = false
          this.loadModal = false
          this.cdr.detectChanges()

        })
      }
    })

  }
  
  validarFormularioTransbordo(form: TransbordoForm): ValidacaoResultado {
    const mensagens: string[] = []

    if (this.modoInclusao) {

      // 1. Campos obrigatórios
      if (!form.codEstabel) {
        mensagens.push('Estabelecimento é obrigatório.')
      }

      if (!form.codEmitente) {
        mensagens.push('Destino é obrigatório.')
      }

      if (!form.codItem) {
        mensagens.push('Item é obrigatório.')
      }

      // 2. Regras simples de negócio (frontend)
      const cEstab = String(form.codEstabel).trim()
      const cEmit  = String(form.codEmitente).trim()
      
      if (cEstab === cEmit) {
        mensagens.push('Estabelecimento e Destino não podem ser iguais.');
      }

    }

    if (!form.dtValidade) {
      mensagens.push('Data de Validade é obrigatória.')
    }

    // 3. Validação da data
    //if (form.lAtivo === 'Sim'){

      const dataInformada = this.converterParaDate(form.dtValidade)
      
      if (!dataInformada) {
        mensagens.push('Data de Validade inválida.');
      } else {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        dataInformada.setHours(0, 0, 0, 0);

        if (dataInformada < hoje) {
          mensagens.push('Data de Validade não pode ser anterior à data atual.');
        }

      }

    //}

    // 4. Consistência Item x Descrição
    if (form.codItem && !form.descItem) {
      //mensagens.push('Descrição do item não foi carregada corretamente.')
    }

    return {
      valido: mensagens.length === 0,
      mensagens
    }
    
  }
  
  public attListaItens(): void {

    if (!this.listaSelecaoFiltrada || this.listaSelecaoFiltrada.length === 0) {
      this.listaItens = [{ label: 'Todos', value: null }];
      return;
    }

    const mapItens = new Map<string, any>();

    this.listaSelecaoFiltrada.forEach(item => {

      const codItem = item.codItem?.toString().trim();

      if (!codItem) return;

      if (!mapItens.has(codItem)) {
        mapItens.set(codItem, {
          label: `${codItem} - ${item.descItem?.trim() ?? ''}`,
          value: codItem
        });
      }
    });

    const itensOrdenados = Array
      .from(mapItens.values())
      .sort((a, b) => a.label.localeCompare(b.label));

    this.listaItens = [
      { label: 'Todos', value: null },
      ...itensOrdenados
    ]

  }

  //---Chama tela de Carga
  onCarga(){

    this.router.navigate(['carga'])

  }

  //--- Change Estabelecimentos - Popular Emitente
  public onEstabChange(obj: string) {

    if (obj === undefined || obj === "") {
      //---Zera as variáveis
      this.estabelecimentoSelecionado = ''
      this.listaSelecaoFiltrada = this.lista //fas [...this.lista]
      this.filtrarLista()
      this.attListaItens()
      return
    }
    
    //---faz o que precisa
    this.estabelecimentoSelecionado = obj ? String(obj).split(' ')[0] : ''
    this.filtrarLista()
    this.attListaItens()

  }

  //--- Limpar Filtros
  limparFiltros(){

    this.filtro = { ...this.filtroPadrao }

  }

  //--- Change Estabelecimentos - Popular Emitente
  public onItemChange(obj: string) {

    if (obj === undefined || obj === "") {
      //---Zera as variáveis
      this.ItemSelecionado = ''
      this.listaSelecaoFiltrada = this.lista //fas [...this.lista]
      this.filtrarLista()
      this.attListaItens()
      return
    }
    
    //---faz o que precisa
    this.ItemSelecionado = obj ? String(obj).split(' ')[0] : ''
    this.filtrarLista()
    // this.attListaItens()

  }

   //--- Change Emitente
  public onEmitenteChange(obj: string) {

    if (obj === undefined || obj === "") {
      //---Zera as variáveis
      this.emitenteSelecionado = ''
      this.listaSelecaoFiltrada = this.lista //fas [...this.lista]
      this.filtrarLista()
      this.attListaItens()
      return
    }

    this.emitenteSelecionado = obj ? String(obj).split(' ')[0] : ''
    this.filtrarLista()
    this.attListaItens()
  }
  //--- Change Emitente

  getRegistroVazio() {
    return {
      codEstabel: null,
      codEmitente: null,
      codItem: '',
      descItem: '',
      dtValidade: new Date(), // ✅ data de hoje
      lAtivo: true
    };
  }
  //--- Filtra Lista
  public filtrarLista() {
    
    this.listaSelecaoFiltrada = this.lista.filter(item => {
      const filtroEstabelecimento = this.estabelecimentoSelecionado ? item.codEstabel === this.estabelecimentoSelecionado: true
      const filtroEmitente        = this.emitenteSelecionado ? item.codEmitente === this.emitenteSelecionado: true
      const filtroItem            = this.ItemSelecionado ? item.codItem === this.ItemSelecionado: true

      return filtroEstabelecimento && filtroEmitente && filtroItem 
    })

  }

  //---Relatório no RPW
  onRPW() {
    this.telaRPW?.open()
  }

  public solicitarExclusao(row: any) {

    this.linhaSelecionada = row
    
    // Monte a mensagem usando os dados da linha
    this.mensagemModal = `<div class="confirm-msg">
                            <p>
                              Deseja realmente excluir o <strong>Transbordo</strong> abaixo?
                            </p>
                            <br>
                            <div class="confirm-box">
                              <div class="linha">
                                <span>Estabelecimento</span>
                                <strong>${row.codEstabel}</strong>
                              </div>

                              <div class="linha">
                                <span>Destino</span>
                                <strong>${row.codEmitente}</strong>
                              </div>

                              <div class="linha destaque">
                                <span>Item</span>
                                <strong>${row.codItem}</strong>
                              </div>
                            </div>

                          </div>
                          `
    this.mostrarModal     = true
  }

  public onConfirmarExclusao(confirmado: boolean){

    this.mostrarModal = false

    if (confirmado) {
      this.onExcluirSelLinha(this.linhaSelecionada)
    }

  }

  public onExcluirSelLinha(row: any): void {

      this.mostrarModal  = false
      this.cdr.detectChanges()

      this.loadTela      = true
      this.labelLoadTela = "Excluindo"

      let paramsTela: any = {
        items: [
          {
            codEstabel: row.codEstabel,
            codEmitente: row.codEmitente,
            codItem: row.codItem
          }
        ]
      }
    

    this.loadTela = true
    this.srvTotvs.onExcluirSel(paramsTela).subscribe({ 
      next: (response: any) => {

        if (response && response.items && response.items.length > 0) {
          
        }
        else {
          
        }
        
        setTimeout(() => {
          this.loadTela = false
          this.cdr.detectChanges()
        })
        this.ChamaObterDadosPag() //4
        this.srvNotification.success('Transbordo excluido com sucesso [Estabel: ' + row.codEstabel + " Destino: " + row.codEmitente + " Item: " + row.codItem + "]")
        //this.cdr.detectChanges()
      },
      error: (e: any) => {
        setTimeout(() => {
          this.loadTela = false
          this.cdr.detectChanges()
        })
      },
      
    })
    
  }

  public onExcluirSelecionados(): void {

    let registrosSelecionados = this.GridCadastro.getSelectedRows()

    //Verificar se existe algum registro selecionado, caso nao exista,
    //exibir msg para o usuario na tela
    if (registrosSelecionados.length > 0) {

      let paramsTela: any = {items: registrosSelecionados.map((row: any) => ({
                              codEstabel: row.codEstabel,
                              codEmitente: row.codEmitente,
                              codItem: row.codItem
                            }))}

      this.loadTela = true
      this.srvTotvs.onExcluirSel(paramsTela).subscribe({ 
        next: (response: any) => {
        
          this.ChamaObterDadosPag() //5
          this.srvNotification.success('Transbordo excluido com sucesso ')
          setTimeout(() => {
            this.loadTela     = false
            this.cdr.detectChanges()
          })
        },
        error: (e: any) => {
          setTimeout(() => {
            this.loadTela = false
            this.cdr.detectChanges()
          })
        },
        
      })

    }

    //Nenhum Registro selecionado no grid
    else this.srvNotification.error('Nenhum registro selecionado !');

  }

  public onAlterar(row: any){

    this.modoAlteracao = true

    // Clona os dados da linha
    this.registroSelecionado = { ...row, lAtivo: this.stringParaBoolean(row.lAtivo), dtValidade: this.parseDate(row.dtValidade)}

    // Abre o modal
    this.onIncluir("Alteração")

  }

  public onIncluir(obj: any) {

    if (obj === "Inclusão"){
      this.registroSelecionado = this.getRegistroVazio()
      
      this.modoInclusao  = true
      this.modoAlteracao = false

    }
    else {
      this.modoInclusao  = false
      this.modoAlteracao = true
    }

    //Chamar a Tela de Detalhe passando o Processo como parametro 
    this.objSolic = obj
    let params = { CStatus: this.objSolic}
    
    this.telaCadastro.open()
      
  }
  
  public FecharChamaCadastro(): void {

    this.telaCadastro.close()

  }
  
  public Cadastro(): void {

    this.telaCadastro.close()

  }

   onAlterarGrid(obj: any | null){

    /*
    this.objSolic = obj.codItem
    this.linhaSelecionada = obj

    this.telaAltera?.open();

    if ((obj !== null) && (obj['$showAction'] !== undefined))
       delete obj['$showAction']

    if (obj !== null) {
      this.formAltera.patchValue(obj)
    }
    */
  }

  ngOnInit(): void {

    this.srvTotvs.ObterCadastro({tabela: 'spool', codigo: ''}).subscribe({
        next: (response: any) => {
          this.urlSpool = response.desc
        }
    })

    //Carregar combo de estabelecimentos
    this.loadModal             = false
    //this.listaEstabelecimentos = []

    this.placeHolderEstabelecimento = 'Aguarde, carregando lista...'
    this.placeHolderEmitente        = 'Aguarde, carregando lista...'
    this.placeHolderItem            = 'Aguarde, carregando lista...'

    this.srvTotvs.ObterEmitente().subscribe({
      next: (response: any) => {

        this.listaEmitente = response //(response as any[]).sort(this.ordenarCampos(['label']))

      },
      error:(e) => {

        this.srvNotification.error(e.message)
        return
        
      },
      complete: () => {

        this.placeHolderEmitente        = 'Selecione um destino'
        this.cdr.detectChanges()

      }

    })

    this.srvTotvs.ObterEstabelecimentos().subscribe({
      next: (response: any) => {

        //Carrega combo com a lista de estabelecimentos
        this.listaEstabelecimentos = (response as any[]).sort(this.ordenarCampos(['label']))
        this.cdr.detectChanges()
      },
      error: (e) => {
        this.srvNotification.error(e.message)
        return
      },
      complete: () => {
      
        //Seta label dos combos
        this.placeHolderEstabelecimento = 'Selecione um estabelecimento'
        this.placeHolderItem            = 'Selecione um item'
        this.cdr.detectChanges()
      }

    })

    //Colunas do grid
    this.colunas = this.srvTotvs.obterColunas()
    this.ChamaObterDadosPag() //6
    this.attListaItens()
  }
  
  //Filtro Avançado
  onFiltroAvancado(){
    this.telaFiltroAvancado?.open()
  }

  //Listagem em Excel
  onExcel(){
    let titulo = "CADASTRO DE Parâmetros de Envio de Reparos" //this.tituloTela.split(':')[0]
    let subTitulo = "LISTAGEM DE DADOS" //this.tituloTela.split(':')[1]
    this.loadExcel = true

    //let valorForm: any = { valorForm: this.form.value }

    
    const colunasExcel = this.colunas.filter(
      col => col.property !== 'opcao'
    )

    this.srvExcel.exportarParaExcel('HTMLPARAMENVIOREP: ' + titulo.toUpperCase(),
      subTitulo.toUpperCase(),
      colunasExcel,
      this.lista,
      'ParamEnvioRep',
      'Plan1')

    this.loadExcel = false
  }

  public ChamaDescItem(): void {

    this.registroSelecionado.descItem = "Procurando item..."
    
    let params = {item: this.registroSelecionado.codItem}
    this.srvTotvs.ObterDescItem(params).subscribe({
      
      next: (response: any) => {
        setTimeout(() => {
          this.registroSelecionado.descItem = response.descricao
          this.cdr.detectChanges()
        }, 0)
      },
      error: (e) => { 
        console.log('e:' + e)
        this.registroSelecionado.descItem = "Item não encontrado"
        this.cdr.detectChanges()
        return
      }
    })    

  }

  ChamaObterRPW(){

    //Inicializar acompanhamento rpw
    this.numPedExec.update(() => 1)
    let paramsTela: any = { items: this.form.value, filtro: this.filtro, page: this.page, pageSize: this.pageSize }
   
    this.srvTotvs.onObterRPW(paramsTela).subscribe({ 
      next: (response: any) => {
        //this.loadTela = false
        this.srvNotification.success("Pedido e Execução [" + response.pedExec + "] criado para Gerar o Relatório")
      
        //Acompanhar rpw
        this.numPedExec.update(() => response.pedExec)

        //Arquivo Gerado
        let params: any = { nrProcess: 'REL', situacao: 'ITRA' };
        this.srvTotvs.ObterArquivo(params).subscribe({
          next: (item: any) => {
            this.arquivoTransbordo = item.items[0].nomeArquivo
          }})

      },
      error: (e: any) => this.loadTela = false,
      complete: () => {
          this.loadTela = false
          //this.ChamaFaturar?.close()
          
          //Carrega Totais
          //this.onEstabChange(this.codEstabelecimento)
          
          //this.srvNotification.success("Consolidação [" + this.nrConsolidacao + "] Faturada com sucesso ! NF[] Geradas")

          //Próximo passo
          //this.stepper.next()

        }

      })

  }

  ChamaObterDadosPag(){

    this.page     = 1
    this.pageSize = 80
    
    this.lista = []

    this.loadMoreItens() //1

  }

  loadMoreItens(){

    this.labelLoadTela = "Carregando Dados"
    this.loadTela = true

    let paramsTela: any = { items: this.form.value, filtro: this.filtro, page: this.page, pageSize: this.pageSize }
   
    this.srvTotvs.ObterDadosPag(paramsTela).subscribe({
      next: (res: any) => {

        console.log(res)
        this.lista = this.page === 1 ? res.items : [...this.lista, ...res.items]
        this.listaSelecaoFiltrada = this.lista

        this.disableShowMore = res.items.length < this.pageSize
        this.page++

        setTimeout(() => {
          this.loadTela = false
          this.cdr.detectChanges()
        })
      },

      error: (err) => {
        setTimeout(() => {
          this.loadTela = false
          this.cdr.detectChanges()
        })
      },
      complete: () => {
        
        setTimeout(() => {
            this.filtrarLista()
            this.attListaItens()
          })

      }
    })

  }

  //--- Função para ordenar
  //Utilize o - (menos) para indicar ordenacao descendente
  ordenarCampos = (fields: any[]) => (a: { [x: string]: number; }, b: { [x: string]: number; }) => fields.map(o => {
    let dir = 1;
    if (o[0] === '-') { dir = -1; o = o.substring(1); }
    return a[o] > b[o] ? dir : a[o] < b[o] ? -(dir) : 0;
  }).reduce((p, n) => p ? p : n, 0)
  //--- Função para Ordenar

  //--- Função para converter string em data
  parseDate(data: string): Date | null {
    if (!data) return null;

    const partes = data.split('/');
    const dia = +partes[0];
    const mes = +partes[1] - 1;
    const ano = partes[2].length === 2 ? +('20' + partes[2]) : +partes[2];

    return new Date(ano, mes, dia);
  }
  
  private converterParaDate(valor: unknown): Date | null {

    if (!valor) return null;

    // Caso excepcional: se algum dia vier Date
    if (valor instanceof Date) {
      return isNaN(valor.getTime()) ? null : valor;
    }

    // Caso normal do PO-UI: string dd/MM/yyyy
    if (typeof valor === 'string') {
      const partes = valor.split('/');
      if (partes.length !== 3) return null;

      const dia = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const ano = Number(partes[2]);

      const data = new Date(ano, mes, dia);
      return isNaN(data.getTime()) ? null : data;
    }

    return null;
  }

  private stringParaBoolean(valor: any): boolean {
    return valor === 'Sim' || valor === '1' || valor === true
  }
  
  private booleanParaString(valor: boolean): string {
    return valor ? 'Sim' : 'Nao';
  }  
  
  private formatarDataDDMMYYYY(data: unknown): string | null {
    if (!data) return null;

    let dia: number;
    let mes: number;
    let ano: number;

    // ✅ Caso 1: já é Date (cenário ideal)
    if (data instanceof Date) {
      dia = data.getDate();
      mes = data.getMonth() + 1;
      ano = data.getFullYear();
    }

    // ✅ Caso 2: string dd/MM/yyyy
    else if (typeof data === 'string' && data.includes('/')) {
      const partes = data.split('/');
      if (partes.length !== 3) return null;

      dia = Number(partes[0]);
      mes = Number(partes[1]);
      ano = Number(partes[2]);
    }

    // ✅ Caso 3: string yyyy-MM-dd ou yyyy-MM-ddTHH:mm:ss
    else if (typeof data === 'string' && data.includes('-')) {
      const partes = data.substring(0, 10).split('-');
      if (partes.length !== 3) return null;

      ano = Number(partes[0]);
      mes = Number(partes[1]);
      dia = Number(partes[2]);
    }

    else {
      return null;
    }

    if (!dia || !mes || !ano) return null;

    return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
  }

  onImprimirConteudoArquivo() {
    let win = window.open(
      '',
      '',
      'height=' +
        window.innerHeight +
        ', width=' +
        window.innerWidth +
        ', left=0, top=0'
    );
    win?.document.open();
    win?.document.write(
      "<html><head><meta charset='UTF-8'><title>" +
        this.nomeArquivo +
        "</title></head><style>p{ font-family: 'Courier New', Courier, monospace;font-size: 12px; font-variant-numeric: tabular-nums;}</style><body><p>"
    );
    win?.document.write(
      this.conteudoArquivo
        .replace(/\n/gi, '<br>')
       /// .replace(/\40/gi, '&nbsp;')
        .replace(//gi, '<br>')
    );
    win?.document.write('</p></body></html>');
    win?.print();
    win?.document.close();
    win?.close();
  }

}
