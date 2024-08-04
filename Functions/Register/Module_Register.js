const connection = require('../../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

function generarID() {
    return uuidv4();
}

/*
{
    "No_Empleado": 12345,
    "Nombre": "Juan Pérez",
    "Telefono": "5551234567",
    "IMEI": "123456789012345",
    "Clave": "password123"
}

*/

const saltRounds = 10; // Número de rondas de sal para bcrypt, ajusta según sea necesario
// Función de hash para la contraseña (debes implementar la función hash real)
function hashFunction(password) {
    // Implementar la función de hash adecuada (por ejemplo, bcrypt)
    // Retorna la contraseña hasheada
    // Ejemplo ficticio:
    return hash(password, saltRounds);
}

// Ejemplo ficticio de función de hash con bcrypt (debes instalar el paquete bcrypt)
function hash(password, saltRounds) {
    const bcrypt = require('bcrypt');
    const salt = bcrypt.genSaltSync(saltRounds);
    return bcrypt.hashSync(password, salt);
}

//funcion para obtener la informacion personal
async function getInformationPerfil(req, res, TelNum) {
    const checkPhoneQuery = 'SELECT * FROM PERFIL_ELEMENTO WHERE ELEMENTO_TELNUMERO = ?';
    connection.query(checkPhoneQuery, [TelNum], (checkError, results) => {
        if (checkError) {
            console.error('Error al verificar el número de teléfono', checkError);
            return res.status(500).json({ error: 'Error de servidor al verificar el número de teléfono' });
        }

        // Si el número de teléfono existe, proceder con la actualización
        if (results.length > 0) {
            res.status(200).json(results[0]);
        } else {
            // Si el número de teléfono no existe, enviar una respuesta de error
            console.log('No se encontró información del perfil para el número de teléfono proporcionado');
            res.status(404).json({ error: 'El número de teléfono ya cuenta con un registro' });
        }
    });

}


//Funcion para validar el registro
async function ValidarRegistro(req, res, numeroTelefono, numeroElemento) {
    console.log('Validando registro para el número de teléfono:', numeroTelefono, 'y número de elemento:', numeroElemento);

    // Consulta para verificar si el número de teléfono existe
    const checkPhoneQuery = `
        SELECT * FROM PERFIL_ELEMENTO
        WHERE ELEMENTO_TELNUMERO = ?`;

    // Consulta para verificar si el número de elemento existe
    const checkElementQuery = `
        SELECT * FROM PERFIL_ELEMENTO
        WHERE ELEMENTO_NUMERO = ?`;

    // Ejecutar la primera consulta de verificación para el número de teléfono
    connection.query(checkPhoneQuery, [numeroTelefono], (error, phoneResults) => {
        if (error) {
            console.error('Error al verificar el número de teléfono', error);
            return res.status(500).json({ message: 'Error de servidor al verificar el número de teléfono' });
        }

        if (phoneResults.length === 0) {
            console.log('El número de teléfono no existe en la base de datos');
            return res.status(404).json({ message: 'El número de teléfono no existe en la base de datos' });
        }

        // Ejecutar la segunda consulta de verificación para el número de elemento
        connection.query(checkElementQuery, [numeroElemento], (error, elementResults) => {
            if (error) {
                console.error('Error al verificar el número de elemento', error);
                return res.status(500).json({ message: 'Error de servidor al verificar el número de elemento' });
            }

            if (elementResults.length === 0) {
                console.log('El número de elemento no existe en la base de datos');
                return res.status(404).json({ message: 'El número de elemento no existe en la base de datos' });
            }

            // Consulta para verificar si el número de teléfono y el número de elemento coinciden y que PERFIL_CLAVE esté vacío
            const checkPhoneAndElementQuery = `
                SELECT * FROM PERFIL_ELEMENTO
                WHERE ELEMENTO_TELNUMERO = ? 
                AND ELEMENTO_NUMERO = ?
                AND PERFIL_CLAVE IS NULL`;

            // Ejecutar la tercera consulta de verificación
            connection.query(checkPhoneAndElementQuery, [numeroTelefono, numeroElemento], (error, results) => {
                if (error) {
                    console.error('Error al verificar el número de teléfono y el número de elemento', error);
                    return res.status(500).json({ message: 'Error de servidor al verificar el número de teléfono y el número de elemento' });
                }

                if (results.length > 0) {
                    console.log('Validación exitosa para el número de teléfono:', numeroTelefono);
                    return res.status(200).json({
                        message: 'Validación exitosa', numeroTelefono: numeroTelefono, numeroElemento: numeroElemento,
                        Nombre: results[0].PERFIL_NOMBRE
                    });
                } else {
                    console.log('PERFIL_CLAVE no está vacío para el número de teléfono:', numeroTelefono);
                    return res.status(404).json({ message: 'PERFIL_CLAVE no está vacío para el número de teléfono y el número de elemento proporcionados' });
                }
            });
        });
    });
}



// Función para actualizar el perfil de un usuario
async function addUserPersonal(req, res, data) {
    console.log('Agregando información personal para el usuario:', data);

    const hashedPassword = hashFunction(data.Clave);
    console.log('Clave hasheada:', hashedPassword);

    const telefono = data.Telefono;

    // Consulta para verificar si el número de teléfono existe en la tabla PERFIL_ELEMENTO
    const checkPhoneQuery = 'SELECT * FROM PERFIL_ELEMENTO WHERE ELEMENTO_TELNUMERO = ? AND PERFIL_CLAVE IS NULL';


    // Consulta para actualizar los campos en la tabla PERFIL_ELEMENTO
    const updateProfileQuery = `
        UPDATE PERFIL_ELEMENTO
        SET 
            PERFIL_NOMBRE = ?, 
            PERFIL_CLAVE = ?, 
            PERFIL_ANDROID = ?, 
            ELEMENTO_NUMERO = ?
        WHERE ELEMENTO_TELNUMERO = ?`;

    // Ejecutar la consulta de verificación
    connection.query(checkPhoneQuery, [telefono], (checkError, results) => {
        if (checkError) {
            console.error('Error al verificar el número de teléfono', checkError);
            return res.status(500).json({ error: 'Error de servidor al verificar el número de teléfono' });
        }

        // Si el número de teléfono existe, proceder con la actualización
        if (results.length > 0) {
            connection.query(updateProfileQuery, [
                data.Nombre,      // PERFIL_NOMBRE
                hashedPassword,       // PERFIL_CLAVE
                data.IMEI,        // PERFIL_ANDROID
                data.No_Empleado, // ELEMENTO_NUMERO
                telefono          // ELEMENTO_TELNUMERO
            ], (updateError, updateResults) => {
                if (updateError) {
                    console.error('Error al actualizar el perfil', updateError);
                    return res.status(500).json({ error: 'Error de servidor al actualizar el perfil' });
                }

                console.log('Perfil actualizado correctamente para el número de teléfono: ' + telefono);
                res.status(200).json({ message: 'Perfil actualizado correctamente', Nombre: data.Nombre });
            });
        } else {
            // Si el número de teléfono no existe, enviar una respuesta de error
            console.log('El número de teléfono ya cuenta con un registro');
            res.status(404).json({ error: 'El número de teléfono ya cuenta con un registro' });
        }
    });
}


// Función para comparar contraseñas utilizando bcrypt
async function comparePasswords(plainPassword, hashedPassword) {
    const bcrypt = require('bcrypt');
    return await bcrypt.compare(plainPassword, hashedPassword);
}

// Función para realizar el inicio de sesión
async function loginUser(req, res, telefono, clave, androidID) {
    const loginScript = `
        SELECT * 
        FROM PERFIL_ELEMENTO 
        JOIN ELEMENTO ON PERFIL_ELEMENTO.ELEMENTO_NUMERO = ELEMENTO.ELEMENTO_NUMERO
        WHERE PERFIL_ELEMENTO.ELEMENTO_TELNUMERO = ? 
        AND ELEMENTO.ELEMENTO_ACTIVO = 1
    `;
    console.log('Recibiendo el telefono, clave y androidID:', telefono + ' ' + clave + ' ' + androidID);
    
    // Ejecutar la consulta con el teléfono
    connection.query(loginScript, [telefono], async (error, results) => {
        if (error) {
            console.error('Error al realizar el inicio de sesión', error);
            return res.status(500).json({ error: 'Error de servidor al realizar el inicio de sesión' });
        }
 
        console.log('Resultados:', results);
        
        if (results.length === 1) {
            // Verificar si el androidID coincide
            if (results[0].PERFIL_ANDROID !== androidID) {
                console.log('androidID no coincide');
                return res.status(403).json({ error: 'Este Android ID no está autorizado para usar esta cuenta' }); // Cambia el código de estado
            }
            
            // Verificar si perfilclave es diferente a null o vacía
            if (results[0].PERFIL_CLAVE === null || results[0].PERFIL_CLAVE === '') {
                console.log('El perfil no tiene una contraseña establecida');
                return res.status(401).json({ error: 'El perfil no tiene una contraseña establecida' });
            } else {
                const isPasswordMatch = await comparePasswords(clave, results[0].PERFIL_CLAVE);
                if (isPasswordMatch) {
                    // Generar un token de autenticación
                    const token = jwt.sign({ telefono: results[0].ELEMENTO_TELNUMERO }, 'secretKey');
                    
                    // Mostrar token
                    console.log(token);
                    return res.status(200).json({
                        ...results[0],
                        token,
                        androidID: results[0].PERFIL_ANDROID // Agregar el androidID a la respuesta
                    });
                } else {
                    return res.status(401).json({ error: 'Credenciales inválidas' });
                }
            }
        } else {
            return res.status(403).json({ error: 'Este usuario está inactivo' });
        }
    });
}

// Función para obtener el Android ID por número de teléfono
async function getAndroidID(req, res, telefono) {
    const query = `
        SELECT PERFIL_ANDROID 
        FROM PERFIL_ELEMENTO 
        WHERE ELEMENTO_TELNUMERO = ?
    `;
    
    console.log('Consultando Android ID para el teléfono:', telefono);
    
    // Ejecutar la consulta con el número de teléfono
    connection.query(query, [telefono], (error, results) => {
        if (error) {
            console.error('Error al obtener el Android ID', error);
            return res.status(500).json({ error: 'Error de servidor al obtener el Android ID' });
        }

        // Comprobar si se encontró el registro
        if (results.length === 0) {
            return res.status(404).json({ error: 'Número de teléfono no encontrado' });
        }

        // Retornar el Android ID
        const androidID = results[0].PERFIL_ANDROID;
        return res.status(200).json({ androidID });
    });
}


function verifyToken(req, res, tokent) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ error: 'No se proporcionó un token' });
    }

    jwt.verify(token, 'secretKey', (err, decoded) => {
        if (err) {
            console.error('Error al verificar el token:', err);
            return res.status(401).json({ error: 'Token inválido' });
        }
        req.usuario = decoded; // Decodificado y disponible en las solicitudes
        next();
    });
}


async function getInfoPerfilApp(req, res, TelNum) {
    const getInfoQuery = `
        SELECT 
            pe.PERFIL_ID,
            pe.PERFIL_NOMBRE,
            pe.PERFIL_CLAVE,
            pe.PERFIL_ANDROID,
            e.ELEMENTO_ID,
            e.ELEMENTO_FEC,
            e.ELEMENTO_ACTIVO,
            e.ELEMENTO_NUMERO,
            e.ELEMENTO_NOMBRE,
            e.ELEMENTO_PATERNO,
            e.ELEMENTO_MATERNO,
            e.ELEMENTO_SEXO,
            e.ELEMENTO_DIRECCION,
            e.ELEMENTO_CORREO,
            e.ELEMENTO_CUIP,
            e.ELEMENTO_QR,
            e.ELEMENTO_TELEMEI,
            e.ELEMENTO_TELMARCA,
            e.ELEMENTO_BOTON,
            e.ESTELEMEN_ID,
            e.REGION_ID,
            e.DIVISION_ID,
            e.CARGO_ID,
            e.BASE_ID,
            e.TURNO_ID,
            e.ELEMENTO_ULTIMALOCAL,
            e.ELEMENTO_LATITUD,
            e.ELEMENTO_LONGITUD,
            e.ELEMENTO_RUTA
        FROM PERFIL_ELEMENTO pe
        LEFT JOIN ELEMENTO e ON pe.ELEMENTO_TELNUMERO = e.ELEMENTO_TELNUMERO
        WHERE pe.ELEMENTO_TELNUMERO = ?
    `;

    connection.query(getInfoQuery, [TelNum], (error, results) => {
        if (error) {
            console.error('Error al obtener información del perfil', error);
            return res.status(500).json({ error: 'Error de servidor al obtener información del perfil' });
        }

        if (results.length > 0) {
            res.status(200).json(results[0]);
        } else {
            res.status(404).json({ error: 'No se encontró información del perfil para el número de teléfono proporcionado' });
        }
    });
}

function updatePerfilElemento(req, res, password, elemento_Numero) {
    console.log('Actualizando información de perfil para el elemento:', elemento_Numero);
    console.log('Nueva contraseña:', password);

    const hashedPassword = hashFunction(password);
    console.log('Clave hasheada:', hashedPassword);

    const query = `
        UPDATE PERFIL_ELEMENTO 
        SET 
            PERFIL_CLAVE = ?  
        WHERE 
            ELEMENTO_NUMERO = ?
    `;

    connection.query(query, [
        hashedPassword,
        elemento_Numero
    ], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            console.log(`Información actualizada de perfil: ${elemento_Numero} + ${hashedPassword}`);
            res.status(200).send('Información actualizada');
        }
    });
}


async function getNotifications(req, res, numero_Elemento) {
    const getBoletinesQuery = `
        SELECT 
            COUNT(*) AS total
        FROM 
            ALER_ELEMENTO 
        WHERE 
            ALELEM_CONFIRM = 0 AND ALELEM_ENVIO = 1 AND
            ELEMENTO_NUMERO = ?;
    `;

    const getConsignasQuery = `
        SELECT 
            COUNT(*) AS total
        FROM 
            CONSIGNA_ELEMENTO 
        WHERE 
            CATELEM_CONFIRM = 0 AND CATELEM_ENVIO = 1 AND
            ELEMENTO_NUMERO = ?;
    `;

    connection.query(getBoletinesQuery, [numero_Elemento], (error, boletinesResults) => {
        if (error) {
            console.error('Error al obtener las notificaciones de boletinaje', error);
            return res.status(500).json({ error: 'Error de servidor al obtener las notificaciones de boletinaje' });
        }

        connection.query(getConsignasQuery, [numero_Elemento], (error, consignasResults) => {
            if (error) {
                console.error('Error al obtener las consignas', error);
                return res.status(500).json({ error: 'Error de servidor al obtener las consignas' });
            }

            res.status(200).json({
                Boletines: boletinesResults[0].total,
                Consignas: consignasResults[0].total
            });
        });
    });
}


function updateNombrePerfilElemento(req, res, nombre, elemento_Numero) {
    console.log('Actualizando nombre de perfil para el elemento:', elemento_Numero);
    console.log('Nuevo nombre:', nombre);

    const query = `
        UPDATE PERFIL_ELEMENTO 
        SET 
            PERFIL_NOMBRE = ?  
        WHERE 
            ELEMENTO_NUMERO = ?
    `;

    connection.query(query, [
        nombre,
        elemento_Numero
    ], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            console.log(`Nombre de perfil actualizado: ${elemento_Numero} - ${nombre}`);
            res.status(200).send('Nombre de perfil actualizado');
        }
    });
}


async function getInfoNombre(req, res, TelNum) {
    const getNameQuery = `
        SELECT 
            CONCAT(e.ELEMENTO_NOMBRE, ' ', e.ELEMENTO_PATERNO) AS nombreCompleto
        FROM ELEMENTO e
        WHERE e.ELEMENTO_TELNUMERO = ?
    `;

    connection.query(getNameQuery, [TelNum], (error, results) => {
        if (error) {
            console.error('Error al obtener el nombre y apellido del elemento', error);
            return res.status(500).json({ error: 'Error de servidor al obtener información del nombre' });
        }

        if (results.length > 0) {
            res.status(200).json({ nombreCompleto: results[0].nombreCompleto });
        } else {
            res.status(404).json({ error: 'No se encontró información del nombre para el número de teléfono proporcionado' });
        }
    });
}


module.exports = {
    addUserPersonal, loginUser, updatePerfilElemento, getInformationPerfil, getInfoPerfilApp, getNotifications, verifyToken, ValidarRegistro,
    updateNombrePerfilElemento, getInfoNombre, getAndroidID
};
