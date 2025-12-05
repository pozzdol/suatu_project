#!/bin/sh
set -e

echo "Starting application setup..."

# Wait for database if needed
if [ -n "$DB_HOST" ]; then
    echo "Waiting for database connection..."
    max_tries=30
    counter=0
    until php -r "new PDO('mysql:host=$DB_HOST;port=${DB_PORT:-3306}', '$DB_USERNAME', '$DB_PASSWORD');" 2>/dev/null; do
        counter=$((counter + 1))
        if [ $counter -gt $max_tries ]; then
            echo "Error: Database connection failed after $max_tries attempts"
            exit 1
        fi
        echo "Waiting for database... ($counter/$max_tries)"
        sleep 2
    done
    echo "Database connection established!"
fi

# Ensure storage directories exist and have proper permissions
echo "Setting up storage directories..."
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/storage/framework/cache/data
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/bootstrap/cache

chown -R www-data:www-data /var/www/html/storage
chown -R www-data:www-data /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage
chmod -R 775 /var/www/html/bootstrap/cache

# Generate app key if not set
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
    echo "Generating application key..."
    php artisan key:generate --force
fi

# Cache configuration for production
if [ "$APP_ENV" = "production" ]; then
    echo "Caching configuration for production..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

# Run migrations if AUTO_MIGRATE is set
if [ "$AUTO_MIGRATE" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force
fi

# Create storage link if not exists
if [ ! -L /var/www/html/public/storage ]; then
    echo "Creating storage link..."
    php artisan storage:link
fi

echo "Application setup complete!"

# Execute CMD
exec "$@"
