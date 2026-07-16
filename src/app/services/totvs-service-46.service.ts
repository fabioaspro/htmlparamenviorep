
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, map, take, tap } from 'rxjs';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment'
import { PoTableColumn } from '@po-ui/ng-components';

//--- Header somente para DEV
const headersTotvs = new HttpHeaders(environment.totvs_header)    

@Injectable({
  providedIn: 'root'
})

export class TotvsService46 {
  private reg!:any;
  _url = environment.totvs46_url;

  constructor(private http: HttpClient ) { }

  //--------------------- INTERPRETADOR RESULTADO DE ERROS/WARNING
 /*  public tratarErros(mensagem:any):string{
     if (mensagem.messages ==! undefined)
        return mensagem.message
      return '';
  } */

  //---------- Colunas Enc Series Pendentes
  obterColunasSeriesPendentes() :Array<PoTableColumn> {
    return [
      { property: 'numos', label: "NumOS" },
      { property: 'chamado', label: "Chamado" },
      { property: 'it-codigo', label: "Item" },
      { property: 'nr-enc', label: "Nr Enc", type:'cellTemplate'},
      { property: 'num-serie-it', label: "Num Serie Garantia", type:'cellTemplate'},
    ]}

//------------ Colunas Grid Saldo Terceiro
obterColunasItems(): Array<PoTableColumn> {
  return [
    { property: 'tt-seqIT', label: "Seq" },
    { property: 'it-codigo', label: "Item", type:'cellTemplate' },
    { property: 'Serie-Nf-Saida', label: "Série"},
    { property: 'nf-saida', label: "Nota Saída" },
    { property: 'Nat-Operacao', label: "Nat Oper" },
    { property: 'Quantidade', label: "Qtde" },
    { property: 'nr-enc', label: "Nr Enc" },
    { property: 'atividade', label: "Atv", type:'cellTemplate' },
    { property: 'Evento', label: "Evento" },
    { property: 'num-serie-it', label: "Num Serie Garantia", type:'cellTemplate'},
    { property: 'serie-ret', label: "Série Ret." },
    { property: 'serie-ins', label: "Série Inst." },
    { property: 'envelope-seguranca', label: "Env.Seg" },
    { property: 'nr-alertas', label: "Versão" },
    { property: 'id-solicita', label: "Monitor" },
    { property: 'nr-pedido', label: "Pedido" },

  ];
}

obterColunasOrdens(): Array<PoTableColumn> {
  return [
    {property:'opcoes', label: "Flag", type:'cellTemplate'},
    /* { property: 'flag', label: " ", color:'color-07', type: 'columnTemplate'}, */
    { property: 'NumOS', label: "NumOs" },
    { property: 'situacao', label: "Sit" },
    { property: 'Chamado', label: "Chamado"},
    { property: 'Serie', label: "Série" },
  ];
}

obterColunasOrdens2(): Array<PoTableColumn> {
  return [
   
    { property: 'NumOS', label: "NumOs", color:'color-03' },
    { property: 'situacao', label: "Sit", color:'color-03' },
    { property: 'Chamado', label: "Chamado", color:'color-03'},
    { property: 'Serie', label: "Série", color:'color-03' },
    { property: 'opcoes', label: "Flag", type:'cellTemplate', width:'60px'},
    { property: 'tt-seqIT', label: "Seq" }, 
   /*  { property: 'sequencia', label: "Seq" }, */
    { property: 'it-codigo', label: "Item", type:'cellTemplate' },
    { property: 'Serie-Nf-Saida', label: "Série"},
    { property: 'nf-saida', label: "Nota Saída" },
    { property: 'Nat-Operacao', label: "Nat Oper" },
    { property: 'Quantidade', label: "Qtde" },
    { property: 'nr-enc', label: "Nr Enc" },
    { property: 'atividade', label: "Atv", type:'cellTemplate' },
    { property: 'Evento', label: "Evento" },
    { property: 'num-serie-it', label: "Num Serie Garantia", type:'cellTemplate'},
    { property: 'serie-ret', label: "Série Ret." },
    { property: 'serie-ins', label: "Série Inst." },
    { property: 'envelope-seguranca', label: "Env.Seg" },
    { property: 'nr-alertas', label: "Versão" },
    { property: 'id-solicita', label: "Monitor" },
    { property: 'nr-pedido', label: "Pedido" },
  ];
}

obterColunasArquivos(): Array<PoTableColumn> {
  return [
    {property: 'nomeArquivo', label: "Arquivo", type: 'columnTemplate'},
    {property: 'mensagem', label: "Descrição"},
    {property: 'dataHora', label: "Data", type:'date', format: "dd/MM/yyyy hh:mm:ss"},
    {property: 'numPedExec', label: "PedExec"},
  ];
}

  //---------------------- COMBOBOX ESTABELECIMENTOS
  //Retorno transformado no formato {label: xxx, value: yyyy}
  public ObterEstabelecimentos(params?: any){
    return this.http.get<any>(`${this._url}/ObterEstab`, {params: params, headers:headersTotvs})
                 .pipe(
                  //tap(data => {console.log("Retorno API TOTVS => ", data)}),
                  map(item => { return item.items.map((item:any) =>  { return { label:item.codEstab + ' ' + item.nome, value: item.codEstab, codFilial: item.codFilial } }) }),
                  ///tap(data => {console.log("Data Transformada pelo Map =>", data)}),
                  take(1));
  }

  public ObterEmitentesDoEstabelecimento(id:string){
    return this.http.get<any>(`${this._url}/ObterTecEstab?codEstabel=${id}`, {headers:headersTotvs})
                 .pipe(
                  map(item => { return item.items.map((item:any) =>  { return { label: item.codTec + ' ' + item.nomeAbrev, value: item.codTec  } }) }),
                  ///tap(data => {console.log("Data Transformada pelo Map =>", data)}),
                  take(1));
  }

  //--- Variavel
  private emissorEvento$ = new Subject<any>();

  //--- Emissor
  public Deslogar() {
    this.emissorEvento$.next('');
  }

  //--- Observador
  public VerificarLogout() {
    return this.emissorEvento$.asObservable();
  }

  //---------------------- 
  public CriarOrdem(params?: any){
    return this.http.post(`${this._url}/CriarOrdem`, params, {headers:headersTotvs})
                .pipe(take(1));
  }
  
  //---------------------- 
  public AlterarOrdem(params?: any){
     return this.http.post(`${this._url}/AlterarOrdem`, params, {headers:headersTotvs})
                .pipe(take(1));
  }

  public ExcluirOrdem(params?: any){
    return this.http.get(`${this._url}/ExcluirOrdem`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }


  //---------------------- 
  public ObterDados(params?: any){
    return this.http.get(`${this._url}/ObterDados`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }

  //---------------------- 
  public ObterDados2(params?: any){
    return this.http.get(`${this._url}/ObterDados2`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }

  //---------------------- 
  public ObterDadosMobile(params?: any){
    return this.http.get(`${this._url}/ObterDadosMobile`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }

  //---------------------- 
  public ObterContadores(params?: any){
    return this.http.get(`${this._url}/ObterContadores`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }
  
  //---------------------- 
  public ImprimirOS(params?: any){
    return this.http.get(`${this._url}/ImprimirOS`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }
  

  public ObterItens(params?: any){
    return this.http.get(`${this._url}/ObterItens`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }

  public Marcar(params?: any){
    return this.http.get(`${this._url}/Marcar`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }

  public Desmarcar(params?: any){
    return this.http.get(`${this._url}/Desmarcar`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }

  public MarcarMoto(params?: any){
    return this.http.get(`${this._url}/MarcarMoto`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }

  public DesmarcarMoto(params?: any){
    return this.http.get(`${this._url}/DesmarcarMoto`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }

  public LeaveItemOS(params?: any){
    return this.http.post(`${this._url}/LeaveItemOS`, params, {headers:headersTotvs})
                   .pipe(take(1));
  }

  public LeaveNFSOS(params?: any){
    return this.http.post(`${this._url}/LeaveNFSOS`, params, {headers:headersTotvs})
                   .pipe(take(1));
  }
  public EliminarEnc(params?: any){
    return this.http.get(`${this._url}/EliminarEnc`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }

  public GravarItemOS(params?: any){
    return this.http.post(`${this._url}/GravarItemOS`, params, {headers:headersTotvs})
                   .pipe(take(1));
  }

  public EliminarItemOS(params?: any){
    return this.http.post(`${this._url}/EliminarItemOS`, params, {headers:headersTotvs})
                   .pipe(take(1));
  }

  public ObterCadastro(params?: any){
    return this.http.get(`${this._url}/ObterCadastro`, {params:params, headers:headersTotvs}).pipe(take(1));
  }

  public ObterArquivo(params?: any){
    return this.http.get(`${this._url}/ObterArquivo`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }

  public GravarEnc(params?: any){
    return this.http.post(`${this._url}/GravarEnc`, params, {headers:headersTotvs})
                   .pipe(take(1));
  }

  public GravarNumSerieItem(params?: any){
    return this.http.get(`${this._url}/GravarNumSerieItem`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }

  public SeriesPendentes(params?: any){
    return this.http.get(`${this._url}/SeriesPendentes`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }

  public ValidarSerie(params?: any){
    return this.http.get(`${this._url}/ValidarSerie`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }

  public GravarListaNumSerieItem(params?: any){
    return this.http.post(`${this._url}/GravarListaNumSerieItem`, params, {headers:headersTotvs})
                   .pipe(take(1));
  }

  public EliminarArquivo(params?: any){
    return this.http.get(`${this._url}/EliminarArquivo`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }

  public piObterSituacaoRPW(params?: any){
    return this.http.get(`${this._url}/piObterSituacaoRPW`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }

  public DestravarProcesso(params?: any){
    return this.http.get(`${this._url}/DestravarProcesso`, {params:params, headers:headersTotvs})
                   .pipe(take(1));
  }





   //Ordenacao campos num array
   public ordenarCampos =
   (fields: any[]) =>
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
       .reduce((p, n) => (p ? p : n), 0);



}
