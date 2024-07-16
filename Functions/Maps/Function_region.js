const connection = require('../../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');

// Generate a unique ID
function UID() {
    return uuidv4();
}
// Obtener geocercas getGeocercasID
function getGeocercas(req, res) {
    const query = `
        SELECT 
            g.GEOCERCA_ID, 
            g.GEOCERCA_CLAVE, 
            g.REGION_ID, 
            g.GEOCERCA_FEC, 
            g.GEOCERCA_DESCRIP, 
            g.GEOCERCA_LOCALIZA,
            r.REGION_DESCRIP
        FROM GEOCERCAS g
        JOIN CATALOGO_REGION r ON g.REGION_ID = r.REGION_ID
    `;
    return new Promise((resolve, reject) => {
        connection.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                const formattedResults = results.map(row => {
                    const perimetro = row.GEOCERCA_LOCALIZA
                        .split('\n')
                        .map(locationString => {
                            const coords = locationString
                                .replace(/[{}]/g, '')
                                .split(',')
                                .map(coord => coord.split(':').map(s => s.trim()));

                            if (coords.length >= 2 && coords[0].length >= 2 && coords[1].length >= 2) {
                                return {
                                    lat: parseFloat(coords[0][1]),
                                    lng: parseFloat(coords[1][1])
                                };
                            } else {
                                console.warn('Formato inesperado en GEOCERCA_LOCALIZA:', locationString);
                                return null;
                            }
                        })
                        .filter(location => location !== null);

                    return {
                        Nombre: row.GEOCERCA_DESCRIP,
                        GeocercaID: row.GEOCERCA_ID,
                        Clave: row.GEOCERCA_CLAVE,
                        RegionID: row.REGION_ID,
                        RegionDescripcion: row.REGION_DESCRIP,
                        Fecha: row.GEOCERCA_FEC,
                        Perimetro: perimetro
                    };
                });

                resolve(formattedResults);
                console.log('Obteniendo geocercas...');
                res.send(formattedResults);
            }
        });
    });
}


function getGeocercasID(req, res, ID) {
    const query = `
    SELECT 
        g.GEOCERCA_ID, 
        g.GEOCERCA_CLAVE, 
        g.REGION_ID, 
        g.GEOCERCA_FEC, 
        g.GEOCERCA_DESCRIP, 
        g.GEOCERCA_LOCALIZA,
        r.REGION_DESCRIP
    FROM GEOCERCAS g
    JOIN CATALOGO_REGION r ON g.REGION_ID = r.REGION_ID
    WHERE g.GEOCERCA_ID = ?
    `;
    return new Promise((resolve, reject) => {
        connection.query(query, [ID], (error, results) => {
            if (error) {
                reject(error);
            } else {
                const formattedResults = results.map(row => {
                    const perimetro = row.GEOCERCA_LOCALIZA
                        .split('\n')
                        .map(locationString => {
                            const coords = locationString
                                .replace(/[{}]/g, '')
                                .split(',')
                                .map(coord => coord.split(':').map(s => s.trim()));

                            return {
                                lat: parseFloat(coords[0][1]),
                                lng: parseFloat(coords[1][1])
                            };
                        });

                    return {
                        Nombre: row.GEOCERCA_DESCRIP,
                        GeocercaID: row.GEOCERCA_ID,
                        Clave: row.GEOCERCA_CLAVE,
                        RegionID: row.REGION_ID,
                        RegionDescripcion: row.REGION_DESCRIP, // Añadido
                        Fecha: row.GEOCERCA_FEC,
                        Perimetro: perimetro
                    };
                });

                resolve(formattedResults);
                console.log('Obteniendo geocercas ' + ID);
                res.send(formattedResults);
            }
        });
    });
}


module.exports = {
    getGeocercas,
    getGeocercasID
};

