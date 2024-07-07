const connection = require('../../SQL_CONECTION');
const { v4: uuidv4 } = require('uuid');

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
async function getInformationPerfil(req, res, TelNum){
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
async function loginUser(req, res, telefono, clave) {
    const loginScript = `
        SELECT * 
        FROM PERFIL_ELEMENTO 
        JOIN ELEMENTO ON PERFIL_ELEMENTO.ELEMENTO_NUMERO = ELEMENTO.ELEMENTO_NUMERO
        WHERE PERFIL_ELEMENTO.ELEMENTO_TELNUMERO = ? 
        AND ELEMENTO.ELEMENTO_ACTIVO = 1
    `;

    // Ejecutar la consulta para buscar el usuario por número de teléfono y clave
    connection.query(loginScript, [telefono], async (error, results) => {
        if (error) {
            console.error('Error al realizar el inicio de sesión', error);
            return res.status(500).json({ error: 'Error de servidor al realizar el inicio de sesión' });
        }

        // Verificar si se encontró un usuario con las credenciales proporcionadas y está activo
        if (results.length === 1) {
            console.log('data:', results[0]);
            const isPasswordMatch = await comparePasswords(clave, results[0].PERFIL_CLAVE);
            if (isPasswordMatch) {
                res.status(200).json(results[0]);
            } else {
                console.log('Clave incorrecta');
                res.status(401).json({ error: 'Credenciales inválidas' });
            }
            console.log('Inicio de sesión exitoso del usuario:', results[0]);
        } else {
            console.log('Credenciales inválidas o usuario inactivo');
            res.status(403).json({ error: 'Credenciales inválidas o usuario inactivo' });
        }
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

function updatePerfilElemento(req, res, data, id) {
    const query = `
        UPDATE PERFIL_ELEMENTO 
        SET 
            PERFIL_NOMBRE = ?, 
            PERFIL_CLAVE = ?, 
            ELEMENTO_NUMERO = ?, 
            ELEMENTO_TELNUMERO = ? 
        WHERE 
        ELEMENTO_TELNUMERO = ?
    `;

    connection.query(query, [
        data.PERFIL_NOMBRE,
        data.PERFIL_CLAVE,
        data.PERFIL_ANDROID,
        data.ELEMENTO_NUMERO,
        data.ELEMENTO_TELNUMERO,
        id
    ], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            console.log(`Información actualizada de perfil: ${data.PERFIL_ID}`);
            res.json(results);
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
            ALELEM_CONFIRM = 0 AND 
            ELEMENTO_NUMERO = ?;
    `;

    const getConsignasQuery = `
        SELECT 
            COUNT(*) AS total
        FROM 
            CONSIGNA_ELEMENTO 
        WHERE 
            CATELEM_CONFIRM = 0 AND 
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



module.exports = {
    addUserPersonal, loginUser, updatePerfilElemento, getInformationPerfil, getInfoPerfilApp, getNotifications
};
