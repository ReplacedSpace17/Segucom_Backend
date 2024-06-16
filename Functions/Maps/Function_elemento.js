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

//modificar ubicacion
function UpdateUbicacion(req, res, data, Num_tel) {
    const query = 'UPDATE ELEMENTO SET ELEMENTO_LATITUD = ?, ELEMENTO_LONGITUD = ?, ELEMENTO_ULTIMALOCAL= ? WHERE ELEMENTO_TELNUMERO = ?';
  

    connection.query(query, [data.ELEMENTO_LATITUD, data.ELEMENTO_LONGITUD, data.ELEMENTO_ULTIMALOCAL, Num_tel], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            console.log('Ubicacion actualizada de elemento: ' + Num_tel + ' a latitud: ' + data.ELEMENTO_LATITUD + ' y longitud: ' + data.ELEMENTO_LONGITUD + 'HORA: '+ data.Hora);
            res.json(results);
        }
    });
}



module.exports = {
    LocalizarElemento,
    UpdateUbicacion,
    LocalizarTodosElemento
};

