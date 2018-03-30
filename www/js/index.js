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

function checkSecure() {
    if (location.protocol != 'https:') {
        location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
    }
}

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
var lat, lng, map, mapOptions, latLng, cuisinesList, distance, content, address, myLatlng;
var category = "";
var cuisines = "";
var search = "";
var travelSelection = "driving";
var sortSelection = "rating";
var orderSelection = "desc";
var miles = "25000";
var count = "20";


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
        mapOptions = {
            zoom: 13,
            center: myLatlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            gestureHandling: 'greedy',
            mapTypeControl: false
        };
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    }
    request('restaurants');
    request('categories');
    request('cuisines');
}

function request(call) {
    let request = new XMLHttpRequest();
    if (call === 'restaurants') {
        var url = 'https://developers.zomato.com/api/v2.1/search?' + search + '&count=' + count + '&lat=' + lat + '&lon=' + lng +
            category + cuisines + '&radius=' + miles + '&sort=' + sortSelection + '&order=' + orderSelection;
    }
    else if (call === 'categories')
        var url = 'https://developers.zomato.com/api/v2.1/categories';
    else if (call === 'cuisines')
        var url = 'https://developers.zomato.com/api/v2.1/cuisines?lat=' + lat + '&lon=' + lng;
    else if (call === 'cityInfo')
        var url = 'https://developers.zomato.com/api/v2.1/geocode?lat=' + lat + '&lon=' + lng;

    else {
        console.log("not a valid request call");
    }
    console.log(url);
    request.open('GET', url, true);
    request.setRequestHeader("Accept", "application/json");
    request.setRequestHeader("X-Zomato-API-Key", key);
    request.onreadystatechange = function (e) {
        if (this.readyState == 4 && this.status == 200) {
            let data = JSON.parse(this.response);
            if (call === 'restaurants') {
                addCard(data.restaurants,call);
                clearOverlays();
                markersDict = {};
                addMarkers(data.restaurants);
            }
            else if (call === 'categories')
                populateSelect(call, data.categories);
            else if (call === 'cuisines')
                populateSelect(call, data.cuisines);
            else if (call === 'cityInfo')
                addCard(data, call);
            else
                console.log("not a valid call");
        }
    }
    request.send();
}


function populateSelect(item, data) {
    let select = document.getElementById(item);
    if (select.options.length > 1)
        select.innerHTML = "";
    let fragment = document.createDocumentFragment();
    for (var i = 0; i < data.length; i++) {
        let option = document.createElement('option');
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

function calculateDistance(latitude1, longitude1, latitude2, longitude2) {
    var meters = google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(latitude1, longitude1), new google.maps.LatLng(parseFloat(latitude2), parseFloat(longitude2)));
    var distance = +((meters * 0.000621371192).toFixed(2));
    return distance;
}

function addCard(data, call) {
    if (call === 'restaurants') {
        let output = "";
        for (var i = 0; i < data.length; i++) {
            var res = data[i].restaurant;
            let distance = calculateDistance(lat, lng, res.location.latitude, res.location.longitude);

            output += "<div id='" + res.id + "' class='card-action' onclick='setMarker(" + res.id + ");'>"
                + "<span><a href='" + res.url + "'>" + res.name + "</a> (" + distance + " miles away) </span> <p> "
                + "<a href='" + generateDirections(res.location) + "'>" + res.location.address + "</a> <br /><b> Cuisines:</b> " + res.cuisines
                + "<br /> <b> User Rating: </b> " + generateStars(res.user_rating.aggregate_rating)
                /* + ( typeof res.phone_numbers !== "undefined" ?  "<p><a href='tel:"+ res.phone_number + "'>" + res.phone_number + "</a></p>" : "" ) */
                + "<br /> <b> Price Range: </b> " + generatePrice(res.price_range) + " | <b>Average cost for two: </b>" + generateCost(res.average_cost_for_two)
                + "</div>";
        }
        document.getElementById("restaurants").innerHTML = output;
        if (document.getElementById("restaurants").innerHTML == "")
            alert("No results!");
    }
    else if (call === 'cityInfo') {

        let output = "";
        output += "<div id='" + data.location.entity_id + "' class='card-action'>"
            + "<br /> <b> Location: </b> " + data.location.title
            + "<br /> <b> City: </b> " + data.location.city_name
            + "<br /> <b> Popularity Rating: </b> " + generateStars(data.popularity.popularity)
            + "<br /> <b> Nightlife Rating: </b> " + generateStars(data.popularity.popularity)
            + "<br /> <b> Top Cuisines: </b> " + data.popularity.top_cuisines.join(', ');
        + "</div>";

        document.getElementById("cityInfo").innerHTML = output;
        document.getElementById("queries").style.display = "none";
        document.getElementById("cityInfo").style.display = "flex";
    }
    else
        console.log("not a valid call");
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

function setMarker(id) {
    map.setCenter(markersDict[id].getPosition());
    infoWindow.setContent(contentDict[id]);
    infoWindow.open(map, markersDict[id]);
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

function generateContent(data) {
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
}

function onError(error) {
    alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
}

google.maps.event.addDomListener(window, 'load');


function applyAll() {
    category = "&category=" + document.getElementById("categories").options[document.getElementById("categories").selectedIndex].value;
    cuisines = "&cuisines=" + document.getElementById("cuisines").options[document.getElementById("cuisines").selectedIndex].value.toString();
    search = "q=" + encodeURI(document.getElementById("search").value);
    request('restaurants');
    latLng = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
    map.panTo(latLng);
    document.getElementById("categories").value = '';
    category = "";
    document.getElementById("cuisines").value = '';
    cuisines = "";
    document.getElementById("search").value = '';
    search = "";
}

function generateDirections(data) {
    return "https://www.google.com/maps/dir/?api=1&origin=" + lat + "," + lng + "&destination=" + data.latitude + "," + data.longitude + "&travelmode=" + travelSelection;
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

//encode trim and 

function applySettings() {
    let travel = document.getElementById("travelMode").options[document.getElementById("travelMode").selectedIndex].value;
    if (travel != "")
        travelSelection = travel;
    let sort = document.getElementById("sort").options[document.getElementById("sort").selectedIndex].value;
    if (sort != "")
        sortSelection = sort;
    let order = document.getElementById("order").options[document.getElementById("order").selectedIndex].value;
    if (order != "")
        orderSelection = order;
    let latVal = document.getElementById("lat").value;
    if (latVal != "")
        lat = latVal;
    let lngVal = document.getElementById("lng").value;
    if (lngVal != "")
        lng = lngVal;
    let countVal = document.getElementById("results").value;
    if (countVal != "")
        count = countVal;
    let milesVal = document.getElementById("miles").value;
    if (milesVal != "")
        miles = Math.round((parseFloat(milesVal) * 1609.344));
    console.log(miles);
    request('restaurants');
    request('cuisines');
    request('cityInfo')
    latLng = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
    map.setCenter(latLng);
    closeNav();
}

function openNav() {
    document.getElementById("mySidenav").style.width = "275px";
}

function closeNav() {

    document.getElementById("mySidenav").style.width = "0";

}