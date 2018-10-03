'use strict';
/*
* WebScheduler (Version 0.1.0)
* mailer.js - Utilities for sending emails
* by Stefano Vazzoler (stefanovazzocell@gmail.com)
* https://stefanovazzoler.com/
*/

/*
* Require Node dependencies
*/

const { mailgun_api, domain, from, webmaster, siteDomain, demoMode, cooldown, maxRetries, autoRush } = require('./../config/mailer');
const cd_checkagain = cooldown['checkagain'];
const cd_betweensend = cooldown['betweensend'];
var mailer;
var rushEmails = false;
var template;
var emailQueue = [];

function printEmail(sendfrom, sendto, subject, message, isDM = true) {
	if (isDM) console.log('MAILER / send / demo mode');
	console.log('----------');
	console.log('from: ' + (sendfrom + from));
	console.log('to: ' + sendto);
	console.log('subject: ' + subject);
	console.log('----------');
	console.log(message);
	console.log('----------');
}

function sendNext() {
	if (autoRush !== false && emailQueue.length >= autoRush) {
		rushEmails = true;
	}
	if (emailQueue.length === 0) {
		// Check again in cd_checkagain ms
		if (rushEmails) {
			rushEmails = false;
		}
		setTimeout(sendNext, cd_checkagain);
	} else {
		let thisEmail = emailQueue[0];
		emailQueue.shift();
		let sendfrom = thisEmail['sendfrom'];
		let sendto = thisEmail['sendto'];
		let subject = thisEmail['subject'];
		let message = thisEmail['message'];
		let messageHtml = template.replace(/:subject:/g,subject).replace(/:message:/g,message).replace(/:domain:/g,siteDomain);
		if (demoMode) {
			printEmail(sendfrom, sendto, subject, message);
			// Check again in cd_betweensend ms
			if (rushEmails) {
				sendNext();
			} else {
				setTimeout(sendNext, cd_betweensend);
			}
		} else {
			mailer.messages().send({ from: (sendfrom + from), to: sendto, subject: subject, html: messageHtml, text: message },
			function (err, body) {
				let retry = thisEmail['retry'];
				if (retry === undefined || retry <= maxRetries) {
					if (retry === undefined) {
						thisEmail['retry'] = 1;
					} else {
						thisEmail['retry'] += 1;
					}
					console.log('Failed to send email to ' + sendto + ', I will try later [' + retry + ']');
					emailQueue.push(thisEmail);
					if (err) throw err;
				} else {
					console.log('Failed to send email to ' + sendto + ', I gave up after ' + retry + ' tries');
					printEmail(sendfrom, sendto, subject, message, false);
				}
				// Check again in cd_betweensend ms
				if (rushEmails) {
					sendNext();
				} else {
					setTimeout(sendNext, cd_betweensend);
				}
			});
		}
	}
}

module.exports = {
	/* setup(Mailgun) - sets up mailer */
	setup: function (Mailgun) {
		if (demoMode) {
			console.warn('MAILER / send / Careful, is demo mode!');
			mailer = null;
		} else {
			mailer = new Mailgun( {apiKey: mailgun_api, domain: domain} );
		}
		var fs = require('fs');
		template = fs.readFileSync('./config/email_template.html', 'utf8');
		template = template.replace(':webmaster:', webmaster);
		// Start emailer in 10 seconds
		setTimeout(sendNext, 10 * 1000);
		console.log('Mailer setup completed');
	},
	/* send(sendfrom, sendto, subject, message, callbackFn) - Sends an email */
	send: function (sendfrom, sendto, subject, message, callbackFn) {
		emailQueue.push({
			'sendfrom': sendfrom,
			'sendto': sendto,
			'subject': subject,
			'message': message
		});
		callbackFn();
	}
}