# BikeMap API
This is a PHP 8.5 Laravel 13 API 

## General Overview
- Do not use the local PHP install for any commands, all commands should be run in the phpfpm85-2026 docker container
- The application will use Laravel Fortify for basic authentication and Laravel Sanctum to manage sessions with the frontend

## General Procedures
- For coding tasks, use folder specific AGENTS.md files for additional instructions
- For PHP coding tasks in backend, run tests in the phpfpm85-2026-command docker container by running `docker exec -it phpfpm85-2026-command {SOME_COMMAND}` replacing {SOME_COMMAND} with what needs to be run
    - Example: `docker exec -it phpfpm85-2026-command php artisan migrate`
    - Use Laravel Artisan commands when possible to run migrations, create new migrations, tests, and other files 
    - Create new unit tests and integration tests as needed

## Verification
- Run tests in the phpfpm85-2026-command docker container by running `docker exec -it phpfpm85-2026-command php artisan test`
