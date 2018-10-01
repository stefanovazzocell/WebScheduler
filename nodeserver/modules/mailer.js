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

const { mailgun_api, domain, from, webmaster } = require('./../config/mailer');
var mailer;
var template;

module.exports = {
	/* setup(Mailgun) - sets up mailer */
	setup: function (Mailgun) {
		console.log();
		mailer = new Mailgun( {apiKey: mailgun_api, domain: domain} );
		var fs = require('fs');
		template = fs.readFileSync('./../config/mailer/email_template.html', 'utf8');
		template = template.replace(':webmaster:', webmaster);
		console.log('Mailer setup completed');
	},
	/* send(sendfrom, sendto, subject, message) - Sends an email */
	send: function (sendfrom, sendto, subject, message) {
		console.log(template.replace(':subject:',subject).replace(':message:',message)); // TODO: Remove this
		/*
		mailer.messages().send({ from: (sendfrom + from), to: sendto, subject: subject, html: message },
			function (err, body) {
				if (err) throw err;
			});
		*/
	}
}