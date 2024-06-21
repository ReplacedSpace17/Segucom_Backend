
CREATE TABLE IMAGES (
    ID_registro INT PRIMARY KEY,
    categoria VARCHAR(255) NOT NULL,
    descripcion TEXT,
    ruta VARCHAR(255) NOT NULL
);


CREATE USER 'API_User'@'%' IDENTIFIED BY 'VJQy9lCOUWsB3wZ';

-- Conceder todos los privilegios en la base de datos SegucomDB a API_User
GRANT ALL PRIVILEGES ON segucomm_db.* TO 'API_User'@'%';

-- Aplicar los cambios
FLUSH PRIVILEGES;