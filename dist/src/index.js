"use strict";
// src/index.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const config_json_1 = __importDefault(require("../config.json"));
const certificates_1 = require("./certificates/certificates");
const mapeoAccess_1 = require("./controllers/creationDB/mapeoAccess");
const updateColumnComments_1 = require("./controllers/creationDB/updateColumnComments");
const fstodb_1 = require("./controllers/creationDB/fstodb");
const db_1 = __importDefault(require("./controllers/creationDB/db"));
const pg_1 = require("pg");
// Rutas
const articleRoute_1 = __importDefault(require("./routes/articleRoute"));
const familiaRoute_1 = __importDefault(require("./routes/familiaRoute"));
const seccionRoute_1 = __importDefault(require("./routes/seccionRoute"));
const medidasRoute_1 = __importDefault(require("./routes/medidasRoute"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const invoicesRoute_1 = __importDefault(require("./routes/invoicesRoute"));
const paymentRoute_1 = __importDefault(require("./routes/paymentRoute"));
const webhookRoutes_1 = __importDefault(require("./routes/webhookRoutes"));
const ratesRoute_1 = __importDefault(require("./routes/ratesRoute"));
const htmlRoutes_1 = __importDefault(require("./routes/htmlRoutes"));
// Socket.io
const socket_1 = require("./socket");
const app = (0, express_1.default)();
// ─── 1) Cargar el webhook de Stripe ANTES de json() ───
app.use('/api', webhookRoutes_1.default);
// ─── 2) CORS y body-parser ───
app.use((0, cors_1.default)(config_json_1.default.cors));
app.use(express_1.default.json());
// ─── 3) Logger global ───
app.use((req, res, next) => {
    console.log(`[GLOBAL] ${req.method} ${req.originalUrl}`, req.body);
    next();
});
// ─── 4) ACME HTTP-01 challenge ───
app.get('/.well-known/acme-challenge/:token', (req, res) => {
    var _a;
    const t = req.params.token;
    if ((_a = globalThis.challengeTokens) === null || _a === void 0 ? void 0 : _a[t]) {
        res.send(globalThis.challengeTokens[t]);
    }
    else {
        res.status(404).send('Token no encontrado');
    }
});
// ─── 5) Montar rutas de tu API ───
app.use('/api', seccionRoute_1.default);
app.use('/api', familiaRoute_1.default);
app.use('/api', articleRoute_1.default);
app.use('/api', medidasRoute_1.default);
app.use('/api', userRoutes_1.default);
app.use('/api', invoicesRoute_1.default);
app.use('/api/payment', paymentRoute_1.default);
app.use('/api', ratesRoute_1.default);
app.use('/panel', htmlRoutes_1.default);
app.get('/success', (_req, res) => res.send('Pago exitoso'));
// ─── 6) Puertos ───
const HTTPS_PORT = config_json_1.default.httpsPort || 443;
const HTTP_PORT = config_json_1.default.httpPort || 3000;
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // a) Inicializar BD
            yield (0, db_1.default)();
            console.log('✔️  Base de datos lista.');
            // b) Sincronización inicial (Access → PostgreSQL)
            let initialized = false;
            try {
                const client = new pg_1.Client(config_json_1.default.database);
                yield client.connect();
                const r = yield client.query(`SELECT valor FROM configuracion WHERE clave='inicializacion'`);
                initialized = !!r.rowCount && +r.rows[0].valor === 1;
                yield client.end();
            }
            catch (_a) {
                console.warn('⚠️  No se pudo verificar inicialización, seguimos de todas formas.');
            }
            if (!initialized) {
                yield (0, mapeoAccess_1.main)();
                console.log('✔️  Mapeo Access→Postgres completado.');
                yield (0, updateColumnComments_1.CommentsInPostgres)();
                console.log('✔️  Comentarios actualizados.');
                yield (0, fstodb_1.getData)();
                console.log('✔️  Sincronización inicial completada.');
                // marcar como hecho
                try {
                    const client = new pg_1.Client(config_json_1.default.database);
                    yield client.connect();
                    yield client.query(`UPDATE configuracion SET valor=1 WHERE clave='inicializacion'`);
                    yield client.end();
                }
                catch (e) {
                    console.error('❌ Error marcando inicialización:', e);
                }
            }
            // c) Servidor HTTP para ACME
            const challenge = http_1.default.createServer(app);
            yield new Promise((resolve, reject) => challenge.listen(80, resolve).on('error', reject));
            // d) Obtener/renovar certificados
            yield (0, certificates_1.obtainCertificate)();
            // e) Parar servidor ACME
            yield new Promise((resolve, reject) => challenge.close(err => (err ? reject(err) : resolve())));
            // f) Leer certificados y levantar HTTPS + Socket.IO
            const certDir = path_1.default.resolve(__dirname, 'certificates', 'generated');
            const sslOpts = {
                key: fs_1.default.readFileSync(path_1.default.join(certDir, 'privkey.pem')),
                cert: fs_1.default.readFileSync(path_1.default.join(certDir, 'cert.pem'))
            };
            const httpsServer = https_1.default.createServer(sslOpts, app);
            (0, socket_1.initializeSocket)(httpsServer);
            yield Promise.all([
                new Promise(res => httpsServer.listen(HTTPS_PORT, () => {
                    console.log(`🚀 HTTPS en puerto ${HTTPS_PORT}`);
                    res();
                })),
                new Promise(res => {
                    const redirect = http_1.default.createServer((req, r) => {
                        r.writeHead(301, { Location: `https://${config_json_1.default.ssl.domain}${req.url}` });
                        r.end();
                    });
                    redirect.listen(HTTP_PORT, () => {
                        console.log(`🔄 HTTP→HTTPS redirigiendo en ${HTTP_PORT}`);
                        res();
                    });
                })
            ]);
            // g) Vigilar cambios en Access
            fs_1.default.watchFile(config_json_1.default.file.path_file_factusol, { interval: 60000 }, () => {
                console.log('♻️  Archivo Access cambiado, sincronizando…');
                (0, fstodb_1.getData)().catch(console.error);
            });
        }
        catch (err) {
            console.error('❌ Falló el servidor:', err);
            process.exit(1);
        }
    });
}
startServer();
