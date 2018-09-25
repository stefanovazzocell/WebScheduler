'use strict';

var tmp_calendar = [];
var tmp_userSchedule = [];
var subs = {};

var dynamic = {
	'tool': 1,
	'mouseMsg': false,
	'mouseMsgTimeout': false,
	'sel_start': false,
	'isTouch': false,
	'hasLocalStorage': (typeof(Storage) !== "undefined"),
	'bigIcons': false
};

var account = {
	'authHash': window.location.hash.slice(1),
	'username': 'TA',
	'course': 'CPSC110',
	'email': 'ta@localhost',
	'privacy': 2
}

// "Constant" settings
var settings = {
	'days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
	'fromto': [8, 21]
}

/*
* commitToLS(caldr, settng) - commits calendar and env to local storage, autosets itself to commit every 30 seconds
* @val caldr (optional) 0 do nothing, -1 retrive, 1 save calendar
* @val settng (optional) 0 do nothing, -1 retrive, 1 save settings
*/
function commitToLS(caldr = 0, settng = 0) {
	if (dynamic['hasLocalStorage']) {
		// Calendar
		if (caldr === -1 && localStorage.getItem('calendar') != null) {
			// Retrive
			tmp_calendar = JSON.parse(localStorage.getItem('calendar'));
			$('#draft').show();
		} else if (caldr === 1) {
			// Save
			localStorage.setItem('calendar', JSON.stringify(tmp_calendar));
		}
		// Settings
		if (settng === -1 && localStorage.getItem('bigIcons') != null) {
			// Retrive
			if (localStorage.getItem('bigIcons') !== (dynamic['bigIcons'] ? 'true' : 'false')) {
				toggleTouch();
			}
		} else if (settng === 1) {
			// Save
			localStorage.setItem('bigIcons', JSON.stringify(dynamic['bigIcons']));
		}
	}
}

/*
* schedule(at, value) - Sets or gets the schedule
* @val (optional) at is index of value or -1 for overwrite or select all
* @val (optional) value to set or entire schedule if -1 for overwrite
* @returns the value at index or all if at = -1
*/
function schedule(at = -1, value = null) {
	if (value === null) {
		if (at === -1) {
			// Return all
			return tmp_userSchedule;
		} else {
			// Return index
			return tmp_userSchedule[at];
		}
	} else {
		if (at === -1) {
			// Overwrites the schedule
			tmp_userSchedule = value;
		} else {
			// Sets the value at index
			tmp_userSchedule[at] = value;
		}
	}
}

/*
* calendar(at, value) - sets or gets the calendar
* @val (optional) at is index of value or -1 for overwrite or select all
* @val (optional) value to set or entire calendar if -1 for overwrite
* @returns the value at index or all if at = -1
*/
function calendar(at = -1, value = null) {
	if (value === null) {
		if (at === -1) {
			// Return all
			return tmp_calendar;
		} else {
			// Return index
			return tmp_calendar[at];
		}
	} else {
		if (at === -1) {
			// Overwrites the calendar
			tmp_calendar = value;
		} else {
			// Sets the value at index
			tmp_calendar[at] = value;
		}
	}
}

/*
* makeEmptyCalendar() - Makes an empty calendar
*/
function makeEmptyCalendar() {
	let tmp = [];
	for (let i = 0; i < (settings['fromto'][1] - settings['fromto'][0]) * 7; i+=0.5) {
		tmp.push(0); // Add 0 to the calendar
	}
	calendar(-1, tmp);
}

/*
* calendarAt(day, time, value, updateUI)
* @var day is the day of the week from 0 to 6 (0 is monday)
* @var time is the from time (hour + 0.5 if 30)
* @var value (optional) is the availability value to set
* @var updateUI (optional) if true refreshes screen
* @return value if value not defined
*/
function calendarAt(day, time, value = undefined, updateUI = false) {
	if (value === undefined) {
		return calendar((time - settings['fromto'][0]) * 2 + (settings['fromto'][1] - settings['fromto'][0]) * 2 * day);
	} else {
		$('#draft').show();
		calendar((time - settings['fromto'][0]) * 2 + (settings['fromto'][1] - settings['fromto'][0]) * 2 * day, value);
		if (updateUI) {
			setAvailability(day, time, value);
		}
	}
}

/*
* isThisNow(day, time, delta, updateUI) - checks if the given day + time is now
* @var day is the day of the week from 0 to 6 (0 is monday)
* @var time is the from time (hour + 0.5 if 30)
* @var delta (optional) is used to calculate the timeframe (0.5 = 30 minutes)
* @var updateUI (optional) if true it updates the UI to highlight the current day
*/
function isThisNow(day, time, delta = 0.5, updateUI = false) {
	let now = new Date();
	let timeNow = now.getHours();
	let dayNow = (now.getDay() + 6) % 7;
	if (updateUI) {
		let targetTime = timeNow;
		if (now.getMinutes() >= 30) {
			targetTime += 0.5;
		}
		$('.now').removeClass('now');
		$('td[data-day="' + dayNow + '"][data-time="' + targetTime + '"]').addClass('now');
	}
	timeNow += (now.getMinutes() / 60);
	return ((day == dayNow) && (time <= timeNow) && (timeNow <= time + delta));
}

/*
* uiMessage() - loads the custom welcome message for a TA
*/
function uiMessage() {
	let messages = [
		'<code>(string-append "Hello" "World")</code>',
		'<code>System.out.println("Hello World");</code>',
		'<code>printf("Hello, World");</code>',
		'<b>g.exe 🧔</b>',
		'<b>' + account['course'] + ' rocks! 🤘</b>',
		'<b>Have a nice day! ⛅</b>',
		'<b>Be awesome! ✨</b>',
		'<b>' + account['username'].split(' ')[0].substring(0,15) + ', you\'re awesome! 😄</b>',
		'<i>📧 Trey, we have a problem.</i>',
		'<b>Have lots of fun! 💻</b>',
		'<b>Autograder is on fire 🔥</b>',
		'<b>Follow the recipe 📖</b>',
		'<b>Follow the recipe 📖</b>'
	];
	let message = messages[getRandom(0, messages.length -1)];
	$('.message').html(message);
}

/*
* drawCalendar() - Redraws the calendar
*/
function drawCalendar() {
	let outputHtml = '';
	for (let time = settings['fromto'][0]; time < settings['fromto'][1]; time+=0.5) {
		outputHtml += '<tr>';
		// --- TIME ---
		let pre = Math.trunc(time) % 12;
		let post = pre;
		if ((time % 12) - pre == 0) {
			if (pre == 0) {
				pre = 12;
				post = 12;
			}
			pre += ':00';
			post += ':30';
		} else {
			if (pre == 0) {
				pre = 12;
			}
			pre += ':30';
			post += 1;
			post += ':00';
		}
		// --- TIME ---
		outputHtml += '<th scope="row" data-hour=' + time + '>' + pre + '</th>';
		//outputHtml += '<th scope="row" data-hour=' + time + '>' + post + '</th>';
		for (let day = 0; day < 7; day++) {
			let message = '';
			let userSchedule = schedule();
			for (var i = 0; i < userSchedule.length; i++) {
				if (userSchedule[i]['day'] == day && userSchedule[i]['from'] <= time && userSchedule[i]['to'] > time) {
					if (message != '') {
						message += ', ';
					}
					message += userSchedule[i]['title'];
				}
			}
			let isNowClass = '';
			if (isThisNow(day, time)) {
				isNowClass = ' now';
			}
			let ctype = ''
			switch (calendar(((time - settings['fromto'][0]) * 2) + (day * (settings['fromto'][1] - settings['fromto'][0]) * 2))) {
				case 0:
					ctype = 'success';
					break;
				case 1:
					ctype = 'warning';
					break;
				case 2:
					ctype = 'danger';
					break;
			}
			outputHtml += '<td class="table-' + ctype + isNowClass + '" data-day="' + day + '" data-time="' + time + '">' + message + '</td>';
		}
		outputHtml += '</tr>';
	}
	$('#calendar').html(outputHtml);
	setEventListeners();
	$('#alert-loading').hide();
}

/*
* changeTool(tool)
* @var tool is [0,1,2] indicating which tool is selected
*/
function changeTool(tool) {
	// Reset UI
	$('#tool > button').removeClass('font-weight-bold');
	// Choose new mode
	switch (tool) {
		case 0: // Available
			$('.tool').html('Available');
			dynamic['tool'] = 0;
			$('#tool > .btn-success').addClass('font-weight-bold');
			break;
		case 1: // Prefer Not
			$('.tool').html('Prefer Not');
			dynamic['tool'] = 1;
			$('#tool > .btn-warning').addClass('font-weight-bold');
			break;
		case 2: // Not Available
			$('.tool').html('Not Available');
			dynamic['tool'] = 2;
			$('#tool > .btn-danger').addClass('font-weight-bold');
			break;
	}
}
var g={exe:'https://www.youtube.com/watch?v=HXcSGuYUkDg'};

/*
* setAvailability(day, time, tool) - Sets the availability for a given time slot
* @var day is the day of the week from 0 to 6 (0 is monday)
* @var time is the from time (hour + 0.5 if 30)
* @var tool (optional) is the availability value to set
*/
function setAvailability(day, time, tool = dynamic['tool']) {
	calendarAt(day, time, tool);
	$('td[data-day="' + day + '"][data-time="' + time + '"]').removeClass('table-success');
	$('td[data-day="' + day + '"][data-time="' + time + '"]').removeClass('table-warning');
	$('td[data-day="' + day + '"][data-time="' + time + '"]').removeClass('table-danger');
	switch (tool) {
		case 0:
			$('td[data-day="' + day + '"][data-time="' + time + '"]').addClass('table-success');
			break;
		case 1:
			$('td[data-day="' + day + '"][data-time="' + time + '"]').addClass('table-warning');
			break;
		case 2:
			$('td[data-day="' + day + '"][data-time="' + time + '"]').addClass('table-danger');
			break;
	}
}

/*
* setupSubs() - Updates the ui to show the list of subs
*/
function setupSubs() {
	if (Object.keys(subs).length === 0) {
		$('#subid').hide();
		$('#sublist').html('You do not have any compatible labs or lectures on your schedule');
	} else {
		let out = '';
		Object.keys(subs).forEach(function(key,index) {
			out += '<option value="' + key + '">' + key + '</option>';
		});
		$('#subid').html(out).show();
		getSubs();
	}
}

/*
* getSub() - Updates the ui to show the subs for the selected option
*/
function getSubs() {
	let item = $('#subid').val();
	let out = '<h4>Subs for ' + item + '</h4>';
	out += '<b>Available</b><br>';
	for (let i = 0; i < subs[item]['Available'].length; i++) {
		out += subs[item]['Available'][i] + '<br>';
	}
	out += '<b>Prefer Not</b><br>';
	for (let i = 0; i < subs[item]['Prefer Not'].length; i++) {
		out += subs[item]['Prefer Not'][i] + '<br>';
	}
	$('#sublist').html(out);
}

/*
* toggleTouch() - Toggles touch mode on and off
*/
function toggleTouch() {
	dynamic['bigIcons'] = !dynamic['bigIcons'];
	commitToLS(0,1);
	// Resize elements
	$('table').toggleClass('table-sm');
	$('.btn-group').toggleClass('btn-group-sm');
	$('.btn').toggleClass('btn-sm');
	$('input[type="button"]').toggleClass('btn-sm');
	$('.btn-only-sm').addClass('btn-sm');
	$('.input-group').toggleClass('input-group-sm');
}

/*
* getRandom(min, max) - generates a random number
* @var min is smallest number (inclusive)
* @var max is biggest number (inclusive)
* @return random integer in specified range
*/
function getRandom(min, max) {
	return Math.round(Math.random() * (max - min) + min);
}

/*
* resetPassword() - Resets the user password
*/
function resetPassword() {
	if (confirm('This will log you out, are you sure?')) {
		resetauth();
	}
}

/*
* addMouseMsg(message) - adds a mouse message
* @var message is message to show
*/
function addMouseMsg(message) {
	clearTimeout(dynamic['mouseMsgTimeout']);
	dynamic['mouseMsg'] = message;
	dynamic['mouseMsgTimeout'] = setTimeout(resetMouseMsg, 1500);
}

/*
* resetMouseMsg() - removes the mouse message
*/
function resetMouseMsg() {
	dynamic['mouseMsg'] = false;
	$('#mouseMsg').html('');
}

/*
* showSelectionMsg(day, time) - shows the selection as a mouse message
* @var day is the day of the week from 0 to 6 (0 is monday)
* @var time is the from time (hour + 0.5 if 30)
*/
function showSelectionMsg(day, time) {
	if (dynamic['sel_start'] === false) {
		let timeFormat = time + ':00 to ' + time + ':30';
		if (Math.trunc(time) != time) {
			timeFormat = Math.trunc(time) + ':30 to ' + Math.trunc(time + 1) + ':00';
		}
		addMouseMsg(settings['days'][day] + ', ' + timeFormat);
	} else {
		let dtFormat = settings['days'][Math.min(day, dynamic['sel_start'][0])] + ' to ' + settings['days'][Math.max(day, dynamic['sel_start'][0])] + ', ';
		if (day == dynamic['sel_start'][0]) dtFormat = settings['days'][day] + ', ';
		let timeStart = Math.min(time, dynamic['sel_start'][1]);
		let timeEnd = Math.max(time, dynamic['sel_start'][1]) + 0.5;
		if (Math.trunc(timeStart) == timeStart) {
			dtFormat += timeStart + ':00 to '
		} else {
			dtFormat += Math.trunc(timeStart) + ':30 to '
		}
		if (Math.trunc(timeEnd) == timeEnd) {
			dtFormat += timeEnd + ':00'
		} else {
			dtFormat += Math.trunc(timeEnd) + ':30'
		}
		addMouseMsg(dtFormat);
	}
}

/*
* deleteAccount() - Deletes the user password
*/
function deleteAccount() {
	let challenge = [
		getRandom(0,100), // Initial
		getRandom(0,100), // Add
		getRandom(3,10),  // Power
		getRandom(0,100), // Mod
	];
	challenge[4] = Math.pow((challenge[0] + challenge[1]),  challenge[2]) % challenge[3];
	if (confirm('This will delete your schedule from the server and delete your account, are you sure?')) {
		// Check if TA drinked too much at the TA social
		if (parseInt(prompt('What is the result of (modulo (expt (+ ' + challenge[0] + ' ' + challenge[1] + ') ' + challenge[2] + ') ' + challenge[3] + ') ?')) == challenge[4]) {
			deleteme();
		} else {
			alert('Did you drink too much at the TA social?\nDeletion denied');
		}
	}
}

/*
* yourNextClass() - Shows a message indicating the next class for a given TA
*/
function yourNextClass() {
	let message = '';
	let now = new Date();
	let timeNow = now.getHours();
	timeNow += (now.getMinutes() / 60);
	let dayNow = (now.getDay() + 6) % 7;
	let userSchedule = schedule();
	if (userSchedule.length != 0) {
		let next = false;
		let delta = 24 * 4;
		for (let i = userSchedule.length - 1; i >= 0; i--) {
			// Check if event is now
			let day = userSchedule[i]['day'];
			let from = userSchedule[i]['from'];
			let smartDay = day;
			if (day < dayNow) {
				smartDay += 7;
			}
			let thisDelta = false;
			if (smartDay == dayNow) {
				if (timeNow < from) {
					thisDelta = timeNow - from;
				}
			} else if ((smartDay - dayNow) < 5) {
				thisDelta = from + (smartDay - dayNow) * 24;
			}
			if (isThisNow(day, from, delta)) {
				message = 'You should be in the ' + userSchedule[i]['type'].toLowerCase() + ' ' + userSchedule[i]['title'] + ' in ' + userSchedule[i]['room'];
				i = 0;
			} else if (thisDelta !=false && (next == false || thisDelta < delta)) {
				delta = thisDelta;
				next = userSchedule[i];
			}
		}
		if (next != false) {
			if (message != '') {
				message += ' and ';
			}
			message += 'your next ' + next['type'].toLowerCase() + ' is ';
			if (dayNow == next['day']) {
				message += 'today at ';
			} else {
				message += settings['days'][next['day']] + ' at ';
			}
			if (Math.trunc(next['from']) == next['from']) {
				message += next['from'] + ':00';
			} else {
				message += Math.trunc(next['from'] )+ ':30';
			}
		}
	}
	if (message != '') {
		message += '.';
	}
	$('.whatsup').html(message);
}

/*
* loadData(username, email, course, privacy, calendar, sched) - loads the data in memory and on the UI
* @var username (optional) - the username or false (don't change)
* @var email (optional) - the email or false (don't change)
* @var course (optional) - the course or false (don't change)
* @var privacy (optional) - the privacy or false (don't change)
* @var cal (optional) - the calendar or false (don't change) or 0 to reset
* @var sched (optional) - the schedule or false (don't change)
*/
function loadData(username = false, email = false, course = false, privacy = false, cal = false, sched = false) {
	let redraw = false;
	if (username !== false) {
		account['username'] = username;
		$('#name').val(username);
		$('.name').html(username.split(' ')[0]);
	}
	if (email !== false) {
		account['email'] = email;
		$('#email').val(email);
	}
	if (course !== false) {
		account['course'] = course;
		$('.course').val(course);
	}
	if (privacy !== false) {
		account['privacy'] = privacy;
		$('#privacy').val(privacy);
	}
	if (cal === 0) {
		let isFirst = (calendar(-1).length === [].length);
		makeEmptyCalendar();
		redraw = true;
		if (isFirst) {
			commitToLS(-1);
		} else {
			commitToLS(1);
		}
	} else if (cal !== false) {
		let isFirst = (calendar(-1) === []);
		calendar(-1, cal);
		redraw = true;
		if (isFirst) {
			commitToLS(-1);
		} else {
			commitToLS(1);
		}
	}
	if (sched !== false) {
		schedule(-1, sched);
		redraw = true;
		// Give the browser a break
		setTimeout(yourNextClass, 250);
	}
	if (redraw) {
		// Give the browser a break
		setTimeout(drawCalendar, 150);
	}
}

/*
* checkStatus(status) - checks the request status and takes actions accordingly
* @var status the return status code for the request (or -1 for failed)
* @return true if everything fine, false on abort
*/
function checkStatus(status) {
	$('#alert-offline').hide();
	$('#pull').removeClass('disabled');
	switch (status) {
		case 200:
			$('#alert-loading').hide();
			// All good
			return true;
		case 400:
			// Request error
			$('#alert-error').html('😕 Something went wrong with your request. Please, try refreshing the page.').show();
			return false;
		case 401:
			// Authentication error
			$('#alert-error').html('🔑 Your authentication code is expired. Please, try checking your emails again.').show();
			return false;
		case 500:
			// Server error
			$('#alert-error').html('😞 Server error... Please, try again in a minute.').show();
			return false;
		case -1:
			// Offline
			let dt = new Date();
			let timestamp = (dt.getHours() % 12) + ":" + ((dt.getMinutes() < 10) ? '0' + dt.getMinutes() : dt.getMinutes()) + ((dt.getHours() > 12) ? 'pm' : 'am');
			$('#offline-lastcheck').html(timestamp);
			$('#alert-offline').show();
			return false;
		default:
			// Unknown error
			$('#alert-error').html('🤔 Something went wrong with your request. Please, try again later.<br>(error code: ' + status + ')').show();
			return false;
	}
}

/*
* setEventListeners() - sets event listeners
*/
function setEventListeners() {
	$('td').off().mouseenter(function (e) {
		let thisDay = parseInt($(this).attr('data-day'));
		let thisTime = parseFloat($(this).attr('data-time'));
		showSelectionMsg(thisDay, thisTime);
		$('th[data-hour="' + thisTime + '"]').addClass('table-primary');
		$('th[data-day="' + thisDay + '"]').addClass('text-primary');
	}).mouseleave(function () {
		let thisDay = parseInt($(this).attr('data-day'));
		let thisTime = parseFloat($(this).attr('data-time'));
		resetMouseMsg();
		$('th[data-hour="' + thisTime + '"]').removeClass('table-primary');
		$('th[data-day="' + thisDay + '"]').removeClass('text-primary');
	}).mousedown(function () {
		let thisDay = parseInt($(this).attr('data-day'));
		let thisTime = parseFloat($(this).attr('data-time'));
		if (dynamic['sel_start'] === false) {
			$(this).addClass('sts');
			dynamic['sel_start'] = [thisDay, thisTime];
		} else if (dynamic['sel_start'][0] === thisDay && dynamic['sel_start'][1] === thisTime) {
			// Commit a selection
			setAvailability(thisDay, thisTime);
			$('[data-day="' + dynamic['sel_start'][0] + '"][data-time="' + dynamic['sel_start'][1] + '"]').removeClass('sts');
			// Close selection
			dynamic['sel_start'] = false;
		}
	}).mouseup(function() {
		let thisDay = parseInt($(this).attr('data-day'));
		let thisTime = parseFloat($(this).attr('data-time'));
		if (dynamic['sel_start'][0] !== thisDay || dynamic['sel_start'][1] !== thisTime) {
			if (dynamic['sel_start'] != false) {
				// Commit a selection
				let minDay = Math.min(dynamic['sel_start'][0], thisDay);
				let maxDay = Math.max(dynamic['sel_start'][0], thisDay);
				let minTime = Math.min(dynamic['sel_start'][1], thisTime);
				let maxTime = Math.max(dynamic['sel_start'][1], thisTime);
				for (let day = minDay; day <= maxDay; day++) {
					for (let time = minTime; time <= maxTime; time+=0.5) {
						setAvailability(day, time);
					}
				}
				$('[data-day="' + dynamic['sel_start'][0] + '"][data-time="' + dynamic['sel_start'][1] + '"]').removeClass('sts');
				// Close selection
				dynamic['sel_start'] = false;
			}
		}
	});
}

/*
* setupRefresh() - refreshes UI elements and keeps data updated (note: call only once)
*/
function setupRefresh() {
	commitToLS(0,-1);
	// Every 5 minutes
	setInterval(function() {
		// Pull data (other than calendar)
		pull(false);
		// Load Current TA
		// Updates the UI message
		uiMessage();
		// Updates the next lab message
		yourNextClass();
	}, 5 * 60 * 1000);
	// Every 30 seconds
	setInterval(function () {
		// Update the selection for current time slot
		isThisNow(0,0,0,true);
		// Commit to LS
		commitToLS(1);
	}, 30 * 1000);
}

/*
* push() - Pushes the current calendar to the server
*/
function push() {
	$.post('api/push/', { 'auth': account['authHash'], 'calendar': calendar(-1) }, function(result, status){
		if (checkStatus(status)) {
			$('#draft').hide();
			// Pulls the latest info
			pull(true);
		}
	}).fail(function () {
		checkStatus(-1);
	});
}

/*
* pull() - Pulls the data from the server
* @var pullCal if calendar should be refreshed as well 
*/
function pull(pullCal = false) {
	$.post('api/pull/', { auth: account['authHash'] }, function(result, status){
		if (checkStatus(status)) {
			$('#pull').removeClass('disabled');
		}
	}).fail(function () {
		checkStatus(-1);
	});
}

/*
* update() - Updates the current user's account info
*/
function update() {
	$.post('api/update/', { auth: account['authHash'] }, function(result, status){
		if (checkStatus(status)) {
			// Pulls the latest info (excluding the calendar)
			pull();
		}
	}).fail(function () {
		checkStatus(-1);
	});
}

/*
* deleteme() - Deletes the user's account 
*/
function deleteme() {
	$.post('api/deleteme/', { auth: account['authHash'] }, function(result, status){
		if (checkStatus(status)) {
			alert('Your account has been deleted');
			window.location.replace('about:blank');
		}
	}).fail(function () {
		checkStatus(-1);
	});
}

/*
* resetauth() - Resets the authentication hash
*/
function resetauth() {
	$.post('api/resetauth/', { auth: account['authHash'] }, function(result, status){
		if (checkStatus(status)) {
			alert('Done, check your emails');
			window.location.replace('about:blank');
		}
	}).fail(function () {
		checkStatus(-1);
	});
}

// Startup
$().ready(function () {
	// === TESTING ===
	let test_schedule = [{
			'title': 'L1Ex',
			'type': 'Lab',
			'room': 'X260',
			'day': 2,
			'from': 10.5,
			'to': 12.5
		},
		{
			'title': 'L1A',
			'type': 'Lab',
			'room': 'X250',
			'day': 4,
			'from': 9,
			'to': 12
		},
		{
			'title': 'MTG',
			'type': 'Meeting',
			'room': 'X800',
			'day': 3,
			'from': 17,
			'to': 18
		},
		{
			'title': 'WEM',
			'type': 'Meeting',
			'room': 'X800',
			'day': 6,
			'from': 20,
			'to': 21
		}];
	subs = {
		'L1Ex': {
			'Available': [
				'Stefano Vazzoler'
			],
			'Prefer Not': [
				'Ruiyu Gou'
			]
		},
		'L1A': {
			'Available': [
				'Qianqian Feng'
			],
			'Prefer Not': [
				'Julian Mentasti',
				'Doru Kesriyeli'
			]
		}
	}
	setupSubs();
	loadData('Alex TheTa', 'alexta@localhost', 'CPSC110', 1, 0, test_schedule);
	// ===============

	// Detect if touch enabled
	dynamic['isTouch'] = (('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch));
	if (dynamic['isTouch']) {
		toggleTouch();
	}

	setTimeout(uiMessage, 400);
	setupRefresh();

	// Mouse Message
	$(document).mousemove(function(e){
		if (dynamic['mouseMsg']) {
			var cpos = { top: e.pageY + 10, left: e.pageX + 10 };
			$('#mouseMsg').offset(cpos).html(dynamic['mouseMsg']);
		}
	});
	// Buttons
	$('#push').select(function() {
		push();
	});
	$('#pull').select(function() {
		if (!$(this).hasClass('disabled')) {
			$(this).addClass('disabled');
			pull(confirm('This will overwrite your local changes'));
		}
	});
});