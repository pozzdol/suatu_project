# ===========================================
# Stage 1: Build stage (install dependencies)
# ===========================================
FROM composer:2 AS composer-build

WORKDIR /app

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Install dependencies without dev packages
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --no-interaction

# Copy application code
COPY . .

# Generate optimized autoloader
RUN composer dump-autoload --optimize --no-dev

# ===========================================
# Stage 2: Production image
# ===========================================
FROM php:8.2-fpm-alpine

# Set working directory
WORKDIR /var/www/html

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    libpng \
    libzip \
    icu \
    oniguruma \
    # Temporary build dependencies
    && apk add --no-cache --virtual .build-deps \
    libpng-dev \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    # Install PHP extensions
    && docker-php-ext-configure intl \
    && docker-php-ext-install -j$(nproc) \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    intl \
    opcache \
    # Remove build dependencies
    && apk del .build-deps \
    # Clean up
    && rm -rf /var/cache/apk/*

# Copy PHP configuration
COPY docker/php.ini /usr/local/etc/php/conf.d/99-custom.ini
COPY docker/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/www.conf

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Copy supervisor configuration
COPY docker/supervisord.conf /etc/supervisor.d/app.ini

# Copy application from build stage
COPY --from=composer-build /app /var/www/html

# Create required directories
RUN mkdir -p /var/www/html/storage/logs \
    /var/www/html/storage/framework/cache \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/bootstrap/cache \
    /var/log/supervisor \
    /run/nginx

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Create entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1

# Expose port
EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["supervisord", "-n", "-c", "/etc/supervisord.conf"]
