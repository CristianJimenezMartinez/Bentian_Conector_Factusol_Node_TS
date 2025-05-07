export const cssStyles = `
body, html {
  margin: 0;
  padding: 0;
  font-family: 'Roboto', sans-serif;
  color: #ffffff; /* Cambia el color del texto a blanco */
  background-color: #28282d;
  height: 100%;
}

.main-content {
  width: 75%;
  padding: 25px; /* Agrega un margen de 20px alrededor del contenido */
  margin-left: 40px;
  box-sizing: border-box;
  
}


.container {
  display: flex;
  height: 100%;
}

.sidebar {
  width: 12%;
  background-color: #33323a;
  padding: 20px;
  box-sizing: border-box;
}

.sidebar h2 {
  margin-top: 30px;
  
  text-align: center; /* Centra el texto horizontalmente */
  border-bottom: 1px solid #ffffff;
}

.sidebar ul {
  list-style: none;
  margin-top: 40px;
  padding: 0;
  
}

.sidebar ul li {
  margin-bottom: 10px;
  
}

.sidebar ul li a {
  display: block;
  padding: 10px 20px; /* Añade margen a la izquierda y a la derecha para separar los enlaces del sidebar */
  background-color: transparent; /* Para que no se diferencie del fondo */
  text-decoration: none; /* Elimina el subrayado predeterminado */
  color: #ffffff; /* Letras blancas */
  cursor: pointer; /* Cambia el cursor a una mano al pasar el ratón */
  transition: background-color 0.3s, border-radius 0.3s, color 0.3s; /* Agrega una transición suave al cambio de color de fondo, al redondeo de las esquinas y al color de texto */
  border-radius: 8px; /* Redondea las esquinas de los botones */
}

.sidebar ul li a i {
  vertical-align: middle; /* Alinea verticalmente los iconos con el texto */
  margin-right: 5px; /* Añade un margen a la derecha de los iconos para separarlos del texto */
}

.sidebar ul li a:hover {
  background-color: #0d0db7; /* Azul más oscuro cuando el cursor está encima */
  border-radius: 12px; /* Ajusta el redondeo de las esquinas al pasar el cursor */
  color: #ffffff; /* Cambia el color de texto a blanco al pasar el cursor */
}

.input{
  display: block;
  padding: 10px 20px; /* Añade margen a la izquierda y a la derecha para separar los enlaces del sidebar */
  background-color: #33323a; /* Para que no se diferencie del fondo */
  text-decoration: none; /* Elimina el subrayado predeterminado */
  color: #ffffff; /* Letras blancas */
  cursor: pointer; /* Cambia el cursor a una mano al pasar el ratón */
  transition: background-color 0.3s, border-radius 0.3s, color 0.3s; /* Agrega una transición suave al cambio de color de fondo, al redondeo de las esquinas y al color de texto */
  border-radius: 8px; /* Redondea las esquinas de los botones */
  
}

.button {
  display: inline-block;
  padding: 10px 20px;
  background-color: #33323a;
  text-decoration: none;
  color: #ffffff;
  cursor: pointer;
  transition: background-color 0.3s, border-radius 0.3s, color 0.3s;
  border-radius: 8px;
  border: 1px solid #ffffff; /* Añade un borde blanco */
}

.button:hover {
  background-color: #0d0db7;
  border-radius: 12px;
  color: #ffffff;
}
`;