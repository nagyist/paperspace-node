'use strict';

var qs = require('qs');
var superagent = require('superagent');

var FSLASH = '/';

function objectToQueryString(obj) {
	// Convert null query params to 'null'
	for (var param in obj) {
		if (obj[param] === null) {
			obj[param] = 'null';
		}
	}
	return qs.stringify(obj, { encode: true });
}

// General-purpose HTTP request method, based on superagent
function request(
	host,
	method,
	path,
	params,
	query,
	headers,
	options,
	file,
	cb,
	debug
) {
	if (!options) options = {};

	// Remove leading/trailing slash from the path/host so that we can join
	// the two together no matter which way the user chose to provide them.
	if (path[0] === FSLASH) {
		path = path.slice(1);
	}
	if (host[host.length - 1] === FSLASH) {
		host = host.slice(0, host.length - 1);
	}

	var url = host + FSLASH + path;

	var req = superagent[method](url);

	if (!options.withoutCredentials) req.withCredentials();

	if (!file) {
		// Clean up extra parameters that may have gotten in here
		// if the request came from the CLI module. This is hacky; move elsewhere
		if (params) {
			delete params._;
			delete params.$0;
			req.send(params);
		}
		if (query) {
			delete query._;
			delete query.$0;
			req.query(objectToQueryString(query));
		}
	} else {
		//for file upload params are sent as query params
		req.accept('application/json');
		req.attach('file', file);
		delete query._;
		delete query.$0;
		req.query(objectToQueryString(query));
	}

	if (headers) {
		for (var headerKey in headers) {
			req.set(headerKey, headers[headerKey]);
		}
	}

	// TODO: Add nicer debug utils? Use the 'debug' module?
	if (debug) {
		console.log(method, url, params, query, headers);
	}

	return req.end(function _requestCallback(err, res) {
		if (cb) return cb(err, res);

		return res;
	});
}

module.exports = request;
