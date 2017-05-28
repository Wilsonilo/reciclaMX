$(document).ready(function(){
    
    //Activate Tooltip for Sentinel info.
    $('[data-toggle="tooltip"]').tooltip();

    //Listen for clicks for votes
    $(".voteup").click(function(){
    	var id = $(this).attr("data-idcentro");
    	vote(id, "up")
    });

    $(".votedown").click(function(){
    	var id = $(this).attr("data-idcentro");
    	vote(id, "down")
    });


});


//Helpers
function vote(id, type){
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

    	}

    	if(data["response"] === true && type === "down"){

    		$(".votedown[data-idcentro='"+ id +"']").css("color", "red");
    		$(".voteup[data-idcentro='"+ id +"']").css("color", "gray")

    	}

    	//Error
    	if(data["response"] === false){
    		console.log(data["msg"]);
    	}

    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console
        console.log(errorThrown.toString());
    });
}	