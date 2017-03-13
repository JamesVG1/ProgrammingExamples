//include geometry library on page
//// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=geometry">
//a lot of these functions are connected by callbacks, making them page specific


//Functions for converting an address into Lat and Long.
//global variables where lat and long are stored.
var latArray = [];
var longArray = [];

//multi array for lat/long of point 1
var latLongArrayMultiP1 = [];
//multi array for lat/long of point 2
var latLongArrayMultiP2 = [];

//global variable for distance calculations.
var distanceArray = [];

//function that converts meters to miles
function convertMetersToMiles(meters){
  var miles = (meters * 1609.34);
  return miles;
}

function convertKmToMiles(km){
  var miles = (km * 0.621371);
  return miles;
}

//scripts for converting address into lat and long
function addressToLatLang(addressOne, addressTwo, apiKey){
  var googleRequestURLAddressOne = "https://maps.googleapis.com/maps/api/geocode/json?address="+addressOne+"&key="+apiKey;
  var googleRequestURLAddressTwo = "https://maps.googleapis.com/maps/api/geocode/json?address="+addressTwo+"&key="+apiKey;
  //populates lat and long in global arrays.
  getLatLongFromAddressGoogleURL(googleRequestURLAddressOne, returnGoogleLatLangP1);
  getLatLongFromAddressGoogleURL(googleRequestURLAddressTwo, returnGoogleLatLangP2);
  //uses values in global arrays to calculate distance between them in meters

}

//calculates distance between two points in km's
function calcDistance(p1, p2) {
  return (google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1000).toFixed(2);
}

//the callback function.
function returnGoogleLatLangP1(data){
  //latitude of the address
  var lat = data.results[0].geometry.location.lat;
  //longitude of the address
  var long = data.results[0].geometry.location.lng;
  latLongArrayMultiP1.push({"lat": lat, "long": long});
}

function returnGoogleLatLangP2(data){
  //latitude of the address
  var lat = data.results[0].geometry.location.lat;
  //longitude of the address
  var long = data.results[0].geometry.location.lng;
  latLongArrayMultiP2.push({"lat": lat, "long": long});
  //calls this function so that the distance can be measured. Callback function.
  calculateDistanceBetweenTwoPoints();
}

//global variable for counting interations of the function, only on the second
// call of this function will both arrays be populated and distance can be calculated.
//this variable is for each iteration of points that the distance is calculated. They have to increase by one each time.
var pointIteration = 0;
function calculateDistanceBetweenTwoPoints(){
    //send lat and long values to database.
    var p1 = new google.maps.LatLng(latLongArrayMultiP1[pointIteration].lat, latLongArrayMultiP1[pointIteration].long);
    var p2 = new google.maps.LatLng(latLongArrayMultiP2[pointIteration].lat, latLongArrayMultiP2[pointIteration].long);
    var distance = calcDistance(p1, p2);
    var miles = convertKmToMiles(distance);
    var roundedMiles = (Math.round(miles*100)/100).toFixed(1);
    distanceArray.push(roundedMiles);
    //set the count back to zero.
    arrayPopulateCount=0;
    pointIteration++;
    //function to add the distances to the Home.php page for maids.
    addMilesToTable();
}



//scripts for address to lat and long
function getLatLongFromAddressGoogleURL(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
          var data = JSON.parse(xmlHttp.responseText);
          //stores lat and long information in callback function.
          callback(data);
        }
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}



//converts lat lang into an address:

// Commenters note: One thing I had trouble finding was how to go in the other direction. From coordinates to an address. Here is the code I neded upp using. Please not that I also use jquery.
// $.each(results[0].address_components, function(){
//     $("#CreateDialog").find('input[name="'+ this.types+'"]').attr('value', this.long_name);
// });
// What I'm doing is to loop through all the returned address_components and test if their types match any input element names I have in a form. And if they do I set the value of the element to the address_components value.

//function to calculate distance between two lat and lang points in meters
function returnDistanceMetersLatLang(){
    var p1 = {lat:latArray[0], lng:longArray[0]};
    var p2 = {lat:latArray[1], lng:longArray[1]};
    var distinMeters = getDistance(p1,p2);
    return distinMeters;
}



//calculates distance, in meters, between lat/long of two points. Does not use API
var rad = function(x) {
  return x * Math.PI / 180;
};

var getDistance = function(p1, p2) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2.lat() - p1.lat());
  var dLong = rad(p2.lng() - p1.lng());
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};
