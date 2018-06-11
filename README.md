## Prerequisites to run the app
Make sure node is installed in your machine
Make sure you are connected to internet to consume here API

## Run the application
Run npm install at my-app
Let it install all dependencies
Once all the dependency is installed run "npm start" the app will be launched autoamtically at localhost://3000

## Algorithm 
Load all the data from csv file before component is mounted.
Initiate map with center point co-ordinates.
Specify noise points for all available data extracted from the CSV file.
Specify icons for perticular type of restaurant.
Use default icons for showing the cluster.
Filter the noise points according to the checked filters.
Rerender the map with checked filters.

## Points Covered
Centered City is Munich which is shown when the app is launched.
All the restaurants are by default shown.
A filter icon is available at the top left corner to filter the restaurants on the maps.
All the restaurants are extracted from the provided CSV file using "Papa Parser".
Icons are shown for respective restaurants.
Clusters are shown with count when the user zooms in/out or pan the map.

## Technology used
React : For component Creation
Typescript : For writing the tsx file
Papa Parser : For Parsing the data from CSV file
CSS : For UI 


