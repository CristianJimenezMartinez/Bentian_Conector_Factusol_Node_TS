import { cssStyles } from './styles';
import * as fs from 'fs';
import { setupButtonClick } from './scripts';


export function generateHTMLHome(): string {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
      <title>Panel de Administración</title>
      <style>${cssStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="sidebar">
          <h2>BENTIAN</h2>
          <ul>
            <li><a href="/panel/home"><i class="fas fa-home"></i>Inicio</a></li>
            <li><a href="/panel/configuracion"><i class="fas fa-cog"></i>Configuración</a></li>
          </ul>
        </div>
        <div class="main-content">
          <h1>Contenido Principal</h1>
          <!-- Aquí puedes añadir elementos y contenido -->
          <div id="seccion1">
            <h2>Sección 1</h2>
            <p>Contenido de la sección 1...</p>
          </div>
          <div id="seccion2">
            <h2>Sección 2</h2>
            <p>Contenido de la sección 2...</p>
          </div>
          <div id="seccion3">
            <h2>Sección 3</h2>
            <p>Contenido de la sección 3...</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
    return htmlContent;
  }
export function generateHTMLConfiguration(): string {
    const htmlContent = `<!DOCTYPE html>
  <html lang="es">
  <head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${cssStyles}</style>
  <title>Panel de Administración</title>
  </head>
  <body>
    <div class="container">
      <div class="sidebar">
        <h2>BENTIAN</h2>
        <ul>
        <li><a href="/panel/home"><i class="fas fa-home"></i>Inicio</a></li>
        <li><a href="/panel/configuracion"><i class="fas fa-cog"></i>Configuración</a></li>
        </ul>
      </div>
      <div class="main-content">
        <h1>Panel de configuración</h1>
        <h3>Ruta de archivo</h3>
        <p></p>
        <button class="button" id="myButton">Botón 1</button>
      </div>
    </div>
    <script>
    // Llama a la función para configurar el clic del botón
    setupButtonClick();
  </script>
  </body>
  </html>`;
    return htmlContent;
}

export function formHTMLConfiguration(configFilePath: string): string {

  const htmlContent = `
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${cssStyles}</style>
      <title>Configuración</title>
    </head>
    <body>
    <div class="container">
      <div class="sidebar">
        <h2>BENTIAN</h2>
        <ul>
        <li><a href="/panel/home"><i class="fas fa-home"></i>Inicio</a></li>
        <li><a href="/panel/configuracion"><i class="fas fa-cog"></i>Configuración</a></li>
        </ul>
      </div>
      <div class="main-content">
        <h1>Configuración de la Base de Datos</h1>
      <form id="configForm">
        <div>
          <label for="dbHost">Host:</label>
          <input type="text" id="dbHost" name="dbHost">
        </div>
        <div>
          <label for="dbUser">Usuario:</label>
          <input type="text" id="dbUser" name="dbUser">
        </div>
        <div>
          <label for="dbPassword">Contraseña:</label>
          <input type="password" id="dbPassword" name="dbPassword">
        </div>
        <div>
          <label for="dbDatabase">Base de Datos:</label>
          <input type="text" id="dbDatabase" name="dbDatabase">
        </div>
        <div>
          <label for="dbPort">Puerto:</label>
          <input type="text" id="dbPort" name="dbPort">
        </div>
        <div>
          <label for="dbUserFac">Usuario Factusol:</label>
          <input type="text" id="dbUserFac" name="dbUserFac">
        </div>
        <div>
          <label for="dbPasswordFac">Contraseña Factusol:</label>
          <input type="password" id="dbPasswordFac" name="dbPasswordFac">
        </div>
        <div>
          <label for="pathFileFactusol">Ruta del archivo Factusol:</label>
          <input type="text" id="pathFileFactusol" name="pathFileFactusol">
        </div>
        <button type="submit">Guardar</button>
      </form>
      </div>
    </div>
      
      <script>
        document.getElementById('configForm').addEventListener('submit', function(e) {
          e.preventDefault();
          const config = {
            database: {
              host: document.getElementById('dbHost').value,
              user: document.getElementById('dbUser').value,
              password: document.getElementById('dbPassword').value,
              database: document.getElementById('dbDatabase').value,
              port: document.getElementById('dbPort').value,
              user_factusol: document.getElementById('dbUserFac').value,
              password_factusol: document.getElementById('dbPasswordFac').value
            },
            file: {
              path_file_factusol: document.getElementById('pathFileFactusol').value
            }
          };

          fetch('/api/config', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
          }).then(response => {
            if (response.ok) {
              alert('Configuración actualizada correctamente');
            } else {
              alert('Error al actualizar la configuración');
            }
          });
        });
      </script>
    </body>
    </html>
  `;
  return htmlContent;
}

export function buttonLogic() {
  const myButton = document.getElementById('myButton') as HTMLButtonElement | null;
  if (myButton) {
    myButton.addEventListener('click', ()=> {
      window.location.href = 'localhost:3000/panel/guardar-configuracion';
    });
  }
}