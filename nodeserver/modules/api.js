'use strict';
/*
* WebScheduler (Version 0.1.0)
* api.js - Utilities for API calls
* by Stefano Vazzoler (stefanovazzocell@gmail.com)
* https://stefanovazzoler.com/
*/

/*
* Require Node dependencies
*/

var db;
var db_ta, db_admin, db_course;

// Making public functions available
module.exports = {
	/*
	* setup(dburl, mClient, callback) - setup db with given url and given mongoclient, then call callback
	*/
	setup: function (dburl, mClient, callback) {
		mClient.connect(dburl, { useNewUrlParser: true }, (err, client) => {
			if (err) {
				throw err;
			}
			db = client.db('webscheduler');
			db_ta = db.collection("ta");
			db_admin = db.collection("admin");
			db_course = db.collection("course");
			console.log('DB Setup completed');
			callback();
		});
	},
	ta: {
		// Authenticate user
		auth: function (req, res, callbackFn) {
			db_ta.find({ 'auth': String(req.body.auth) }).toArray(function(err, result) {
				if (err) throw err;
				if (result.length) {
					callbackFn(true);
				} else {
					callbackFn(false);
				}
			});
		},
		// Sends user data
		pull: function (req, res) {
			db_ta.find({ 'auth': String(req.body.auth) }).toArray(function(err, result) {
				if (err) throw err;
				if (result.length) {
					result = result[0];
					let toReturn = { 'username': result['name'], 'email': result['email'], 'course': result['course'], 'privacy': result['privacy'],  'calendar': result['calendar'], 'schedule': result['schedule']};
					res.send(toReturn);
				} else {
					res.status(500);
					res.send();
				}
			});
		},
		// Saves user data
		push: function (req, res) {
			res.send('OK');
			// TODO
		},
		// Updates user info
		update: function (req, res) {
			res.send('OK');
			// TODO
		},
		// Removes user
		deleteme: function (req, res) {
			res.send('OK');
			// TODO
		},
		// Resets auth
		resetauth: function (req, res) {
			res.send('OK');
			// TODO
		},
		// Finds available subs
		getsubs: function (req, res) {
			res.send('OK');
			// TODO
		}
	},
	admin: {
		// Authenticate user
		auth: function (req, res, callbackFn) {
			// TODO
			callbackFn(false);
		}
	}
}