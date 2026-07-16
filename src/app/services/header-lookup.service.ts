import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, map, of, take, tap } from 'rxjs';
import { Observable } from 'rxjs';
import { PoLookupFilteredItemsParams, PoLookupResponseApi, PoTableColumn } from '@po-ui/ng-components';
import { environment } from '../environments/environment'
import { PoLookupFilter } from '@po-ui/ng-components'

//--- Header somente para DEV
const headersTotvs = new HttpHeaders(environment.totvs_header)

@Injectable({
  providedIn: 'root'
})
export class TecLabLookupService implements PoLookupFilter {
  constructor(private http: HttpClient) { }

  _url = environment.totvs_url;
  
  getFilteredData(filter: string, page: number, pageSize: number): Observable<any> {
    //console.log(3)
    const url = this._url + `/ObterEmitente?filter=${filter}&page=${page}&pageSize=${pageSize}`
    return this.http.get(url, { headers: headersTotvs  }).pipe(take(1))
  }

  getFilteredItems(params: PoLookupFilteredItemsParams): Observable<any> {
    //console.log(params)
    const {filter, page, pageSize} = params

    const url = this._url + `/ObterEmitente?filter=${filter}&page=${page}&pageSize=${pageSize}`
    //console.log(url)
    return this.http.get<any>(url, {headers: headersTotvs }).pipe(take(1))

  }
  //Busca feita quando digita na tela
  getObjectByValue(value: string): Observable<any> { 
      
    const url = this._url + `/ObterEmitente?filter=${value}`
    //return this.http.get(url, { headers: headersTotvs }).pipe(take(1), tap(res => console.log(res)))
    return this.http.get<any>(url, { headers: headersTotvs }).pipe(take(1), map(response => response.items[0]))
  }
}