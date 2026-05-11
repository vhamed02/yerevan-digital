FROM php:8.5-fpm-alpine

COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/bin/

RUN install-php-extensions \
        pdo_mysql \
        gd \
        zip \
        bcmath \
        intl \
        opcache \
        exif \
        redis \
        mongodb

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY docker/php/php.ini /usr/local/etc/php/conf.d/vendora.ini
COPY docker/php/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /var/www/html

# In production the source is baked in; in dev a bind-mount overrides this layer.
COPY services/api .
RUN composer install --no-dev --optimize-autoloader --no-interaction

EXPOSE 9000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["php-fpm"]
