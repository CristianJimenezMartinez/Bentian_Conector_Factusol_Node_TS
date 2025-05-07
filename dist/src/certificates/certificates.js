"use strict";
// src/certificates/certificates.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.challengeCreateFn = challengeCreateFn;
exports.challengeRemoveFn = challengeRemoveFn;
exports.obtainCertificate = obtainCertificate;
const acme_client_1 = __importDefault(require("acme-client"));
const forge = __importStar(require("node-forge"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_json_1 = __importDefault(require("../../config.json"));
if (!globalThis.challengeTokens) {
    globalThis.challengeTokens = {};
}
// Directorio donde se guardarán los certificados (usaremos la ruta definida en config.ssl)
const certificatesDir = path_1.default.resolve(__dirname, 'generated');
if (!fs_1.default.existsSync(certificatesDir)) {
    fs_1.default.mkdirSync(certificatesDir, { recursive: true });
}
// Archivos de salida
const keyFile = path_1.default.join(certificatesDir, 'privkey.pem');
const certFile = path_1.default.join(certificatesDir, 'cert.pem');
// Extraer los valores necesarios desde config.json
const domain = config_json_1.default.ssl.domain; // ej. "desktop-p1l2603.duckdns.org"
const email = config_json_1.default.ssl.email; // ej. "tuemail@gmail.com"
// Usar el directorio de producción de Let's Encrypt
const directoryUrl = acme_client_1.default.directory.letsencrypt.production;
// Si deseas probar, usa: acme.directory.letsencrypt.staging
// Umbral de renovación (en días); si el certificado vence en menos de estos días, se renueva.
const RENEW_THRESHOLD_DAYS = 30;
/**
 * Función que se ejecuta cuando Let's Encrypt solicita crear un desafío HTTP-01.
 * Se almacena el token en globalThis.challengeTokens para poder responder la petición.
 */
function challengeCreateFn(authz, challenge, keyAuthorization) {
    return __awaiter(this, void 0, void 0, function* () {
        globalThis.challengeTokens[challenge.token] = keyAuthorization;
        console.log(`[ACME] challengeCreateFn: Guardado token ${challenge.token}`);
    });
}
/**
 * Función que se ejecuta para remover el desafío HTTP-01.
 */
function challengeRemoveFn(authz, challenge, keyAuthorization) {
    return __awaiter(this, void 0, void 0, function* () {
        delete globalThis.challengeTokens[challenge.token];
        console.log(`[ACME] challengeRemoveFn: Eliminado token ${challenge.token}`);
    });
}
/**
 * Función auxiliar que determina si el certificado en certFile está a punto de caducar.
 * Devuelve true si el archivo no existe o si vence en menos de thresholdDays.
 */
function certificateNeedsRenewal(thresholdDays = RENEW_THRESHOLD_DAYS) {
    if (!fs_1.default.existsSync(certFile)) {
        return true;
    }
    try {
        const pem = fs_1.default.readFileSync(certFile, 'utf8');
        const cert = forge.pki.certificateFromPem(pem);
        const now = new Date();
        const diffMs = cert.validity.notAfter.getTime() - now.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        console.log(`[ACME] Certificado expira en ${Math.floor(diffDays)} días.`);
        return diffDays < thresholdDays;
    }
    catch (error) {
        console.error('[ACME] Error al leer el certificado:', error);
        // Si hay error al leer, forzamos la renovación.
        return true;
    }
}
/**
 * Función principal para obtener el certificado mediante acme-client.
 * Comprueba primero si ya existe un certificado válido (no caducado o próximo a caducar).
 * Si es así, no hace nada; en caso contrario, procede a solicitar uno nuevo.
 */
function obtainCertificate() {
    return __awaiter(this, void 0, void 0, function* () {
        // Comprobar si ya existe un certificado y si está vigente
        if (!certificateNeedsRenewal()) {
            console.log('[ACME] Certificado existente es válido; se usará el certificado actual.');
            return;
        }
        try {
            // Crear una clave para la cuenta ACME
            const accountKey = yield acme_client_1.default.forge.createPrivateKey();
            // Crear el cliente ACME
            const client = new acme_client_1.default.Client({
                directoryUrl,
                accountKey,
            });
            // Registrar la cuenta (aceptando los términos de servicio)
            yield client.createAccount({
                termsOfServiceAgreed: true,
                contact: [`mailto:${email}`],
            });
            console.log('[ACME] Cuenta registrada correctamente.');
            // Generar una clave privada y CSR para el dominio
            const [domainKey, csr] = yield acme_client_1.default.forge.createCsr({
                commonName: domain,
            });
            console.log('[ACME] CSR generada para el dominio:', domain);
            // Solicitar el certificado usando el método automático que gestiona el desafío HTTP-01
            const certificate = yield client.auto({
                csr,
                challengeCreateFn,
                challengeRemoveFn,
            });
            console.log('[ACME] Certificado obtenido.');
            // Guardar la clave privada y el certificado en archivos PEM
            fs_1.default.writeFileSync(keyFile, domainKey);
            fs_1.default.writeFileSync(certFile, certificate);
            console.log(`[ACME] Certificado guardado en:
  - Clave privada: ${keyFile}
  - Certificado: ${certFile}`);
        }
        catch (error) {
            // Si hay error y existe una respuesta HTTP, mostramos la data para depurar
            if (error.response) {
                console.error('[ACME] Error en la respuesta HTTP:', error.response.data);
            }
            console.error('[ACME] Error al obtener el certificado:', error);
            throw error;
        }
    });
}
