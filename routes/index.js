var express = require('express');
var router = express.Router();

// 1. connect to mongo db
var mongodb = require('mongodb');
var mongoClient = mongodb.MongoClient;
var mongoUrl = 'mongodb://localhost:27017/electric';
var db; //Global so all of our routes have access to our database connection

mongoClient.connect(mongoUrl, function(error, database){
	if(error){
		console.log(error)
	}else{
		db = database;
		console.log(db);
	}
})

/* GET home page. */
router.get('/', function(req, res, next) {
	// 2. get pics from Mongo and store them in an array to pass to view
  db.collection('images').find().toArray(function(error, photos){
  	var randomNum = Math.floor(Math.random() * photos.length);
  	// 3. grab a random image from that array
  	var randomPhoto = photos[randomNum].imgSrc;
  	// 4. send that image to the view
  	res.render('index', { imageToRender: randomPhoto });
  })
});

router.post('/electric', function(req, res, next){
	res.json(req.body);
	// 1. we know whether they voted electric or poser because it's in re.body.submit
	// 2. we know what image they voted on because it is in req.body.image
	// 3. we know who they are because we have their IP address because of req.
	db.collection('votes').insertOne({
		ip: req.ip,
		vote: req.body.submmit,
		image: req.body.image
	})
})

module.exports = router;
