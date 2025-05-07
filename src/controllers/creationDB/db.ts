import { Client } from 'pg';
import { ensureCAWCLIFieldLength } from './ensureCAWCLIFieldLength';
import dotenv from 'dotenv';
import config from '../../../config.json';

dotenv.config();

// Función para crear la base de datos y el usuario
async function crearBaseDeDatos(): Promise<void> {
  // Conectar a la base de datos "postgres" para crear Factusol
  const client = new Client({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    port: config.database.port || 5432,
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('Conectado a PostgreSQL para verificar la base de datos.');

    // Verificar si la base de datos Factusol existe
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'Factusol'");
    if (res.rowCount === 0) {
      await client.query('CREATE DATABASE "Factusol"');
      console.log('Base de datos "Factusol" creada exitosamente');
    } else {
      console.log('La base de datos "Factusol" ya existe');
    }

    // Crear usuario user_factusol si no existe
    const resUser = await client.query("SELECT 1 FROM pg_roles WHERE rolname = 'user_factusol'");
    if (resUser.rowCount === 0) {
      await client.query("CREATE USER user_factusol WITH PASSWORD '123456789'");
      console.log('Usuario "user_factusol" creado exitosamente');
    } else {
      console.log('El usuario "user_factusol" ya existe');
    }

    // Otorgar privilegios al usuario en la base de datos Factusol
    await client.query('GRANT ALL PRIVILEGES ON DATABASE "Factusol" TO user_factusol');
    await client.query('GRANT CREATE, USAGE ON SCHEMA public TO user_factusol');
    console.log('Privilegios otorgados al usuario "user_factusol" en la base de datos "Factusol"');
  } catch (error) {
    console.error('Error al crear la base de datos o usuario:', error);
  } finally {
    await client.end();
  }
}

// Función que conecta y crea las tablas (utilizando un nuevo cliente para "Factusol")
async function conectar(): Promise<void> {
  try {
    // Primero se crea la base de datos (conectado a 'postgres')
    await crearBaseDeDatos();

    // Luego, se crea un nuevo cliente para la base de datos "Factusol"
    const clientFactusol = new Client({
      host: config.database.host,
      user: config.database.user,  // usuario administrador (o el que tenga permisos)
      password: config.database.password,
      database: config.database.database,  // "Factusol"
      port: config.database.port || 5432
    });

    await clientFactusol.connect();
    console.log('Conexión exitosa con la base de datos Factusol');

    // Crear (o verificar) la tabla de configuración
    await crearTablaConfiguracion(clientFactusol);

    // Verificamos la existencia de una tabla clave (por ejemplo, f_cfg)
    const existe = await verificarTablaExistente(clientFactusol, 'f_cfg');
    if (!existe) {
      await crearTablaCfg(clientFactusol);
      await crearTablaCli(clientFactusol);
      await crearTablaAge(clientFactusol);
      await crearTablaSec(clientFactusol);
      await crearTablaFam(clientFactusol);
      await crearTablaArt(clientFactusol);
      await crearTablaTar(clientFactusol);
      await crearTablaLta(clientFactusol);
      await crearTablaDes(clientFactusol);
      await crearTablaFac(clientFactusol);
      await crearTablaLfa(clientFactusol);
      await crearTablaFpa(clientFactusol);
      await crearTablaAlm(clientFactusol);
      await crearTablaPcl(clientFactusol);
      await crearTablaLpc(clientFactusol);
      await crearTablaSto(clientFactusol);
      await crearTablaEmp(clientFactusol);
      await crearTablaUsuarios(clientFactusol);
      await ensureCAWCLIFieldLength();
      console.log('Todas las tablas fueron creadas exitosamente');


    } else {
      console.log('Las tablas ya existen');
    }

    await clientFactusol.end();
    console.log('Conexión cerrada');
  } catch (error) {
    console.error('Error al conectar con PostgreSQL:', error);
  }
}


// Función para verificar si una tabla existe (usando el cliente pasado)
async function verificarTablaExistente(client: Client, tableName: string): Promise<boolean> {
  try {
    const resultado = await client.query(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = $1
       )`,
      [tableName.toLowerCase()]
    );
    return resultado.rows[0].exists;
  } catch (error) {
    console.error('Error al verificar si la tabla existe:', error);
    return false;
  }
}
async function crearTablaUsuarios(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        CODCLI INTEGER PRIMARY KEY,
        NAME VARCHAR(35),
        SURNAME VARCHAR(65),
        EMAIL VARCHAR(255),
        ADDRESS VARCHAR(100),
        DNI VARCHAR(18),
        TELF VARCHAR(20),
        CP VARCHAR(10),
        POB VARCHAR(30),
        PROV VARCHAR(40),
        PAIS VARCHAR(50),
        TDC VARCHAR(3),
        password VARCHAR(100)
      );
    `);
    console.log('Tabla "usuarios" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "usuarios":', error);
  }
}

/* Ejemplo: Funciones de creación de tablas modificadas para recibir el cliente como parámetro */

// Tabla de configuración (f_cfg)
async function crearTablaCfg(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_cfg (
        codcfg VARCHAR(50) PRIMARY KEY,
        nomcfg VARCHAR(50),
        domcfg VARCHAR(50),
        pobcfg VARCHAR(50),
        cpocfg VARCHAR(5),
        procfg VARCHAR(20),
        nifcfg VARCHAR(18),
        nrlcfg VARCHAR(100),
        nilcfg VARCHAR(20),
        logcfg VARCHAR(255),
        piv1cfg DECIMAL(4,2),
        piv2cfg DECIMAL(4,2),
        piv3cfg DECIMAL(4,2),
        pre1cfg DECIMAL(4,2),
        pre2cfg DECIMAL(4,2),
        pre3cfg DECIMAL(4,2)
      );
    `);
    console.log('Tabla "f_cfg" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_cfg":', error);
  }
}

// Tabla de clientes (f_cli)
async function crearTablaCli(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_cli (
        codcli VARCHAR(5) PRIMARY KEY,
        cawcli VARCHAR(256),
        cuwcli VARCHAR(50),
        nifcli VARCHAR(18),
        nofcli VARCHAR(50),
        noccli VARCHAR(50),
        domcli VARCHAR(50),
        pobcli VARCHAR(30),
        cpocli VARCHAR(10),
        procli VARCHAR(40),
        agecli VARCHAR(5),
        fpacli VARCHAR(3),
        fincli DECIMAL(5,2),
        tarcli VARCHAR(2),
        tipcli VARCHAR(5),
        dt1cli DECIMAL(5,2),
        dt2cli DECIMAL(5,2),
        ppacli DECIMAL(5,2),
        tpocli VARCHAR(1),
        porcli VARCHAR(30),
        ivacli VARCHAR(1),
        tivcli VARCHAR(1),
        reqcli VARCHAR(1),
        mewcli VARCHAR(255)
      );
    `);
    console.log('Tabla "f_cli" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_cli":', error);
  }
}


// Agentes comerciales (f_age)
async function crearTablaAge(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_age (
        cuwage VARCHAR(50) PRIMARY KEY,
        cawage VARCHAR(15),
        codage VARCHAR(5),
        nomage VARCHAR(50),
        comage DECIMAL(5,2),
        mewage VARCHAR(255)
      );
    `);
    console.log('Tabla "f_age" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_age":', error);
  }
}

// Artículos (f_art)
async function crearTablaArt(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_art (
        codart VARCHAR(13) PRIMARY KEY,
        eanart VARCHAR(13),
        famart VARCHAR(3) REFERENCES f_fam(codfam),
        desart VARCHAR(50),
        dewart TEXT,
        tivart VARCHAR(1),
        cp1art VARCHAR(25),
        cp2art VARCHAR(25),
        cp3art VARCHAR(25),
        imgart VARCHAR(100),
        mewart VARCHAR(255),
        cstart VARCHAR(1),
        ustart VARCHAR(1),
        suwart INTEGER DEFAULT 0 CHECK (suwart IN (0, 1))
      );
    `);
    console.log('Tabla "f_art" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_art":', error);
  }
}

// Familias de artículos (f_fam)
async function crearTablaFam(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_fam (
        codfam VARCHAR(3) PRIMARY KEY,
        desfam VARCHAR(50),
        secfam VARCHAR(3) REFERENCES f_sec(codsec),
        suwfam INTEGER DEFAULT 0 CHECK (suwfam IN (0, 1))
      );
    `);
    console.log('Tabla "f_fam" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_fam":', error);
  }
}

// Secciones de artículos (f_sec)
async function crearTablaSec(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_sec (
        codsec VARCHAR(3) PRIMARY KEY,
        dessec VARCHAR(50),
        suwsec INTEGER DEFAULT 0 CHECK (suwsec IN (0, 1))
      );
    `);
    console.log('Tabla "f_sec" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_sec":', error);
  }
}

// Tarifas (f_tar)
async function crearTablaTar(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_tar (
        codtar VARCHAR(2) PRIMARY KEY,
        destar VARCHAR(20),
        iintar VARCHAR(1)
      );
    `);
    console.log('Tabla "f_tar" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_tar":', error);
  }
}

// Precios de artículos (f_lta)
async function crearTablaLta(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_lta (
        tarlta VARCHAR(2) NOT NULL,
        artlta VARCHAR(13) NOT NULL,
        prelta DECIMAL(10,2),
        PRIMARY KEY (tarlta, artlta),
        FOREIGN KEY (tarlta) REFERENCES f_tar(codtar),
        FOREIGN KEY (artlta) REFERENCES f_art(codart)
      );
    `);
    console.log('Tabla "f_lta" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_lta":', error);
  }
}

// Descuentos (f_des)
async function crearTablaDes(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_des (
        tcldes VARCHAR(5) NOT NULL,
        artdes VARCHAR(13),
        tipdes VARCHAR(1),
        pordes DECIMAL(5,2),
        impdes DECIMAL(10,2),
        fijdes VARCHAR(1),
        PRIMARY KEY (tcldes, artdes)
      );
    `);
    console.log('Tabla "f_des" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_des":', error);
  }
}

// Facturas emitidas (f_fac)
async function crearTablaFac(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_fac (
        tipfac VARCHAR(1),
        codfac BIGINT PRIMARY KEY,
        reffac VARCHAR(50),
        fecfac TIMESTAMP,
        estfac VARCHAR(1),
        almfac VARCHAR(3),
        agefac VARCHAR(5),
        profac VARCHAR(10),
        clifac VARCHAR(5),
        cnofac VARCHAR(50),
        cdofac VARCHAR(50),
        cpofac VARCHAR(5),
        cprfac VARCHAR(20),
        cnifac VARCHAR(12),
        tivfac VARCHAR(1),
        reqfac VARCHAR(1),
        telfac VARCHAR(20),
        net1fac DECIMAL(12,2),
        net2fac DECIMAL(12,2),
        net3fac DECIMAL(12,2),
        pdto1fac DECIMAL(4,2),
        pdto2fac DECIMAL(4,2),
        pdto3fac DECIMAL(4,2),
        idto1fac DECIMAL(12,2),
        idto2fac DECIMAL(12,2),
        idto3fac DECIMAL(12,2),
        pppa1fac DECIMAL(4,2),
        pppa2fac DECIMAL(4,2),
        pppa3fac DECIMAL(4,2),
        ippa1fac DECIMAL(12,2),
        ippa2fac DECIMAL(12,2),
        ippa3fac DECIMAL(12,2),
        ppor1fac DECIMAL(4,2),
        ppor2fac DECIMAL(4,2),
        ppor3fac DECIMAL(4,2),
        ipor1fac DECIMAL(12,2),
        ipor2fac DECIMAL(12,2),
        ipor3fac DECIMAL(12,2),
        pfin1fac DECIMAL(4,2),
        pfin2fac DECIMAL(4,2),
        pfin3fac DECIMAL(4,2),
        ifin1fac DECIMAL(12,2),
        ifin2fac DECIMAL(12,2),
        ifin3fac DECIMAL(12,2),
        bas1fac DECIMAL(12,2),
        bas2fac DECIMAL(12,2),
        bas3fac DECIMAL(12,2),
        piva1fac DECIMAL(4,2),
        piva2fac DECIMAL(4,2),
        piva3fac DECIMAL(4,2),
        iiva1fac DECIMAL(12,2),
        iiva2fac DECIMAL(12,2),
        iiva3fac DECIMAL(12,2),
        prec1fac DECIMAL(4,2),
        prec2fac DECIMAL(4,2),
        prec3fac DECIMAL(4,2),
        irec1fac DECIMAL(12,2),
        irec2fac DECIMAL(12,2),
        irec3fac DECIMAL(12,2),
        pret1fac DECIMAL(4,2),
        iret2fac DECIMAL(12,2),
        totfac DECIMAL(12,2),
        fopfac VARCHAR(3),
        ob1fac VARCHAR(50),
        ob2fac VARCHAR(50),
        obrfac VARCHAR(3),
        repfac VARCHAR(50),
        embfac VARCHAR(50),
        aatfac VARCHAR(50),
        reafac VARCHAR(50),
        pedfac VARCHAR(30),
        fpefac TIMESTAMP,
        cobfac VARCHAR(1),
        venfac VARCHAR(255)
      );
    `);
    console.log('Tabla "f_fac" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_fac":', error);
  }
}

// Líneas de detalle de facturas (f_lfa)
async function crearTablaLfa(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_lfa (
        tiplfa VARCHAR(1),
        codlfa BIGINT,
        poslfa VARCHAR(5),
        artlfa VARCHAR(13),
        deslfa VARCHAR(50),
        canlfa DECIMAL(12,2),
        dt1lfa DECIMAL(4,2),
        dt2lfa DECIMAL(4,2),
        dt3lfa DECIMAL(4,2),
        prelfa DECIMAL(12,2),
        totlfa DECIMAL(12,2),
        ivalfa VARCHAR(1),
        iinlfa VARCHAR(1),
        doclfa VARCHAR(1),
        dtplfa VARCHAR(1),
        dcolfa BIGINT,
        bullfa DECIMAL(12,2),
        comlfa DECIMAL(2,2),
        memlfa TEXT,
        altlfa DECIMAL(12,2),
        anclfa DECIMAL(12,2),
        fonlfa DECIMAL(12,2),
        ffalfa TIMESTAMP,
        fcolfa TIMESTAMP,
        PRIMARY KEY (codlfa, poslfa)
      );
    `);
    console.log('Tabla "f_lfa" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_lfa":', error);
  }
}

// Formas de pago (f_fpa)
async function crearTablaFpa(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_fpa (
        codfpa VARCHAR(1) PRIMARY KEY,
        desfpa VARCHAR(50),
        venfpa INTEGER,
        tipfpa INTEGER
      );
    `);
    console.log('Tabla "f_fpa" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_fpa":', error);
  }
}

// Almacenes (f_alm)
async function crearTablaAlm(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_alm (
        codalm VARCHAR(3) PRIMARY KEY,
        nomalm VARCHAR(50)
      );
    `);
    console.log('Tabla "f_alm" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_alm":', error);
  }
}

// Pedidos de clientes (f_pcl)
async function crearTablaPcl(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_pcl (
        tippcl VARCHAR(1),
        codpcl BIGINT PRIMARY KEY,
        refpcl VARCHAR(50),
        fecpcl TIMESTAMP,
        agepcl VARCHAR(5),
        clipcl VARCHAR(5),
        dirpcl VARCHAR(3),
        tivpcl VARCHAR(1),
        reqpcl VARCHAR(1),
        almpcl VARCHAR(3),
        net1pcl DECIMAL(12,2),
        net2pcl DECIMAL(12,2),
        net3pcl DECIMAL(12,2),
        pdto1pcl DECIMAL(4,2),
        pdto2pcl DECIMAL(4,2),
        pdto3pcl DECIMAL(4,2),
        idto1pcl DECIMAL(12,2),
        idto2pcl DECIMAL(12,2),
        idto3pcl DECIMAL(12,2),
        pppa1pcl DECIMAL(4,2),
        pppa2pcl DECIMAL(4,2),
        pppa3pcl DECIMAL(4,2),
        ippa1pcl DECIMAL(12,2),
        ippa2pcl DECIMAL(12,2),
        ippa3pcl DECIMAL(12,2),
        pfin1pcl DECIMAL(4,2),
        pfin2pcl DECIMAL(4,2),
        pfin3pcl DECIMAL(4,2),
        ifin1pcl DECIMAL(12,2),
        ifin2pcl DECIMAL(12,2),
        ifin3pcl DECIMAL(12,2),
        bas1pcl DECIMAL(12,2),
        bas2pcl DECIMAL(12,2),
        bas3pcl DECIMAL(12,2),
        piva1pcl DECIMAL(4,2),
        piva2pcl DECIMAL(4,2),
        piva3pcl DECIMAL(4,2),
        iiva1pcl DECIMAL(12,2),
        iiva2pcl DECIMAL(12,2),
        iiva3pcl DECIMAL(12,2),
        prec1pcl DECIMAL(4,2),
        prec2pcl DECIMAL(4,2),
        prec3pcl DECIMAL(4,2),
        irec1pcl DECIMAL(12,2),
        irec2pcl DECIMAL(12,2),
        irec3pcl DECIMAL(12,2),
        totpcl DECIMAL(12,2),
        foppcl VARCHAR(3),
        ob1pcl VARCHAR(50),
        ob2pcl VARCHAR(50),
        ppopcl VARCHAR(40)
      );
    `);
    console.log('Tabla "f_pcl" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_pcl":', error);
  }
}

// Líneas de detalle de pedidos (f_lpc)
async function crearTablaLpc(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_lpc (
        tiplpc VARCHAR(1),
        codlpc BIGINT,
        poslpc VARCHAR(5),
        artlpc VARCHAR(13),
        deslpc VARCHAR(50),
        canlpc DECIMAL(12,2),
        dt1lpc DECIMAL(4,2),
        prelpc DECIMAL(12,2),
        totlpc DECIMAL(12,2),
        ivalpc VARCHAR(1),
        iinlpc VARCHAR(1),
        PRIMARY KEY (codlpc, poslpc)
      );
    `);
    console.log('Tabla "f_lpc" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_lpc":', error);
  }
}

// Stock de artículos (f_sto)
async function crearTablaSto(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_sto (
        artsto VARCHAR(13),
        almsto VARCHAR(3),
        minsto DECIMAL(12,4),
        maxsto DECIMAL(12,4),
        actsto DECIMAL(12,4),
        dissto DECIMAL(12,4),
        PRIMARY KEY (artsto, almsto)
      );
    `);
    console.log('Tabla "f_sto" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_sto":', error);
  }
}
async function crearTablaConfiguracion(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        clave VARCHAR(50) PRIMARY KEY,
        valor INT NOT NULL DEFAULT 0
      );
    `);
    console.log('Tabla "configuracion" creada exitosamente');
    // Inserta la fila por defecto si no existe
    const res = await client.query("SELECT * FROM configuracion WHERE clave = 'inicializacion'");
    if (res.rowCount === 0) {
      await client.query("INSERT INTO configuracion (clave, valor) VALUES ('inicializacion', 0)");
      console.log('Fila de configuración por defecto insertada');
    }
  } catch (error) {
    console.error('Error al crear la tabla "configuracion":', error);
  }
}
// Datos de la empresa (f_emp)
async function crearTablaEmp(client: Client): Promise<void> {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS f_emp (
        codemp VARCHAR(3) PRIMARY KEY,
        nifemp VARCHAR(18),
        denemp VARCHAR(100),
        nomemp VARCHAR(100),
        domemp VARCHAR(100),
        numemp VARCHAR(5),
        escemp VARCHAR(2),
        pisemp VARCHAR(2),
        pretemp VARCHAR(2),
        pobemp VARCHAR(30),
        cpoemp VARCHAR(10),
        proemp VARCHAR(40),
        pteemp VARCHAR(3),
        telemp VARCHAR(12),
        pfaemp VARCHAR(3),
        faxemp VARCHAR(12),
        ejeemp VARCHAR(4),
        monemp VARCHAR(1),
        claemp VARCHAR(120),
        regemp VARCHAR(30),
        tomemp VARCHAR(10),
        folemp VARCHAR(10),
        hojemp VARCHAR(10),
        insemp VARCHAR(10),
        emaemp VARCHAR(50),
        webemp VARCHAR(50),
        cfgemp VARCHAR(250),
        ivaemp VARCHAR(1),
        ffeemp VARCHAR(1)
      );
    `);
    console.log('Tabla "f_emp" creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla "f_emp":', error);
  }
}

export default conectar;
