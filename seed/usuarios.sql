
CREATE USER 'API_User'@'%' IDENTIFIED BY 'VJQy9lCOUWsB3wZ';

-- Conceder todos los privilegios en la base de datos SegucomDB a API_User
GRANT ALL PRIVILEGES ON segucomm_db.* TO 'API_User'@'%';

-- Aplicar los cambios
FLUSH PRIVILEGES;