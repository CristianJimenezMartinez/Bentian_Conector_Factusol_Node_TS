export interface PedidoCabecera {
  tippcl: string;
  refpcl: string;
  fecpcl: string;
  agepcl: string;
  clipcl: string;
  tivpcl: string;
  reqpcl: string;
  almpcl: string;


  cempcl: string;   // Email
  cpapcl: string;   // País

  cnopcl: string;   // Nombre
  cdopcl: string;   // Domicilio
  cpopcl: string;   // Población
  ccppcl: string;   // Cód. Postal
  cprpcl: string;   // Provincia
  telpcl: string;   // Teléfono

  net1pcl: number;
  iiva1pcl: number;
  totpcl: number;
}



  
  export interface PedidoLinea {
    tiplpc: string;
    poslpc: string;
    artlpc: string;
    deslpc: string;
    canlpc: number;
    dt1lpc: number;
    prelpc: number;
    totlpc: number;
  }
  
  export interface Pedido {
    cabecera: PedidoCabecera;
    lineas: PedidoLinea[];
  }
  