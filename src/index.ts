// src/index.ts

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';
import config from '../config.json';

import { obtainCertificate } from './certificates/certificates';
import { main }                from './controllers/creationDB/mapeoAccess';
import { CommentsInPostgres }  from './controllers/creationDB/updateColumnComments';
import { getData }             from './controllers/creationDB/fstodb';
import conectar                from './controllers/creationDB/db';
import { Client }              from 'pg';

// Rutas
import articleRoutes   from './routes/articleRoute';
import familyRoutes    from './routes/familiaRoute';
import sectionRoutes   from './routes/seccionRoute';
import medidasRoutes   from './routes/medidasRoute';
import userRoutes      from './routes/userRoutes';
import invoiceRouter   from './routes/invoicesRoute';
import paymentRouter   from './routes/paymentRoute';
import webhookRoutes   from './routes/webhookRoutes';
import ratesRoutes     from './routes/ratesRoute';
import htmlRoutes      from './routes/htmlRoutes';

// Socket.io
import { initializeSocket } from './socket';

const app = express();

// ─── 1) Cargar el webhook de Stripe ANTES de json() ───
app.use('/api', webhookRoutes);

// ─── 2) CORS y body-parser ───
app.use(cors(config.cors));
app.use(express.json());

// ─── 3) Logger global ───
app.use((req, res, next) => {
  console.log(`[GLOBAL] ${req.method} ${req.originalUrl}`, req.body);
  next();
});

// ─── 4) ACME HTTP-01 challenge ───
app.get('/.well-known/acme-challenge/:token', (req, res) => {
  const t = req.params.token;
  if (globalThis.challengeTokens?.[t]) {
    res.send(globalThis.challengeTokens[t]);
  } else {
    res.status(404).send('Token no encontrado');
  }
});

// ─── 5) Montar rutas de tu API ───
app.use('/api', sectionRoutes);
app.use('/api', familyRoutes);
app.use('/api', articleRoutes);
app.use('/api', medidasRoutes);
app.use('/api', userRoutes);
app.use('/api', invoiceRouter);
app.use('/api/payment', paymentRouter);
app.use('/api', ratesRoutes);
app.use('/panel', htmlRoutes);
app.get('/success', (_req, res) => res.send('Pago exitoso'));

// ─── 6) Puertos ───
const HTTPS_PORT = config.httpsPort  || 443;
const HTTP_PORT  = config.httpPort   || 3000;

async function startServer() {
  try {
    // a) Inicializar BD
    await conectar();
    console.log('✔️  Base de datos lista.');

    // b) Sincronización inicial (Access → PostgreSQL)
    let initialized = false;
    try {
      const client = new Client(config.database);
      await client.connect();
      const r = await client.query(
        `SELECT valor FROM configuracion WHERE clave='inicializacion'`
      );
      initialized = !!r.rowCount && +r.rows[0].valor === 1;
      await client.end();
    } catch {
      console.warn('⚠️  No se pudo verificar inicialización, seguimos de todas formas.');
    }

    if (!initialized) {
      await main();
      console.log('✔️  Mapeo Access→Postgres completado.');
      await CommentsInPostgres();
      console.log('✔️  Comentarios actualizados.');
      await getData();
      console.log('✔️  Sincronización inicial completada.');

      // marcar como hecho
      try {
        const client = new Client(config.database);
        await client.connect();
        await client.query(
          `UPDATE configuracion SET valor=1 WHERE clave='inicializacion'`
        );
        await client.end();
      } catch (e) {
        console.error('❌ Error marcando inicialización:', e);
      }
    }

    // c) Servidor HTTP para ACME
    const challenge = http.createServer(app);
    await new Promise<void>((resolve, reject) =>
      challenge.listen(80, resolve).on('error', reject)
    );

    // d) Obtener/renovar certificados
    await obtainCertificate();

    // e) Parar servidor ACME
    await new Promise<void>((resolve, reject) =>
      challenge.close(err => (err ? reject(err) : resolve()))
    );

    // f) Leer certificados y levantar HTTPS + Socket.IO
    const certDir = path.resolve(__dirname, 'certificates', 'generated');
    const sslOpts = {
      key:  fs.readFileSync(path.join(certDir, 'privkey.pem')),
      cert: fs.readFileSync(path.join(certDir, 'cert.pem'))
    };
    const httpsServer = https.createServer(sslOpts, app);
    initializeSocket(httpsServer);

    await Promise.all([
      new Promise<void>(res =>
        httpsServer.listen(HTTPS_PORT, () => {
          console.log(`🚀 HTTPS en puerto ${HTTPS_PORT}`);
          res();
        })
      ),
      new Promise<void>(res => {
        const redirect = http.createServer((req, r) => {
          r.writeHead(301, { Location: `https://${config.ssl.domain}${req.url}` });
          r.end();
        });
        redirect.listen(HTTP_PORT, () => {
          console.log(`🔄 HTTP→HTTPS redirigiendo en ${HTTP_PORT}`);
          res();
        });
      })
    ]);

    // g) Vigilar cambios en Access
    fs.watchFile(config.file.path_file_factusol, { interval: 60000 }, () => {
      console.log('♻️  Archivo Access cambiado, sincronizando…');
      getData().catch(console.error);
    });

  } catch (err) {
    console.error('❌ Falló el servidor:', err);
    process.exit(1);
  }
}

startServer();
