$(document).ready(function(){
    
	var alert = "";

    //Handle Postular
    $("#sendpostular").submit(function(e){

    	//Prevent Default
    	e.preventDefault();

    	//Check if empty
    	if( $("#postularname").val() == "" ||
    		$("#postularaddress").val() == "" ||
    		$("#postularmaterial").val() == ""
    		){
    			alert("Nombre, Direccion y Material son campos obligatorios.");
    			return;	
    		}

    	//Set Vals
    	var postularname = $("#postularname").val();
    	var postularphone = $("#postularphone").val();
    	var postularemail = $("#postularemail").val();
    	var postularweb = $("#postularweb").val();
    	var postularaddress = $("#postularaddress").val();
    	var postularmaterial = $("#postularmaterial").val();
    	var type = "postular";

    	//Get vals with Jquery
    	var dataString = {
    		type 	: type,
    		name	: postularname,
    		phone 	: postularphone,
    		email	: postularemail,
    		web		: postularweb,
    		address	: postularaddress,
    		material: postularmaterial
    	}

    	//Send
    	$.ajax({
		  url: "/postajuste",
		  data: dataString,
		  dataType: 'json'
		})
		.done(function(response) {
		  	//Check response
			if(response["response"] == false){

				alert = '<div class="alert alert-danger" role="alert">';
				alert += response["msg"];
				alert += '</div>';

			} else {

				alert = '<div class="alert alert-success" role="alert">';
				alert += response["msg"];
				alert += '</div>';

				//Clean
				$('#sendpostular').trigger("reset");
			}

			$("#alertzone").html(alert);
		})
		.fail(function(response){
			alert = '<div class="alert alert-danger" role="alert">';
			alert += "Tenemos un error en el sistema, por favor intentelo mas tarde.";
			alert += '</div>';
			$("#alertzone").html(alert);
			console.log("Error: ", response);
		});

    });

    //Handle Ajuste
    $("#sendajuste").submit(function(e){

    	//Prevent Default
    	e.preventDefault();

    	//Check if empty
    	if( $("#ajustename").val() == "" ||
    		$("#ajustemail").val() == "" ||
    		$("#ajustedescripcion").val() == ""
    		){
    			alert = '<div class="alert alert-danger" role="alert">';
				alert += "Necesitamos su nombre, email y descripcion para el ajuste."
				alert += '</div>';
    			$("#alertzone").html(alert);
    			return;	
    		}

    	//Set Vals
    	var ajustename = $("#ajustename").val();
    	var ajustemail = $("#ajustemail").val();
    	var ajustedescripcion = $("#ajustedescripcion").val();
    	var type = "ajuste";

    	//Get vals with Jquery
    	var dataString = {
    		type 	: type,
    		name	: ajustename,
    		descp 	: ajustedescripcion,
    		email	: ajustemail
    	}

    	//Send
    	$.ajax({
		  url: "/postajuste",
		  data: dataString,
		  dataType: 'json'
		})
		.done(function(response) {

			//Check response
			if(response["response"] == false){

				alert = '<div class="alert alert-danger" role="alert">';
				alert += response["msg"];
				alert += '</div>';

			} else {

				alert = '<div class="alert alert-success" role="alert">';
				alert += response["msg"];
				alert += '</div>';

				//Clean
				$('#sendajuste').trigger("reset");

			}

			$("#alertzone").html(alert);

		})
		.fail(function(response){

			alert = '<div class="alert alert-danger" role="alert">';
			alert += "Tenemos un error en el sistema, por favor intentelo mas tarde.";
			alert += '</div>';
			$("#alertzone").html(alert);
			console.log("Error: ", response);

		});

    });

});