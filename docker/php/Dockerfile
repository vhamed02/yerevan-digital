# Base images are digest-pinned: unpinned tags re-resolve from the registry on
# every build, and any upstream release silently busts the whole layer cache.
# To upgrade: change the digest deliberately, expect one slow rebuild.
FROM php:8.5-fpm-alpine@sha256:cb4a96fe4ee2888dc2fc5383b72de4a9be045fa8252b33f441ef3435fd22b465

COPY --from=mlocati/php-extension-installer@sha256:24b0e392309d7085c05b3dc2429bf1c0d934b7d07ded31d212367405e4554a84 /usr/bin/install-php-extensions /usr/bin/

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
