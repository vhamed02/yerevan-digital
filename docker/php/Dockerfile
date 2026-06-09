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

# 1) Dependency layer — cached across deploys unless composer.json/lock change.
#    Installs vendor/ without app code or scripts, so a code-only deploy reuses
#    this layer instead of re-downloading every package.
COPY services/api/composer.json services/api/composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist \
        --no-scripts --no-autoloader

# 2) Application code — Docker rebuilds from here only when files actually change
#    (it keys the layer on their checksums), so no CACHEBUST hack is needed.
#    vendor/ is excluded via .dockerignore, so it won't clobber layer 1.
COPY services/api .

# 3) Generate the optimized autoloader now that the app is present; this also
#    runs package:discover (post-autoload-dump).
RUN composer dump-autoload --no-dev --optimize

EXPOSE 9000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["php-fpm"]
