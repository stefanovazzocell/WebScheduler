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
			console.log(req.body);
			console.log(req.body.auth);
			console.log(String(req.body.auth));
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
			// TODO
		},
		// Saves user data
		push: function (req, res) {
			// TODO
		},
		// Updates user info
		update: function (req, res) {
			// TODO
		},
		// Removes user
		deleteme: function (req, res) {
			// TODO
		},
		// Resets auth
		resetauth: function (req, res) {
			// TODO
		},
		// Finds available subs
		getsubs: function (req, res) {
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