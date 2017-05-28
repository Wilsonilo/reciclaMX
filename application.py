from flask import Flask, jsonify, render_template, request, url_for
from nocache import nocache
from flask_jsglue import JSGlue
from bson import json_util
from bson.objectid import ObjectId
import os
import pymongo
import json

#prepare app
app = Flask(__name__)
app.config['DEBUG'] = True
JSGlue(app)


# establish a connection to the database
connection = pymongo.MongoClient("mongodb://localhost")


#ensure responses aren't cached
if app.config["DEBUG"]:
    @app.after_request
    def after_request(response):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Expires"] = 0
        response.headers["Pragma"] = "no-cache"
        return response


#index
@app.route("/")
@nocache
def index():
    if not os.environ.get("MAPS_API_KEY"):
        raise RuntimeError("MAPS_API_KEY not set")
    return render_template("index.html", key=os.environ.get("MAPS_API_KEY"))

#acerca / about
@app.route("/acerca")
@nocache
def acerca():
    return render_template("acerca.html")

#community
@app.route("/comunidad")
@nocache
def comunidad():

    # select collection
    db = connection.reciclamx
    semarnat = db.semarnat

    #get info from db
    try:
        search = semarnat.find()
    except Exception as e:
        print ("Unexpected error:", type(e), e)

    #send to template
    return render_template("comunidad.html", centros=search)

#postulate
@app.route("/postular")
@nocache
def postular():

    #return template
    return render_template("postular.html")

#donations
@app.route("/donaciones")
@nocache
def donaciones():

    #return template
    return render_template("donaciones.html")

#cs50
@app.route("/cs50")
@nocache
def cs50():

    #return template
    return render_template("cs50.html")


#request mongodb with pymongo and return json
@app.route("/semarnat", methods=["GET"])
@nocache
def semarnat():

    # select collection
    db = connection.reciclamx
    semarnat = db.semarnat

    #declare center (if any)
    center = request.args.get("centro")
    
    #get specific element
    if center != None:

        try:
            query = { '_id': ObjectId(center) }
            search = semarnat.find_one(query)
            docs_list  = search
        except Exception as e:
            print ("Unexpected error:", type(e), e)

   
    else :
        #get all
        try:
            search = semarnat.find()
            docs_list  = list(search)
        except Exception as e:
            print ("Unexpected error:", type(e), e)

    #return
    return json.dumps(docs_list, default=json_util.default) 
   
#cs50
@app.route("/vote", methods=["GET"])
@nocache
def vote():

    # select collection
    db = connection.reciclamx
    semarnat = db.semarnat

    #declare center and type of vote (if any)
    idcentro = request.args.get("id")
    typevote = request.args.get("type")
    if not idcentro or not typevote:
        info = {"response": False, "msg": "Problema con id o tipo de voto"}
        print("Problem with id and type")
    else:

        query = query = { '_id': ObjectId(idcentro) }

        if typevote == "up":
            result = semarnat.update_one(query, { '$inc': { 'votesup': 1 } })

        else:

            result = semarnat.update_one(query, { '$inc': { 'votesdown': 1} })

        #print(result)

        info = {"response": True, "msg": "Voto recibido"}


    #return template
    return jsonify(info)

#load app
if __name__ == '__main__':
    app.run()