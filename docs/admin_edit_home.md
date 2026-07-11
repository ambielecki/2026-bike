# Admin Edit Home Page
Make the home page editable by admins

## Features
- The current home page layout is static and should now be editable. The home page current displays the site name, a 
large callout section, and a smaller description on the left. On the right there is a card with a list of descriptors
- Make the sections on the left editable, replace the card on the right with an image carousel. Images will be uploaded by admins
- Remove the buttons on the left that had test functionality
- Keep the highlights section, but make it editable
- Admin area is only accessible by admins and all routes should be secured and authorized

## Implementation

- Create necessary frontend, backend, and database changes to support the editable home page
- Allow for a variable number of sections in the highlights section
- Add an alt_text field to the images table
- Create a new modal for uploading images, modal should include fields for description and alt_text
- Allow editing text areas, select images for the carousel
