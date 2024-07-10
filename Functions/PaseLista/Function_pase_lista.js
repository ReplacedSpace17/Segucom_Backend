const connection = require('../../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');


// Validar administrador tiene permiso de efectuar el pase de lista
function ValidarAdministrador(req, res, numero_Elemento) {
    const query = `
        SELECT 
            PASE_ID
        FROM 
            PASE_GRUPO
        WHERE 
            PASE_ADMON = ? AND PASE_ESTATUS = 1
    `;
    
    connection.query(query, [numero_Elemento], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            if (results.length > 0) {
                res.json({ PASE_ID: results[0].PASE_ID });
            } else {
                res.status(404).send('Administrador no válido o estatus incorrecto');
            }
        }
    });
}

//Insertar un nuevo encabezado de pase de lista
function CrearEncabezado(req, res, numero_Elemento, id_Grupo) {
    var fechaActual = new Date().toISOString().slice(0, 10); 
    
    const query = `
        INSERT INTO PASE_ENCABEZADO (PASENCA_FEC, PASENCA_FECHA, PASE_ID, PASE_ADMON)
        VALUES (?, ?, ?, ?)
    `;
    
    connection.query(query, [fechaActual, fechaActual, id_Grupo, numero_Elemento], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            console.log('Encabezado de pase de lista creado correctamente: ' + results.insertId);
            res.json({ PASENCA_ID: results.insertId });
        }
    });
}

//verificar si el elemento pertenece al grupo que se esta realizando el pase de lista
function ValidarElementoGrupo(req, res, numero_Elemento, id_Grupo, id_Encabezado) {
    const query = `
        SELECT 
            PASELEM_ID
        FROM 
            PASE_ELEMENTO
        WHERE 
            PASELEM_ELEMENTO = ? AND PASE_ID = ? AND PASELEM_ESTATUS = 1
    `;
    
    connection.query(query, [numero_Elemento, id_Grupo], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            if (results.length > 0) {
                //res.json({ PASELEM_ID: results[0].PASELEM_ID, Mensaje: 'Elemento pertenece al grupo'});
                PasarLista(req, res, numero_Elemento, id_Encabezado);
            } else {
                res.status(404).send('Elemento no pertenece al grupo o estatus incorrecto');
            }
        }
    });
}

//Insertar el pase de lista de un elemento
function PasarLista(req, res, numero_Elemento, id_Encabezado) {
    const fechaActual = new Date().toISOString().slice(0, 10); // Obtiene la fecha actual en formato YYYY-MM-DD

    const query = `
        INSERT INTO PASE_ASISTENCIA (PASASIS_FEC, PASENCA_ID, ELEMENTO_NUMERO)
        VALUES (?, ?, ?)
    `;
    
    connection.query(query, [fechaActual, id_Encabezado, numero_Elemento], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            console.log('Pase de lista realizado correctamente para el elemento ' + numero_Elemento);
            res.json({ Mensaje: 'Pase de lista realizado correctamente para el elemento ' + numero_Elemento });
        }
    });
}

function GetElementosAsignados(req, res, id_Grupo) {
    const query = `
        SELECT 
            e.ELEMENTO_NOMBRE,
            e.ELEMENTO_PATERNO,
            e.ELEMENTO_MATERNO,
            e.ELEMENTO_NUMERO
        FROM 
            PASE_ELEMENTO pe
        JOIN 
            ELEMENTO e ON pe.PASELEM_ELEMENTO = e.ELEMENTO_NUMERO
        WHERE 
            pe.PASE_ID = ? AND pe.PASELEM_ESTATUS = 1
    `;
    
    connection.query(query, [id_Grupo], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            if (results.length > 0) {
                res.json(results);
            } else {
                res.status(404).send('No se encontraron elementos asignados al grupo.');
            }
        }
    });
}

function getStatusElementos(req, res) {
    const query = `
        SELECT 
           *
        FROM 
            ESTAT_ELEMENTO
    `;
    console.log('ejeuctando query');
    
    connection.query(query, (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            if (results.length > 0) {
                res.json(results);
            } else {
                res.status(404).send('No se encontraron registros en la tabla ESTAT_ELEMENTO.');
            }
        }
    });
}

module.exports = {
    ValidarAdministrador,
    CrearEncabezado,
    ValidarElementoGrupo,
    PasarLista,
    GetElementosAsignados,
    getStatusElementos
};
