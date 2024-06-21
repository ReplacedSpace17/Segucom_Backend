const express = require('express');
const connection = require('./SQL_CONECTION');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const nodemailer = require('nodemailer');
const session = require('express-session');
const multer = require('multer');
const { expressCspHeader, INLINE, NONE, SELF } = require('express-csp-header');
const path = require('path');
const app = express();
const port = 3000;

// Configura CORS
const corsOptions = {
  origin: ['https://segucom.mx', 'http://localhost:3001', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: '20mb' }));
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Configura la carpeta public para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'tu_secreto',
  resave: false,
  saveUninitialized: true
}));

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
    cb(null, Date.now() + path.extname(file.originalname)); // Asigna un nombre único al archivo
  }
});

const uploadBoletines = multer({ storage: storage('boletines') });
const uploadConsignas = multer({ storage: storage('consignas') });


//-------------------------------------------------------------> IMPORTS DE FUNCTION SEGUCOM
const { addUserPersonal, loginUser, updatePerfilElemento, getInformationPerfil, getInfoPerfilApp } = require('./Functions/Register/Module_Register');

//-------------------------------------------------------------> IMPORTS DE FUNCTION MAPS
const { getGeocercas , getGeocercasID} = require('./Functions/Maps/Function_region');
const { LocalizarElemento, UpdateUbicacion, LocalizarTodosElemento} = require('./Functions/Maps/Function_elemento');
const {getPuntosVigilancia, getElementosAsignados, getPuntosVigilanciaByID} = require('./Functions/Maps/FunctionPuntoVigilancia');
const { Console } = require('console');

const { addImagePath, getImages} = require('./Functions/Images/Module_Images');
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

//get informaciomde usuario
//localhost:3000/segucom/api/user/personal/4791039947
app.get('/segucom/api/user/personal/:id', async (req, res) => {
  const telefono = req.params.id;
  await getInformationPerfil(req, res, telefono);
});
//localhost:3000/segucom/api/user/personal/4791039947
app.get('/segucom/api/user/personal/app/:id', async (req, res) => {
  const telefono = req.params.id;
  await getInfoPerfilApp(req, res, telefono);
});

//-------------------------------------------------------------> Endpoints Mapas
// Obtener el perímetro de geocercas
app.get('/segucom/api/maps/geocercas', async (req, res) => {
  await getGeocercas(req, res);
});

// Obtener geocercas por id
app.get('/segucom/api/maps/geocercas/:id', async (req, res) => {
  const id = req.params.id;
  await getGeocercasID(req, res, id);
});

// Localizar un elemento
app.get('/segucom/api/maps/elemento/:id', async (req, res) => {
  const id = req.params.id;
  await LocalizarElemento(req, res, id);
});

// Obtener todos los elementos
app.get('/segucom/api/maps/elementos/all', async (req, res) => {
  await LocalizarTodosElemento(req, res);
});

// Actualizar ubicación de un elemento
app.put('/segucom/api/maps/elemento/:id', async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  await UpdateUbicacion(req, res, data, id);
});

// Obtener los puntos de vigilancia
app.get('/segucom/api/maps/puntosvigilancia', async (req, res) => {
  await getPuntosVigilancia(req, res);
});

// Obtener los elementos asignados a un punto de vigilancia
app.get('/segucom/api/maps/puntosvigilancia/elementos/:id', async (req, res) => {
  const puntoID = req.params.id;
  await getElementosAsignados(req, res, puntoID);
});

// Obtener punto de vigilancia por id
app.get('/segucom/api/maps/puntosvigilancia/:id', async (req, res) => {
  const id = req.params.id;
  await getPuntosVigilanciaByID(req, res, id);
});

//-------------------------------------------------------------> Rutas de mapas

// Ruta para servir la página de mapas
app.get('/maps/elemento', (req, res) => {
  res.sendFile(path.join(__dirname, 'maps', 'mapaElemento.html'));
});
// Ruta para servir la página de mapas
app.get('/maps/geocercas', (req, res) => {
  res.sendFile(path.join(__dirname, 'maps', 'mapaRegiones.html'));
});
// Ruta para servir la página de mapas
app.get('/maps/elementos/geocerca', (req, res) => {
  res.sendFile(path.join(__dirname, 'maps', 'mapaElementoRegion.html'));
});
// Ruta para servir la página de mapas
app.get('/maps/vigilancia/punto', (req, res) => {
  res.sendFile(path.join(__dirname, 'maps', 'mapaPuntoVigilancia.html'));
});

//-------------------------------------------------------------> Rutas de fotos

app.post('/segucom/api/upload/boletines/:id', uploadBoletines.single('file'), async (req, res) => {
  console.log('Subiendo imagen a boletines');
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



app.post('/segucom/api/upload/consignas/:id', uploadConsignas.single('file'), async (req, res) => {
  console.log('Subiendo imagen a consignas');
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


// Endpoint para obtener una imagen según el ID y categoría
// Endpoint para obtener imágenes según el ID y categoría
app.get('/segucom/api/images/:id/:category', async (req, res) => {
  console.log('Obteniendo imágenes');
  const connection = require('./SQL_CONECTION');
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

// Ruta de ejemplo
app.get('/test', (req, res) => {
  res.send('¡Hola, mundo!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});

/* Mapas:
http://localhost:3000/maps/elemento?elementoId=80000
http://localhost:3000/maps/geocercas?regionId=31
http://localhost:3000/maps/elementos/geocerca?regionId=29
http://localhost:3000/maps/vigilancia/punto?puntoId=3
*/
