FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    unzip \
    git \
    libicu-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libwebp-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install gd \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && docker-php-ext-install intl mysqli pdo pdo_mysql zip opcache \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Opcache optimization for smooth performance
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini \
    && echo "opcache.memory_consumption=128" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini \
    && echo "opcache.interned_strings_buffer=8" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini \
    && echo "opcache.max_accelerated_files=4000" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini \
    && echo "opcache.revalidate_freq=2" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini \
    && echo "opcache.fast_shutdown=1" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini

# Production PHP settings
RUN echo "upload_max_filesize=50M" >> /usr/local/etc/php/conf.d/production.ini \
    && echo "post_max_size=50M" >> /usr/local/etc/php/conf.d/production.ini \
    && echo "memory_limit=512M" >> /usr/local/etc/php/conf.d/production.ini \
    && echo "max_execution_time=120" >> /usr/local/etc/php/conf.d/production.ini \
    && echo "max_input_time=120" >> /usr/local/etc/php/conf.d/production.ini \
    && echo "display_errors=Off" >> /usr/local/etc/php/conf.d/production.ini \
    && echo "date.timezone=Asia/Jakarta" >> /usr/local/etc/php/conf.d/production.ini

WORKDIR /var/www/html

COPY apps/admin/ /var/www/html/

# Optimize Composer autoloader for production
RUN if [ ! -d "/var/www/html/vendor" ] || [ ! -f "/var/www/html/vendor/autoload.php" ]; then \
        composer install --no-dev --optimize-autoloader --no-interaction; \
    else \
        composer dump-autoload --optimize --no-dev; \
    fi

RUN mkdir -p /var/www/html/public/apps/assets \
    && mkdir -p /var/www/html/writable/cache/mpdf \
    && mkdir -p /var/www/html/writable/logs \
    && mkdir -p /var/www/html/writable/session \
    && mkdir -p /var/www/html/writable/uploads/public/excel \
    && mkdir -p /var/www/html/writable/uploads/public/avatars \
    && mkdir -p /var/www/html/writable/uploads/public/gallery \
    && mkdir -p /var/www/html/writable/uploads/public/lost_and_found \
    && mkdir -p /var/www/html/writable/uploads/public/assets \
    && mkdir -p /var/www/html/writable/uploads/public/projects/progress \
    && mkdir -p /var/www/html/writable/uploads/public/general \
    && mkdir -p /var/www/html/writable/uploads/private/pnbp \
    && mkdir -p /var/www/html/writable/uploads/private/signatures \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod -R 775 /var/www/html/writable

