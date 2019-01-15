# WhereToEat
Built a cross platform mobile app that displays the nearest restaurants to the user's location, as well as being able to filter them by establishment type, category or cuisines. In addition, users can modify location and maximum miles radius.
- Consumes data from an API listing more than 1.5 million restaurants across 10,000 cities globally. 
- Uses the Google Maps API to display markers for the nearby restaurants. 
- **Technologies Used:** Zomato API, Google Maps API, Apache Cordova,  HTML5, Javascript, CSS3, Git.

## How to run on different platforms
1. Install Cordova through npm
2. Execute the command : **cordova create whereToEat com.yourname.whereToEat WhereToEat**
3. Download the www folder and use it replace the one on the whereToEat folder
4. Execute command: **cordova platform add (desired-platform)** Ex: cordova platform add browser
5. Execute command: **cordova run (desired-platform)** Ex: cordova run browser
