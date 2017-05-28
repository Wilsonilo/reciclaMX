// Google Map
var map;

// markers for map
var markers = [];

// info window
var info = new google.maps.InfoWindow();

//Markes:
var markerGreen = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
var markerYellow = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
var markerRed = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
var iconMarker = markerYellow;
//http://maps.google.com/mapfiles/ms/icons/blue-dot.png
// execute when the DOM is fully loaded
$(function() {


    //map
    var canvas = $("#map-canvas").get(0);
    var styles = [

        // hide Google's labels
        {
            featureType: "all",
            elementType: "labels",
            stylers: [
                {visibility: "off"}
            ]
        },

        // hide roads
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [
                {visibility: "off"}
            ]
        }

    ];
    var options = {
        center: {lat: 23.9842768, lng: -103.5929129}, // Stanford, California
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        maxZoom: 13,
        panControl: true,
        //styles: styles,
        zoom: 5,
        zoomControl: true
    };
    
    map = new google.maps.Map(canvas, options);

    //Run request and create markers
    addMarkers()

});

//Helpers

/**
 * Add Markers to Map
 */
function addMarkers(){
    // get places matching query (asynchronously)
    var parameters = {
        
    };
    $.getJSON(Flask.url_for("semarnat"), parameters)
    .done(function(data, textStatus, jqXHR) {
       // remove old markers from map
       removeMarkers();

       // add new markers to map
       for (var i = 0; i < data.length; i++)
       {    
           addMarker(data[i]);
       }
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console
        console.log(errorThrown.toString());
    });

}

/**
 * asks for specific element.
 */

function preparMarker(marker, id){
    //JSON

    var parameters = {
        centro: id
    };
   
    $.getJSON(Flask.url_for("semarnat"), parameters, function(data) {
        var content = '<div>';
        content += '<h5>' + data['name'] + '</h5>';
        content += '<small style="color:gray;font-size:9px;">' + id + '</small>';
        content += '<p><strong>Dirección: </strong>' + data['address'] + '</p>';
        if(data['phone'] != undefined){
            content += '<p><strong>Teléfono: </strong>' + data['phone'] + '</p>';
        }
        content += '<p><strong>Material: </strong>' + data['material'] + '</p>';
        content += '</div>';
        showInfo(marker, content)
    });

}

/**
 * Shows info window at marker with content.
 */
function showInfo(marker, content)
{

    // set info window's content
    info.setContent(content);

    // open info window (if not already open)
    info.open(map, marker);
}

/**
 * Adds marker for place to map.
 */
function addMarker(place)
{

    //If we have votes we redefine the Marker.
    if (place['votes'] != undefined){

    }

    //Get info
    var idplace = place["_id"]["$oid"]
    var image = 'https://www.goodlifefitness.com/assets/img/icons/map-marker.png'; //found this image on google images, hope there is no problem.
    if(place["location"] != undefined && place["location"].length > 0) {
        //console.log(parseFloat(place["location"][0]))
        var myLatLng = {lat: parseFloat(place["location"][0]), lng: parseFloat(place["location"][1])};
        var marker = new google.maps.Marker({
            position: myLatLng,
            //label: place["admin_name1"],
            animation: google.maps.Animation.DROP,
            icon: iconMarker
         });
        marker.addListener('click', function(){
            preparMarker(marker, idplace);
        });
        marker.setMap(map);
        markers.push(marker);

    }
}

/**
 * Removes markers from map.
 */
function removeMarkers()
{
    for (i in markers){
        markers[i].setMap(null);
    }
}