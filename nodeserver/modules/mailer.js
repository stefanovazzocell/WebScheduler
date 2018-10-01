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

const { mailgun_api, domain, from, webmaster, siteDomain, demoMode } = require('./../config/mailer');
var mailer;
var template;

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
		console.log('Mailer setup completed');
	},
	/* send(sendfrom, sendto, subject, message, callbackFn) - Sends an email */
	send: function (sendfrom, sendto, subject, message, callbackFn) {
		let messageHtml = template.replace(/:subject:/g,subject).replace(/:message:/g,message).replace(/:domain:/g,siteDomain);
		if (demoMode) {
			console.log('MAILER / send / demo mode');
			console.log('----------');
			console.log('from: ' + (sendfrom + from));
			console.log('to: ' + sendto);
			console.log('subject: ' + subject);
			console.log('----------');
			console.log(message);
			console.log('----------');
			callbackFn();
		} else {
			mailer.messages().send({ from: (sendfrom + from), to: sendto, subject: subject, html: messageHtml, text: message },
			function (err, body) {
				if (err) throw err;
				callbackFn();
			});
		}
	}
}