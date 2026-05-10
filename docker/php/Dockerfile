FROM php:8.5-fpm-alpine

RUN apk add --no-cache \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        libzip-dev \
        icu-dev \
        openssl-dev \
    && apk add --no-cache --virtual .build-deps \
        autoconf g++ make linux-headers \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        gd \
        zip \
        bcmath \
        intl \
        opcache \
        exif \
    && pecl install redis mongodb \
    && docker-php-ext-enable redis mongodb \
    && apk del .build-deps \
    && rm -rf /tmp/pear /var/cache/apk/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY docker/php/php.ini /usr/local/etc/php/conf.d/vendora.ini

WORKDIR /var/www/html

EXPOSE 9000

CMD ["php-fpm"]
