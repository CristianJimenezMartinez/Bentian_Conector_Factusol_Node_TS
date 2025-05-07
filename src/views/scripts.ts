export function setupButtonClick() {
    // Obtener el botón por su ID
    const myButton = document.getElementById('myButton');
  
    // Verificar si el botón existe
    if (myButton) {
      // Agregar un evento de clic al botón
      myButton.addEventListener('click', () => {
        // Redirigir a la URL deseada
        window.location.href = '/panel/otra-pagina';
      });
    }
  }