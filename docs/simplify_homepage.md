# Remove Homepage Customization
The ability to edit the homepage is causing content flicker, simplify

## Tasks
- Remove the ability to edit hero content in admin and remove those fields from the database
  - This removes the ability to edit site name, headline, and intro
- Set site name as "ShowMyRides"
- Set headline as "Track every route and see where you have been"
- Set intro as "Keep a clean record of the trails you ride, remember the lines you liked, and build a personal map of every loop, climb, and descent. Even track rides from Zwift in Watopia or Makuri Islands."
- These should be hardcoded on the front page to reduce first render speed
- Keep the ability to edit the image carousel, but lazy load images with default blank image
- Keep the ability to create and edit highlights, but do not have a placeholder and do not showw highlights until content loads
