'use strict';

var admin = {
	'hash': window.location.hash.slice(1),
	'username': 'Admin',
	'email': 'admin@localhost',
	'courses': []
}

var courses = []; // 'CPSC110', 'CPSC121', ...
var coursesData = []; // 'CPSC110': {...}, ...
var coursesTa = []; // 'CPSC110': [{...}, ...] ...
var coursesSchedule = [] // 'CPSC110': [{...}, ...] ...

var dynamic = {
	'mouseMsg': false,
	'mouseMsgTimeout': false,
	'isTouch': false,
	'bigIcons': false
};

// "Constant" settings
var settings = {
	'days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
	'fromto': [8, 21]
}

/*
* toggleTouch() - Toggles touch mode on and off
*/
function toggleTouch() {
	dynamic['bigIcons'] = !dynamic['bigIcons'];
	// Resize elements
	$('table').toggleClass('table-sm');
	$('.btn-group').toggleClass('btn-group-sm');
	$('.btn').toggleClass('btn-sm');
	$('input[type="button"]').toggleClass('btn-sm');
	$('.btn-only-sm').addClass('btn-sm');
	$('.input-group').toggleClass('input-group-sm');
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
* checkStatus(status) - checks the request status and takes actions accordingly
* @var status the return status code for the request (or 0 for failed)
* @return true if everything fine, false on abort
*/
function checkStatus(status) {
	$('#pull').removeClass('disabled');
	$('#alert-error').hide();
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
			window.location.replace('login/#wp');
			return false;
		case 403:
			// Brute Force error
			window.location.replace('login/#bf');
			return false;
		case 500:
			// Server error
			$('#alert-error').html('😞 Server error... Please, try again in a minute.').show();
			return false;
		case 0:
			// Offline
			let dt = new Date();
			let timestamp = (dt.getHours() % 12) + ":" + ((dt.getMinutes() < 10) ? '0' + dt.getMinutes() : dt.getMinutes()) + ((dt.getHours() > 12) ? 'pm' : 'am');
			$('#offline-lastcheck').html(timestamp);
			$('#alert-offline').show();
			return false;
		default:
			// Unknown error
			$('#alert-error').html('🤔 Something went wrong with your request. Please, try again later.').show();
			return false;
	}
}

/*
* request(action, data, successFn, tryAgain) - is an ajax request
* @var action is the action to take
* @var data is the data to send (without auth)
* @successFn is the callback function
* @var tryAgain (optional) is the amount of seconds before retrying the request (false is disabled)
*/
function request(action, data, successFn, tryAgain = false) {
	data['auth'] = admin['hash'];
	$.ajax({
		url: 'http://localhost:8080/api/admin/' + action,
		type: 'POST',
		contentType: 'application/json',
		data: JSON.stringify(data),
		success: function(data,textStatus) {
			$('#alert-offline').hide();
			successFn(data);
		},
		error: function(jqXHR,textStatus) {
			checkStatus(jqXHR['status']);
			if (tryAgain !== false) {
				setTimeout(function () {
					request(action, data, successFn, tryAgain);
				}, tryAgain * 1000);
			}
		}
	});
}

/*
* apiGet() - Gets all the data for this admin and shows it
*/
function apiGet() {
	request('get', {}, function(data) {
		$('#alert-loading').hide();
		admin['username'] = data['username'];
		admin['email'] = data['email'];
		admin['courses'] = data['courses'];
		$('.name').html(admin['username'].split(' ')[0]);
		$('#name').val(admin['username']);
		$('.email').html(admin['email']);
		$('#email').val(admin['email']);
		let courses = '';
		for (var i = 0; i < admin['courses'].length; i++) {
			courses = '<option value="' + admin['courses'][i] + '">' + admin['courses'][i] + '</option>';
		}
		$('#courselist').html(courses);
	}, 5);
}

/*
* apiCourseAdd(courseName) - Adds a course
* @var courseName (optional) is the course name to use
*/
function apiCourseAdd(courseName = '') {
	if (courseName === '') {
		courseName = $('#courseName').val();
	}
	request('courseAdd', { 'courseName': courseName }, function(data) {
		if (courseName === $('#courseName').val()) {
			$('#courseName').val('');
		}
		apiGet();
	});
}

$().ready(function () {
	// Once page ready
	// Detect if touch enabled
	dynamic['isTouch'] = (('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch));
	if (dynamic['isTouch']) {
		toggleTouch();
	}
	// Mouse Message
	$(document).mousemove(function(e){
		if (dynamic['mouseMsg']) {
			var cpos = { top: e.pageY + 10, left: e.pageX + 10 };
			$('#mouseMsg').offset(cpos).html(dynamic['mouseMsg']);
		}
	});
	// Get courses list
	apiGet();
});