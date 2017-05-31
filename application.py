#!/usr/bin/python3
# -*- coding: iso-8859-15 -*-

#imports
from flask import Flask, jsonify, render_template, request, url_for
from nocache import nocache
from flask_jsglue import JSGlue
from bson import json_util
from bson.objectid import ObjectId
from datetime import date
import os
import pymongo
import json
import yagmail
import googlemaps

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

#cs50
@app.route("/cs50check", methods=["GET"])
@nocache
def cs50check():

    #answers
    first   = "david"
    second  = "malan"
    third   = "this"
    fourth  = "cs"

    #get info from user
    one     = str(request.args.get("one")).lower().strip()
    two     = str(request.args.get("two")).lower().strip()
    three   = str(request.args.get("three")).lower().strip()
    four    = str(request.args.get("four")).lower().strip()
    print(one, two, three, four)
    if one != first or second != two or third != three or fourth != four:
        info = {"response": False, "msg": "Something is not right."}
    else:
        info = {"response": True, "msg": "Welcome CS50 Alumni!", "filename": "cs50info.html"}

    #return template
    return jsonify(info)


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
        
        #return all
        try:
            search = semarnat.find()
            docs_list  = list(search)
        except Exception as e:
            print ("Unexpected error:", type(e), e)

    #return
    return json.dumps(docs_list, default=json_util.default) 
   
#vote
@app.route("/vote", methods=["GET"])
@nocache
def vote():

    # select collection
    db = connection.reciclamx
    semarnat = db.semarnat

    #declare center and type of vote (if any)
    idcentro = request.args.get("id")
    typevote = request.args.get("type")

    #check user IP
    ipuser   = request.headers.get('X-Forwarded-For', request.remote_addr)
    today    = date.today()
    print(ipuser)
    #check log for votes
    pathtovotes = "{}{}".format(os.path.dirname(os.path.realpath(__file__)), "/votelogs.txt")
    votelogs = open(pathtovotes, "r")
    votes = votelogs.readlines()
    votelogs.close

    if len(votes) > 0:
        datelastvote = votes[0].split(' ')
        if datelastvote != None:

            if str(datelastvote[0]) != str(date.today()):
                
                #We are in a new day.
                votelogs = open(pathtovotes, "w")
                votelogs.write("{} {}\n".format(today, ipuser))
                votelogs.close

            else:

                #check if the user has already voted.
                for vote in votes:
                    
                    #clean to get user ip
                    user = vote.split(' ')
                    userclean = user[1].split('\n')
                    print("{},{}".format( str(userclean[0]), str(ipuser) ))
                    
                    #check ip
                    if str(userclean[0]) == str(ipuser):
                        info = {"response": False, "msg": "Yas has votado el dia de hoy."}
                        return jsonify(info)
                        break

                    else:
                        votelogs = open(pathtovotes, "a")
                        votelogs.write("{} {}\n".format(today, ipuser))
                        votelogs.close
                
    else:
        votelogs = open(pathtovotes, "a")
        votelogs.write("{} {}\n".format(today, ipuser))
        votelogs.close

    if not idcentro or not typevote:
        info = {"response": False, "msg": "Problema con id o tipo de voto"}
        print("Problem with id and type")
    else:

        query = query = { '_id': ObjectId(idcentro) }

        if typevote == "up":
            result = semarnat.update_one(query, { '$inc': { 'votesup': 1 } })

        else:

            result = semarnat.update_one(query, { '$inc': { 'votesdown': 1} })

        info = {"response": True, "msg": "Voto recibido"}


    #return template
    return jsonify(info)

#deal with postulate inserts and adjustments requests.
@app.route("/postajuste", methods=["GET"])
@nocache
def postajuste():

    #check the type
    if request.args.get("type") == None:

        response = { "respone": False, "msg": "No Type."}
        return jsonify(response)

    else:

        if request.args.get("type") == "postular":

            #last attempt for empty fields, trying to avoid injection
            if request.args.get("name") == None or request.args.get("address") == None or request.args.get("material") == None :
                
                response = { "respone": False, "msg": "Nombre, Material y Dirección son campos obligatorios."}
            
            #seems that everything is ok, insert into db
            else:

                #ask Google for coodinates
                gmaps = googlemaps.Client(os.environ.get("MAPS_API_KEY")) #maps Key && call Object
                address = str(request.args.get("address"))
                geocode_result = gmaps.geocode(address)

                #check if have a result or not from Google
                if len(geocode_result) == 0:
                    response = { "respone": False, "msg": "No hemos podido obtener las coordinadas de la dirección proporcionada."}
                    return jsonify(response)
                else:

                    #we have coordinates, create Object to insert
                    newelement = {
                        "name"      : str(request.args.get("name")),
                        "address"   : str(request.args.get("address")),
                        "material"  : str(request.args.get("material")),
                        "location"  : [geocode_result[0]['geometry']['location']['lat'], geocode_result[0]['geometry']['location']['lng']]
                    }

                    #check for optional data
                    # NEED TO PROTECT this.
                    if request.args.get("phone") != None:
                        newelement["phone"] = str(request.args.get("phone"))

                    if request.args.get("email") != None:
                        newelement["email"] = str(request.args.get("email"))

                    if request.args.get("web") != None:
                        newelement["web"] = str(request.args.get("web"))

                    #set flag of postulate
                    newelement["postulate"] = True

                    #once we have everything, we insert
                    db = connection.reciclamx
                    semarnat = db.semarnat

                    result = semarnat.insert_one(newelement)

                    print(result)
                    response = { "respone": True, "msg": "Nuevo centro ha sido agregado a la base de datos. Recuerda que para que aparezca sin el uso de filtros necesita de votos positivos, pide ayuda a la Comunidad."}



        elif request.args.get("type") == "ajuste":

            #last attempt for empty fields, trying to avoid injection
            if request.args.get("name") == None or request.args.get("descp") == None or request.args.get("email") == None :

                response = { "respone": False, "msg": "Necesitamos su nombre, email y descripción para el ajuste."}

            else:

                #prepare and send email
                yag = yagmail.SMTP('USER', 'PW')
                to = 'reciclamxweb@gmail.com'
                subject = 'Peticion de Ajuste'
                html = '<strong>Nombre:</strong>: {} <br> <strong>Email:</strong>: {} <br> <strong>Descripción:</strong>: {}'.format(request.args.get("name"), request.args.get("email"), request.args.get("descp"))

                yag.send(to = to, subject = subject, contents = html)

                response = { "respone": True, "msg": "Hemos Recibido su petición"}


    #return response
    return jsonify(response)

#load app
if __name__ == '__main__':
    app.run()