const connection = require('../../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');

// Generate a unique ID
function UID() {
    return uuidv4();
}

// Obtener geocercas
function getPuntosVigilancia(req, res) {
    const query = 'SELECT VIGLIA_ID , VIGILA_FEC, VIGILA_SERVICIO  , VIGILA_LATITUD , VIGILA_LONGITUD  from PUNTO_VIGILANCIA ;';
    return new Promise((resolve, reject) => {
        connection.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                

        
                console.log('Obteniendo Puntos vigilancia...');
                res.send(results);
            }
        });
    });
}

function getPuntosVigilanciaByID(req, res, ID) {
    const query = 'SELECT *  from PUNTO_VIGILANCIA WHERE VIGILA_ID = ?;';
    return new Promise((resolve, reject) => {
        connection.query(query, [ID], (error, results) => {
            if (error) {
                reject(error);
            } else {
                

        
                console.log('Obteniendo Puntos vigilancia...');
                res.send(results);
            }
        });
    });
}

function getElementosAsignados(req, res, PuntoID) {
    const query = `
    SELECT 
        PE.*,
        E.*,
        R.REGION_DESCRIP,
        D.DIVISION_DESCRIP,
        C.CARGO_DESCRIP,
        B.BASE_DESCRIP,
        T.TURNO_DESCRIP
    FROM 
        PUNTO_ELEMENTO PE
    INNER JOIN 
        ELEMENTO E ON PE.ELEMENTO_ID = E.ELEMENTO_ID
    LEFT JOIN 
        CATALOGO_REGION R ON E.REGION_ID = R.REGION_ID
    LEFT JOIN 
        CATALOGO_DIVISION D ON E.DIVISION_ID = D.DIVISION_ID
    LEFT JOIN 
        CATALOGO_CARGO C ON E.CARGO_ID = C.CARGO_ID
    LEFT JOIN 
        CATALOGO_BASE B ON E.BASE_ID = B.BASE_ID
    LEFT JOIN 
        CATALOGO_TURNOS T ON E.TURNO_ID = T.TURNO_ID
    WHERE 
        PE.VIGILA_ID = ?
`;


    return new Promise((resolve, reject) => {
        connection.query(query, [PuntoID], (error, results) => {
            if (error) {
                reject(error);
            } else {
                console.log('Obteniendo elementos asignados...');
                
                res.send(results);
            }
        });
    });
}


module.exports = {
    getPuntosVigilancia, getElementosAsignados, getPuntosVigilanciaByID
};

