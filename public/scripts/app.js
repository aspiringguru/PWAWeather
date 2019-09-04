/*
 * @license
 * Your First PWA Codelab (https://g.co/codelabs/pwa)
 * Copyright 2019 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License
 */
'use strict';

var userLat;
var userLon;

var visible = false;

const weatherApp = {
  selectedLocations: {},
  addDialogContainer: document.getElementById('addDialogContainer'),
};

/**
 * Toggles the visibility of the add location dialog box.
 * known problem: cannot get population of dropdown autocomplete
 * to work for second use. nfi idea why.
 * console logs show the options are populated but not displaying
 */
function toggleAddDialog() {
  visible = !visible;
  //populate the drop down options.
  if (visible) {
      console.log("visible is True, start populateOptions()")
      populateOptions();
  } else {
      console.log("visible is false, do not start populateOptions()")
  }
  //tried moving this line above the if, didn't fix problem.
  weatherApp.addDialogContainer.classList.toggle('visible');
}

function getLatLon() {
    console.log("start function getLatLon()");
    //now get the values from the form and obtain lat,lon
    const select = document.getElementById('selectCityToAdd3');
    console.log("select:"+select)
    console.log("select.value:"+select.value)
    const selectedValue = select.value;
    //now find index of cities where cities.?? matches citie
    var cityCountry = "";
    var index = 0
    for(var i = 0; i < cities.length; i++) {
        cityCountry = cities[i].city_ascii+", "+cities[i].country;
        if (selectedValue === cityCountry) {
            index = i;
            break;
        }
    }
    console.log("match found at index:"+index);
    console.log("city, country:"+cityCountry);
    console.log("lat:"+cities[index].lat)
    console.log("lon:"+cities[index].lng)
    //
    /*
    select = document.getElementById('selectCityToAdd2');
    selected = select.options[select.selectedIndex];
    geo = selected.value;
    label = selected.textContent;
    console.log("results from getElementById('cities')");
    console.log("select:"+select)
    console.log("selected:"+selected)
    console.log("geo:"+geo)
    console.log("label:"+label)
    */
    console.log("end function getLatLon()");
    return ([cities[index].lat, cities[index].lng, cityCountry])
}

function addLocationn() {
  console.log("start function addLocationn()")
  getLatLon();
  // Hide the dialog
  toggleAddDialog();

  // Get the selected city
  var results = getLatLon();
  console.log("results:"+results);
  console.log("lat:"+results[0]);
  console.log("lon:"+results[1]);
  console.log("City,Country:"+results[2]);
  var geo = results[0]+","+results[1];
  console.log("geo:"+geo);
  const location = {label: results[2], geo: geo};
  // Create a new card & get the weather data from the server
  const card = getForecastCard(location);
  getForecastFromNetwork(geo).then((forecast) => {
    renderForecast(card, forecast);
  });
  // Save the updated list of selected cities.
  weatherApp.selectedLocations[geo] = location;
  saveLocationList(weatherApp.selectedLocations);

  console.log("end function addLocationn()")
}

/**
 * Event handler for butDialogAdd, adds the selected location to the list.
 * selectCityToAdd
 *
 */
function addLocation() {
  // Hide the dialog
  toggleAddDialog();
  // Get the selected city
  const select = document.getElementById('selectCityToAdd');
  const selected = select.options[select.selectedIndex];
  const geo = selected.value;
  const label = selected.textContent;
  console.log("geo:"+geo);
  console.log("label:"+label);
  const location = {label: label, geo: geo};
  // Create a new card & get the weather data from the server
  const card = getForecastCard(location);
  getForecastFromNetwork(geo).then((forecast) => {
    renderForecast(card, forecast);
  });
  // Save the updated list of selected cities.
  weatherApp.selectedLocations[geo] = location;
  saveLocationList(weatherApp.selectedLocations);
}

/**
 * Event handler for .remove-city, removes a location from the list.
 *
 * @param {Event} evt
 */
function removeLocation(evt) {
  const parent = evt.srcElement.parentElement;
  parent.remove();
  if (weatherApp.selectedLocations[parent.id]) {
    delete weatherApp.selectedLocations[parent.id];
    saveLocationList(weatherApp.selectedLocations);
  }
}

/**
 * Renders the forecast data into the card element.
 *
 * @param {Element} card The card element to update.
 * @param {Object} data Weather forecast data to update the element with.
 */
function renderForecast(card, data) {
  if (!data) {
    // There's no data, skip the update.
    return;
  }

  // Find out when the element was last updated.
  const cardLastUpdatedElem = card.querySelector('.card-last-updated');
  const cardLastUpdated = cardLastUpdatedElem.textContent;
  const lastUpdated = parseInt(cardLastUpdated);

  // If the data on the element is newer, skip the update.
  if (lastUpdated >= data.currently.time) {
    return;
  }
  cardLastUpdatedElem.textContent = data.currently.time;

  // Render the forecast data into the card.
  card.querySelector('.description').textContent = data.currently.summary;
  const forecastFrom = luxon.DateTime
      .fromSeconds(data.currently.time)
      .setZone(data.timezone)
      .toFormat('DDDD t');
  card.querySelector('.date').textContent = forecastFrom;
  card.querySelector('.current .icon')
      .className = `icon ${data.currently.icon}`;
  card.querySelector('.current .temperature .value')
      .textContent = Math.round(data.currently.temperature);
  card.querySelector('.current .humidity .value')
      .textContent = Math.round(data.currently.humidity * 100);
  card.querySelector('.current .wind .value')
      .textContent = Math.round(data.currently.windSpeed);
  card.querySelector('.current .wind .direction')
      .textContent = Math.round(data.currently.windBearing);
  const sunrise = luxon.DateTime
      .fromSeconds(data.daily.data[0].sunriseTime)
      .setZone(data.timezone)
      .toFormat('t');
  card.querySelector('.current .sunrise .value').textContent = sunrise;
  const sunset = luxon.DateTime
      .fromSeconds(data.daily.data[0].sunsetTime)
      .setZone(data.timezone)
      .toFormat('t');
  card.querySelector('.current .sunset .value').textContent = sunset;

  // Render the next 7 days.
  const futureTiles = card.querySelectorAll('.future .oneday');
  futureTiles.forEach((tile, index) => {
    const forecast = data.daily.data[index + 1];
    const forecastFor = luxon.DateTime
        .fromSeconds(forecast.time)
        .setZone(data.timezone)
        .toFormat('ccc');
    tile.querySelector('.date').textContent = forecastFor;
    tile.querySelector('.icon').className = `icon ${forecast.icon}`;
    tile.querySelector('.temp-high .value')
        .textContent = Math.round(forecast.temperatureHigh);
    tile.querySelector('.temp-low .value')
        .textContent = Math.round(forecast.temperatureLow);
  });

  // If the loading spinner is still visible, remove it.
  const spinner = card.querySelector('.card-spinner');
  if (spinner) {
    card.removeChild(spinner);
  }
}

/**
 * Get's the latest forecast data from the network.
 *
 * @param {string} coords Location object to.
 * @return {Object} The weather forecast, if the request fails, return null.
 */
function getForecastFromNetwork(coords) {
  return fetch(`/forecast/${coords}`)
      .then((response) => {
        return response.json();
      })
      .catch(() => {
        return null;
      });
}

/**
 * Get's the cached forecast data from the caches object.
 *
 * @param {string} coords Location object to.
 * @return {Object} The weather forecast, if the request fails, return null.
 */
function getForecastFromCache(coords) {
  // CODELAB: Add code to get weather forecast from the caches object.
    if (!('caches' in window)) {
      return null;
    }
    const url = `${window.location.origin}/forecast/${coords}`;
    return caches.match(url)
        .then((response) => {
          if (response) {
            return response.json();
          }
          return null;
        })
        .catch((err) => {
          console.error('Error getting data from cache', err);
          return null;
        });
}

/**
 * Get's the HTML element for the weather forecast, or clones the template
 * and adds it to the DOM if we're adding a new item.
 *
 * @param {Object} location Location object
 * @return {Element} The element for the weather forecast.
 */
function getForecastCard(location) {
  const id = location.geo;
  const card = document.getElementById(id);
  if (card) {
    return card;
  }
  const newCard = document.getElementById('weather-template').cloneNode(true);
  newCard.querySelector('.location').textContent = location.label;
  newCard.setAttribute('id', id);
  newCard.querySelector('.remove-city')
      .addEventListener('click', removeLocation);
  document.querySelector('main').appendChild(newCard);
  newCard.removeAttribute('hidden');
  return newCard;
}

/**
 * Gets the latest weather forecast data and updates each card with the
 * new data.
 */
function updateData() {
  Object.keys(weatherApp.selectedLocations).forEach((key) => {
    const location = weatherApp.selectedLocations[key];
    const card = getForecastCard(location);
    // CODELAB: Add code to call getForecastFromCache
    getForecastFromCache(location.geo)
      .then((forecast) => {
        renderForecast(card, forecast);
    });

    // Get the forecast data from the network.
    getForecastFromNetwork(location.geo)
        .then((forecast) => {
          renderForecast(card, forecast);
        });
  });
}

/**
 * Saves the list of locations.
 *
 * @param {Object} locations The list of locations to save.
 */
function saveLocationList(locations) {
  const data = JSON.stringify(locations);
  localStorage.setItem('locationList', data);
}

//https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition
var options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};

function success(pos) {
  var crd = pos.coords;
  userLat = crd.latitude;
  userLon = crd.longitude;
  console.log('Your current position is:');
  console.log(`Latitude : ${crd.latitude}`);
  console.log(`Longitude: ${crd.longitude}`);
  console.log(`More or less ${crd.accuracy} meters.`);

}

function error(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
}


/**
 * Loads the list of saved location.
 *
 * @return {Array}
 */
function loadLocationList() {
  console.log("start loadLocationList()");
  let locations = localStorage.getItem('locationList');
  if (locations) {
    try {
      console.log("locations exists, now locations=JSON.parse(locations)")
      locations = JSON.parse(locations);
    } catch (ex) {
      console.log("error caught, set locations={}");
      locations = {};
    }
  }
  if (!locations || Object.keys(locations).length === 0) {
    console.log("!locations="+!locations);
    if (locations) {
        console.log("Object.keys(locations).length="+Object.keys(locations).length);
    }
    //
    console.log("myCityCountry:"+myCityCountry);
    //console.log("myLatLon:"+myLatLon);
    navigator.geolocation.getCurrentPosition(success, error, options);
    //calls success(pos), nfi where pos comes from. gah!
    //userLat and userLon now have non null values
    console.log("userLat:"+userLat);
    console.log("userLon:"+userLon);
    //need to redo to get non null values asynch??
    const key = '-27.4698,153.0251';
    locations = {};
    locations[key] = {label: 'Brisbane, Australia', geo: '-27.4698,153.0251'};
    //xxxxx
  }
  return locations;
}

/*
 *  Populate the drop down list.
 *
 *
 */
function populateOptions() {
    console.log("start function populateOptions()")
    //now load cities and populate options
    //var select = document.getElementById("selectCityToAdd2");
    //console.log("select:"+select)
    console.log("in function populateOptions: cities.length:"+cities.length)
    var options = '';
    //reset innerHTML to "" before generating content to insert
    document.getElementById('cities').innerHTML = options;
    //console.log("cities:"+cities)
    for(var i = 0; i < cities.length; i++) {
        var el = document.createElement("option");
        var tempText = cities[i].city_ascii+", "+cities[i].country;
        //var tempValue = cities[i].lat+","+cities[i].lng
        //el.text = tempText;
        //el.value = tempValue;
        //console.log("tempText:"+tempText)
        //console.log("tempValue:"+tempValue)
        //select.add(el);
        var tempOptions = "<option>"+tempText+"</option>";
        //console.log("adding tempOptions to options:"+tempOptions)
        options += tempOptions;
    }
    //console.log("at end of for loop, options:\n"+options)
    document.getElementById('cities').innerHTML = options;
    console.log("end function populateOptions()")
}

/**
 * Initialize the app, gets the list of locations from local storage, then
 * renders the initial data.
 */
function init() {
  // Get the location list, and update the UI.
  weatherApp.selectedLocations = loadLocationList();
  updateData();
  // Set up the event handlers for all of the buttons.
  document.getElementById('butRefresh').addEventListener('click', updateData);
  document.getElementById('butAdd').addEventListener('click', toggleAddDialog);
  document.getElementById('butDialogCancel')
      .addEventListener('click', toggleAddDialog);
  document.getElementById('butDialogCancel2')
      .addEventListener('click', toggleAddDialog);
  document.getElementById('butDialogAdd')
      .addEventListener('click', addLocation);
  document.getElementById('ButDialogAdd2')
      .addEventListener('click', addLocationn);
  populateOptions();
  getLocation();
}

init();
