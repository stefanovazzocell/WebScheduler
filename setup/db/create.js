var mongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/webscheduler';

var resetdb = true; // Change me to reset DB

if (resetdb) {
	console.log('Clearing database...');
	mongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
		if (err) throw err;
		var dbo = db.db('webscheduler');
		dbo.dropDatabase(function(err, delok) {
			if (err) throw err;
			db.close();
			if (delok) console.log('OK');
			create();
		});
	});
} else {
	create();
}

function create() {
	console.log('Creating database...');
	mongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
		if (err) throw err;
		console.log('OK');
		var dbo = db.db('webscheduler');
		// Collections
		console.log('Creating collections...');
		dbo.createCollection('admin', function(err, res) {
			if (err) throw err;
			console.log('1/4 - admin');
			dbo.createCollection('course', function(err, res) {
				if (err) throw err;
				console.log('2/4 - course');
				dbo.createCollection('ta', function(err, res) {
					if (err) throw err;
					console.log('3/4 - ta');
					dbo.createCollection('items', function(err, res) {
						if (err) throw err;
						console.log('4/4 - items');
						console.log('OK');
						db.close();
					});
				});
			});
		});
	});
}