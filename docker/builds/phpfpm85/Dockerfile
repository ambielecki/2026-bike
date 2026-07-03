FROM php:8.5.7-fpm

RUN apt-get update && \
    apt-get upgrade -y

RUN apt-get install -y --force-yes \
    git \
    gnupg \
    libgd-dev \
    libxml2-dev \
    libzip-dev \
    nano \
    unzip \
    vim \
    zip \
    zlib1g-dev

RUN pecl install mongodb xdebug

RUN docker-php-ext-install \
    pdo \
    pdo_mysql \
    soap \
    zip \
    && docker-php-ext-enable mongodb xdebug

RUN docker-php-ext-configure gd --with-freetype --with-jpeg &&  \
    docker-php-ext-install gd

# Install latest node and npm (node 16)
RUN  apt-get update -yq \
    && curl -sL https://deb.nodesource.com/setup_26.x | bash \
    && apt-get install nodejs -yq

# Install composer
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN curl -sS https://getcomposer.org/installer | php && \
    mv composer.phar /usr/local/bin/composer && \
    printf "\nPATH=\"~/.composer/vendor/bin:\$PATH\"\n" | tee -a ~/.bashrc

RUN composer global require laravel/installer

RUN curl -L https://cs.symfony.com/download/php-cs-fixer-v3.phar -o php-cs-fixer && \
    chmod a+x php-cs-fixer && \
    mv php-cs-fixer /usr/local/bin/php-cs-fixer

COPY ./xdebug.ini /usr/local/etc/php/conf.d/xdebug.ini

COPY ./ssh-keys /root/.ssh
RUN chmod 600 /root/.ssh/id_rsa