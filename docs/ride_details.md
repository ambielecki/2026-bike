# Ride Details
This view will display the details of a ride and a map showing the location and the route of the ride.

## Details
- Page should show the name of the ride as a title
- Below the title will be two columns on desktop (one on mobile) 
  - On desktop, the left column will show the map with the location and route of the ride, the right will have the ride details (description, date, time, total_time, moving time, speed average and max, distance, etc.)
  - Mobile will be a single column with the map on top and the ride details below
- Use leaflet for the map and openstreetmap for the tiles
- The map should be responsive and zoomable
- The map should have a marker for the start and end of the ride (assume the first and last points of the route)
- The map should be in a reusable component that can handle multiple routes
- The route line should be a different color than the markers
- The color of the route line should be selectable with a color picker associated with the route - later there will be multiple route overlays 
- The opacity of the route lines should be selectable, but all routes should have the same opacity
- Routes should be able to be added and removed dynamically
