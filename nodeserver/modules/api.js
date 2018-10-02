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

const crypto = require('crypto');

/*
* Get Settings
*/

var db;
var settings;
var sendEmail; // sendEmail(sendfrom, sendto, subject, message, callbackFn)
var db_ta, db_admin, db_course;

/*
* genAuth(length)
* @var length (optional) is length of the secret
* @return String being random char
*/
function genAuth(length = 20) {
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

/*
* API Helpers
* NOTE: Skipping purpose (name must be descriptive)
*/

function autoCallback(res, code) {
	if (code === 0) {
		res.send();
	} else {
		res.status(code);
		res.send();
	}
}

function apiTaAuth(hash, callbackFn) {
	db_ta.find({ 'auth': String(hash) }).toArray(function(err, result) {
			if (err) {
				callbackFn(500);
				throw err;
			}
			if (result.length) {
				callbackFn(true);
			} else {
				callbackFn(false);
			}
		});
}

function apiTaGet(hash, callbackFn) {
	db_ta.find({ 'auth': String(hash) }).toArray(function(err, result) {
			if (err) {
				callbackFn(500);
				throw err;
			}
			if (result.length) {
				callbackFn(result[0]);
			} else {
				callbackFn(false);
			}
		});
}

function apiTaSetCalendar(hash, calendar, callbackFn) {
	if (!((calendar) instanceof Array) || (calendar).length !== ((settings['fromto'][1] - settings['fromto'][0]) * 7 * 2)) {
		console.log('API / ta.push / Failed check 1');
		callbackFn(400);
		return false;
	}
	for (let i = 0; i < (calendar).length; i++) {
		if ((calendar)[i] !== 0 && (calendar)[i] !== 1 && (calendar)[i] !== 2) {
			console.log('API / ta.push / Failed check 2');
			callbackFn(400);
			return false;
		}
	}
	let time = new Date().getTime();
	db_ta.updateOne({ 'auth': String(hash) },
		{$set: { calendar: calendar, lastPush: time }},
		function(err, result) {
			if (err) {
				callbackFn(500);
				throw err;
			}
			if (result) {
				callbackFn(0);
			} else {
				callbackFn(500);
			}
		});
}

function apiTaSetAcct(hash, data, callbackFn) {
	let reqUsername = (data['username']).replace(/&/g,'_').replace(/</g,'_').replace(/>/g,'_');
	let reqEmail = (data['email']).replace(/&/g,'_').replace(/</g,'_').replace(/>/g,'_');
	if ((String(reqUsername) < 2 || String(reqUsername) > 40) || 
		(String(reqEmail) < 5 || String(reqEmail) > 200) ||
		(req.body.privacy !== 0 && req.body.privacy !== 1 && req.body.privacy !== 2)) {
		console.log('API / ta.update / Failed check');
		callbackFn(400);
		return false;
	}
	db_ta.updateOne({ 'auth': String(hash) },
		{$set: { name: String(reqUsername), email: String(reqEmail), privacy: req.body.privacy }},
		function(err, result) {
			if (err) {
				callbackFn(500);
				throw err;
			}
			if (result) {
				callbackFn(0);
			} else {
				callbackFn(500);
			}
		});
}

function apiTaDelete(hash, callbackFn) {
	db_ta.deleteOne({ 'auth': String(hash) },
		function (err, obj) {
			if (err) {
				callbackFn(500);
				throw err;
			}
			callbackFn(0);
		});
}

function apiTaResetAuth(hash, callbackFn) {
	db_ta.find({ 'auth': String(hash) }).toArray(function(erra, resulta) {
			if (erra) {
				callbackFn(500);
				throw erra;
			}
			if (resulta.length) {
				resulta = resulta[0];
				let newHash = genAuth();
				db_ta.find({ 'auth': newHash }).toArray(function (errb, resultb) {
					if (erra) {
						callbackFn(500);
						throw erra;
					}
					if (resulta.length) {
						// Another TA with this code exists... Trying again
						console.log('Generation of new ID has conflict, trying again');
						apiTaResetAuth(hash, callbackFn);
					} else {
						db_ta.updateOne({ 'auth': String(hash) },
						{$set: { auth: newHash }},
						function(errc, resultc) {
							if (errc) {
								callbackFn(500);
								throw errc;
							}
							if (resultc) {
								console.log('New hash: ' + newHash);
								let message = 'Hello, ' + resulta['name'] + '<br>'
								message += 'Your authentication code has been reset.<br>';
								message += 'The new code is <a href=":domain:/#' + newHash + '">' + newHash + '</a>.<br>';
								message += 'Have a great day!';
								sendEmail('', resulta['email'], 'Password Reset', message, function () {
									callbackFn(0);
								});
							} else {
								callbackFn(500);
							}
						});
					}
				});
			} else {
				callbackFn(500);
			}
		});
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
			apiTaAuth(req.body.auth, callbackFn);
		},
		// Sends user data
		pull: function (req, res) {
			apiTaGet(req.body.auth, function(result) {
				if (result === false) {
					res.status(500);
					res.send();
				} else {
					let toReturn = { 'username': result['name'], 'email': result['email'], 'course': result['course'], 'privacy': result['privacy'],  'calendar': result['calendar'], 'schedule': result['schedule']};
					res.send(toReturn);
				}
			});
		},
		// Saves user data
		push: function (req, res) {
			apiTaSetCalendar(req.body.auth, req.body.calendar, function(code) {
				autoCallback(res, code);
			});
		},
		// Updates user info
		update: function (req, res) {
			apiTaSetAcct(req.body.auth, {'username': req.body.username, 'email': req.body.email}, function(code) {
				autoCallback(res, code);
			});
		},
		// Removes user
		deleteme: function (req, res) {
			apiTaDelete(req.body.auth, function (code) {
				autoCallback(res, code);
			});
		},
		// Resets auth
		resetauth: function (req, res) {
			apiTaResetAuth(req.body.auth, function (code) {
				autoCallback(res, code);
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