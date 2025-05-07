// src/certificates/certificates.ts

import acme from 'acme-client';
import * as forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import config from '../../config.json';

// Declarar la propiedad global challengeTokens para almacenar los tokens de desafío HTTP-01
declare global {
  var challengeTokens: Record<string, string>;
}
if (!globalThis.challengeTokens) {
  globalThis.challengeTokens = {};
}

// Definir un tipo simple para el desafío (ya que acme-client no exporta 'Challenge')
interface Challenge {
  token: string;
}

// Directorio donde se guardarán los certificados (usaremos la ruta definida en config.ssl)
const certificatesDir = path.resolve(__dirname, 'generated');
if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir, { recursive: true });
}

// Archivos de salida
const keyFile = path.join(certificatesDir, 'privkey.pem');
const certFile = path.join(certificatesDir, 'cert.pem');

// Extraer los valores necesarios desde config.json
const domain: string = config.ssl.domain; // ej. "desktop-p1l2603.duckdns.org"
const email: string = config.ssl.email;   // ej. "tuemail@gmail.com"

// Usar el directorio de producción de Let's Encrypt
const directoryUrl = acme.directory.letsencrypt.production;
// Si deseas probar, usa: acme.directory.letsencrypt.staging

// Umbral de renovación (en días); si el certificado vence en menos de estos días, se renueva.
const RENEW_THRESHOLD_DAYS = 30;

/**
 * Función que se ejecuta cuando Let's Encrypt solicita crear un desafío HTTP-01.
 * Se almacena el token en globalThis.challengeTokens para poder responder la petición.
 */
export async function challengeCreateFn(authz: any, challenge: Challenge, keyAuthorization: string): Promise<void> {
  globalThis.challengeTokens[challenge.token] = keyAuthorization;
  console.log(`[ACME] challengeCreateFn: Guardado token ${challenge.token}`);
}

/**
 * Función que se ejecuta para remover el desafío HTTP-01.
 */
export async function challengeRemoveFn(authz: any, challenge: Challenge, keyAuthorization: string): Promise<void> {
  delete globalThis.challengeTokens[challenge.token];
  console.log(`[ACME] challengeRemoveFn: Eliminado token ${challenge.token}`);
}

/**
 * Función auxiliar que determina si el certificado en certFile está a punto de caducar.
 * Devuelve true si el archivo no existe o si vence en menos de thresholdDays.
 */
function certificateNeedsRenewal(thresholdDays: number = RENEW_THRESHOLD_DAYS): boolean {
  if (!fs.existsSync(certFile)) {
    return true;
  }
  try {
    const pem = fs.readFileSync(certFile, 'utf8');
    const cert = forge.pki.certificateFromPem(pem);
    const now = new Date();
    const diffMs = cert.validity.notAfter.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    console.log(`[ACME] Certificado expira en ${Math.floor(diffDays)} días.`);
    return diffDays < thresholdDays;
  } catch (error) {
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
export async function obtainCertificate(): Promise<void> {
  // Comprobar si ya existe un certificado y si está vigente
  if (!certificateNeedsRenewal()) {
    console.log('[ACME] Certificado existente es válido; se usará el certificado actual.');
    return;
  }

  try {
    // Crear una clave para la cuenta ACME
    const accountKey = await acme.forge.createPrivateKey();

    // Crear el cliente ACME
    const client = new acme.Client({
      directoryUrl,
      accountKey,
    });

    // Registrar la cuenta (aceptando los términos de servicio)
    await client.createAccount({
      termsOfServiceAgreed: true,
      contact: [`mailto:${email}`],
    });
    console.log('[ACME] Cuenta registrada correctamente.');

    // Generar una clave privada y CSR para el dominio
    const [domainKey, csr] = await acme.forge.createCsr({
      commonName: domain,
    });
    console.log('[ACME] CSR generada para el dominio:', domain);

    // Solicitar el certificado usando el método automático que gestiona el desafío HTTP-01
    const certificate = await client.auto({
      csr,
      challengeCreateFn,
      challengeRemoveFn,
    });
    console.log('[ACME] Certificado obtenido.');

    // Guardar la clave privada y el certificado en archivos PEM
    fs.writeFileSync(keyFile, domainKey);
    fs.writeFileSync(certFile, certificate);

    console.log(`[ACME] Certificado guardado en:
  - Clave privada: ${keyFile}
  - Certificado: ${certFile}`);
  } catch (error: any) {
    // Si hay error y existe una respuesta HTTP, mostramos la data para depurar
    if (error.response) {
      console.error('[ACME] Error en la respuesta HTTP:', error.response.data);
    }
    console.error('[ACME] Error al obtener el certificado:', error);
    throw error;
  }
}
