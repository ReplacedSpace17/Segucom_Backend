sudo apt update
sudo apt upgrade

sudo apt install nginx
sudo mkdir -p /etc/nginx/ssl

#copiar los certificados
sudo cp /home/rs17/GitHub/Segucom/BackendFESPE/certificates/PrivateKey.pem /etc/nginx/ssl/
sudo cp /home/rs17/GitHub/Segucom/BackendFESPE/certificates/segubackend.com_2024.crt /etc/nginx/ssl/

#crear el archivo de configuracion
sudo nano /etc/nginx/sites-available/segubackend

#copiar el contenido del archivo de configuracion
server {
    listen 443 ssl;
    server_name segubackend.com;

    ssl_certificate /etc/nginx/ssl/segubackend.com_2024.crt;
    ssl_certificate_key /etc/nginx/ssl/PrivateKey.pem;

    location /app1/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /app2/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name segubackend.com;
    return 301 https://$host$request_uri;
}



#crear un enlace simbolico
sudo ln -s /etc/nginx/sites-available/segubackend /etc/nginx/sites-enabled/
sudo nginx -t

#reiniciar el servicio
sudo systemctl enable nginx
sudo systemctl restart nginx


#validar que el servicio este corriendo
https://segubackend.com/app1/