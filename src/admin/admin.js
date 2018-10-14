'use strict';

var admin = {
	'hash': window.location.hash.slice(1),
	'username': 'Admin',
	'email': 'admin@localhost',
	'courses': []
};

var courses = [
	'CPSC110',
	'CPSC210'
];
var courseData = [
	
]; // 'CPSC110': {...}, ...
var courseTa = []; // 'CPSC110': [{...}, ...] ...
var courseSchedule = [] // 'CPSC110': [{...}, ...] ...

var selected = {
	'course': null, // 'CPSC110'
	'item': null,   // { 'name': 'L1A', 'course': 'CPSC110' }
	'ta': null,     // '_id_'
};

var dynamic = {
	'mouseMsg': false,
	'mouseMsgTimeout': false,
	'isTouch': false,
	'hasLocalStorage': (typeof(Storage) !== "undefined"),
	'bigIcons': false
};

// "Constant" settings
var settings = {
	'days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
	'fromto': [8, 21]
};

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
* getSelectedCourse() - Gets the selected course
*/
function getSelectedCourse() {
	let value = $('#courseList').val();
	console.log('course: ' + value);
	if (value === '') {
		selected['course'] = null;
	} else {
		selected['course'] = value;
	}
	selected['item'] = null;
	selected['ta'] = null;
}

/*
* typeOfItem(name) - given an item with a name, it guesses the type
* @var name (optional) is the name of the item, if not defined it will update on the screen
* @returns the type of the item
*/
function typeOfItem(name = -1) {
	let onScreen = false;
	if (name === -1) {
		onScreen = true;
		name = $('#newItem').val();
	}
	let itemIs = 'special';
	switch (name.charAt(0).toUpperCase()) {
		case '':
			itemIs = '...';
			break;
		case 'L':
			itemIs = 'lab';
			break;
		case 'M':
			itemIs = 'meeting';
			break;
		case 'O':
		case 'D':
			itemIs = 'office hours';
			break;
		case 'G':
			itemIs = 'grading meeting';
			break;
		case '0':
		case '1':
		case '2':
		case '3':
		case '4':
		case '5':
		case '6':
		case '7':
		case '8':
		case '9':
			itemIs = 'lecture';
			break;
	}
	if (onScreen) {
		$('#itemType').html(itemIs)
	}
	return itemIs;
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
			window.location.replace('../login/#wp');
			return false;
		case 403:
			// Brute Force error
			window.location.replace('../login/#bf');
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
		let changed = (admin['courses'].length != data['courses'].length);
		admin['username'] = data['username'];
		admin['email'] = data['email'];
		admin['courses'] = data['courses'];
		$('.name').html(admin['username'].split(' ')[0]);
		$('#name').val(admin['username']);
		$('.email').html(admin['email']);
		$('#email').val(admin['email']);
		if (changed) {
			let courses = '';
			for (var i = 0; i < admin['courses'].length; i++) {
				courses += '<option value="' + admin['courses'][i] + '">' + admin['courses'][i] + '</option>';
			}
			$('#courseList').html(courses);
			let index = admin['courses'].indexOf(selected['course']);
			getSelectedCourse();
		}
	}, 5);
}

/*
* resetauth() - Resets the authentication hash
*/
function resetauth() {
	request('resetauth', {}, function() {
		alert('Done, check your emails');
		if (dynamic['hasLocalStorage']) {
			localStorage.clear();
		}
		window.location.replace('../login/');
	});
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

/*
* apiCourseAdd(courseName) - Adds a course
* @var courseName (optional) is the course name to use
*/
function apiAccountDelete(courseName = '') {
	if (courseName === '') {
		courseName = selected['course'];
	}
	let check = prompt('You are about to delete a course.' +
						'To confirm the deletion enter the course name (' +
						courseName + ') below');
	if (check === courseName) {
		request('courseRemove', { 'courseName': courseName }, function(data) {
			if (courseName === $('#courseName').val()) {
				$('#courseName').val('');
			}
			apiGet();
		});
	} else {
		alert('Deletion cancelled');
	}
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
	// Store or retrive id
	if (dynamic['hasLocalStorage']) {
		if (admin['hash'] !== '') {
			localStorage.setItem('hash', admin['hash']);
		} else {
			if (localStorage.getItem('hash') != null) {
				admin['hash'] = localStorage.getItem('hash');
			} else {
				window.location.replace('../login/');
			}
		}
	}
	// Get courses list
	apiGet();
	// Handle clicks
	$('#sectionsList > li').click(function (data) {
		let item = $(data.target).attr('data-item');
		$('.selectedItem').html(item);
		selected['item'] = {
			'course': selected['course'],
			'item': item
		};
	});
});