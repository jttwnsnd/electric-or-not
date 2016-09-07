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
	var userIP = req.ip;
	db.collection('votes').find({ip:userIP}).toArray(function(error, userResult){
		var photosVoted = [];
		if(error){
			console.log("There was an error fetching user votes");
		}else{
			for(var i = 0; i < userResult.length; i++){
				photosVoted.push(userResult[i].image);
			}
		}
		// 2. get pics from Mongo and store them in an array to pass to view
		db.collection('images').find({ imgSrc: {$nin: photosVoted } }).toArray(function(error, photos){
		  	if(photos.length === 0){
		  		res.redirect('/standings');
		  	}else{
		  		var randomNum = Math.floor(Math.random() * photos.length);
			  	// 3. grab a random image from that array
			  	var randomPhoto = photos[randomNum].imgSrc;
			  	// 4. send that image to the view
			  	res.render('index', { imageToRender: randomPhoto });
		  	}
		  	
		})
	})
});

router.post('/electric', function(req, res, next){
	// res.json(req.body);
	// 1. we know whether they voted electric or poser because it's in re.body.submit
	// 2. we know what image they voted on because it is in req.body.image
	// 3. we know who they are because we have their IP address because of req.
	db.collection('votes').insertOne({
		ip: req.ip,
		vote: req.body.submit,
		image: req.body.image
	})
	// 7. update the images collection so that the images voted on will have a new total votes
	db.collection('images').find({imgSrc: req.body.image}).toArray(function(error, result){
		var total, posers, elctrc;
		var inputValue = req.body.submit;
		console.log(result[0].totalVotes);
		if(isNaN(result[0].totalVotes)){
			total = 0;
		}else{
			total = result[0].totalVotes;
		}
		if(isNaN(result[0].poser)){
			posers = 0;
		}else{
			posers = result[0].poser;
		}
		if(isNaN(result[0].electric)){
			elctrc = 0;
		}else{
			elctrc = result[0].electric;
		}
		db.collection('images').updateOne(
			{imgSrc: req.body.image},
			{
				$set: {'totalVotes': (total + 1)}
			}, function(error, results){
				//check to see if there is an error
				if(error){
					console.log(error)
				}else{
					console.log('updating');
				}
				//check to see if the document was updated
			}
		)
		if(inputValue === "Electric!"){
			db.collection('images').update(
				{imgSrc: req.body.image},
				{
					$set: {'electric': (elctrc + 1), 'poser': posers},
				}, function(error, results){
					//check to see if there is an error
					if(error){
						console.log(error)
					}else{
						console.log('electric');
					}
					//check to see if the document was updated
				}
			)
		}else if(inputValue === "Poser!"){
			db.collection('images').update(
				{imgSrc: req.body.image},
				{
					$set: {'poser': (posers + 1), 'electric': elctrc},
				}, function(error, results){
					//check to see if there is an error
					if(error){
						console.log(error)
					}else{
						console.log('poser');
					}
					//check to see if the document was updated
				}
			)
		}
	})
	res.redirect('/');
})

router.get('/standings', function(req, res, next){
	db.collection('images').find().toArray(function(error, allResults){
		var standingsArray = [];
		allResults.sort(function(a,b){
			return (b.totalVotes - a.totalVotes);
		});
		res.render('standings', {theStandings: allResults});
	})
})

module.exports = router;
