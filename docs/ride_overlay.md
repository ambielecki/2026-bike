# Ride Overlay
Adds a new view that is a combination of the ride list view and the map view. This view will contain a condensed 
version of the list, no thumbnail image, only the ride name, date, distance, and location

The view will also show a map with the ability to add multiple routes.

Make necessary frontend and backend changes and any changes to the map component necessary for reuse

The view is only accessible to logged in users

## Details
- Add a new section to both the top and mobile navs with a route, titled Ride Overlay
- The view will be split into two columns on desktop, the left will have the map, controls for opacity for all routes and a color picker
to set the color for all routes as an override. Only the user's own routes can be seen or added
- The right will have the condensed ride list, with the ability to filter by date (start and end), and location. The list will show all matching rides limitted to 50 with load more ability. If selected to add to
the map, fetch the full route details to allow plotting. Do not add start and end markers. Each route will have a separate color picker, but no opacity slider. Routes 
can be added or removed from the map. Route colors can be overridden by the main map control.
- The map should be centered either on the filtered location lat and lon or the lat and lon of the first route added
