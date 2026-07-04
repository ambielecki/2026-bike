# Add Ride
This document describes the process of adding a ride to the application, including backend models and schema

## Schema
Users can create locations and then rides in those locations. Locations are associated with users and rides are associated with users and locations

- Table locations
  - Standard Laravel id, created_at, updated_at
  - name: string
  - user_id bigint unsigned foreign key references users(id)
  - latitude: decimal (8,6)
  - longitude: decimal (9,6)
- Table rides
  - Standard Laravel id, created_at, updated_at
  - name: string
  - description: text nullable
  - user_id bigint unsigned foreign key references users(id)
  - location_id bigint unsigned foreign key references locations(id)
  - datetime: datetime 
  - route_data: json
  - distance: decimal (10,2)
  - duration: decimal (10,2)
  - average_speed: decimal (10,2)
  - max_speed: decimal (10,2)
- Table images
  - ride_id bigint unsigned foreign key references rides(id)
  - user_id bigint unsigned foreign key references users(id)
  - name: string
  - description: string nullable
  - has_sizes: boolean

A user will add a ride through the frontend via a form to collect
- name: required
- description: optional
- location_id: selected from the user's existing locations or ability to create new via a modal
  - modal for new location requires name, latitude, longitude
  - after successful save go back to ride page and reload locations
- file selector for fit file (required)
- file selector for image (optional upload)

Upload via multipart/form-data

Basic data will be saved to rides table

Backend will trigger an async job to process fit file to extract additional data and add to record and then discard the fit file
Backend will save image to storage and trigger an async job to create additional appropriate image sizes and store them in storage appropriate for desktop, thumbnail and other uses
Image paths will be saved to images table using the same name in multiple folders for each size (small, medium, large)