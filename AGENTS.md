# BikeMap
This project is a web application running in docker locally with a PHP Laravel API and a Vue.js frontend.

## General Overview
- The root directory contains the docker-compose.yml file with the follwing services
  - nginx-proxy-2026: handles routing requests to the proper container
  - backend-2026: the nginx container for the Laravel API
  - phpfpm85-2026: PHP 8.5 fpm container
  - phpfpm85-2026-command: PHP 8.5 for running docker commands, there is no xdebug to avoid errors
  - mariadb-2026: MariaDB database container
- Do not use the local PHP install for any commands, all commands should be run in the phpfpm85-2026 docker container

- Project Structure
  - ./backend contains the Laravel API code
  - ./frontend contains the Vue.js frontend code
  - ./docker contains the docker files for the project

## General Procedures
  - For coding tasks, use folder specific AGENTS.md files for additional instructions
  - For PHP coding tasks in backend, run tests in the phpfpm85-2026-command docker container by running `docker exec -it phpfpm85-2026-command {SOME_COMMAND}` replacing {SOME_COMMAND} with what needs to be run
    - Example: `docker exec -it phpfpm85-2026-command php artisan migrate`
## Verification
  - For PHP coding tasks in backend, run tests in the phpfpm85-2026-command docker container by running `docker exec -it phpfpm85-2026-command php artisan test`