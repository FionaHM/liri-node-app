var keys = require('./keys.js');
var fs = require('fs');
var continueGame = true;
var Twitter = require('twitter');
var client = new Twitter(keys.twitterKeys);
var logFile = 'logfile.txt';
// last 20 tweets for my twitter account
var params = {screen_name: 'hmfiona', count: 20};
// create a logfile and log initial message to it
var logMessage = 'log created on ' +  Date.now() + '\r\n' ;
appendLogfileHandler(logMessage);


function appendLogfileHandler(logMessage){
	console.log(logMessage);
	fs.appendFile(logFile, logMessage, function(err) {
	    if(err) {
	        return console.log(err);
	    }
	}); 
}

// create a promise to handle twitter call as the get API does not itself return a promise (that i could find anyway)
function twitterHandler(params){
   return new Promise(function(resolve, reject) {	
	// get path, params and callback
		client.get('statuses/user_timeline', params, function(error, tweets, response) {
			// resolve if no error or reject if error
			if (!error) {
				resolve(tweets)
			} else {
				reject(error);
			}
		})
	})
}			

function spotifyHandler(song){
	var spotify = require('spotify');
   	return new Promise(function(resolve, reject) {	
		if (song === ""){
			song = "The Sign";
		}
		var exactMatch = '"'+song+'"';
		spotify.search({ type: 'track',  query: exactMatch}, function(err, data) {
			if ( !err ) {
				// make sure there was at least one song in the results returned
				if (data.tracks.items.length !== 0) {
					resolve(data);
				} else {
					// if no songs found - log an error, could be spelling as looks for exact match
					reject(err);
				}			
			} else{
				// handle any connection or retrieval error
				reject(err);
			}
		})
	})
}

function requestHandler(movie){
	return new Promise(function(resolve, reject) {
		var request = require('request');
		if (movie === ""){
			movie = "Mr. Nobody";
		}
		request('https://www.omdbapi.com/?t=' + movie + '&y=&plot=short&r=json', function (error, response, body) {
			if ((!error && response.statusCode == 200)) {
				resolve(JSON.parse(body));
			} else {
				reject(error);
			}
		})
	})
}

function readFileHandler(){
	return new Promise(function(resolve, reject){
		var fs = require("fs");
		fs.readFile('random.txt', 'utf8', function (err, data) {
		   if (!err) {
		    	resolve(data);
		   } else {
		   		reject(err);
		   }
		});
	})
}

function handleUserData(optionSelected, userInput){
	
	switch (optionSelected) {
		case "my-tweets":
			twitterHandler(params).then(function(response) { 
				var twitterMessage = '\r\n************* '+ optionSelected  + ' *********************\r\n';
				appendLogfileHandler(twitterMessage);
				for (var i = Object.keys(response).length-1; i >= 0; i--){
					twitterMessage = 'You tweeted: ' + response[i].text + ' on ' + response[i].created_at;
					appendLogfileHandler(twitterMessage + '\r\n');
				}

			}).catch(function(error) {
				errorHandler(optionSelected);
			})
			break;
		case "spotify-this-song":
				var song = userInput;
				spotifyHandler(song).then(function(response) { 
					var songMessage = '\r\n*************' + optionSelected  + '*********************';
					appendLogfileHandler(songMessage + '\r\n');
					// needs to be more DRY
					if (Object.keys(response.tracks).length > 0){
						if (song === "The Sign"){
							// filter for artist =  "The Sign"
							for (var i = 0; i < Object.keys(response.tracks).length; i++){
								if ((response.tracks.items[i].artists[0].name.toUpperCase() === artist.toUpperCase()) && (response.tracks.items[i].name.toUpperCase() === song.toUpperCase())){
									songData(i, response);
								}
							}
						} else {
							// display all results
							for (var i = 0; i < Object.keys(response.tracks).length; i++){
								songData(i, response);
							}
						}

					} 
				}).catch(function(error) {
					errorHandler(optionSelected);
				})
			break;
		case "movie-this":
		 	var movie = userInput;
		 	requestHandler(movie).then(function(response) {
		 		var movieData = '\r\n************* ' + optionSelected  + ' *********************';
		 		appendLogfileHandler(movieData);
		 		movieData = "'\r\nTitle: " + response.Title + '\r\n' +
		 		"Release Year: " + response.Year + '\r\n' +
				"Rating: " + response.Rated + '\r\n' +
		 		"Country of Origin: " + response.Country + '\r\n' +
		 		"Language: " + response.Language + '\r\n' +
		 		"Plot Summary: " + response.Plot + '\r\n' +
		 		"Actors: " + response.Actors + '\r\n' +
		 		"Rating: " + response.imdbRating + '\r\n' +
		 		"Link: " + response.Poster + '\r\n';
		 		appendLogfileHandler(movieData);
		 	}).catch(function(error){
		 		errorHandler(optionSelected);
		 	})
			break;
		case "do-what-it-says":
			readFileHandler().then(function(response){
				/// response is a string so i need to split it on /n
				var responseLineArr = response.split(/[\n]+/);
				// handle each line in the reponse
				for (var i = 0; i < responseLineArr.length; i++){
					var fileDataArr = responseLineArr[i].split(',');		
					handleUserData(fileDataArr[0], fileDataArr[1]);
				}		
			}).catch(function(error){
				errorHandler(optionSelected);
			})
			break;
		default:
			errorHandler("not a valid function");
		}
}

function songData(i, response){
	songMessage = '\r\nAlbum Name: ' + response.tracks.items[i].album.name + '\r\n' +
	'Song: ' + response.tracks.items[i].name + '\r\n' +
	'Artist: ' + response.tracks.items[i].artists[0].name + '\r\n' +
	'Preview Link: ' + response.tracks.items[i].preview_url + '\r\n' +
	'\r\n**********************************************************************************************\r\n';	
	appendLogfileHandler(songMessage);
}

function errorHandler(optionSelected){
	errorMessage = '\r\n****************** Error: '+ optionSelected  + ' *********************\r\nOops there was an error -  likely no valid option selected. \r\n Check your input data and try again.';
	console.log(errorMessage);
}

function userInputs(){
	// inquirer returns a promise so i can use then and catch for return data and catch errors
	var inquirer = require('inquirer');
	inquirer.prompt([
		{
		    type: 'list',
		    name: 'predefinedOptions',
		    message: 'Please select an option:',
		    choices: ['my-tweets',
			  'spotify-this-song',
			  'movie-this',
			  'do-what-it-says']
	    },
	    {
	    	type: "input",
	    	message: "Please enter a title:",
	    	name: "userInput",
	    	when: function(answers){
	    		if (answers.predefinedOptions === "spotify-this-song"){
	    			return answers.predefinedOptions === "spotify-this-song"
	    		} else if (answers.predefinedOptions === "movie-this"){
	    			return answers.predefinedOptions === "movie-this"
		    	}
	    		
		    }
		}

	]).then(function (answers) {
		// return action, values;
		var optionSelected  =  answers.predefinedOptions;
		var userInput = answers.userInput;
		handleUserData(optionSelected, userInput);	
	}).catch(function(e){
		console.log(e)
	})
}

function newGame(){
	// inquirer returns a promise so i can use then and catch for return data and catch errors
	var inquirer = require('inquirer');
	inquirer.prompt([
		{
		    type: 'confirm',
		    name: 'continueGame',
		    message: 'Would you like to continue? (Y/n)',
		    default: "Y"
	    }
	]).then(function (answers) {
		// return action, values;
		continueGame = answers.continueGame;
	
	}).catch(function(e){
		console.log(e)
	})
}

// initial call to get selection from user
userInputs();






