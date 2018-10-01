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
var settings;
var sendEmail;
var db_ta, db_admin, db_course;

/*
* genAuth(length)
* @var length (optional) is length of the secret
* @return String being random char
*/
function getAuth(length = 20) {
	// Removed: I l ? / : @ - . _ ~ ! $ & ' ( ) * + , ; =
	// Length 
	var pool = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789';
	var rnd = crypto.randomBytes(length);
	var value = new Array(length);
	var lim = 256 / pool.length;

	for (var i = 0; i < length; i++) {
		  value[i] = pool[Math.floor(rnd[i] / lim)];
	}

	return value.join('');
}

// Making public functions available
module.exports = {
	/*
	* setup(dburl, mClient, mailerFn, givenSettings, callback) - setup db with given url and given mongoclient, then call callback
	*/
	setup: function (dburl, mClient, mailerFn, givenSettings, callback) {
		settings = givenSettings;
		sendEmail = mailerFn;
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
			if (!((req.body.calendar) instanceof Array) || (req.body.calendar).length !== ((settings['fromto'][1] - settings['fromto'][0]) * 7 * 2)) {
				console.log('API / ta.push / Failed check 1');
				res.status(400);
				res.send();
				return false;
			}
			for (let i = 0; i < (req.body.calendar).length; i++) {
				if ((req.body.calendar)[i] !== 0 && (req.body.calendar)[i] !== 1 && (req.body.calendar)[i] !== 2) {
					console.log('API / ta.push / Failed check 2');
					res.status(400);
					res.send();
					return false;
				}
			}
			let time = new Date().getTime();
			db_ta.updateOne({ 'auth': String(req.body.auth) },
				{$set: { calendar: req.body.calendar, lastPush: time }},
				function(err, result) {
					if (err) throw err;
					if (result) {
						res.send(getAuth());
					} else {
						res.status(500);
						res.send();
					}
				});
		},
		// Updates user info
		update: function (req, res) {
			if ((String(req.body.username) < 2 || String(req.body.username) > 40) || 
				(String(req.body.email) < 5 || String(req.body.email) > 200) ||
				(req.body.privacy !== 0 && req.body.privacy !== 1 && req.body.privacy !== 2)) {
				console.log('API / ta.update / Failed check');
				res.status(400);
				res.send();
				return false;
			}
			db_ta.updateOne({ 'auth': String(req.body.auth) },
				{$set: { name: String(req.body.username), email: String(req.body.email), privacy: req.body.privacy }},
				function(err, result) {
					if (err) throw err;
					if (result) {
						res.send();
					} else {
						res.status(500);
						res.send();
					}
				});
		},
		// Removes user
		deleteme: function (req, res) {
			db_ta.deleteOne({ 'auth': String(req.body.auth) },
				function (err, obj) {
					if (err) throw err;
					res.send();
				});
		},
		// Resets auth
		resetauth: function (req, res) {
			let newHash = getAuth();
			db_ta.updateOne({ 'auth': String(req.body.auth) },
				{$set: { name: newHash }},
				function(err, result) {
					if (err) throw err;
					if (result) {
						console.log(newHash);
					} else {
						res.status(500);
						res.send();
					}
				});
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