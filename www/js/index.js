/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function () {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function () {
        this.receivedEvent('deviceready');
    },

    // Update DOM on a Received Event
    receivedEvent: function (id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

app.initialize();

navigator.geolocation.getCurrentPosition(onSuccess, onError, { timeout: 30000 });
var lat, lng, map, mapOptions, infoWindow, latLng;

function onSuccess(position) {
    if (position.coords) {

        lat = position.coords.latitude;
        lng = position.coords.longitude;
        console.log(lat, lng);
        //Google Maps
        var myLatlng = new google.maps.LatLng(lat, lng);
        mapOptions = { zoom: 13, center: myLatlng, mapTypeId: google.maps.MapTypeId.ROADMAP };
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    }
    request();
}

function request() {

    var request = new XMLHttpRequest();
    var key = 'cbc783e9fb1cbd2140eeb68d9e5323e7';
    console.log(lat, lng);
    https://developers.zomato.com/api/v2.1/search?count=20&lat=43.1222716&lon=-77.57340479999999&radius=25000&sort=real_distance&order=desc

    var url = 'https://developers.zomato.com/api/v2.1/search?count=20&lat=' + lat + '&' + 'lon=' + lng + '&radius=25000&sort=rating&order=desc&apikey=' + key;
    console.log(url);
    let output = "";
    request.open('GET', url, true);
    request.onload = function () {

        // Begin accessing JSON data here

        if (request.status >= 200 && request.status < 400) {
            let data = JSON.parse(this.response);
            addRestaurantCards(data.restaurants);
            addMarkers(data.restaurants);
            //document.getElementById("restaurants").innerHTML = data.restaurants[0].restaurant.name;
        } else {
            console.log('error');
        }
    }

    request.send();
}
function calculateDistance(latitude1, longitude1, latitude2, longitude2) {
    var meters = google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(latitude1, longitude1), new google.maps.LatLng(parseFloat(latitude2), parseFloat(longitude2)));
    var distance = +((meters * 0.000621371192).toFixed(2));
    return distance;
}

function addRestaurantCards(data) {

    let output = "";
    for (var i = 0; i < data.length; i++) {
        let restaurant = data[i].restaurant;
        let distance = calculateDistance(lat, lng, restaurant.location.latitude, restaurant.location.longitude);
        output += "<div class='card-action'>" + restaurant.name + distance + "</div>";
    }
    document.getElementById("restaurants").innerHTML = output;
}
function addMarkers(data) {
    for (var i = 0; i < data.length; i++) {
        var res = data[i].restaurant;
        latLng = new google.maps.LatLng(res.location.latitude, res.location.longitude);
        //map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions),
        addMarker(res);
    }
}

function addMarker(data) {
    var marker = new google.maps.Marker({
        position: latLng,
        map: map,
        title: data.name
    });
    (function (marker, data) {
        google.maps.event.addListener(marker, "click", function (e) {
            infoWindow = new google.maps.InfoWindow;
            bindInfoWindow(marker, map, infoWindow, data.name);
        });
    })(marker, data, infoWindow);
}

function bindInfoWindow(marker, map, infowindow, data) {
    marker.addListener('click', function () {
        infowindow.setContent(data);
        infowindow.open(map, this);
    });
}

function onError(error) {
    alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
}

google.maps.event.addDomListener(window, 'load', onSuccess);