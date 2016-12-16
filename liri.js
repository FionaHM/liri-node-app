var keys = require('./keys.js');
var fs = require('fs');
var moment = require('moment')
var count = 1;
var continueGame = true;
var Twitter = require('twitter');
var client = new Twitter(keys.twitterKeys);
var logFile = 'log.txt';

var date = moment().format('LLLL');
// last 10 tweets for my twitter account
var params = {screen_name: 'hmfiona', count: 10};
// create a logfile and log initial message to it
var logMessage = '\r\nLog file log.txt created on ' + date + '\r\n' ;
// logs message to console and to logfile
appendLogfileHandler(logMessage);

// function to append to the logfile
function appendLogfileHandler(logMessage){
	// display message on screen
	console.log(logMessage);
	// append to the logfile
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
// create a promise to handle spotify search
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
// promise to handle movie query
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
// promise to handle reading input file
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

// function to display and log error messages
function errorHandler(optionSelected){
	errorMessage = '\r\n****************** Error: '+ optionSelected  + ' *********************\r\nOops there was an error -  likely no valid option selected. \r\n Check your input data and try again.';
	// append errors to the logfile and this also outputs it on the console
	appendLogfileHandler(errorMessage + '\r\n');
}

// function to display song data
function songData(i, response){
	songMessage = '\r\nAlbum Name: ' + response.tracks.items[i].album.name + '\r\n' +
	'Song: ' + response.tracks.items[i].name + '\r\n' +
	'Artist: ' + response.tracks.items[i].artists[0].name + '\r\n' +
	'Preview Link: ' + response.tracks.items[i].preview_url + '\r\n';	
	appendLogfileHandler(songMessage);
}

// function that decides what to do with user input
function handleUserData(optionSelected, userInput){
	switch (optionSelected) {
		case "my-tweets":
			twitterHandler(params).then(function(response) { 
				var twitterMessage = 	'\r\n************* Action Selected: '+ optionSelected  + ' **************************************************************\r\n';
				appendLogfileHandler(twitterMessage);
				for (var i = Object.keys(response).length-1; i >= 0; i--){
					twitterMessage = 'You tweeted: ' + response[i].text + ' on ' + response[i].created_at;
					appendLogfileHandler(twitterMessage + '\r\n');
				}

			}).then(function(){
				
					newGame();
			
			}).catch(function(error){
				errorHandler(optionSelected);
			})
			break;
		case "spotify-this-song":
				var song = userInput;
				spotifyHandler(song).then(function(response) { 
					var songMessage = '\r\n************* Action Selected: '+ optionSelected  + ' *******************************************************';
		 			appendLogfileHandler(songMessage + '\r\n');
					// just display the first song in the response.
					if (Object.keys(response.tracks).length > 0){

						var i = 0;
						songData(i, response);
							
					} 
				}).then(function(){
					
					newGame();
				
				}).catch(function(error) {
					errorHandler(optionSelected);
				})
			break;
		case "movie-this":
		 	var movie = userInput;
		 	requestHandler(movie).then(function(response) {
				var movieData = '\r\n************* Action Selected: '+ optionSelected  + ' *******************************************************';
		 		appendLogfileHandler(movieData);
		 		movieData = '\r\nTitle: ' + response.Title + '\r\n' +
		 		'Release Year: ' + response.Year + '\r\n' +
				'Rating: ' + response.Rated + '\r\n' +
		 		'Country of Origin: ' + response.Country + '\r\n' +
		 		'Language: ' + response.Language + '\r\n' +
		 		'Plot Summary: ' + response.Plot + '\r\n' +
		 		'Actors: ' + response.Actors + '\r\n' +
		 		'Rating: ' + response.imdbRating + '\r\n' +
		 		'Link: ' + response.Poster + '\r\n';
		 		appendLogfileHandler(movieData);
		 	}).then(function(){
					
				newGame();
			
			}).catch(function(error){
		 		errorHandler(optionSelected);
		 	})
			break;
		case "do-what-it-says":
			continueGame = false;	
			var logMessage = '\r\n************************** Action Selected: '+ optionSelected + ' *************************************';
			appendLogfileHandler(logMessage + '\r\n');
			readFileHandler().then(function(response){
				/// response is a string so i need to split it on /n
				// can take in a multi-line file and determine the relevant action - movie-this, spotify-this-song or my-tweets
				var responseLineArr = response.split(/[\n]+/);
				// handle each line in the reponse
				for (var i = 0; i < responseLineArr.length; i++){
					var fileDataArr = responseLineArr[i].split(',');		
					handleUserData(fileDataArr[0], fileDataArr[1]);
				}	
				// user input from text file so don't give option to continue
				
				
			}).catch(function(error){
				errorHandler(optionSelected);
			})
			break;
		default:
			errorHandler("not a valid function");
	}
}
// users npm inquirer to take userinput from the console
function userInputs(){
	count++;
	// inquirer returns a promise so i can use both then and catch for return data and catch errors
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
		// var continueGame = answers.confirmNewGame;
		// calls function to decide what to do with user input
		handleUserData(optionSelected, userInput);	
	}).catch(function(e){
		errorHandler(e);
	})
}

function newGame(){
	// this flag is true initially before it is set by the user
	// console.log(continueGame);
	if (continueGame){
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
				// update the flag based on the user answer
				continueGame = answers.continueGame;
				// start a new game
				if (continueGame){
					userInputs();
				}		
			}).catch(function(e){
				console.log(e)
		})
	} 
	
}

// initial call to get selection from user
userInputs();






