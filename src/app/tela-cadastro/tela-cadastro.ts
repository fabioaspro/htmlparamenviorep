import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AfterViewInit, NgZone, ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChild, signal, } from '@angular/core';
import { RouterOutlet, Router, ɵEmptyOutletComponent } from '@angular/router';
import { finalize, map, Subscription, timeInterval } from 'rxjs';
import { FormBuilder, FormGroup, UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PoWidgetModule, PoUploadComponent, PoModule, PoUploadFile, PoTableColumn, PoTableModule, PoButtonModule, PoMenuItem, PoMenuModule, PoModalModule, PoPageModule, PoToolbarModule, PoTableAction, PoModalAction, PoDialogService, PoNotificationService, PoFieldModule, PoDividerModule, PoTableLiterals, PoTableComponent, PoUploadLiterals, PoModalComponent, PoInputComponent, PoComboModule, PoIconModule, PoLoadingModule, PoDialogModule, PoDialogAlertLiterals, PoDialogConfirmLiterals, PoAccordionModule, PoTooltipModule, PoToolbarAction, PoTabsModule } from '@po-ui/ng-components';
import { environment } from '../environments/environment'
import { ServerTotvsService } from '../services/server-totvs.service'
import { ExcelService } from '../services/excel-service.service'
import { DnRangeComponent } from "../dn-range/dn-range.component"
import { DnModal } from "../dn-modal/dn-modal"
import { RpwComponent } from '../rpw/rpw.component';
import { BtnDownloadComponent } from '../btn-download/btn-download.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

interface CadastroForm {
  codEstabel: string | null;
  codItem: string | null;
  descItem: string | null;
  tpControle: string | null;
  dtValidade: Date | string | null;
  lAtivo: string | null;
  cObs: string | null;
}

interface ValidacaoResultado {
  valido: boolean;
  mensagens: string[];
}

type AbaCadastro = 'parametros' | 'tempo';

@Component({
  standalone: true,
  selector: 'app-tela-cadastro',
  imports: [
    PoToolbarModule,
    ReactiveFormsModule,
    PoWidgetModule,
    FormsModule,
    PoPageModule,
    PoButtonModule,
    PoComboModule,
    PoIconModule,
    PoTableModule,
    PoModalModule,
    PoFieldModule,
    PoDividerModule,
    PoLoadingModule,
    PoModule,
    CommonModule,
    PoDialogModule,
    DnRangeComponent,
    CommonModule,
    PoAccordionModule,
    ReactiveFormsModule,
    FormsModule,
    PoTableModule,
    PoModule,
    PoFieldModule,
    PoToolbarModule,
    PoMenuModule,
    PoPageModule,
    HttpClientModule,
    DnModal,
    RpwComponent,
    BtnDownloadComponent,
    PoTooltipModule,
    NgxExtendedPdfViewerModule,
    PoTabsModule
  ],
  templateUrl: './tela-cadastro.html',
  styleUrl: './tela-cadastro.css'
})
export class TelaCadastro implements OnInit {

  constructor(
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) { }

  private srvTotvs = inject(ServerTotvsService);
  private srvExcel = inject(ExcelService);
  private srvNotification = inject(PoNotificationService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);

  private get srvTotvsAny(): any {
    return this.srvTotvs as any
  }

  @ViewChild('telaFiltroAvancado', { static: true }) telaFiltroAvancado: PoModalComponent | undefined;
  @ViewChild('telaRPW', { static: true }) telaRPW: PoModalComponent | undefined;
  @ViewChild('ChamaCadastro') telaCadastro!: PoModalComponent;
  @ViewChild('ChamaCadTempo') telaCadTempo!: PoModalComponent;  
  @ViewChild('ttDados') GridCadastro?: PoTableComponent;
  @ViewChild('ttDadosTempo') GridCadastroTempo?: PoTableComponent;
  @ViewChild('abrirArquivo', { static: true }) abrirArquivo: PoModalComponent | undefined;
  @ViewChild('pdfModal', { static: true }) pdfModal: PoModalComponent | undefined;

  labelLoadTela: string = '';
  loadTela: boolean = false;
  loadExcel: boolean = false;

  abaAtiva: AbaCadastro = 'parametros';

  //--- Controle do acompanhamento RPW
  numPedExec = signal(0);
  labelTimer: string = 'Aguarde a liberação do arquivo...';
  labelTimerDetail: string = '';
  labelPedExec: string = '';
  telaTimerFoiFechada: boolean = false;
  cMensagemErroRPW = '';

  //Abertura de Arquivo
  conteudoArquivo: string = '';
  mostrarInfo: boolean = false;
  nomeArquivo: string = '';
  arquivoParametros: string = '';

  //paginação do grid
  itensPaginados: any[] = [];
  page = 1;
  pageSize = 20;
  disableShowMore = false;

  //---ComboEstabelecimento
  codEstabelecimento: any;
  placeHolderEstabelecimento!: string;

  //---ComboItem
  codItem: any;
  placeHolderItem!: string;

  

  //---ComboTipodeControle
  tpControle: any
  placeHoldertc!: string
  placeHoldertpCont!: string
  loadtpControle: string = ''

  tipoControleback = [
    { label: '1 - Dotação', value: 1 },
    { label: '2 - Transferência', value: 2 },
    { label: '3 - Remessa', value: 3 },
    { label: '4 - Sucata', value: 4 }
  ];

  tipoControleOptions = [
    { label: 'Dotação',       value: 'DOTACAO' },
    { label: 'Transferência', value: 'TRANSFERENCIA' },
    { label: 'Remessa',       value: 'REMESSA' },
    { label: 'Sucata',        value: 'SUCATA' }
  ]
  //--- Filtro Seleção
  estabelecimentoSelecionado: string = '';
  emitenteSelecionado: string = '';
  ItemSelecionado: string = '';

  codTecnico: any;
  listaTecnicos!: any[];
  loadTecnico: string = '';

  listaItens!: any[];
  loadItem: string = '';

  //ListasCombo
  listaEstabelecimentos!: any[];
  listaTransp!: any[];

  //---Grid
  colunas!: PoTableColumn[];
  colunasParametros: PoTableColumn[] = [];
  colunasTempoMedio: PoTableColumn[] = [
    { property: 'codEstabel', label: 'Estabel' },
    { property: 'descEstabel', label: 'Descrição' },
    { property: 'descEmitente', label: 'Descrição' },
    { property: 'codItem', label: 'Item' },
    { property: 'descItem', label: 'Descrição' },
    { property: 'tempoMedio', label: 'Tempo médio (dias)' },
    { property: 'observacao', label: 'Observação' },
    { property: 'lAtivo', label: 'Ativo' },
    { property: 'dtAlteracao', label: 'Alteração' }
  ];

  lista!: any[];
  sub!: Subscription;
  alturaGrid: number = window.innerHeight - 330;
  listaSelecaoFiltrada: any[] = [];
  itensSelecionados: any[] = [];

  //--Variáveis
  objSolic!: any[];
  showLoading = false;
  cItCodigo!: string;
  cDescItem!: string;
  registroSelecionado: any = {};
  modoAlteracao = false;
  modoInclusao = false;
  mostrarModal = false;
  linhaSelecionada: any;
  mensagemModal = '';
  loadModal = false;
  urlSpool: string = '';

  //---Funcionar o visualizar PDF
  pdfUrl?: SafeResourceUrl | undefined;

  //Filtros Avançados
  filtro = {
    valEstabIni: "",
    valEstabFim: "ZZZ",
    cLabelCodEstabel: "Estabelecimento",

    valItemIni: "",
    valItemFim: "ZZZZZZZZZZZZZZZZ",
    cLabelItem: "Item",

    valtpControleIni: "1",
    valtpControleFim: "4",
    cLabeltpControle: "Tipo de Controle",
  };

  filtroPadrao = {
    valEstabIni: "",
    valEstabFim: "ZZZ",
    cLabelCodEstabel: "Estabelecimento",

    valItemIni: "",
    valItemFim: "ZZZZZZZZZZZZZZZZ",
    cLabelItem: "Item",

    valtpControleIni: "1",
    valtpControleFim: "4",
    cLabeltpControle: "Tipo de Controle"
  };

  get filtrosAlterados(): boolean {
    return JSON.stringify(this.filtro) !== JSON.stringify(this.filtroPadrao);
  }

  //Formulario
  public form = this.formBuilder.group({
    codEstabel: [''],
    codItem: [''],
    tpControle: ['']
  });

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
    },
    {
      icon: 'bi bi-bullseye',
      label: 'Escopo',
      action: this.abrirEspec.bind(this)
    }
  ];

  readonly opcoes: PoTableAction[] = [
    {
      label: 'Alterar',
      icon: 'po-icon po-icon-edit'
    },
    {
      label: 'Excluir',
      icon: 'bi bi-trash'
    }
  ];

  readonly acaoSalvar: PoModalAction = {
    label: 'Salvar',
    action: () => {
      this.onConfirmar();
    }
  };

  readonly acaoCancelar: PoModalAction = {
    label: 'Cancelar',
    action: () => {
      this.telaCadastro?.close();
    }
  };

  readonly acaoConfirmarFiltro: PoModalAction = {
    label: 'Aplicar',
    action: () => {
      this.telaFiltroAvancado?.close()
      console.log(this.filtro.valEstabFim)
      this.ChamaObterDadosPag();
    }
  };

  readonly acaoCancelarFiltro: PoModalAction = {
    label: 'Cancelar',
    action: () => {
      this.telaFiltroAvancado?.close();
    }
  };

  readonly acaoConfirmarRPW: PoModalAction = {
    label: 'Executar',
    action: () => {
      this.telaRPW?.close();
      this.ChamaObterRPW();
    }
  };

  readonly acaoCancelarRPW: PoModalAction = {
    label: 'Cancelar',
    action: () => {
      this.telaRPW?.close();
    }
  };

  acaoImprimir: PoModalAction = {
    action: () => {
      this.onImprimirConteudoArquivo();
    },
    label: 'Gerar PDF'
  };

  acaoSair: PoModalAction = {
    action: () => {
      this.abrirArquivo?.close();
    },
    label: 'Sair'
  };

  customLiterals: PoTableLiterals = {
    noData: 'Infome os filtros para Buscar os Dados',
    loadMoreData: 'Carregar mais',
    loadingData: 'Buscar '
  };

  abrirAjuda() {
    const fileUrl = 'assets/docs/ManualTransbordo.pdf';
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
    this.pdfModal?.open();
  }

  abrirDocto() {
    const fileUrl = 'assets/docs/TecnicoTransbordo.pdf';
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
    this.pdfModal?.open();
  }

  abrirEspec() {
    const fileUrl = 'assets/docs/TecnicoTransbordo.pdf';
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
    this.pdfModal?.open();
  }

  ngOnInit(): void {
    this.srvTotvs.ObterCadastro({ tabela: 'spool', codigo: '' }).subscribe({
      next: (response: any) => {
        this.urlSpool = response.desc;
      }
    });

    this.loadModal                  = false
    this.placeHolderEstabelecimento = 'Aguarde, carregando lista...';
    this.placeHoldertpCont          = 'Aguarde, carregando lista...';
    this.placeHolderItem            = 'Aguarde, carregando lista...';

    /*---FAS - não usando mais
    this.srvTotvs.ObterEmitente().subscribe({
      next: (response: any) => {
        this.listaEmitente = response;
      },
      error: (e) => {
        this.srvNotification.error(e.message);
      },
      complete: () => {
        this.placeHolderEmitente   = 'Selecione um destino';
        this.placeHoldertpCont     = 'Selecione um Tipo de Controle'
        this.cdr.detectChanges();
      }
    });
    ---*/

    this.srvTotvs.ObterEstabelecimentos().subscribe({
      next: (response: any) => {
        this.listaEstabelecimentos = (response as any[]).sort(this.ordenarCampos(['label']));
        this.loadTela = false
        this.cdr.detectChanges();
      },
      error: (e) => {
        //this.srvNotification.error(e.message);
      },
      complete: () => {
        this.placeHolderEstabelecimento = 'Selecione um estabelecimento'
        this.placeHoldertpCont          = 'Selecione um Tipo de Controle'
        this.placeHolderItem            = 'Selecione um item'
        this.cdr.detectChanges();
      }
    });

    this.colunasParametros = this.srvTotvs.obterColunas()

    if (typeof this.srvTotvsAny.obterColunasTempoMedio === 'function') {
      this.colunasTempoMedio = this.srvTotvsAny.obterColunasTempoMedio()
    }

    this.configurarAbaAtual()
    this.ChamaObterDadosPag()
    this.attListaItens()
  }

  // =========================
  // CONTROLE DE ABA / CONTEXTO
  // =========================
  private getGridAtual(): PoTableComponent | undefined {
    return this.abaAtiva === 'parametros' ? this.GridCadastro : this.GridCadastroTempo;
  }

  private configurarAbaAtual(): void {
    this.colunas = this.abaAtiva === 'parametros'
      ? this.colunasParametros
      : this.colunasTempoMedio;
  }

  private limparEstadoTela(): void {
    this.page = 1;
    this.pageSize = 80;
    this.lista = [];
    this.listaSelecaoFiltrada = [];
    this.disableShowMore = false;

    this.estabelecimentoSelecionado = '';
    this.emitenteSelecionado = '';
    this.ItemSelecionado = '';

    this.codEstabelecimento = undefined;
    this.codItem = undefined;
    this.tpControle = undefined;

    this.form.patchValue({
      codEstabel: '',
      codItem: '',
      tpControle: ''
    }, { emitEvent: false });
  }

  selecionarAba(aba: AbaCadastro): void {
    if (this.abaAtiva === aba) return;

    this.abaAtiva = aba;
    this.limparEstadoTela();
    this.configurarAbaAtual();
    this.ChamaObterDadosPag();
    this.attListaItens()
    this.cdr.detectChanges()
  }

  // wrappers para os botões do topo
  onAtualizar(): void {
    this.ChamaObterDadosPag();
  }

  onNovo(): void {
    this.onIncluir('Inclusão');
  }

  onExcluir(): void {
    this.onExcluirSelecionados();
  }

  // =========================
  // CARGA / FILTRO / RPW
  // =========================
  onCarga() {
    this.router.navigate(['carga'], {
      queryParams: { aba: this.abaAtiva }
    });
  }

  onFiltroAvancado() {
    this.telaFiltroAvancado?.open();
  }

  onRPW() {
    this.telaRPW?.open();
  }

  limparFiltros() {
    this.filtro = { ...this.filtroPadrao };
  }

  // =========================
  // FILTROS DOS COMBOS
  // =========================
  public onEstabChange(obj: string) {
    if (obj === undefined || obj === "") {
      this.estabelecimentoSelecionado = '';
      this.listaSelecaoFiltrada = this.lista;
      this.filtrarLista();
      this.attListaItens();
      return;
    }

    this.estabelecimentoSelecionado = obj ? String(obj).split(' ')[0] : '';
    this.filtrarLista();
    this.attListaItens();
  }

  public onItemChange(obj: string) {
    if (obj === undefined || obj === "") {
      this.ItemSelecionado = '';
      this.listaSelecaoFiltrada = this.lista;
      this.filtrarLista();
      this.attListaItens();
      return;
    }

    this.ItemSelecionado = obj ? String(obj).split(' ')[0] : '';
    this.filtrarLista();
  }

  public onEmitenteChange(obj: string) {
    if (obj === undefined || obj === "") {
      this.emitenteSelecionado = '';
      this.listaSelecaoFiltrada = this.lista;
      this.filtrarLista();
      this.attListaItens();
      return;
    }
 
    this.emitenteSelecionado = obj ? String(obj).split(' ')[0] : ''
    this.filtrarLista();
    this.attListaItens();
  }

  public filtrarLista() {
    this.listaSelecaoFiltrada = (this.lista || []).filter(item => {
      const filtroEstabelecimento = this.estabelecimentoSelecionado ? item.codEstabel === this.estabelecimentoSelecionado : true;
      const filtroEmitente = this.emitenteSelecionado ? item.tpControle === this.emitenteSelecionado : true;
      const filtroItem = this.ItemSelecionado ? item.codItem === this.ItemSelecionado : true;
      return filtroEstabelecimento && filtroEmitente && filtroItem;
    });
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

    const novosItens = [{ label: 'Todos', value: null }, ...itensOrdenados]

    if (JSON.stringify(this.listaItens) !== JSON.stringify(novosItens)) {
      this.listaItens = novosItens
    }

  }

  // =========================
  // REGISTROS / MODAL
  // =========================
  getRegistroVazio() {
    return {
      codEstabel: null,
      codItem: '',
      descItem: '',
      tpControle: '',
      dtValidade: new Date(),
      lAtivo: true
    };
  }

  getRegistroVazioTempo() {
    return {
      codEstabel: null,
      codItem: '',
      descItem: '',
      tempoMedio: null,
      observacao: '',
      lAtivo: true
    };
  }

  private montarFormularioParametros(): CadastroForm {
    return {
      codEstabel: this.registroSelecionado.codEstabel,
      codItem: this.registroSelecionado.codItem,
      descItem: this.registroSelecionado.descItem,
      tpControle: this.registroSelecionado.tpControle,
      dtValidade: this.formatarDataDDMMYYYY(
        this.registroSelecionado.dtValidade as Date | null
      ),
      lAtivo: this.booleanParaString(this.registroSelecionado.lAtivo),
      cObs: this.registroSelecionado.cObs
    };
  }

  private montarFormularioTempoMedio() {
    return {
      codEstabel: this.registroSelecionado.codEstabel,
      codItem: this.registroSelecionado.codItem,
      descItem: this.registroSelecionado.descItem,
      tempoMedio: this.registroSelecionado.tempoMedio,
      observacao: this.registroSelecionado.observacao ?? '',
      lAtivo: this.booleanParaString(this.registroSelecionado.lAtivo)
    };
  }

  onConfirmar() {
    if (this.abaAtiva === 'parametros') {
      this.onConfirmarParametro();
      return;
    }

    this.onConfirmarTempo();
  }

  private onConfirmarParametro(): void {
    this.loadModal = true;

    const formulario = this.montarFormularioParametros();
    const resultado  = this.validarFormularioParametros(formulario);

    if (!resultado.valido) {
      resultado.mensagens.forEach(mensagem => {
        this.srvNotification.error(mensagem);
      });
      this.loadModal = false;
      return;
    }

    this.telaCadastro.close();
    this.loadTela = true;

    const paramsTela: any = { items: [formulario] };

    this.srvTotvs.onSalvarParametros(paramsTela).subscribe({
      next: () => {
        this.srvNotification.success('Parâmetros salvo com sucesso.');
        this.ChamaObterDadosPag();

        setTimeout(() => {
//          this.loadTela = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loadTela = false;
          this.loadModal = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private onConfirmarTempo(): void {
    const formulario = this.montarFormularioTempoMedio();
    const resultado = this.validarFormularioTempoMedio(formulario);

    if (!resultado.valido) {
      resultado.mensagens.forEach(mensagem => {
        this.srvNotification.error(mensagem);
      });
      return;
    }

    if (typeof this.srvTotvsAny.onSalvarTempoMedio !== 'function') {
      this.srvNotification.warning('Implementar método onSalvarTempoMedio no service.');
      return;
    }

    this.loadModal = true;
    this.telaCadastro.close();
    this.loadTela = true;

    const paramsTela: any = { items: [formulario] };

    this.srvTotvsAny.onSalvarTempoMedio(paramsTela).subscribe({
      next: () => {
        this.srvNotification.success('Tempo médio salvo com sucesso.');
        this.loadModal = false;
        this.ChamaObterDadosPag();

        setTimeout(() => {
          this.loadTela = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loadTela = false;
          this.loadModal = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  validarFormularioParametros(form: CadastroForm): ValidacaoResultado {
    const mensagens: string[] = [];

    if (this.modoInclusao) {
      if (!form.tpControle) mensagens.push('Tipo de Controle é obrigatório.');
      if (!form.codItem)    mensagens.push('Item é obrigatório.');
      if (!form.codEstabel) mensagens.push('Estabelecimento é obrigatório.');
    }

    if (!form.dtValidade) {
      mensagens.push('Data de Validade é obrigatória.');
    }

    const dataInformada = this.converterParaDate(form.dtValidade);

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

    return {
      valido: mensagens.length === 0,
      mensagens
    };
  }

  validarFormularioTempoMedio(form: any): ValidacaoResultado {
    const mensagens: string[] = [];

    if (!form.codEstabel) mensagens.push('Estabelecimento é obrigatório.');
    if (!form.codItem) mensagens.push('Item é obrigatório.');

    if (form.tempoMedio === null || form.tempoMedio === undefined || form.tempoMedio === '') {
      mensagens.push('Tempo médio é obrigatório.');
    }

    const tempo = Number(form.tempoMedio);
    if (isNaN(tempo) || tempo < 0) {
      mensagens.push('Tempo médio inválido.');
    }

    return {
      valido: mensagens.length === 0,
      mensagens
    };
  }

  public onAlterar(row: any) {
    if (this.abaAtiva === 'parametros') {
      this.modoAlteracao = true;
      this.registroSelecionado = {
        ...row,
        lAtivo: this.stringParaBoolean(row.lAtivo),
        dtValidade: this.parseDate(row.dtValidade)
      };
      this.onIncluirParametro('Alteração');
      return;
    }

    this.modoAlteracao = true;
    this.registroSelecionado = {
      ...row,
      lAtivo: this.stringParaBoolean(row.lAtivo)
    };
    this.onIncluirTempo('Alteração');
  }

  public onIncluir(obj: any) {
    if (this.abaAtiva === 'parametros') {
      this.onIncluirParametro(obj)
      return
    }

    this.onIncluirTempo(obj)
  }

  private onIncluirParametro(obj: any) {
    if (obj === "Inclusão") {
      this.registroSelecionado = this.getRegistroVazio();
      this.modoInclusao  = true;
      this.modoAlteracao = false;
    } else {
      this.modoInclusao  = false;
      this.modoAlteracao = true;
    }

    this.objSolic = obj;
    this.telaCadastro.open();
  }

  private onIncluirTempo(obj: any) {
    if (obj === "Inclusão") {
      this.registroSelecionado = this.getRegistroVazioTempo();
      this.modoInclusao = true;
      this.modoAlteracao = false;
    } else {
      this.modoInclusao = false;
      this.modoAlteracao = true;
    }

    this.objSolic = obj;
    this.telaCadTempo.open();
  }

  public FecharChamaCadastro(): void {
    this.telaCadastro.close();
  }

  public Cadastro(): void {
    this.telaCadastro.close();
  }

  onAlterarGrid(obj: any | null) {
    // reservado
  }

  public ChamaDescItem(): void {
    this.registroSelecionado.descItem = "Procurando item...";

    const params = { item: this.registroSelecionado.codItem };
    this.srvTotvs.ObterDescItem(params).subscribe({
      next: (response: any) => {
        setTimeout(() => {
          this.registroSelecionado.descItem = response.descricao;
          this.cdr.detectChanges();
        }, 0);
      },
      error: () => {
        this.registroSelecionado.descItem = "Item não encontrado";
        this.cdr.detectChanges();
      }
    });
  }

  // =========================
  // EXCLUSÃO
  // =========================
  public solicitarExclusao(row: any) {
    this.linhaSelecionada = row;

    const tituloRegistro = this.abaAtiva === 'parametros' ? 'Parâmetro' : 'Tempo médio';

    this.mensagemModal = `<div class="confirm-msg">
                            <p>
                              Deseja realmente excluir o <strong>${tituloRegistro}</strong> abaixo?
                            </p>
                            <br>
                            <div class="confirm-box">
                              <div class="linha">
                                <span>Estabelecimento</span>
                                <strong>${row.codEstabel}</strong>
                              </div>

                              <div class="linha destaque">
                                <span>Item</span>
                                <strong>${row.codItem}</strong>
                              </div>
                              
                              <div class="linha destaque">
                                <span>Tipo de Controle</span>
                                <strong>${row.tpControle}</strong>
                              </div>

                            </div>
                          </div>`;

    this.mostrarModal = true;
  }

  public onConfirmarExclusao(confirmado: boolean) {
    this.mostrarModal = false;

    if (confirmado) {
      this.onExcluirSelLinha(this.linhaSelecionada);
    }
  }

  public onExcluirSelLinha(row: any): void {
    if (this.abaAtiva === 'parametros') {
      this.onExcluirSelLinhaParametro(row);
      return;
    }

    this.onExcluirSelLinhaTempo(row);
  }

  private onExcluirSelLinhaParametro(row: any): void {
    this.mostrarModal = false;
    this.cdr.detectChanges();

    this.loadTela = true;
    this.labelLoadTela = "Excluindo";

    const paramsTela: any = {
      items: [
        {
          codEstabel: row.codEstabel,
          codItem: row.codItem,
          tpControle: row.tpControle
        }
      ]
    };

    this.srvTotvs.onExcluirSel(paramsTela).subscribe({
      next: () => {
        this.ChamaObterDadosPag();
        this.srvNotification.success(
          'Parâmetro excluido com sucesso [Estabel: ' +
          row.codEstabel + ' Item: ' + row.codItem + ' Tipo de Controle: ' + row.tpControle + ']'
        );

        setTimeout(() => {
          this.loadTela = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loadTela = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private onExcluirSelLinhaTempo(row: any): void {
    if (typeof this.srvTotvsAny.onExcluirSelTempoMedio !== 'function') {
      this.srvNotification.warning('Implementar método onExcluirSelTempoMedio no service.');
      return;
    }

    this.mostrarModal = false;
    this.cdr.detectChanges();

    this.loadTela = true;
    this.labelLoadTela = "Excluindo";

    const paramsTela: any = {
      items: [
        {
          codEstabel: row.codEstabel,
          codItem: row.codItem,
          tpControle: row.tpControle
        }
      ]
    };

    this.srvTotvsAny.onExcluirSelTempoMedio(paramsTela).subscribe({
      next: () => {
        this.ChamaObterDadosPag();
        this.srvNotification.success(
          'Tempo médio excluido com sucesso [Estabel: ' +
          row.codEstabel + ' Item: ' + row.codItem + ' Tipo de Controle: ' + row.tpControle + ']'
        );

        setTimeout(() => {
          this.loadTela = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loadTela = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  public onExcluirSelecionados(): void {
    if (this.abaAtiva === 'parametros') {
      this.onExcluirSelecionadosParametro();
      return;
    }

    this.onExcluirSelecionadosTempo();
  }

  private onExcluirSelecionadosParametro(): void {
    const registrosSelecionados = this.getGridAtual()?.getSelectedRows() ?? [];

    if (registrosSelecionados.length <= 0) {
      this.srvNotification.error('Nenhum registro selecionado !');
      return;
    }

    const paramsTela: any = {
      items: registrosSelecionados.map((row: any) => ({
        codEstabel: row.codEstabel,
        codItem: row.codItem,
        tpControle: row.tpControle
      }))
    };

    this.loadTela = true;

    this.srvTotvs.onExcluirSel(paramsTela).subscribe({
      next: () => {
        this.ChamaObterDadosPag();
        this.srvNotification.success('Parâmetro excluido com sucesso');

        setTimeout(() => {
          this.loadTela = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loadTela = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private onExcluirSelecionadosTempo(): void {
    if (typeof this.srvTotvsAny.onExcluirSelTempoMedio !== 'function') {
      this.srvNotification.warning('Implementar método onExcluirSelTempoMedio no service.');
      return;
    }

    const registrosSelecionados = this.getGridAtual()?.getSelectedRows() ?? [];

    if (registrosSelecionados.length <= 0) {
      this.srvNotification.error('Nenhum registro selecionado !');
      return;
    }

    const paramsTela: any = {
      items: registrosSelecionados.map((row: any) => ({
        codEstabel: row.codEstabel,
        codItem: row.codItem
      }))
    };

    this.loadTela = true;

    this.srvTotvsAny.onExcluirSelTempoMedio(paramsTela).subscribe({
      next: () => {
        this.ChamaObterDadosPag();
        this.srvNotification.success('Tempo médio excluido com sucesso');

        setTimeout(() => {
          this.loadTela = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loadTela = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  // =========================
  // RPW
  // =========================
  ChamaObterRPW() {
    if (this.abaAtiva === 'parametros') {
      this.ChamaObterRPWParametro();
      return;
    }

    this.ChamaObterRPWTempo();
  }

  private ChamaObterRPWParametro() {
    this.numPedExec.update(() => 1);

    console.log(this.filtro.valEstabFim)
    const paramsTela: any = {
      items: this.form.value,
      filtro: this.filtro,
      page: this.page,
      pageSize: this.pageSize
    };

    if (typeof this.srvTotvs.onObterRPW !== 'function') {
      this.srvNotification.warning('Implementar método onObterRPW no service.');
      return;
    }

    this.srvTotvs.onObterRPW(paramsTela).subscribe({
      next: (response: any) => {
        this.srvNotification.success("Pedido e Execução [" + response.pedExec + "] criado para Gerar o Relatório");
        this.numPedExec.update(() => response.pedExec);

        const params: any = { nrProcess: 'REL', situacao: 'ParamEnvioRep' };
        this.srvTotvs.ObterArquivo(params).subscribe({
          next: (item: any) => {
            this.arquivoParametros = item.items[0].nomeArquivo;
          }
        });
      },
      error: () => {
        this.loadTela = false;
      },
      complete: () => {
        this.loadTela = false;
      }
    });
  }

  private ChamaObterRPWTempo() {
    if (typeof this.srvTotvsAny.onObterRPWTempoMedio !== 'function') {
      this.srvNotification.warning('Implementar método onObterRPWTempoMedio no service.');
      return;
    }

    this.numPedExec.update(() => 1);

    const paramsTela: any = {
      items: this.form.value,
      filtro: this.filtro,
      page: this.page,
      pageSize: this.pageSize
    };

    this.srvTotvsAny.onObterRPWTempoMedio(paramsTela).subscribe({
      next: (response: any) => {
        this.srvNotification.success("Pedido e Execução [" + response.pedExec + "] criado para Gerar o Relatório");
        this.numPedExec.update(() => response.pedExec);
      },
      error: () => {
        this.loadTela = false;
      },
      complete: () => {
        this.loadTela = false;
      }
    });
  }

  // =========================
  // BUSCA / PAGINAÇÃO
  // =========================
  ChamaObterDadosPag() {
    this.page                 = 1;
    this.pageSize             = 80;
    this.lista                = [];
    this.listaSelecaoFiltrada = [];
    this.disableShowMore      = false;
    this.loadMoreItens();
  }

  loadMoreItens() {
    if (this.abaAtiva === 'parametros') {
      this.loadMoreItensParametro();
      return;
    }

    this.loadMoreItensTempo();
  }

  private loadMoreItensParametro() {
    this.labelLoadTela = "Carregando Dados";
    this.loadTela = true

    const paramsTela: any = {
      items: this.form.value,
      filtro: this.filtro,
      page: this.page,
      pageSize: this.pageSize
    };

    this.srvTotvs.ObterDadosPag(paramsTela).subscribe({
      next: (res: any) => {
        
        //this.lista = this.page === 1 ? res.items : [...this.lista, ...res.items];
        if (this.page === 1) {
            this.lista.splice(0, this.lista.length, ...res.items);
          } else {
            this.lista.push(...res.items);
        }

        this.listaSelecaoFiltrada = this.lista;
        this.disableShowMore = res.items.length < this.pageSize;
        this.page++;

        setTimeout(() => {
          this.loadTela = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loadTela = false
          this.cdr.detectChanges()
        });
      },
      complete: () => {
        setTimeout(() => {
          this.loadTela = false
          this.filtrarLista()
          this.attListaItens()
        });
      }
    });
  }

  private loadMoreItensTempo() {
    if (typeof this.srvTotvsAny.ObterDadosPagTempoMedio !== 'function') {
      this.lista = [];
      this.listaSelecaoFiltrada = [];
      this.disableShowMore = true;
      this.loadTela = false;
      this.cdr.detectChanges();
      this.srvNotification.warning('Implementar método ObterDadosPagTempoMedio no service.');
      return;
    }

    this.labelLoadTela = "Carregando Dados";
    this.loadTela = true;

    const paramsTela: any = {
      items: this.form.value,
      filtro: this.filtro,
      page: this.page,
      pageSize: this.pageSize
    };

    this.srvTotvsAny.ObterDadosPagTempoMedio(paramsTela).subscribe({
      next: (res: any) => {
        this.lista = this.page === 1 ? res.items : [...this.lista, ...res.items];
        this.listaSelecaoFiltrada = this.lista;
        this.disableShowMore = res.items.length < this.pageSize;
        this.page++;

        setTimeout(() => {
          this.loadTela = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loadTela = false;
          this.cdr.detectChanges();
        });
      },
      complete: () => {
        setTimeout(() => {
          this.filtrarLista();
          this.attListaItens();
        });
      }
    });
  }

  // =========================
  // EXCEL
  // =========================
  onExcel() {
    const titulo = this.abaAtiva === 'parametros'
      ? "CADASTRO DE Parâmetros de Envio de Reparos"
      : "CADASTRO DE Tempo Médio";

    const subTitulo = "LISTAGEM DE DADOS";
    this.loadExcel = true;

    const colunasExcel = this.colunas.filter(col => col.property !== 'opcao');

    this.srvExcel.exportarParaExcel(
      'HTMLPARAMENVIOREP: ' + titulo.toUpperCase(),
      subTitulo.toUpperCase(),
      colunasExcel,
      this.lista,
      this.abaAtiva === 'parametros' ? 'ParamEnvioRep' : 'TempoMedioRep',
      'Plan1'
    );

    this.loadExcel = false;
  }

  // =========================
  // UTILITÁRIOS
  // =========================
  ordenarCampos = (fields: any[]) => (a: { [x: string]: number }, b: { [x: string]: number }) =>
    fields.map(o => {
      let dir = 1;
      if (o[0] === '-') {
        dir = -1;
        o = o.substring(1);
      }
      return a[o] > b[o] ? dir : a[o] < b[o] ? -(dir) : 0;
    }).reduce((p, n) => p ? p : n, 0);

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

    if (valor instanceof Date) {
      return isNaN(valor.getTime()) ? null : valor;
    }

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
    return valor === 'Sim' || valor === '1' || valor === true;
  }

  private booleanParaString(valor: boolean): string {
    return valor ? 'Sim' : 'Nao';
  }

  private formatarDataDDMMYYYY(data: unknown): string | null {
    if (!data) return null;

    let dia: number;
    let mes: number;
    let ano: number;

    if (data instanceof Date) {
      dia = data.getDate();
      mes = data.getMonth() + 1;
      ano = data.getFullYear();
    } else if (typeof data === 'string' && data.includes('/')) {
      const partes = data.split('/');
      if (partes.length !== 3) return null;

      dia = Number(partes[0]);
      mes = Number(partes[1]);
      ano = Number(partes[2]);
    } else if (typeof data === 'string' && data.includes('-')) {
      const partes = data.substring(0, 10).split('-');
      if (partes.length !== 3) return null;

      ano = Number(partes[0]);
      mes = Number(partes[1]);
      dia = Number(partes[2]);
    } else {
      return null;
    }

    if (!dia || !mes || !ano) return null;

    return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
  }

  onImprimirConteudoArquivo() {
    const win = window.open(
      '',
      '',
      'height=' + window.innerHeight + ', width=' + window.innerWidth + ', left=0, top=0'
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
        .replace(//gi, '<br>')
    );

    win?.document.write('</p></body></html>');
    win?.print();
    win?.document.close();
    win?.close();
  }
}