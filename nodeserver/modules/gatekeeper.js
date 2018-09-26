'use strict';
/*
* WebScheduler (Version 0.1.0)
* gatekeeper.js - Rate limiting utility
* by Stefano Vazzoler (stefanovazzocell@gmail.com)
* https://stefanovazzoler.com/
*/

// Require Config
const { trigger, resetTime } = require('./../config/gatekeeper');
// NOTE: ResetTime is in minutes

// Users that are being 
var access = {};
var banned = [];
var isDev = false;
var msg = function (x) {
	console.log(x);
}
var getIp = function (x) {
	// Call startup to setup
	return 'uninitialized';
}

/*
* count(id) - counts an user view
*
* @var id to be a user id string
*/
function addToUser(id) {
	// Check if it's a new ID
	if (! access.hasOwnProperty(id)) {
		// Add id to list and update value
		access[id] = 1;
	} else {
		// Update id value
		access[id] += 1;
	}
}

/*
* isBanned(id) - Checks if id is banned
*
* @return true if banned, false otherwise
*/
function isBanned(id) {
	return (access[id] > trigger);
}

/*
* resetAccess() - Resets Access DB
*/
function resetCounter() {
	access = {};
	msg('resetCounter() - OK');
}

/*
* count(req) - Counts visit and checks if user is allowed
*
* @var req to be null or valid expressjs request
* @return true if user is allowed, false otherwise
*/
function count(req) {
	var id = getIp(req);
	// Check if user is banned or maxed
	if (isBanned(id)) {
		return false;
	}
	// Count
	addToUser(id);
}

// Making public functions available
module.exports = {
	// Export count
	count: count,
	/*
	* check(req, res) - Check if user allowed, auto ban otherwise
	*
	* @var req to be a valid express request
	* @var res to be a valid express response
	* @returns true if user is allowed, false otherwise
	*/
	check: function (req, res) {
		var id = getIp(req);
		if (! isBanned(id)) {
			// Continue execution
			return true;
		} else {
			res.status(403);
			res.send();
			// Stop execution
			return false;
		}
	},
	/*
	* startup(getIpUtil, msgUtil) - Starts up gatekeeper's resets
	*
	* @var getIpUtil to be a getIp utility from ipresolver.js package
	* @var msgUtil to be a message utility
	*/
	startup: function (getIpUtil, msgUtil) {
		// Save the msg & getIpUtil utility and the mode
		msg = msgUtil;
		getIp = getIpUtil;
		// At some random time (between 0 and 60 seconds) set ban timer
		setTimeout(function () {
			// Start Reset Ban Timer
			setInterval(resetCounter, resetTime * 60 * 1000);
			if (isDev) msg('Started resetBan interval', 'log');
		}, (Math.random() * 60 * 1000));
		// Report completed startup
		msg('Startup of gatekeeper initiated', 'log');
	}
}
