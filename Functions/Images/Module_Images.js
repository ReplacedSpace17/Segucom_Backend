const connection = require('../../SQL_CONECTION');

async function addImagePath(id, ruta, category, descripcion) {
    const addImagenScript = 'INSERT INTO IMAGES (ID_registro, categoria, descripcion, ruta) VALUES (?, ?, ?, ?)';
  
    // Asegúrate de que todos los valores son cadenas de texto antes de pasarlos a la consulta
    const query = (sql, values) => {
      return new Promise((resolve, reject) => {
        connection.query(sql, values.map(value => String(value)), (error, results) => {
          if (error) {
            return reject(error);
          }
          resolve(results);
        });
      });
    };
  
    try {
      // Ejecutar la consulta para agregar la imagen a la tabla "IMAGES"
      await query(addImagenScript, [id, category, descripcion, ruta]);
    } catch (error) {
      console.error('Error al agregar la imagen', error);
      throw error; // Propaga el error para manejarlo en el endpoint
    }
}






module.exports = {
    addImagePath
};
