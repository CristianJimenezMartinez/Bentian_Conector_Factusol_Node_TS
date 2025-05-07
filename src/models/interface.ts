interface seccionDB {
    CODSEC: string,
    DESSEC: string,
    suwsec: number
  }
  
  interface familiaDB {
    CODFAM: string,
    ESFAM: string,
    SECFAM: string,
    suwfam: number
  }
  
  interface articulosDB {
    CODART: string,
    FAMART: string,
    NOMART: string,
    DESART: string,
    UMEART: string,
    IVAART: string,
    IMAART: string,
    PREART: string,
    suwart: number
  }
  
  interface medidasDB {
    UMECOD: number,
    UMEDES: string
  }
  
  interface ivaDB {
    IVACOD: number,
    IVATAS: number
  }
  
  export { seccionDB, familiaDB, articulosDB, medidasDB, ivaDB };
  