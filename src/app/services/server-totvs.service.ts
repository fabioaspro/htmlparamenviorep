import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, catchError, map, of, take, tap } from 'rxjs';
import { Observable } from 'rxjs';
import { PoNotificationService, PoTableColumn } from '@po-ui/ng-components';
import { environment } from '../environments/environment'

//--- Header somente para DEV
const headersTotvs = new HttpHeaders(environment.totvs_header)

@Injectable({
  providedIn: 'root'
})
export class ServerTotvsService {
  private reg!:any;
  private srvNotification = inject(PoNotificationService);

  _url      = environment.totvs_url
  _urlGeral = environment.totvs_url_Geral

  constructor(private http: HttpClient ) { }

  //------------ Colunas Grid Parametros de Envio de Reparos
  obterColunas(): Array<PoTableColumn> {
    return [
      { property: 'iLinha',        label: "Linha", visible: false},
      { property: 'codEstabel',    label: "Estabel"}, 
      { property: 'descEstabel',   label: "Descrição"},
      { property: 'codItem',       label: "Item"}, 
      { property: 'descItem',      label: "Descrição"},
      { property: 'tpControle',    label: "Tipo de Controle"},
      { property: 'lAtivo',        label: "Ativo"},
      { property: 'dtValidade',    label: "Validade"},
      { property: 'opcao',         label: 'Ação', type: 'cellTemplate', width: '130px' },
      { property: 'DtHrUsInc',     label: "Inclusão"},
      { property: 'DtHrUsAlt',     label: "Alteração"},
      { property: 'cObs',          label: "Observação"},
    ];
  }
  //------------ Colunas Grid Importação Parametros de Envio de Reparos
  obterColunasImp(): Array<PoTableColumn> {
    return [
      { property: 'iLinha',        label: "Linha", visible: false},
      { property: 'codEstabel',    label: "Estabel"}, 
      { property: 'descEstabel',   label: "Descrição"},
      { property: 'codItem',       label: "Item"}, 
      { property: 'descItem',      label: "Descrição"},
      { property: 'lAtivo',        label: "Ativo"},
      { property: 'dtValidade',    label: "Validade"},
      { property: 'DtHrUsInc',     label: "Resultado"},
      { property: 'opcao',         label: 'Ação', type: 'cellTemplate', visible: false},
      { property: 'DtHrUsAlt',     label: "Alteração", visible: false},
    ];
  }

  //--- url
  public onObterRPW(params?: any){
    return this.http.post(`${this._url}/onObterRPW`, params, {headers:headersTotvs}).pipe(take(1))  
  }

  //Retorno transformado no formato {label: xxx, value: yyyy}
  public ObterEstabelecimentos(params?: any) {
    return this.http.get<any>(
      `${this._url}/ObterEstab`,
      { params, headers: headersTotvs }
    ).pipe(
      map((response: any) =>
        (response?.items || []).map((item: any) => ({
          label: `${item.codEstab} ${item.nome}`,
          value: item.codEstab,
          codFilial: item.codFilial
        }))
      ),
      catchError(error => {
        if (error.status === 404) {
          this.srvNotification.warning('Endpoint ObterEstab indisponível.');
        } else {
          this.srvNotification.error('Endpoint ObterEstab indisponível.');
        }
        
        return of([]);
      }),
      take(1)
    );
  }

  //Usando paginação
  public ObterDadosPag(params?: any) {
    return this.http.post(
      `${this._url}/ObterDadosPag`,
      params,
      { headers: headersTotvs }
    ).pipe(
      catchError(error => {

        if (error.status === 404) {
          this.srvNotification.warning('Funcionalidade ainda não disponível.');
        } else {
          this.srvNotification.error('Erro ao consultar dados.');
        }

        return of([]);
      }),
      take(1)
    );
}

  //Retorno transformado no formato {label: xxx, value: yyyy}
  public ObterEmitente(params?: any){
    return this.http.get<any>(`${this._url}/ObterEmitente`, {params: params, headers:headersTotvs}).pipe(
                  map(item => { return item.items.map((item:any) =>  { return { label:item.codEmitente + ' ' + item.nomeAbrev, value: item.codEmitente, codFilial: item.codFilial } }) }), take(1));
  }

  //---Efetivar alteração/inclusão do cadastro
  public onSalvarParametros(params?: any){
    return this.http.post(`${this._url}/onSalvarParametros`, params, {headers:headersTotvs}).pipe(take(1))
  }

  //--- Procedure POST
  public onExcluirSel(params?: any) {
      return this.http.post(`${this._url}/onExcluirSel`, params, { headers: headersTotvs }).pipe(take(1))
  }
  
  //---Upload do arquivo
  public UpdloadArquivo(params?: any){
    return this.http.post(`${this._url}/addFiles`, params, {headers:headersTotvs}).pipe(take(1))
  }

  //---Efetivar arquivo
  public EfetivarArquivo(params?: any){
    return this.http.post(`${this._url}/EfetivarArquivo`, params, {headers:headersTotvs}).pipe(take(1))
  }

  //--- Obter Lista Completa
  public ObterArquivoImp(params?: any){
    return this.http.get(`${this._url}/ObterArquivoImp`, {params:params, headers:headersTotvs}).pipe(take(1));
  }

  //--- Obter Arquivo
  public ObterArquivo(params?: any){
    return this.http.get(`${this._urlGeral}/ObterArquivo`, {params:params, headers:headersTotvs}).pipe(take(1));
  }
  
  

  //############
  //--- urlGeral
  //--- Obter Situação do RPW 
  public piObterSituacaoRPW(params?: any){
    return this.http.get(`${this._urlGeral}/piObterSituacaoRPW`, {params:params, headers:headersTotvs}).pipe(take(1));
  }

  //---Obter descrição do item
  public ObterDescItem(params?: any){
    return this.http.get<any>(`${this._urlGeral}/ObterDescItem`, {params:params, headers:headersTotvs}).pipe(take(1))
      .pipe(take(1))
  }

  public ObterCadastro(params?: any){
    return this.http.get(`${this._urlGeral}/ObterCadastro`, {params:params, headers:headersTotvs}).pipe(take(1));
  }

  //Chama tela do TOTVS
  public AbrirTelaTOTVS(params?:any){
    return this.http.get('/totvs-menu/rest/exec', { params, headers: headersTotvs }).pipe(take(1));
  }


   //Ordenacao campos num array
  public ordenarCampos = (fields: any[]) =>
    (a: { [x: string]: number }, b: { [x: string]: number }) =>
      fields
        .map((o) => {
          let dir = 1;
          if (o[0] === '-') {
            dir = -1;
            o = o.substring(1);
          }
          return a[o] > b[o] ? dir : a[o] < b[o] ? -dir : 0;
        })
        .reduce((p, n) => (p ? p : n), 0)

  //#############
  //--- Não usado

  //---------------------- Variaveis Globais
  public OLD_ObterVariaveisGlobais(params?: any){
    return this.http.get(`${this._url}/ObterVariaveisGlobais`, {params, headers:headersTotvs}).pipe(take(1));
  }

  

  

  

  
  
  

  
  
  
  //---Tela de Parametros de Envio de Reparos acima

  //------------ Colunas Grid ESRR033
  OLD_obterColunasmttr(): Array<PoTableColumn> {
    return [
      { property: 'cScan',            label: "cScan", visible:false},
      { property: 'codEstabel',       label: "Estab"},
      { property: 'codFilial',        label: "Filial"},
      { property: 'numRR',            label: "NumRR"},
      { property: 'itCodigo',         label: "Item"},
      { property: 'totT',             label: "Tot.Teórico"},
      { property: 'totR',             label: "Tot.Real"},
      { property: 'tpPed',            label: "Tp.Ped"},
      { property: 'desctpPed',        label: "Descrição"},
      { property: 'numSerieIt',       label: "Num.Série"},
      { property: 'termGarantia',     label: "Térm.Garantia"},
      { property: 'decValOrc',        label: "Valor Orçado"}
    ];
  }

  //------------ Colunas Grid ESRR033B
  OLD_obterColunasPed(): Array<PoTableColumn> {
    return [
      { property: 'codEstabel',       label: "Estab"},
      { property: 'nrPedCli',         label: "Ped.Cliente"},
      { property: 'nomeAbrev',        label: "Nome Abrev"},
      { property: 'nrPedido',         label: "Pedido"},      
      { property: 'solicitante',      label: "Solicitante"},
      { property: 'tpPed',            label: "Tipo de Pedido"},
      { property: 'destino',          label: "Destino"},
      { property: 'sitPed',           label: "Situação"}
    ];
  }

  //------------ Colunas Grid ESAA052
  OLD_obterColunasRPD(): Array<PoTableColumn> {
    return [
      { property: 'tecLab',        label: "Técnico LAB"},
      { property: 'dataRPD',       label: "Data"},
      { property: 'hrIni',         label: "Hora Ini Rep"},
      { property: 'hrFim',         label: "Hora Fim Rep"},
      { property: 'defCons',       label: "Defeito Cons"},
      { property: 'causa',         label: "Causa"},
      { property: 'sol1',          label: "Solução 1"},
      { property: 'sol2',          label: "Solução 2"},
      { property: 'situacao',      label: "Situação"},
    ];
  }

  OLD_obterColunasItens(): Array<PoTableColumn> {
    return [
      { property: 'Componente',      label: "Componente"},
      { property: 'Descricao',       label: "Descrição"},
      { property: 'Local',           label: "Local"},
      { property: 'Qtde',            label: "Qtde"},
      { property: 'Situacao',        label: "Situação"},
    ];
  }

  OLD_obterColunasErrorEsaa052(): Array<PoTableColumn> {
    return [
      { property: 'idBatch',       label: "ID", type: 'number', format: "1.0-0", visible: false},
      { property: 'SeqError',      label: "Seq"},
      { property: 'msgErro',       label: "Msg Error"},
      { property: 'Erro',          label: "Erro"},
      { property: 'DtHrError',     label: "Dt/Hr Error", type:'date', format: "dd/MM/yyyy"},
    ];
  }

  //------------ Colunas Grid ESAA068
  OLD_obterColunasEsaa068(): Array<PoTableColumn> {
    return [
      { property: 'idBatch',       label: "IDBatch", type: 'number', format: "1.0-0", visible: false},
      { property: 'Chave',         label: "Chave", visible: true},
      { property: 'Estab',         label: "Estab"},
      { property: 'numOS',         label: "NumOS", visible: false},
      { property: 'serie',         label: "Série", visible: false},
      { property: 'itCodigo',      label: "Item", visible: false},
      { property: 'nrEnc',         label: "ENC", visible: false},     
      { property: 'Integracao',    label: "Integracao"},
      { property: 'Lote',          label: "Lote"},
      { property: 'DtHrInc',       label: "DtHrInc", type:'date', format: "dd/MM/yyyy"},
      { property: 'DtHrEnv',       label: "DtHrEnv", type:'date', format: "dd/MM/yyyy"},
      { property: 'Pendente',      label: "Pendente"},
      { property: 'Origem',        label: 'Origem', visible: false}, 
      { property: 'QtdReprocessa', label: "QtdReprocessa", visible: false},
    ];
  }

  OLD_obterColunasErrorEsaa068(): Array<PoTableColumn> {
    return [
      { property: 'idBatch',       label: "ID", type: 'number', format: "1.0-0", visible: false},
      { property: 'SeqError',      label: "Seq"},
      { property: 'msgErro',       label: "Msg Error"},
      { property: 'Erro',          label: "Erro"},
      { property: 'DtHrError',     label: "Dt/Hr Error", type:'date', format: "dd/MM/yyyy"},
    ];
  }
  //---------------------- Obter Lista Completa
  public OLD_ObterTecLab(params?: any){
    return this.http.post(`${this._url}/addFiles`, params, {headers:headersTotvs}).pipe(take(1))
  }
  
  //Chama tela do TOTVS
  public OLD_ObterCadastro(params?: any){
    return this.http.get(`${this._url}/ObterCadastro`, {params:params, headers:headersTotvs}).pipe(take(1));
  }

  public OLD_ObterFilialOrigem(params?: any){
    return this.http.get<any>(`${this._url}/ObterFilialOrigem`, {params: params, headers:headersTotvs}).pipe(
                  map(item => { return item.items.map((item:any) =>  { return { label:item.codEstab + ' ' + item.nome, value: item.codEstab, codFilial: item.codFilial } }) }), take(1));
  }

  //Chama obter usuario
  public OLD_ObterUsuario(params?: any){
    return this.http.post(`${this._url}/ObterUsuario`, params, {headers:headersTotvs}).pipe(take(1))
  }

  
  public OLD_ObterImprimePd(params?: any){
    return this.http.post(`${this._url}/ObterImprimePd`, params, {headers:headersTotvs}).pipe(take(1))
  }
  

  //Colunas do Log de Arquivos
  OLD_obterColunasArquivos(): Array<PoTableColumn> {
  return [
    {property: 'nomeArquivo', label: "Arquivo", type: 'columnTemplate'},
    {property: 'mensagem',    label: "Descrição"},
    {property: 'dataHora',    label: "Data", type:'date', format: "dd/MM/yyyy hh:mm:ss"},
    {property: 'numPedExec',  label: "PedExec"},
  ];
}
  //---------------------- Obter Lista Completa
  public OLD_ObterLeave(params?: any){
    return this.http.post(`${this._url}/ObterLeave`, params, {headers:headersTotvs}).pipe(take(1))
  }
  
  //---------------------- Obter Lista Completa
  public OLD_ObterDadosReparo(params?: any){
    return this.http.post(`${this._url}/ObterDadosReparo`, params, {headers:headersTotvs}).pipe(take(1))
  }

  //---------------------- Obter Lista Completa
  public OLD_ObterDadosRelPed(params?: any){
    return this.http.post(`${this._url}/ObterDadosRelPed`, params, {headers:headersTotvs}).pipe(take(1))
  }
  
  //---------------------- Validar Numero de Série do Item
  public OLD_validaSerie(params?: any){
    return this.http.post(`${this._url}/validaSerie`, params, {headers:headersTotvs}).pipe(take(1))
  }
  
  //---------------------- Obter Lista Completa
  public OLD_EfetivarPedido(params?: any){
    return this.http.post(`${this._url}/EfetivarPedido`, params, {headers:headersTotvs}).pipe(take(1))
  }

  public OLD_ObterDadosEsaa052(params?: any){
    return this.http.post(`${this._url}/ObterDadosEsaa052`, params, {headers:headersTotvs}).pipe(take(1))
  }

  public OLD_ObterDadosErrorEsaa052(params?: any){
    return this.http.post(`${this._url}/ObterDadosErrorEsaa052`, params, {headers:headersTotvs}).pipe(take(1))
  }

  //---------------------- Obter Lista Completa
  public OLD_ObterDadosEsaa068(params?: any){
    return this.http.post(`${this._url}/ObterDadosEsaa068`, params, {headers:headersTotvs}).pipe(take(1))
  }

  public OLD_ObterDadosErrorEsaa068(params?: any){
    return this.http.post(`${this._url}/ObterDadosErrorEsaa068`, params, {headers:headersTotvs}).pipe(take(1))
  }

  //Usando paginação
  public OLD_ObterDadosPagEsaa068(params?: any){
    return this.http.post(`${this._url}/ObterDadosPagEsaa068`, params, {headers:headersTotvs}).pipe(take(1))
  }
  
  //abaixo não é usado, só exemplo
  //------------ Colunas Grid Prioridade
  OLD_obterColunasEmergencial(): Array<PoTableColumn> {
    return [         
      { property: 'Ativo', label: 'Ativo', type: 'subtitle',
        subtitles: [
          { value: 'Sim', color: 'color-10', label: '', content: 'S'},
          { value: 'Não', color: 'color-07', label: '', content: 'N'},
        ]},
      { property: 'codEstabel',    label: "Estab"},
      { property: 'codFilial',     label: "Fil Emerg"},
      { property: 'itCodigo',      label: "Item", width: '300px' },
      { property: 'qtdEmerg',      label: "Qtd.Emerg."},
      { property: 'qtdPend',       label: "Qtd.Pend."},
      { property: 'Obs',           label: "Observação"},
      { property: 'Inclusao',      label: "Inclusão"},      
    ];
  }
  
  //---------------------- Obter Lista Completa
  public OLD_ObterBRR(params?: any){
    return this.http.post(`${this._url}/ObterBRR`, params, {headers:headersTotvs}).pipe(take(1))
  }

  //---------------------- Obter Lista Completa
  public OLD_Obter(params?: any){
    return this.http.get(`${this._url}/ObterLT`, {params:params, headers:headersTotvs}).pipe(take(1));
  }

  //---------------------- Obter Linha Editada
  public OLD_ObterID(params?: any){
    return this.http.get(`${this._url}/ObterLTId`, {params:params, headers:headersTotvs}).pipe(take(1));
  }
  //---------------------- Salvar registro
  public OLD_Salvar(params?: any){
    return this.http.post(`${this._url}/SalvarLT`, params, {headers:headersTotvs})
                .pipe(take(1));
  }

  //---------------------- Deletar registro
  public OLD_Deletar(params?: any){
    return this.http.get(`${this._url}/DeletarEmergencial`, {params:params, headers:headersTotvs})
                    .pipe(take(1));
  }
  
 

}