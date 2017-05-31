// Google Map
var map;

// markers for map
var markers = [];

//Holder for data, avoid multiple request to DB
var centers             = [];
var centersFiltrados    = [];

// info window
var info = new google.maps.InfoWindow();

//Markes:
var markerGreen     = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
var markerYellow    = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
var markerRed       = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
var markerPurple    = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
var iconMarker      = markerYellow; //Default

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


    //Value Search
    $("#q").on("keyup", function() {

        //Check if we have value or user cleared
        if($("#q").val() != ""){
            centersFiltrados = centers.filter(function(center){

                var material    = center["material"].toLowerCase();
                material        = accent_fold(material);
                var search      = material.search(accent_fold($("#q").val()));

                return search >= 0;

            });
        }
        
        addMarkers();  

    });


});

//Helpers


/**
 * Add Markers to Map
 */
function addMarkers(){

    //Check if we already requested the DB

    if(centers.length > 0 ){

        //Clean
        removeMarkers();

        //Check if user want to filter
        var communityPlaces = $("#centrospostuladoscheck").is(":checked");

        //Check if we have something to filter
        if($("#q").val() != ""){

            // Load Markes Filtered
            for (var o = 0; o < centersFiltrados.length; o++)
            {    

                //Markers
                if(communityPlaces == true){
                    
                    addMarker(centersFiltrados[o]);
                
                //Add Marker without Postulates
                } else {

                    if (centersFiltrados[o]["postulate"] == undefined) {
                        addMarker(centersFiltrados[o]);
                    }

                }
                
                
            }

        } else {

            //Load Markers that we already have
            for (var u = 0; u < centers.length; u++)
            {    
                

                //Markers
                if(communityPlaces == true){
                    
                    addMarker(centers[u]);
                
                //Add Marker without Postulates
                } else {

                    if (centers[u]["postulate"] == undefined) {
                        addMarker(centers[u]);
                    }

                }
                
            }
        }
    

    //Fresh Request
    } else {

        //Check if user want to filter
        var communityPlaces = $("#centrospostuladoscheck").is(":checked");

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
                //Markers
                if(communityPlaces == true){
                    
                    addMarker(data[i]);
                
                //Add Marker first without Postulates
                } else {

                    if (data[i]["postulate"] == undefined) {
                        addMarker(data[i]);
                    }

                }      
                
                //Data
                centers.push(data[i]);

           }
        })
        .fail(function(jqXHR, textStatus, errorThrown) {

            // log error to browser's console
            console.log(errorThrown.toString());
        });
    }

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

        //Is Postulate?
        if (data['postulate'] != undefined){

            content += '<div class="alert alert-info" role="alert"> Este centro ha sido sugerido por la comunidad</div>';

        }
        //Votes
        var votesup     = 0;
        var votesdown   = 0;
        if (data['votesup'] != undefined) {
            votesup = parseInt(data['votesup']);
        }

        if (data['votesdown'] != undefined) {
            votesdown = parseInt(data['votesdown']);
        }
                                
        content += '<div class="alert" role="alert"> <span class="glyphicon glyphicon-thumbs-up voteup" aria-hidden="true" style="color:green;" data-idcentro="' + id +'"></span> <span id-label-centro="labelup' + id +'">' + votesup + '</span> <span class="glyphicon glyphicon-thumbs-down votedown" aria-hidden="true" style="color:red; margin-left:5px;" data-idcentro="' + id +'"></span><span id-label-centro="labeldown' + id +'">' + votesdown + '</span></div>';

        //close and show
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

    //Add a listener
    google.maps.event.addListener(info, 'domready', function() {
        

        $(".voteup").click(function(){
            var id = $(this).attr("data-idcentro");
            vote(id, "up");
        });

        $(".votedown").click(function(){
            var id = $(this).attr("data-idcentro");
            vote(id, "down");
        });


    })

    // open info window (if not already open)
    info.open(map, marker);
}

/**
 * Adds marker for place to map.
 */
function addMarker(place)
{        

    //Holder For votes.
    var votesup     = 0;
    var votesdown   = 0;
    
    //If we have votes we redefine the Marker
    if (place['votesup'] != undefined || place['down'] != undefined ){

        if (place['votesup'] != undefined) {
            votesup = parseInt(place['votesup']);
        }
        if (place['votesdown'] != undefined) {
            votesdown = parseInt(place['votesdown']);
        }


        //Set Marker if passes the minimum;
        if (votesup > votesdown)
        {
            iconMarker = markerGreen;
        } 
        if(votesup < votesdown) {
            iconMarker = markerRed;
        }
    }

    //Is Postulate?
    if (place['postulate'] != undefined){

        //Set Default Marker for Postulate.
        iconMarker = markerPurple;

        //Center may be postule, but if has more positives or negatives we adjust.
        if (votesup >= 3)
        {
            iconMarker = markerGreen;
        } 
        if(votesup <= 3) {
            iconMarker = markerRed;
        }
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

    //Reset
    iconMarker = markerYellow;
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


/**
 * Vote Handler
 */
function vote(id, type){
    console.log(id, type);
    var parameters = {
        type: type,
        id : id
    };
    $.getJSON(Flask.url_for("vote"), parameters)
    .done(function(data, textStatus, jqXHR) {

        //Set Icon to green if everything is ok
        if(data["response"] === true && type === "up"){

            $(".voteup[data-idcentro='"+ id +"']").css("color", "green");
            $(".votedown[data-idcentro='"+ id +"']").css("color", "gray");

            //Increase
            var votes = $('span[id-label-centro="labelup'+id+'"]').html();
            votes = parseInt(votes) + 1;
            $('span[id-label-centro="labelup'+id+'"]').html(votes);

        }

        if(data["response"] === true && type === "down"){

            $(".votedown[data-idcentro='"+ id +"']").css("color", "red");
            $(".voteup[data-idcentro='"+ id +"']").css("color", "gray");

            var votes = $('span[id-label-centro="labeldown'+id+'"]').html();
            votes = parseInt(votes) + 1;
            $('span[id-label-centro="labeldown'+id+'"]').html(votes);

            //Decrease


        }

        //Error
        if(data["response"] === false){
            $("#alertarea").html('<div class="alert alert-warning" role="alert">'+ data["msg"] +' <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>')
        }

    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console
        console.log(errorThrown.toString());
    });
}

//Working Accents
//By: https://alistapart.com/article/accent-folding-for-auto-complete
var accentMap = {
  'á':'a', 'é':'e', 'í':'i','ó':'o','ú':'u'
};

function accent_fold(s) {
  if (!s) { return ''; }
  var ret = '';
  for (var i = 0; i < s.length; i++) {
    ret += accentMap[s.charAt(i)] || s.charAt(i);
  }
  return ret;
};