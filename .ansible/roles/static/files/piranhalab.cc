server {
	root /var/www/html/piranhalab.cc;

	index index.html index.htm index.nginx-debian.html;

	gzip on;
	gzip_disable "msie6";

	gzip_vary on;
	gzip_proxied any;
	gzip_comp_level 6;
	gzip_buffers 16 8k;
	gzip_http_version 1.1;
	gzip_min_length 256;
	gzip_types
		application/atom+xml
		application/geo+json
		application/javascript
		application/x-javascript
		application/json
		application/ld+json
		application/manifest+json
		application/rdf+xml
		application/rss+xml
		application/xhtml+xml
		application/xml
		font/eot
		font/otf
		font/ttf
		image/svg+xml
		text/css
		text/javascript
		text/plain
		text/xml;

        server_name piranhalab.cc www.piranhalab.cc;

	access_log /var/log/nginx/piranhalab.cc.access.log;
	error_log /var/log/nginx/piranhalab.cc.error.log;

	location ~ /(.*){
		alias /var/www/html/piranhalab.cc/$1;
		index index.html;
	}

	listen 443 ssl; # managed by Certbot
	ssl_certificate /etc/letsencrypt/live/piranhalab.cc/fullchain.pem; # managed by Certbot
	ssl_certificate_key /etc/letsencrypt/live/piranhalab.cc/privkey.pem; # managed by Certbot
	include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
	ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
	if ($host = piranhalab.cc) {
		return 301 https://$host$request_uri;
	} # managed by Certbot

	if ($host = www.piranhalab.cc) {
		return 301 https://$host$request_uri;
	} # managed by Certbot


	server_name piranhalab.cc www.piranhalab.cc;
	listen 80;
	return 404; # managed by Certbot
}
