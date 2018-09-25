'use strict';
/*
* WebScheduler (Version 0.1.0)
* ipresolver.js - Utility to resolve the user's ip
* by Stefano Vazzoler (stefanovazzocell@gmail.com)
* https://stefanovazzoler.com/
*/

// Load config
var { use_connection_ip, use_proxy, use_cloudflare } = require('./../config/ipresolver');

/*
* getCloudflare(req) - gets the ip from cloudflare if allowed or the next available option
*
* @var req to be a valid express request
* @returns ip string
*/
function getCloudflare(req) {
	// Check if Cloudflare header allowed and available
	if (use_cloudflare && req.headers['cf-connecting-ip'] !== undefined) {
		return req.headers['cf-connecting-ip'];
	} else {
		return getProxy(req);
	}
}

/*
* getProxy(req) - gets the ip from the proxy if allowed or the next available option
*
* @var req to be a valid express request
* @returns ip string
*/
function getProxy(req) {
	// Check if proxy header allowed and available
	if (use_proxy && req.headers['x-forwarded-for'] !== undefined) {
		return req.headers['x-forwarded-for'];
	} else {
		return getRequest(req);
	}
}

/*
* getRequest(req) - gets the ip from the request if allowed or returns 'unknown'
*
* @var req to be a valid express request
* @returns ip string
*/
function getRequest(req) {
	// Check if connection ip allowed
	if (use_connection_ip) {
		return req.connection.remoteAddress;
	} else {
		return 'unknown';
	}
}

/*
* getCfCountry(req) - gets the country code from Cloudflare header or '??' for unknown
*
* @var req to be a valid express request
* @returns country code string as for |ISO 3166-1 Alpha 2| or '??' if unknown
*/
function getCfCountry(req) {
	return req.headers['cf-ipcountry'] || '??';
}

// Make public function accessible
module.exports = {
	// When the users requires an ip, start looking for cloudflare
	getIp: getCloudflare,
	// If the users requests the country of origin, check Cloudflare response
	getLocation: getCfCountry
}