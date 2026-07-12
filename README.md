# ShowMyRides

ShowMyRides is a local-first cycling ride journal and mapping application. It pairs a Laravel API with a Vue frontend so rides can be uploaded, organized by location, viewed on maps, and compared as route overlays.

## Technologies

- Docker Compose for the local development stack.
- Nginx reverse proxy and API web server containers.
- PHP 8.5 with Laravel 13 for the backend API.
- Laravel Fortify and Sanctum for session-based authentication.
- MariaDB for application storage.
- `sportlog/fit` for extracting ride data from Garmin/FIT activity files.
- Vue 3, TypeScript, Vite, Pinia, and Vue Router for the frontend.
- Leaflet for interactive route maps.
- Vitest and Vue Test Utils for frontend unit tests.
- Playwright for frontend end-to-end testing.
- PHPUnit for backend feature and unit tests.

## Features

- Register, log in, and manage authenticated sessions.
- Upload cycling rides from `.fit` files.
- Attach optional ride images and generate image sizes for display.
- Store ride metrics such as date, distance, total time, moving time, average speed, max speed, and route coordinates.
- Create and manage user-owned ride locations.
- Browse rides with pagination and filters for location and date ranges.
- View ride details with metrics, images, and an interactive route map.
- Edit ride names and descriptions.
- Delete rides and their stored FIT/image files.
- Overlay multiple rides from a single selected location for route comparison.
- Adjust route color, opacity, and visibility controls on ride maps.
- Use OpenStreetMap for normal outdoor locations.
- Use image maps for Zwift Watopia and Makuri Islands rides, including route overlays plotted directly from GPS coordinates.

## ZwiftMap Attribution

ShowMyRides' Zwift mapping support is inspired by and uses code/data ideas from [andipaetzold/zwiftmap](https://github.com/andipaetzold/zwiftmap).

The Watopia and Makuri Islands map images and map configuration values were adapted from that project, including the local raster map assets and the Zwift world bounds used to place each image in Leaflet. The route points are not transformed by ShowMyRides; Zwift rides are drawn directly onto georeferenced image overlays.

Third-party license notices are maintained in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## License

ShowMyRides is licensed under the [MIT License](LICENSE). Third-party software, data, and asset notices are documented separately in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Local Development

Run the application with Docker Compose from the project root:

```sh
docker compose up
```

Backend Laravel commands should be run in the PHP command container:

```sh
docker exec phpfpm85-2026-command php artisan test
```

Frontend commands run from `frontend/` with Node 26:

```sh
npm run type-check
npm run test:unit -- --run
```
