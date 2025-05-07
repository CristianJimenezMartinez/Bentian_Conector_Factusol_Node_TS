#Bentian Conector Factusol (Node TS, x64)

Versión 64 bits (Beta) — totalmente funcional.

Descripción

Este proyecto actúa como conector entre el software de facturación Factusol y sistemas externos, exponiendo:

API REST y WebSockets para llamadas síncronas y en tiempo real.

Generación automática de facturas desde la API.

Integración con Stripe y PayPal (modo prueba) para pasarelas de pago.

Notificaciones por SMTP, subida de archivos vía FTP y recepción de Webhooks.

Autenticación, manejo de errores y middleware personalizado.

La capa de datos utiliza PostgreSQL, y la comunicación directa con Factusol (basada en 32 bits) se realiza a través de OLE DB.

🚧 Importante: Actualmente esta versión es 64 bits y requiere Microsoft Access Database Engine x64. Si Factusol está instalado en la misma máquina, no funcionará (Factusol usa OLE DB de 32 bits). Próximamente habrá una rama para coexistir con Factusol en la misma máquina.

📋 Prerrequisitos

Node.js ≥ 20.0.0

Microsoft Access Database Engine x64 (preferiblemente 2010 o 2016)

PostgreSQL instalado y configurado

Puerto HTTP (80) abierto (port forwarding o DMZ) para generar certificados Let’s Encrypt

Cuenta de Stripe y PayPal (modo prueba)

🔧 Instalación y configuración

Clona el repositorio:

git clone https://github.com/CristianJimenezMartinez/Bentian_Conector_Factusol_Node_TS.git
cd Bentian_Conector_Factusol_Node_TS

Instala dependencias de Node:

npm install

Configura variables de entorno:

Copia config.example.json a config.json.

Rellena las secciones con tus credenciales:

{
  "ssl": { "enabled": true, ... },
  "database": { "host": "...", "user": "...", "password": "..." },
  "ftp": { "host": "...", "user": "...", "password": "..." },
  "stripe": { "privateKey": "sk_test_...", "webhookSecret": "whsec_..." },
  "paypal": { "clientId": "...", "clientSecret": "...", "mode": "sandbox" },
  "smtp": { "host": "...", "user": "...", "password": "..." }
}

Asegúrate de instalar Microsoft Access Database Engine x64:

Descarga e instala la versión 2010 o 2016 desde Microsoft.

Crea la base de datos en PostgreSQL y ejecuta los scripts de inicialización (si existen).

Ejecuta la aplicación:

npm run build
npm start

Al final del proceso encontrarás bentian.exe en la carpeta dist/, listo para usar.

🌐 Certificados HTTPS

Para obtener certificados válidos con Let's Encrypt, asegúrate de:

Abrir el puerto 80 en tu router/servidor.

Tener configurado el dominio en config.json.

La primera ejecución generará y guardará cert.pem, privkey.pem y ca_bundle.pem.

⚙️ Uso y pruebas

Accede a la URL de la API (puerto 3000 o 443 según configuración).

Haz peticiones REST (GET, POST, PUT, DELETE) a los endpoints de Factusol.

Prueba el flujo de facturación automático.

En modo prueba de Stripe, configura tus Webhooks con los eventos mínimos:

payment_intent.payment_failed

payment_intent.succeeded

🚀 Próximos pasos

Crear rama feature/32bit-support para permitir ejecución junto a Factusol (32 bits).

Generar un ejecutable autónomo (sin dependencia de Node.js).

Añadir tests automáticos y pipeline CI/CD.

© 2025 Cristian Jimenez Martinez — Hecho con 💙 y café
