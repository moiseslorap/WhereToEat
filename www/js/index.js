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
var markersArray = [];
var markersDict = {};
var contentDict = {};
var infoWindow = new google.maps.InfoWindow;
var lat, lng, map, mapOptions, latLng, cuisinesList, distance, content, address,myLatlng;
var category = "";
var cuisines = "";
var search = "";
//var cuisines
var key = 'cbc783e9fb1cbd2140eeb68d9e5323e7';

app.initialize();

navigator.geolocation.getCurrentPosition(onSuccess, onError, { timeout: 30000 });


function onSuccess(position) {
    if (position.coords) {

        lat = position.coords.latitude;
        lng = position.coords.longitude;
        console.log(lat, lng);
        //Google Maps
        myLatlng = new google.maps.LatLng(lat, lng);
        mapOptions = { zoom: 13, center: myLatlng, mapTypeId: google.maps.MapTypeId.ROADMAP };
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    }
    requestRestaurants();
    requestCategories();
    requestCuisines();
}

function requestRestaurants() {
    let request = new XMLHttpRequest();
    let url = 'https://developers.zomato.com/api/v2.1/search?' + search + '&count=20&lat=' + lat + '&' + 'lon=' + lng + category + cuisines + '&radius=25000&sort=rating&order=desc';
    request.open('GET', url, true);
    request.setRequestHeader("Accept", "application/json");
    request.setRequestHeader("X-Zomato-API-Key", key);
    request.onload = function () {

        // Begin accessing JSON data here

        if (request.status >= 200 && request.status < 400) {
            let data = JSON.parse(this.response);
            addRestaurantCards(data.restaurants);
            clearOverlays();
            markersDict = {};
            addMarkers(data.restaurants);
        } else {
            console.log('error');
        }
    }

    request.send();
}

function populateSelect(item, data) {
    var select = document.getElementById(item);
    var fragment = document.createDocumentFragment();

    for (var i = 0; i < data.length; i++) {
        var option = document.createElement('option');
        if (item == 'categories') {
            option.innerHTML = data[i].categories.name;
            option.value = data[i].categories.id;
        }
        else if (item == 'cuisines') {
            option.innerHTML = data[i].cuisine.cuisine_name;
            option.value = data[i].cuisine.cuisine_id;
        }
        fragment.appendChild(option);
    };
    select.appendChild(fragment);
}

function requestCategories() {

    var request = new XMLHttpRequest();

    var url = 'https://developers.zomato.com/api/v2.1/categories';
    request.open('GET', url, true);
    request.setRequestHeader("Accept", "application/json");
    request.setRequestHeader("X-Zomato-API-Key", key);
    request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
            let json = request.responseText;
            let data = JSON.parse(json);
            populateSelect('categories', data.categories);
        } else {
            console.log('error');
        }
    }
    request.send();
}

function requestCuisines() {

    var request = new XMLHttpRequest();
    var url = 'https://developers.zomato.com/api/v2.1/cuisines?lat=' + lat + '&lon=' + lng;
    request.open('GET', url, true);
    request.setRequestHeader("Accept", "application/json");
    request.setRequestHeader("X-Zomato-API-Key", key);
    request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
            let data = JSON.parse(this.response);
            populateSelect('cuisines', data.cuisines);
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
        var res = data[i].restaurant;
        let distance = calculateDistance(lat, lng, res.location.latitude, res.location.longitude);
         
        output += "<div id='" + res.id + "' class='card-action' onclick='setMarker("+ res.id + ");'>"
            + "<span><a href='" + res.url + "'>" + res.name + "</a> (" + distance + " miles away) </span> <p> "
            + "<a href='" + generateDirections(res.location) + "'>" + res.location.address + "</a> <br /><b> Cuisines:</b> " + res.cuisines
            + "<br /> <b> User Rating: </b> " + generateStars(res.user_rating.aggregate_rating)
            /* + ( typeof res.phone_numbers !== "undefined" ?  "<p><a href='tel:"+ res.phone_number + "'>" + res.phone_number + "</a></p>" : "" ) */
            + "<br /> <b> Price Range: </b> " + generatePrice(res.price_range) + " | <b>Average cost for two: </b>" + generateCost(res.average_cost_for_two)
            + "</div>";
    }
    document.getElementById("restaurants").innerHTML = output;
}

function addMarkers(data) {
    for (var i = 0; i < data.length; i++) {
        var res = data[i].restaurant;
        latLng = new google.maps.LatLng(res.location.latitude, res.location.longitude);
        //map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions),
        contentDict[res.id] = generateContent(res);
        addMarker(res);
    }
}

function addMarker(data) {
    var marker = new google.maps.Marker({
        position: latLng,
        map: map,
        title: data.name
    });
    markersDict[data.id] = marker;
    (function (marker, data) {
        google.maps.event.addListener(marker, "click", function (e) {
            
            bindInfoWindow(marker, map, infoWindow, data);
        });
    })(marker, data);
}

function setMarker(id){
    map.setCenter(markersDict[id].getPosition());
    infoWindow.setContent(contentDict[id]);
    infoWindow.open(map,markersDict[id]);
}
function bindInfoWindow(marker, map, infoWindow, data) {
    
    content = generateContent(data);
    contentDict[data.id] = content;
    marker.addListener('click', function () {
        window.location = "#" + data.id;
        infoWindow.setContent(content);
        infoWindow.open(map, this);
    });
}

function generateContent(data){
    distance = calculateDistance(lat, lng, data.location.latitude, data.location.longitude);
    address = data.location.address.split(',');
    content = "<b>" + data.name + "</b> <br/>" +
        distance + " miles away"
        + "<br /> " + address[0] + "<br /> " + address[1]
        + "<br /> <a href='" + generateDirections(data.location) + "'>Directions</a>"
        + "  |  <a href='#" + data.id + "'>More info </a>";
    return content;
}

function clearOverlays() {
    for (var key in markersDict) {
        markersDict[key].setMap(null);
    }
    /* for (var i = 0; i < markersArray.length; i++ ) {
      markersArray[i].setMap(null);
    }
    markersArray.length = 0; */
}

function onError(error) {
    alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
}

google.maps.event.addDomListener(window, 'load', onSuccess);

$(document).ready(function () {
    $('#categories').select2({
        placeholder: "Choose a category",
        allowClear: true,
    });
    $('#cuisines').select2({
        placeholder: "Choose any cuisine",
        allowClear: true
    });
    $('#city').select2({
        placeholder: "Choose a city",
        allowClear: true
    });
});
function saveCategory() {
    category = "&category=" + $('#categories').select2("val");
    requestRestaurants();
    map.panTo(myLatlng);    
    $('#categories').val('').trigger('change');
    category = "";
}
function saveCuisines() {
    cuisines = "&cuisines=" + $('#cuisines').select2("val").toString();
    requestRestaurants();
    map.panTo(myLatlng);
    $('#cuisines').val('').trigger('change');
    cuisines = "";
}

function saveSearch() {
    search = "q=" + document.getElementById("search").value;
    requestRestaurants();
    map.panTo(myLatlng);
    document.getElementById("search").value = '';
    search = "";
}

function applyAll() {
    //if($('#categories').select2("val") != "")
    category = "&category=" + $('#categories').select2("val");
    //if($('#cuisines').select2("val") != "")
    cuisines = "&cuisines=" + $('#cuisines').select2("val").toString();
    //if(document.getElementById("search").value != "")
    search = "q=" + document.getElementById("search").value;
    alert(category, cuisines, search);
    requestRestaurants();
    map.panTo(myLatlng);
    $('#categories').val('').trigger('change');
    category = "";
    $('#cuisines').val('').trigger('change');
    cuisines = "";
    document.getElementById("search").value = '';
    search = "";
}


function generateDirections(data) {
    return "https://www.google.com/maps/dir/?api=1&origin=" + lat + "," + lng + "&destination=" + data.latitude + "," + data.longitude + "&travelmode=driving"
}

function generateCost(data) {
    if (data == 0) {
        return "N/A"
    }
    else {
        return "&#36;" + data
    }
}

function generateStars(data) {
    data = Math.round(data);
    if (data == "5")
        return "&#9733;&#9733;&#9733;&#9733;&#9733;";
    else if (data == "4")
        return "&#9733;&#9733;&#9733;&#9733;";
    else if (data == "3")
        return "&#9733;&#9733;&#9733;";
    else if (data == "2")
        return "&#9733;&#9733;";
    else if (data == "1")
        return "&#9733;";
    else {
        return "N/A";
    }
}

function generatePrice(data) {
    data = Math.round(data);
    if (data == "5")
        return "&#36;&#36;&#36;&#36;&#36;";
    else if (data == "4")
        return "&#36;&#36;&#36;&#36;";
    else if (data == "3")
        return "&#36;&#36;&#36;";
    else if (data == "2")
        return "&#36;&#36;";
    else if (data == "1")
        return "&#36;";
    else {
        return "N/A"
    }
}