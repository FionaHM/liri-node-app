var keys = require('./keys.js');
// console.log(keys.twitterKeys.consumer_key);
// var inputArgsArr = process.argv;

var inquirer = require('inquirer');
var Twitter = require('twitter');
var spotify = require('spotify');

var client = new Twitter(keys.twitterKeys);
// last 20 tweets for my twitter account
var params = {screen_name: 'hmfiona', count: 20};
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
   return new Promise(function(resolve, reject) {	
	// get path, params and callback
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
				// console.log(body) // Show the HTML for the Google homepage.
				resolve(JSON.parse(body));
			} else {
				reject(error);
			}
		})
	})
}


function userInputs(){
	// inquirer returns a promise so i can use then and catch for return data and catch errors
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
		switch (answers.predefinedOptions) {
			case "my-tweets":
				twitterHandler(params).then(function(response) { 
				/* do something with the result */
					for (var i = Object.keys(response).length-1; i >= 0; i--){
						console.log('You tweeted: ' + response[i].text + ' on ' + response[i].created_at)
					}

				}).catch(function(error) {
					console.log("Oops there was an error - tweets could not be retrieved. Please try again later.")
				})
				// maybe call UserInputs again and keep doing until user ends
				break;
			case "spotify-this-song":
					var song = answers.userInput;
					spotifyHandler(song).then(function(response) { 
						// needs to be more DRY
						if (Object.keys(response.tracks).length > 0){
							if (song === "The Sign"){
								// filter for artist =  "The Sign"
								for (var i = 0; i < Object.keys(response.tracks).length; i++){
									if ((response.tracks.items[i].artists[0].name.toUpperCase() === artist.toUpperCase()) && (response.tracks.items[i].name.toUpperCase() === song.toUpperCase())){
										console.log('**************************************');
										console.log('Album Name: ' + response.tracks.items[i].album.name);
										console.log('Song: ' + response.tracks.items[i].name);
										console.log('Artist: ' + response.tracks.items[i].artists[0].name);
										console.log('Preview Link: ' + response.tracks.items[i].preview_url);
									}
								}
							} else {
								// display all results
								for (var i = 0; i < Object.keys(response.tracks).length; i++){
									console.log('**************************************');
									console.log('Album Name: ' + response.tracks.items[i].album.name);
									console.log('Song: ' + response.tracks.items[i].name);
									console.log('Artist: ' + response.tracks.items[i].artists[0].name);
									console.log('Preview Link: ' + response.tracks.items[i].preview_url);
								}
							}

						} 
					}).catch(function(error) {
						console.log("Oops there was an error - songs could not be retrieved. Please check your spelling and try again later.")
					})
				break;
			case "movie-this":
			 	console.log("movie-this");
			 	var movie = answers.userInput;
			 	requestHandler(movie).then(function(response) {
			 		console.log(response);
			 		console.log("Title: " + response.Title);
			 		console.log("Release Year: " + response.Year);
			 		console.log("Rating: " + response.Rated);
			 		console.log("Country of Origin: " + response.Country);
			 		console.log("Language: " + response.Language);
			 		console.log("Plot Summary: " + response.Plot);
			 		console.log("Actors: " + response.Actors);
			 		console.log("Rating: " + response.imdbRating); // rotten tomatoes?
			 		console.log("Link: " + response.Poster);  // rotten tomatoes?
			 	}).catch(function(error){
			 		console.log("Oops there was an error - movie data could not be retrieved. Please try again later.");

			 	})
				break;
			case "do-what-it-says":
				console.log("do-what-it-says");
				break;
			default:
				console.log("Sorry there must have been an error. Try again later,");
}

	
	}).catch(function(e){
		console.log(e)
	})
}

// initial call to get selection from user
userInputs();




