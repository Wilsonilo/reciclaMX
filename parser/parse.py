#	Parser for directorio.txt 
#	(Structure: line 1: name, line2: address, line3: phone (opt) or email (opt) or website (opt) or category/material)
#	Author: Wilson Munoz
#	www.wilsonmunoz.net
#	Tried to follow https://www.python.org/dev/peps/pep-0008/ sorry if something is not good.

import os
import sys
import re
import json
import urllib.request
import googlemaps

element 		= {} 				# holder for item
elements 		= [] 				# holder for all items
counter 		= 1 				# helper to count the line number we are in
jsonfilename	= "directory.json" 	#json file, extra file for practice reasons
gmaps 			= googlemaps.Client(os.environ.get("MAPS_API_KEY")) #maps Key && call Object

def main():

	#get those globals
	global counter
	global jsonfilename

	if len(sys.argv) != 2:
		print("\nNeed name of file.\nUsage: parse.py \"filename.extension\"\n")
		return 

	nameFile = sys.argv[1]

	file = open(nameFile, "r")
	lines = file.readlines()
	file.close

	#loop each line
	for line in lines:
		line = line.strip()
		proccessLine(line)
		counter += 1

	#send everything to json
	#Making the Json file is an "extra step" for programming/practice reasons and future adjustments.
	sendToJson(elements)

	#after Json is ready we send it to Mongo
	#sendToMongo(jsonfilename)

#Work each line, append to element, send to DB or return.
def proccessLine(line):
	
	#get those globals
	global element
	global counter
	print(line)
	#Work new line to new element 
	if line == "":
		#check if element is empty, if not we send it to mongo else we return
		if bool(element) == False:
			return
		else:
			elements.append(element)
			print(element)
			element = {} 		#reset
			counter = 0 		#reset
			return

	#proccess line, add to to new element
	else:

		#name?
		if counter == 1:
				
			#insert name
			element['name'] = str(line)
			return

		#address
		if counter == 2:

			#get location from address or name in the case if get null from the first one.
			location = askGoogleWhatsup(str(line))
			if len(location) != 0:
				element['location'] = [location[0]['geometry']['location']['lat'], location[0]['geometry']['location']['lng']]

			if 'location' not in element:
				name = str(element.get('name'))
				location = askGoogleWhatsup(name)
				if len(location) != 0:
					element['location'] = [location[0]['geometry']['location']['lat'], location[0]['geometry']['location']['lng']]

			#insert address
			element['address'] = str(line)
			return

		#phone?
		if counter > 2:
			if str(line[0]) == "(" or str(line[0]).isdigit() == True:
				element['phone'] = str(line)
				return

		#email?
		if counter > 2 and re.match(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", str(line)):
			element['email'] = str(line)
			return	

		#website?
		if counter > 2 and str(line[0-2]) == "www":
			element['website'] = str(line)
			return

		#material
		if counter > 2:
			element['material'] = str(line)
			return


#Asks Google for Locations 
def askGoogleWhatsup(string):
	global gmaps
	geocode_result = gmaps.geocode(string)
	return geocode_result

#Inserts "elements" to Json File
def sendToJson(element):

	global jsonfilename

	#open and write
	with open(jsonfilename, 'w') as jsonfile:
		json.dump(element, jsonfile, indent=4, sort_keys=True, ensure_ascii=False)
		jsonfile.close()

	return

#send Json File to Mongo
def sendToMongo(filename):
	return

if __name__ == '__main__':
    main()