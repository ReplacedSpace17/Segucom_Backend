const connection = require('../../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');

// Generate a unique ID
function UID() {
    return uuidv4();
}

// Obtener la latitud y lon de un elemento
// Obtener geocercas
function LocalizarElemento(req, res, Num_elemento) {
    const query = `
        SELECT 
            e.*,
            r.REGION_DESCRIP,
            d.DIVISION_DESCRIP,
            c.CARGO_DESCRIP,
            b.BASE_DESCRIP,
            t.TURNO_DESCRIP
        FROM 
            ELEMENTO e
        LEFT JOIN 
            CATALOGO_REGION r ON e.REGION_ID = r.REGION_ID
        LEFT JOIN 
            CATALOGO_DIVISION d ON e.DIVISION_ID = d.DIVISION_ID
        LEFT JOIN 
            CATALOGO_CARGO c ON e.CARGO_ID = c.CARGO_ID
        LEFT JOIN 
            CATALOGO_BASE b ON e.BASE_ID = b.BASE_ID
        LEFT JOIN 
            CATALOGO_TURNOS t ON e.TURNO_ID = t.TURNO_ID
        WHERE 
            e.ELEMENTO_NUMERO = ?
    `;
    
    connection.query(query, [Num_elemento], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            if (results.length > 0) {
                console.log('Elemento localizado ' + Num_elemento + ' con latitud: ' + results[0].ELEMENTO_LATITUD + ' y longitud: ' + results[0].ELEMENTO_LONGITUD);
                res.json(results[0]);
            } else {
                res.status(404).send('Elemento no encontrado');
            }
        }
    });
}

function LocalizarTodosElemento(req, res) {
    const query = `
    SELECT 
        e.*,
        r.REGION_DESCRIP,
        d.DIVISION_DESCRIP,
        c.CARGO_DESCRIP,
        b.BASE_DESCRIP,
        t.TURNO_DESCRIP
    FROM 
        ELEMENTO e
    LEFT JOIN 
        CATALOGO_REGION r ON e.REGION_ID = r.REGION_ID
    LEFT JOIN 
        CATALOGO_DIVISION d ON e.DIVISION_ID = d.DIVISION_ID
    LEFT JOIN 
        CATALOGO_CARGO c ON e.CARGO_ID = c.CARGO_ID
    LEFT JOIN 
        CATALOGO_BASE b ON e.BASE_ID = b.BASE_ID
    LEFT JOIN 
        CATALOGO_TURNOS t ON e.TURNO_ID = t.TURNO_ID
`;
    connection.query(query, [], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            console.log('Elementos localizados (all)');
            res.json(results);
        }
    });
}


function VerifyMonitoreoRondin(Num_tel) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT ELEMENTO_RONDIN FROM ELEMENTO WHERE ELEMENTO_TELNUMERO = ?';
        console.log('Verificando monitoreo de rondín para elemento: ' + Num_tel);
        connection.query(query, [Num_tel], (error, results) => {
            if (error) {
                console.error('Error al verificar monitoreo de rondín:', error);
                reject(error);
            } else {
                //console.log(results);
                if (results.length > 0 && results[0].ELEMENTO_RONDIN === 1) {
                    console.log('Elemento ' + Num_tel + ' tiene monitoreo de rondín activado');
                    resolve(true);
                } else {
                    console.log('Elemento ' + Num_tel + ' no tiene monitoreo de rondín activado');
                    resolve(false);
                }
            }
        });
    });
}

function VerifyMonitoreoZona(Num_tel) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT ELEMENTO_FUERA FROM ELEMENTO WHERE ELEMENTO_TELNUMERO = ?';
        console.log('Verificando monitoreo de rondín para elemento: ' + Num_tel);
        connection.query(query, [Num_tel], (error, results) => {
            if (error) {
                console.error('Error al verificar monitoreo de rondín:', error);
                reject(error);
            } else {
                console.log(results);
                if (results.length > 0 && results[0].ELEMENTO_FUERA === 1) {
                    console.log('Elemento ' + Num_tel + ' tiene monitoreo de zona activado');
                    resolve(true);
                } else {
                    console.log('Elemento ' + Num_tel + ' no tiene monitoreo de zona activado');
                    resolve(false);
                }
            }
        });
    });
}

function AddUbicacionHistorial(req, res, numeroElemento, lat, long, time) {
    // Obtener la fecha y hora actual
    const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' '); // Formato YYYY-MM-DD HH:MM:SS

    // Construir el objeto de ubicación en formato {lat: VALUE, lon: VALUE}
    const ubicacion = { lat: lat, lon: long };
    
    // Construir la consulta SQL para insertar en HISTO_UBICA
    const query = 'INSERT INTO HISTO_UBICA (ELEMENTO_NUMERO, HISTO_FECHA, HISTO_UBICACION) VALUES (?, ?, ?)';
  
    connection.query(query, [numeroElemento, time, JSON.stringify(ubicacion)], (error, results) => {
        if (error) {
            
        } else {
            console.log('Registro de ubicación histórica agregado para elemento número: ' + numeroElemento);
           
        }
    });
}

//function para verificar si el elemento está dentro de una geocerca
// Función para verificar si un punto está dentro de una geocerca
function isPointInPolygon(point, polygon) {
    const { lat, lng } = point; // Cambiado lon por lng
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat, yi = polygon[i].lng; // Cambiado lon por lng
      const xj = polygon[j].lat, yj = polygon[j].lng; // Cambiado lon por lng
  
      const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
  
  // Función para verificar si el elemento está dentro de una geocerca
  function verifyElementoDentroGeocerca(req, res, numeroElemento, lat, long, time) {
    const query = 'SELECT G.GEOCERCA_LOCALIZA FROM GEOCERCAS G JOIN ELEMENTO E ON G.REGION_ID = E.REGION_ID WHERE E.ELEMENTO_NUMERO = ?';
  
    connection.query(query, [numeroElemento], (error, results) => {
      if (error) {
        console.error('Error en la consulta:', error);
        //res.status(500).send(error);
        return;
      }
  
      if (results.length === 0) {
        console.log(`No se encontraron geocercas para el elemento número ${numeroElemento}`);
        //res.status(200).send(`No se encontraron geocercas para el elemento número ${numeroElemento}`);
        return;
      }
  
      const point = { lat, lng: long }; // Cambiado lon por lng
      let dentroDeGeocerca = false;
  
      try {
        for (let i = 0; i < results.length; i++) {
          const geocercaLocaliza = results[i].GEOCERCA_LOCALIZA
            .split('\n')
            .map(locationString => {
              const coords = locationString
                .replace(/[{}]/g, '')
                .split(',')
                .map(coord => coord.split(':').map(s => s.trim()));
  
              return {
                lat: parseFloat(coords[0][1]),
                lng: parseFloat(coords[1][1]) // Cambiado lon por lng
              };
            });
  
          if (isPointInPolygon(point, geocercaLocaliza)) {
            dentroDeGeocerca = true;
            break;
          }
        }
      } catch (parseError) {
        console.error('Error al analizar la geocerca:', parseError);
        //res.status(500).send(parseError);
        return;
      }
  
      if (dentroDeGeocerca) {
        console.log(`El elemento número ${numeroElemento} está dentro de una geocerca`);
        //res.status(200).send(`El elemento número ${numeroElemento} está dentro de una geocerca`);
      } else {
        console.log(`El elemento número ${numeroElemento} NO está dentro de una geocerca`);
        //res.status(200).send(`El elemento número ${numeroElemento} NO está dentro de una geocerca`);
      }
    });
  }
  

//modificar ubicacion
async function UpdateUbicacion(req, res, data, Num_tel) {
    try {
        const rondin = await VerifyMonitoreoRondin(Num_tel);
        const zona = await VerifyMonitoreoZona(Num_tel);
        //console.log('Desea rondin?: ' + rondin);

        const query = 'UPDATE ELEMENTO SET ELEMENTO_LATITUD = ?, ELEMENTO_LONGITUD = ?, ELEMENTO_ULTIMALOCAL = ? WHERE ELEMENTO_TELNUMERO = ?';
    
        connection.query(query, [data.ELEMENTO_LATITUD, data.ELEMENTO_LONGITUD, data.ELEMENTO_ULTIMALOCAL, Num_tel], (error, results) => {
            if (error) {
                res.status(500).send(error);
            } else {
                console.log('Ubicación actualizada de elemento: ' + Num_tel + ' a latitud: ' + data.ELEMENTO_LATITUD + ' y longitud: ' + data.ELEMENTO_LONGITUD + ' HORA: ' + data.Hora);
                if (rondin === true) {
                    AddUbicacionHistorial(req, res, data.ELEMENTO_NUM, data.ELEMENTO_LATITUD, data.ELEMENTO_LONGITUD, data.ELEMENTO_ULTIMALOCAL);
                }
                if (zona === true) {
                    // Verificar si el elemento está dentro de una geocerca
                    verifyElementoDentroGeocerca(req, res, data.ELEMENTO_NUM, data.ELEMENTO_LATITUD, data.ELEMENTO_LONGITUD, data.ELEMENTO_ULTIMALOCAL)
                }
                res.json(results);
            }
        });
    } catch (error) {
        res.status(500).send(error);
    }
}

async function GetRastreoElemento(req, res, numeroElemento) {
    try {
        const query = 'SELECT * FROM HISTO_UBICA WHERE ELEMENTO_NUMERO = ?';
        connection.query(query, [numeroElemento], (error, results) => {
            if (error) {
                console.error('Error al obtener el historial de ubicaciones:', error);
                return res.status(500).json({ error: 'Error de servidor al obtener el historial de ubicaciones' });
            }

            const formattedResults = results.map(row => {
                const ubicacion = JSON.parse(row.HISTO_UBICACION);
                return {
                    HISTO_ID: row.HISTO_ID,
                    ELEMENTO_NUMERO: row.ELEMENTO_NUMERO,
                    HISTO_FECHA: row.HISTO_FECHA,
                    LATITUD: ubicacion.lat,
                    LONGITUD: ubicacion.lon
                };
            });

            res.json(formattedResults);
        });
    } catch (error) {
        console.error('Error inesperado:', error);
        res.status(500).json({ error: 'Error de servidor inesperado' });
    }
}


module.exports = {
    LocalizarElemento,
    UpdateUbicacion,
    LocalizarTodosElemento,
    GetRastreoElemento
};

