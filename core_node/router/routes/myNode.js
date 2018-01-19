/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
/*eslint-env node, es6 */
"use strict";
var express = require("express");
var async = require("async");
module.exports = function() {
	var app = express.Router();
	//Hello Router
	app.get("/", (req, res) => {
		res.send("Hello World Node.js");
	});

	//Simple Database Select - In-line Callbacks
	app.get("/example1", (req, res) => {
		var client = req.db;
		client.prepare(
			"select SESSION_USER from \"DUMMY\" ",
			(err, statement) => {
				if (err) {
					res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
					return;
				}
				statement.exec([],
					(err, results) => {
						if (err) {
							res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
							return;
						} else {
							var result = JSON.stringify({
								Objects: results
							});
							res.type("application/json").status(200).send(result);
						}
					});
			});
	});
	
	//Simple Database Select - Async Waterfall
	app.get("/example2", (req, res) => {
		var client = req.db;
		async.waterfall([

			function prepare(callback) {
				client.prepare("select SESSION_USER from \"DUMMY\" ",
					(err, statement) => {
						callback(null, err, statement);
					});
			},

			function execute(err, statement, callback) {
				statement.exec([], function(execErr, results) {
					callback(null, execErr, results);
				});
			},
			function response(err, results, callback) {
				if (err) {
					res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
					return;
				} else {
					var result = JSON.stringify({
						Objects: results
					});
					res.type("application/json").status(200).send(result);
				}
				callback();
			}
		]);
	});
	return app;
};