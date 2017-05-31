$(document).ready(function(){
    
	var alert = "";

    //Handle Postular
    $("#cs50entry").submit(function(e){

    	//Prevent Default
    	e.preventDefault();

        //Check for empty data.
        if($("#firstnamecaptcha").val() == "" || $("#lastnamecaptcha").val() == "" || $("#secondphraseone").val() == "" || $("#secondphrasetwo").val() == ""){

            alert = '<div class="alert alert-danger" role="alert">';
            alert += "Please, complete both phrases.";
            alert += '</div>';

            $("#alertarea").html(alert);
            return;
        }

        //Set Vals
        var one     = $("#firstnamecaptcha").val();
        var two     = $("#lastnamecaptcha").val();
        var three   = $("#secondphraseone").val();
        var four    = $("#secondphrasetwo").val();

        //Get vals with Jquery
        var dataString = {
            one     : one,
            two     : two,
            three   : three,
            four    : four
        }
    	
        //Check
        $.ajax({
          url: "/cs50check",
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

                $("#infocs50").load("static/"+ response["filename"] );

                //Clean
                $('#cs50entry').trigger("reset");
            }

            $("#alertarea").html(alert);
        })
        .fail(function(response){
            alert = '<div class="alert alert-danger" role="alert">';
            alert += "Internal error, try again later.";
            alert += '</div>';
            $("#alertarea").html(alert);
            console.log("Error: ", response);
        });


    });

});