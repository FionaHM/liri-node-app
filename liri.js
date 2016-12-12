var keys = require('./keys.js');
// console.log(keys.twitterKeys.consumer_key);
// var inputArgsArr = process.argv;

var inquirer = require("inquirer");
var Twitter = require('twitter');

var client = new Twitter(keys.twitterKeys);



/// i put in my screen name to get my tweets

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

// twitterHandler(params).then(function(response) { 
// 	/* do something with the result */
// 	for (var i = Object.keys(response).length-1; i >= 0; i--){
// 		console.log('You tweeted: ' + response[i].text + ' on ' + response[i].created_at)
// 	}
	
// }).catch(function(error) {
// 	console.log("Oops there was an error - tweets could not be retrieved. Please try again later.")
// })

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
	
		console.log( answers);
		// return action, values;
		switch (answers.predefinedOptions) {
			case "my-tweets":
			 	console.log("my-tweets");
				twitterHandler(params).then(function(response) { 
				/* do something with the result */
					for (var i = Object.keys(response).length-1; i >= 0; i--){
					console.log('You tweeted: ' + response[i].text + ' on ' + response[i].created_at)
					}

				}).catch(function(error) {
					console.log("Oops there was an error - tweets could not be retrieved. Please try again later.")
				})
				break;
			case "spotify-this-song":
				console.log("spotify-this-song");
				break;
			case "movie-this":
				console.log("movie-this");
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




