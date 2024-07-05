const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const connection = require('./SQL_CONECTION');
const cors = require('cors');
const bodyParser = require('body-parser');
const { expressCspHeader, INLINE, NONE, SELF } = require('express-csp-header');
const session = require('express-session');
const multer = require('multer');
const nodemailer = require('nodemailer');
const http = require('http');
const app = express();
const port = 3000;

// Configuración de CORS
const corsOptions = {
  origin: ['https://segucom.mx', 'http://localhost:3001', 'http://localhost:5500', 'http://127.0.0.1:5500', '*', 'http://192.168.1.68/', 'http://localhost:3000'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: false }));

// Configuración de archivos estáticos
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de session
app.use(session({
  secret: 'tu_secreto',
  resave: false,
  saveUninitialized: true
}));

// Configuración de encabezados CSP
app.use(expressCspHeader({ 
    policies: { 
        'default-src': [expressCspHeader.NONE], 
        'img-src': [expressCspHeader.SELF], 
        'script-src': [expressCspHeader.SELF],
        'style-src': [expressCspHeader.SELF],
        'object-src': [expressCspHeader.NONE],
        'frame-src': [expressCspHeader.NONE],
        'base-uri': [expressCspHeader.NONE],
        'form-action': [expressCspHeader.NONE],
        'frame-ancestors': [expressCspHeader.NONE],
        'manifest-src': [expressCspHeader.NONE],
        'media-src': [expressCspHeader.NONE],
        'worker-src': [expressCspHeader.NONE]
    } 
}));

// Función para asegurarse de que la carpeta existe
const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configuración de Multer para subida de archivos
const storage = (folder) => multer.diskStorage({
  destination: function (req, file, cb) {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const uploadDir = path.join(__dirname, 'uploads', folder, year.toString(), month);

    ensureDirExists(uploadDir);

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const uploadBoletines = multer({ storage: storage('boletines') });
const uploadConsignas = multer({ storage: storage('consignas') });

//-------------------------------------------------------------> IMPORTS DE FUNCTION SEGUCOM
const { addUserPersonal, loginUser, updatePerfilElemento, getInformationPerfil, getInfoPerfilApp } = require('./Functions/Register/Module_Register');

//-------------------------------------------------------------> IMPORTS DE FUNCTION MAPS
const { getGeocercas , getGeocercasID} = require('./Functions/Maps/Function_region');
const { LocalizarElemento, UpdateUbicacion, LocalizarTodosElemento, GetRastreoElemento} = require('./Functions/Maps/Function_elemento');
const {getPuntosVigilancia, getElementosAsignados, getPuntosVigilanciaByID} = require('./Functions/Maps/FunctionPuntoVigilancia');
const { Console } = require('console');

const { addImagePath, getImages} = require('./Functions/Images/Module_Images');

const { ValidarAdministrador,
  CrearEncabezado,
  ValidarElementoGrupo,
  PasarLista, GetElementosAsignados} = require('./Functions/PaseLista/Function_pase_lista');

//-------------------------------------------------------------> Endpoints App
// Agregar un nuevo usuario
app.post('/segucom/api/user', async (req, res) => {
  const data = req.body;
  await addUserPersonal(req, res, data);
});

// Iniciar sesión
app.post('/segucom/api/login', async (req, res) => {
  const { telefono, clave } = req.body;
  await loginUser(req, res, telefono, clave);
});

// Actualizar perfil de un elemento
app.put('/segucom/api/user/:id', async (req, res) => {
  const data = req.body;
  const id = req.params.id;
  await updatePerfilElemento(req, res, data, id);
});

// Obtener información de usuario por teléfono
app.get('/segucom/api/user/personal/:id', async (req, res) => {
  const telefono = req.params.id;
  await getInformationPerfil(req, res, telefono);
});

// Obtener información de usuario por teléfono para la app
app.get('/segucom/api/user/personal/app/:id', async (req, res) => {
  const telefono = req.params.id;
  await getInfoPerfilApp(req, res, telefono);
});

//-------------------------------------------------------------> Endpoints Mapas
// Obtener el perímetro de geocercas
app.get('/segucom/api/maps/geocercas', async (req, res) => {
  await getGeocercas(req, res);
});

// Obtener geocercas por ID
app.get('/segucom/api/maps/geocercas/:id', async (req, res) => {
  const id = req.params.id;
  await getGeocercasID(req, res, id);
});

// Localizar un elemento por ID
app.get('/segucom/api/maps/elemento/:id', async (req, res) => {
  const id = req.params.id;
  await LocalizarElemento(req, res, id);
});

// Obtener todos los elementos
app.get('/segucom/api/maps/elementos/all', async (req, res) => {
  await LocalizarTodosElemento(req, res);
});

// Actualizar ubicación de un elemento por ID
app.put('/segucom/api/maps/elemento/:id', async (req, res) => {
  
  const id = req.params.id;
  const data = req.body;
  await UpdateUbicacion(req, res, data, id);
});

// Obtener los puntos de vigilancia
app.get('/segucom/api/maps/puntosvigilancia', async (req, res) => {
  await getPuntosVigilancia(req, res);
});

// Obtener los elementos asignados a un punto de vigilancia por ID de punto
app.get('/segucom/api/maps/puntosvigilancia/elementos/:id', async (req, res) => {
  const puntoID = req.params.id;
  await getElementosAsignados(req, res, puntoID);
});

// Obtener punto de vigilancia por ID
app.get('/segucom/api/maps/puntosvigilancia/:id', async (req, res) => {
  const id = req.params.id;
  await getPuntosVigilanciaByID(req, res, id);
});

//Ruta para obtener el rastreo de un elemento
app.get('/segucom/api/maps/elemento/:id/rastreo', async (req, res) => {
  const id = req.params.id; //numero de elemento
  await GetRastreoElemento(req, res, id);
});

//-------------------------------------------------------------> Rutas de mapas

// Ruta para servir la página de mapas para elemento
app.get('/maps/elemento', (req, res) => {
  res.sendFile(path.join(__dirname, 'maps', 'mapaElemento.html'));
});

// Ruta para servir la página de mapas para geocercas
app.get('/maps/geocercas', (req, res) => {
  res.sendFile(path.join(__dirname, 'maps', 'mapaRegiones.html'));
});

// Ruta para servir la página de mapas para elementos en geocercas
app.get('/maps/elementos/geocerca', (req, res) => {
  res.sendFile(path.join(__dirname, 'maps', 'mapaElementoRegion.html'));
});

// Ruta para servir la página de mapas para puntos de vigilancia
app.get('/maps/vigilancia/punto', (req, res) => {
  res.sendFile(path.join(__dirname, 'maps', 'mapaPuntoVigilancia.html'));
});

// 
app.get('/maps/vigilancia/rastreo', (req, res) => {
  res.sendFile(path.join(__dirname, 'maps', 'mapaRastreo.html'));
});




//-------------------------------------------------------------> Rutas de fotos
// Ruta para enviar
app.get('/fotos/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'fotos', 'uploadImage.html'));
});
// Ruta para ver fotos
app.get('/fotos/view', (req, res) => {
  res.sendFile(path.join(__dirname, 'fotos', 'viewFotos.html'));
});

// Ruta para subir imágenes a boletines por ID
app.post('/segucom/api/upload/boletines/:id', uploadBoletines.single('file'), async (req, res) => {
  const id = req.params.id.toString(); // Asegúrate de que el ID sea una cadena
  const file = req.file;
  const description = req.body.description.toString(); // Asegúrate de que la descripción sea una cadena
  
  if (!file) {
      return res.status(400).send({ message: 'Please upload a file.' });
  }
  
  const filePath = path.relative(__dirname, file.path);
  
  try {
      await addImagePath(id, filePath, 'Boletines', description);
      console.log('(Boletines): Nueva imagen guardada: ' + filePath + ' ID: ' + id);
      res.send({ message: 'File uploaded successfully to boletines', file: filePath, description });
  } catch (error) {
      console.error('Error al subir la imagen:', error);
      res.status(500).send({ error: 'Error de servidor al agregar la imagen' });
  }
});

// Ruta para subir imágenes a consignas por ID
app.post('/segucom/api/upload/consignas/:id', uploadConsignas.single('file'), async (req, res) => {
  const id = req.params.id;
  const file = req.file;
  const description = req.body.description;
  
  if (!file) {
      return res.status(400).send({ message: 'Please upload a file.' });
  }
  
  const filePath = path.relative(__dirname, file.path);
  
  try {
      await addImagePath(id, filePath, 'Consignas', description);
      console.log('(Consignas): Nueva imagen guardada: ' + filePath + ' ID: ' + id);
      res.send({ message: 'File uploaded successfully to consignas', file: filePath, description });
  } catch (error) {
      console.error('Error al subir la imagen:', error);
      res.status(500).send({ error: 'Error de servidor al agregar la imagen' });
  }
});

// Endpoint para obtener imágenes según el ID y categoría
app.get('/segucom/api/images/:id/:category', async (req, res) => {
  const id = req.params.id;
  const category = req.params.category;

  const query = `
    SELECT * FROM IMAGES WHERE ID_registro = ? AND categoria = ?;
  `;
  
  connection.query(query, [id, category], (error, results) => {
    if (error) {
      res.status(500).send(error);
    } else if (results.length === 0) {
      res.status(404).send({ message: 'Images not found' });
    } else {
      const images = results.map(row => ({
        ID: row.ID_registro,
        categoria: row.categoria,
        descripcion: row.descripcion,
        ruta: row.ruta
      }));
      console.log('Imagenes enviadas: ', images);
      res.json(images);
    }
  });
});


//-------------------------------------------------------------> Rutas de pase de lista
// Validar administrador tiene permiso de efectuar el pase de lista
app.get('/segucom/api/pase_de_lista/validar/:numero_Elemento', async (req, res) => {
  const numero_Elemento = req.params.numero_Elemento;
  await ValidarAdministrador(req, res, numero_Elemento);
});
//http://localhost:3000/segucom/api/pase_de_lista/validar/80000


//Insertar un nuevo encabezado de pase de lista
app.post('/segucom/api/pase_de_lista/encabezado/:numero_Elemento/:id_Grupo', async (req, res) => {
  const numero_Elemento = req.params.numero_Elemento;
  const id_Grupo = req.params.id_Grupo;
  await CrearEncabezado(req, res, numero_Elemento, id_Grupo);

});
//http://localhost:3000/segucom/api/pase_de_lista/encabezado/80000/2

//verificar si el elemento pertenece al grupo que se esta realizando el pase de lista
app.get('/segucom/api/pase_de_lista/validar_elemento/:numero_Elemento/:id_Grupo/:id_Encabezado', async (req, res) => {
  const numero_Elemento = req.params.numero_Elemento;
  const id_Grupo = req.params.id_Grupo;
  const id_Encabezado = req.params.id_Encabezado;
  await ValidarElementoGrupo(req, res, numero_Elemento, id_Grupo, id_Encabezado);
});
//num elemeneto, id grupo, id encabezado
//http://localhost:3000/segucom/api/pase_de_lista/validar_elemento/80001/2/1 

//obtener la lista de elementos de un grupo
app.get('/segucom/api/pase_de_lista/elementos/:id_Grupo', async (req, res) => {
  const id_Grupo = req.params.id_Grupo;
  console.log('Obtener elementos asignados al grupo: ' + id_Grupo);
  await GetElementosAsignados(req, res, id_Grupo);

});
//http://localhost:3000/segucom/api/pase_de_lista/elementos/2




//------ayuda
// Ruta para enviar
app.get('/help', (req, res) => {
  res.sendFile(path.join(__dirname, 'help', 'index.html'));
});

// Ruta de ejemplo
app.get('/test', (req, res) => {
  res.send('¡Hola, mundo!');
});

// Ruta de inicio
app.get('/', (req, res) => {
  res.send('Backend raiz');
});

// Configuración de HTTPS
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificates', 'PrivateKey.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificates', 'segubackend.com_2024.crt'))
};

// Crear servidor HTTPS
/*
https.createServer(httpsOptions, app).listen(port, () => {
  console.log(`Servidor HTTPS corriendo en https://0.0.0.0:${port}`);
});
*/

http.createServer(app).listen(port, () => {
  console.log(`Servidor HTTP corriendo en http://0.0.0.0:${port}`);
});

//https://segubackend.com:3000/fotos/upload?endpoint=boletines&id_data=1
//https://segubackend.com:3000/fotos/view?category=Boletines&id_data=1
//https://segucom.mx/fotos/viewFotos.html?category=Boletines&id_data=1
//https://segucom.mx/fotos/uploadImage.html?endpoint=boletines&id_data=1


//http://localhost:3000/segucom/api/images/1/Boletines
//http://localhost:3000/segucom/api/images/2/Consignas


/*
CREATE TABLE IMAGES (
    ID_registro VARCHAR(50),
    categoria VARCHAR(100),
    descripcion VARCHAR(255),
    ruta VARCHAR(255)
);
 */

/* Mapas:
https://localhost:3000/maps/elemento?elementoId=80000
https://localhost:3000/maps/geocercas?regionId=31
https://localhost:3000/maps/elementos/geocerca?regionId=29
https://localhost:3000/maps/vigilancia/punto?puntoId=3

https://segubackend.com:3000/maps/elemento?elementoId=80000
https://segubackend.com:3000/maps/geocercas?regionId=31
https://segubackend.com:3000/maps/elementos/geocerca?regionId=29
https://segubackend.com:3000/maps/vigilancia/punto?puntoId=3
*/

/*
{
  "PersonalID": "843673647647",
  "ELEMENTO_LATITUD": 21.151806,
  "ELEMENTO_LONGITUD": -100.909455,
  "ELEMENTO_ULTIMALOCAL": "2024-06-22 10:15:30",
  "Hora": "10:15:30",
  "Fecha": "2024-06-22",
  "NumTel": 4791039914
}
segubackend.com:3000/segucom/api/maps/elemento/4791039914
*/
