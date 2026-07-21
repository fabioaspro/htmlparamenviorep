import { Routes } from '@angular/router';

export const routes: Routes = [

    {path: '', redirectTo: '/tela', pathMatch: 'full'},
    {path:'tela',  loadComponent:()=> import('../app/tela-cadastro/tela-cadastro').then(c=>c.TelaCadastro)},
    {path:'carga', loadComponent:()=> import('../app/tela-carga/tela-carga').then(c=>c.Telacarga)},
    
]
