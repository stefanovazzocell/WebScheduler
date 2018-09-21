
var calendar = []

var dynamic = {
	'tool': 1,
	'sel_start': false,
	'isTouch': false
}

var settings = {
	//'days': ['MON', 'TUE', 'THU', 'WED', 'FRI', 'SAT', 'SUN'],
	'fromto': [8, 21]
}

/*
* makeEmptyCalendar() - Makes an empty calendar
*/
function makeEmptyCalendar() {
	calendar = []; // Reset the calendar
	for (let i = 0; i < (settings['fromto'][1] - settings['fromto'][0]) * 7; i+=0.5) {
		calendar.push(0); // Add 0 to the calendar
	}
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
		return calendar[(time - settings['fromto'][0]) * 2 + (settings['fromto'][1] - settings['fromto'][0]) * 2 * day];
	} else {
		calendar[(time - settings['fromto'][0]) * 2 + (settings['fromto'][1] - settings['fromto'][0]) * 2 * day] = value;
		if (updateUI) {
			setAvailability(day, time, value);
		}
	}
}

/*
* drawCalendar() - Redraws the calendar
*/
function drawCalendar() {
	let outputHtml = '';
	for (let time = settings['fromto'][0]; time < settings['fromto'][1]; time+=0.5) {
		outputHtml += '<tr>';
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
		outputHtml += '<th scope="row" data-hour=' + time + '>' + pre + '</th>';
		outputHtml += '<th scope="row" data-hour=' + time + '>' + post + '</th>';
		for (let day = 0; day < 7; day++) {
			outputHtml += '<td class="table-success" data-day="' + day + '" data-time="' + time + '"></td>';
		}
		outputHtml += '</tr>';
	}
	$('#calendar').html(outputHtml);
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
* toggleTouch() - Toggles touch mode on and off
*/
function toggleTouch() {
	// Resize elements
	$('table').toggleClass('table-sm');
	$('.btn-group').toggleClass('btn-group-sm');
	$('.btn').toggleClass('btn-sm');
	$('input[type="button"]').toggleClass('btn-sm');
	$('.input-group').toggleClass('input-group-sm');
}

/*
* getRandom(min, max) - generates a random number
* @var min is smallest number (inclusive)
* @var max is biggest number (exclusive)
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
		window.location.replace('/');
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
			window.location.replace('/');
		} else {
			alert('Did you drink too much at the TA social?\nDeletion denied');
		}
	}
}

// Startup
$().ready(function () {
	makeEmptyCalendar();

	// Detect if touch enabled
	dynamic['isTouch'] = (('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch));
	if (dynamic['isTouch']) {
		toggleTouch();
	}	

	drawCalendar();

	// Deal with click selection
	$('td').mouseenter(function () {
		let thisDay = parseInt($(this).attr('data-day'));
		let thisTime = parseFloat($(this).attr('data-time'));
		$(this).addClass('ots');
		$('th[data-hour="' + thisTime + '"]').addClass('table-primary');
		$('th[data-day="' + thisDay + '"]').addClass('ots');
		$('th[data-day="' + thisDay + '"]').addClass('text-primary');
	}).mouseleave(function () {
		let thisDay = parseInt($(this).attr('data-day'));
		let thisTime = parseFloat($(this).attr('data-time'));
		$(this).removeClass('ots');
		$('th[data-hour="' + thisTime + '"]').removeClass('table-primary');
		$('th[data-day="' + thisDay + '"]').removeClass('ots');
		$('th[data-day="' + thisDay + '"]').removeClass('text-primary');
	}).mousedown(function() {
		let thisDay = parseInt($(this).attr('data-day'));
		let thisTime = parseFloat($(this).attr('data-time'));
		if (dynamic['sel_start'] === false) {
			$(this).addClass('sts');
			dynamic['sel_start'] = [thisDay, thisTime];
		}
	}).mouseup(function() {
		let thisDay = parseInt($(this).attr('data-day'));
		let thisTime = parseFloat($(this).attr('data-time'));
		if (dynamic['sel_start'][0] !== thisDay && dynamic['sel_start'][0] !== thisTime) {
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
});