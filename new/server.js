'use strict';
/*
* WebScheduler (Version 0.0.2)
* webscheduler.js - main server fuction
* by Stefano Vazzoler (stefanovazzocell@gmail.com)
* https://stefanovazzoler.com/
*/

/*
* Require Node dependencies, config, and global vars
*/

const debug = console.log;

debug('Core - Loading settings');
const settings = require('./config/settings');

debug('Core - Loading dependencies');
const fs = require('fs');
const express = require('express');
const hbs = require('hbs');

/*
* Setup Express
*/

debug('HBS - Loading partials');
hbs.registerPartials(__dirname + '/views/partials');
debug('Express - Setting up');
const app = express();
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'));

/*
* Helpers
*/

function authenticate(req, res, callback) {
	callback(); // TODO
}

const api = {
	ta: {
		push: function (req, res) { // TODO
			//
		},
		pull: function (req, res) { // TODO
			res.send({
				'username': 'Stefano Vazzoler',
				'email': 'stefanovazzocell@gmail.com',
				'course': 'CPSC110',
				'privacy': 0,
				'calendar': api.utils.makeCalendar(),
				'schedule': []
			});
		},
		delete: function (req, res) { // TODO
			//
		},
		reset: function (req, res) { // TODO
			//
		},
		subs: function (req, res) { // TODO
			//
		},
		create: function(username, email, course) {
			return { // TODO
				username: username,
				email: email,
				course: course,
				privacy: 0,
				calendar: api.utils.makeCalendar(),
				schedule: []
			}
		}
	},
	utils: {
		makeCalendar: function () {
			let tmp = [];
			for (let i = 0; i < (settings.app.calendar.to - settings.app.calendar.from) * 7; i += 0.5) {
				tmp.push(0);
			}
			return tmp;
		},
		uiMessage: function () {
			return settings.app.messages[Math.round(Math.random() * (settings.app.messages.length - 1))];
		}
	}
}

/*
* Routes
*/

debug('Express - Setting routes');

app.get('/', function(req, res) {
  res.render('index', {
		title: 'WebScheduler',
		style: 'index',
		scripts: ['ta'],
		message: api.utils.uiMessage()
	});
});

app.get('/admin/', function(req, res) {
  res.render('admin', {
		title: 'WebScheduler Admin',
		style: 'admin',
		scripts: ['admin'],
		message: api.utils.uiMessage()
	});
});

app.get('/admin/*/', function(req, res) {
	let course = req.params[0];
  res.render('admin', {
		title: 'WebScheduler ' + course,
		style: 'admin',
		scripts: ['admin'],
		message: api.utils.uiMessage()
	});
});

app.get('/login/', function(req, res) {
  res.render('login', {
		'title': 'WebScheduler Login',
		'scripts': ['login'],
		message: api.utils.uiMessage()
	});
});

// TA API request
app.post('/api/ta/*', function (req, res) {
	authenticate(req, res, function() {
		switch (req.params[0]) {
			case 'pull':
				api.ta.pull(req, res);
				break;
			case 'push':
				api.ta.push(req, res);
				break;
			case 'delete': // Delete user
				api.ta.delete(req, res);
				break;
			case 'reset': // Reset Auth
				api.ta.reset(req, res);
				break;
			case 'subs':
				api.ta.subs(req, res);
				break;
			default:
				res.status(400);
				res.send();
		}
	});
});

debug('Express - listen');
app.listen(settings.server.port, function () {
  debug('Server started on port ' + settings.server.port);
});
