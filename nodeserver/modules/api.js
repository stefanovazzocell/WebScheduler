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
var calendarLength;
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
				callbackFn(false);
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
				callbackFn(false);
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
	let reqPrivacy = data['privacy'];
	if ((String(reqUsername) < 2 || String(reqUsername) > 40) || 
		(String(reqEmail) < 5 || String(reqEmail) > 200) ||
		(reqPrivacy !== 0 && reqPrivacy !== 1 && reqPrivacy !== 2)) {
		console.log('API / ta.update / Failed check');
		callbackFn(400);
		return false;
	}
	db_ta.updateOne({ 'auth': String(hash) },
		{$set: { name: String(reqUsername), email: String(reqEmail), privacy: reqPrivacy }},
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

function apiResetAuth(hash, callbackFn, _db) {
	_db.find({ 'auth': String(hash) }).toArray(function(erra, resulta) {
			if (erra) {
				callbackFn(500);
				throw erra;
			}
			if (resulta.length) {
				resulta = resulta[0];
				let newHash = genAuth();
				_db.find({ 'auth': newHash }).toArray(function (errb, resultb) {
					if (erra) {
						callbackFn(500);
						throw erra;
					}
					if (resulta.length) {
						// Another TA with this code exists... Trying again
						console.log('Generation of new ID has conflict, trying again');
						apiTaResetAuth(hash, callbackFn);
					} else {
						_db.updateOne({ 'auth': String(hash) },
						{$set: { auth: newHash }},
						function(errc, resultc) {
							if (errc) {
								callbackFn(500);
								throw errc;
							}
							if (resultc) {
								console.log('New hash: ' + newHash);
								let message = 'Hi, ' + resulta['name'] + '!<br>';
								message += 'Your access code for the scheduler 📅 is <a href=":domain:/#' + newHash + '">' + newHash + '</a>.<br>';
								message += 'You can either click on the link above or simply copy the code into the scheduler to login.<br><br>';
								message += 'Have a great day,';
								message += 'A ' + resulta['course'] + ' robot 🤖';
								sendEmail(resulta['course'], resulta['email'], resulta['course'] + ' Scheduler Password', message, function () {
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

function apiTaResetAuth(hash, callbackFn) {
	apiResetAuth(hash, callbackFn, db_ta);
}

function apiTaAdd(data, sendEmail, callbackFn) {
	// data = 'name', 'course', 'email'
	let calendar = [];
	for (let i = 0; i < calendarLength; i++) {
		calendar.push(2);
	}
	var newTa = {
		'_id': (data['course'] + '#' + data['email']),
		'name': data['name'],
		'course': data['course'],
		'email': data['email'],
		'auth': (genAuth() + '_new'),
		'privacy': 1,
		'calendar': calendar,
		'schedule': {},
		'lastPush': 0
	};
	db_ta.insertOne(newTa, function(err, result) {
			if (err) {
				callbackFn(500);
				throw err;
			} else {
				if (sendEmail) {
					apiResetAuth(hash, callbackFn, db_ta);
				} else {
					callbackFn(0);
				}
			}
		});
}

function apiAdminAuth(hash, callbackFn) {
	db_admin.find({ 'auth': String(hash) }).toArray(function(err, result) {
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

function apiAdminCourseAdd(hash, courseName, callbackFn) {
	var newCourse = {
		'_id': courseName,
		'items': []
	};
	db_course.insertOne(newCourse, function(err, result) {
			if (err) {
				callbackFn(500);
				throw err;
			} else {
				db_admin.updateOne({ 'auth': String(hash) },
					{$push: { courses: courseName }},
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
		});
}

function apiAdminCourseRemove(courseName, callbackFn) {
	// TODO
}

function apiAdminItemAdd(course, data, callbackFn) {
	// TODO
	// data = 'name', 'type', 'room', 'needed', 'day', 'from', 'to'
}

function apiAdminItemEdit(course, data, callbackFn) {
	// TODO
	// data = 'name' -> 'type', 'room', 'needed', 'day', 'from', 'to'
}

function apiAdminItemRemove(course, name, callbackFn) {
	// TODO
}

function apiAdminNew(name, callbackFn) {
	// TODO
}

function apiAdminDelete(hash, callbackFn) {
	db_admin.deleteOne({ 'auth': String(hash) },
		function (err, obj) {
			if (err) {
				callbackFn(500);
				throw err;
			}
			callbackFn(0);
		});
}

function apiAdminResetAuth(hash, callbackFn) {
	apiResetAuth(hash, callbackFn, db_admin);
}

function apiAdminGet(hash, callbackFn) {
	db_admin.find({ 'auth': String(hash) }).toArray(function(err, result) {
			if (err) {
				callbackFn(false);
				throw err;
			}
			if (result.length) {
				callbackFn(result[0]);
			} else {
				callbackFn(false);
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
		calendarLength = (settings['fromto'][0] - settings['fromto'][0]) * 7 * 2;
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
			apiTaSetAcct(req.body.auth, {'username': req.body.username, 'email': req.body.email, 'privacy': req.body.privacy }, function(code) {
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
		// Authenticate admin
		auth: function (req, res, callbackFn) {
			apiAdminAuth(req.body.auth, callbackFn);
		},
		// Add a course
		get: function(req, res) {
			apiAdminGet(req.body.auth, function (result) {
				if (result === false) {
					res.status(500);
					res.send();
				} else {
					let toReturn = { 'username': result['name'], 'email': result['email'], 'courses': result['courses'] };
					res.send(toReturn);
				}
			});
		},
		// Resets auth
		resetauth: function (req, res) {
			apiAdminResetAuth(req.body.auth, function (code) {
				autoCallback(res, code);
			});
		},
		deleteme: function (req, res) {
			// Not Allowed
			autoCallback(res, 400);
		},
		// Add a course
		courseAdd: function(req, res) {
			apiAdminCourseAdd(req.body.auth, req.body.courseName, function(code) {
				autoCallback(res, code);
			});
		},
		// Remove a course
		courseRemove: function(req, res) {
			//
		},
		// Creates a new ta
		taAdd: function (req, res) {
			let sendEmail = true;
			if (req.body.sendEmail === false) {
				sendEmail = false;
			}
			apiTaAdd({
				'name': String(req.body.taName),
				'course': String(req.body.taCourse),
				'email': String(req.body.taEmail)
			}, sendEmail, function (code) {
				autoCallback(res, code);
			});
		},
		// Removes a ta
		taRemove: function (req, res) {
			apiTaDelete(req.body.taHash, function (code) {
				autoCallback(res, code);
			});
		},
		// Gets a ta
		taGet: function (req, res) {
			apiTaGet(req.body.taAuth, function(result) {
				if (result === false) {
					res.status(500);
					res.send();
				} else {
					let toReturn = { '_id': result['_id'], 'hash': result['hash'], 'username': result['name'], 'email': result['email'], 'course': result['course'], 'privacy': result['privacy'],  'calendar': result['calendar'], 'schedule': result['schedule']};
					res.send(toReturn);
				}
			});
		},
		// Password resets a ta
		taResetAuth: function (req, res) {
			apiTaResetAuth(req.body.taAuth, function (code) {
				autoCallback(res, code);
			});
		},
	}
}