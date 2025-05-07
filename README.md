# 🚀 Bentian Conector Factusol (Node TS, x64)

[![Node.js](https://img.shields.io/badge/Node-20.0.0+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-PolyForm_NC-blue)](LICENSE)

**Versión 64 bits (Beta)** — totalmente funcional.

---

## 📝 Descripción

Este proyecto actúa como conector entre el software de facturación Factusol y sistemas externos, exponiendo:

- **API REST** y **WebSockets** para llamadas síncronas y en tiempo real.
- **Generación automática de facturas** desde la API.
- Integración con **Stripe** y **PayPal** (modo prueba) para pasarelas de pago.
- Notificaciones por **SMTP**, subida de archivos vía **FTP** y recepción de **Webhooks**.
- **Autenticación**, manejo de errores y middleware personalizado.

La capa de datos utiliza **PostgreSQL**, y la comunicación directa con Factusol (basada en 32 bits) se realiza a través de **OLE DB**.

> 🚧 **Importante:** Esta versión es **64 bits** y requiere Microsoft Access Database Engine x64. Si Factusol está instalado en la misma máquina, no funcionará (Factusol usa OLE DB de 32 bits). Próximamente habrá una rama para coexistir con Factusol en la misma máquina.

---

## 📋 Prerrequisitos

- **Node.js** ≥ 20.0.0
- **Microsoft Access Database Engine x64** (preferiblemente 2010 o 2016)
- **PostgreSQL** instalado y configurado
- **Puerto HTTP (80)** abierto (port forwarding o DMZ) para certificados Let’s Encrypt
- Cuenta de **Stripe** y **PayPal** (modo prueba)

---

## 🔧 Instalación y configuración

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/CristianJimenezMartinez/Bentian_Conector_Factusol_Node_TS.git
   cd Bentian_Conector_Factusol_Node_TS
   ```

2. **Instala dependencias**:
   ```bash
   npm install
   ```

3. **Configura `config.json`**:
   - Copia `config.example.json` → `config.json`.
   - Completa tus credenciales:
     ```json
     {
       "ssl": { ... },
       "database": { ... },
       "ftp": { ... },
       "stripe": { ... },
       "paypal": { ... },
       "smtp": { ... }
     }
     ```

4. **Instala Access Database Engine x64** (2010 o 2016).
5. **Creación de base de datos** en PostgreSQL y ejecución de scripts (si aplica).
6. **Ejecución**:
   ```bash
   npm run build
   npm start
   ```

> Al finalizar, encontrarás `bentian.exe` en `dist/`, listo para usarse.

---

## 🔒 Certificados HTTPS

Para generar certificados Let’s Encrypt:

1. Abre el **puerto 80** en tu router/servidor.
2. Define tu dominio en `config.json`.
3. Ejecuta la aplicación: se generarán `cert.pem`, `privkey.pem` y `ca_bundle.pem` en `src/certificates`.

---

## ⚙️ Uso y pruebas

1. Accede a la API (puerto 3000 o 443).
2. Realiza peticiones REST (GET, POST, PUT, DELETE).
3. Verifica la generación automática de facturas.
4. En modo prueba de Stripe, configura Webhooks para:
   - `payment_intent.payment_failed`
   - `payment_intent.succeeded`

---

## 🛠 Próximos pasos

- Rama **`feature/32bit-support`** para compatibilidad con Factusol (32 bits).
- Ejecutable autónomo (sin Node.js).
- Tests automáticos y pipeline CI/CD.

---

© 2025 Cristian Jimenez Martinez — Hecho con 💙 y café
