'use strict';
/*
* WebScheduler (Version 0.1.0)
* webscheduler.js - main server fuction
* by Stefano Vazzoler (stefanovazzocell@gmail.com)
* https://stefanovazzoler.com/
*/

/*
* Require Node dependencies
*/

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mClient = require('mongodb').MongoClient;

/*
* Require custom modules
*/

// const dbmanager = require('./modules/dbmanager'); // Database manager
const ipresolver = require('./modules/ipresolver'); // Resolve ip
const gatekeeper = require('./modules/gatekeeper'); // Rate limiting
const api = require('./modules/api'); // Rate limiting

/*
* Helpers
*/

/*
* authenticate(req, res, isAdmin) - Authenticates user
*
* @var req from expressjs' request
* @var res from expressjs' request
* @var isAdmin (optional) true if admin false otherwise
* @returns true if authenticated, false otherwise
*/
function authenticate(req, res, isAdmin = false) {
	if (isAdmin ? api.admin.auth(req, res) : api.ta.auth(req, res)) {
		return true;
	} else {
		gatekeeper.count(req);
		res.status(401);
		res.send();
		return false;
	}
}

/*
* Require Settings
*/

var { port, headers, dburl } = require('./config/general');

/*
* Perform initial checks
*/

// Update port if necessary
port = process.env.PORT || port || 8080;
// Startup gatekeeper
gatekeeper.startup(ipresolver.getIp, function(msg) {
	console.log(msg);
});

/*
* Linking dependencies
*/
app.use(bodyParser.json());

/*
* Adding headers
*/
app.use(function (req, res, next) {
	// If the server is in development
	if (headers['active']) {
		// Allow any origin
		res.setHeader('Access-Control-Allow-Origin', headers['Origin']);
		// Allow GET and POST
		res.setHeader('Access-Control-Allow-Methods', 'POST');
		// Disable cookies
		res.setHeader('Access-Control-Allow-Credentials', false);
		// Allow given Headers
		res.header('Access-Control-Allow-Headers', headers['Headers']);
	}
	// Pass to next layer of middleware
	next();
});

/*
* Routes
*/

// GET not allowed
app.get('*', function (req, res) {
	if (gatekeeper.check(req, res, 'getReq')) {
		// Get requests not allowed
		res.status(405);
		res.send('GET Requests not allowed');
	}
});

// TA API request
app.post('/api/ta/*', function (req, res) {
	if (gatekeeper.check(req, res)) {
		if (authenticate(req, res)) {
			switch (req.params[0]) {
				case 'pull':
					api.ta.pull(req, res);
					break;
				case 'push':
					api.ta.push(req, res);
					break;
				case 'update':
					api.ta.update(req, res);
					break;
				case 'deleteme':
					api.ta.deleteme(req, res);
					break;
				case 'resetauth':
					api.ta.resetauth(req, res);
					break;
				case 'getsubs':
					api.ta.getsubs(req, res);
					break;
				default:
					gatekeeper.count(req);
					res.status(400);
					res.send();
			}
		}
	}
});

// Coordinator API request
app.post('/api/admin/*', function (req, res) {
	if (gatekeeper.check(req, res)) {
		if (authenticate(req, res)) {
			switch (req.params[0]) {
				case 'pull':
					break;
				default:
					gatekeeper.count(req);
					res.status(400);
					res.send();
			}
		}
	}
});

// Not implemented
app.post('*', function (req, res) {
	if (gatekeeper.check(req, res)) {
		gatekeeper.count(req);
		res.status(400);
		res.send();
	}
});

/*
* Connect to DB and start server
*/

// Setup db+api then start
api.setup(dburl, mClient, function () {
	// Start server
	app.listen(port, () => {
		console.log('Server started on port ' + port);
	});
});
