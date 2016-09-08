var express = require('express');
var router = express.Router();

// 1. connect to mongo db
var mongodb = require('mongodb');
var mongoClient = mongodb.MongoClient;
var mongoUrl = 'mongodb://localhost:27017/electric';
var db; //Global so all of our routes have access to our database connection

mongoClient.connect(mongoUrl, (error, database) => {
	if(error){
		console.log(error)
	}else{
		db = database;
		console.log(db);
	}
})
router.get('/', (req, res, next)=> {
	db.collection('images').find().toArray((error, allResults) => {
		var standingsArray = [];
		allResults.sort((a,b) => {
			return (b.totalVotes - a.totalVotes);
		});
		res.render('index', {theStandings: allResults});
	})
})

/* GET home page. */
router.get('/game', (req, res, next) => {
	var userIP = req.ip;
	db.collection('votes').find({ip:userIP}).toArray((error, userResult) => {
		var photosVoted = [];
		if(error){
			console.log("There was an error fetching user votes");
		}else{
			for(var i = 0; i < userResult.length; i++){
				photosVoted.push(userResult[i].image);
			}
		}
		// 2. get pics from Mongo and store them in an array to pass to view
		db.collection('images').find({ imgSrc: {$nin: photosVoted } }).toArray((error, photos) => {
		  	if(photos.length === 0){
		  		res.redirect('/standings');
		  	}else{
		  		var randomNum = Math.floor(Math.random() * photos.length);
			  	// 3. grab a random image from that array
			  	var randomPhoto = photos[randomNum].imgSrc;
			  	// 4. send that image to the view
			  	res.render('game', { imageToRender: randomPhoto });
		  	}
		  	
		})
	})
});

router.post('/electric', (req, res, next) => {
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
	db.collection('images').find({imgSrc: req.body.image}).toArray((error, result) =>{
		var total;
		var upDownVote;
		if(req.body.submit === "Electric!"){
			upDownVote = 1;
		}else if(req.body.submit === "Poser!"){
			upDownVote = -1;
		}
		if(isNaN(result[0].totalVotes)){
			total = 0;
		}else{
			total = result[0].totalVotes;
		}
		if((upDownVote == -1) && (total === 0)){
			db.collection('images').updateOne(
				{imgSrc: req.body.image},
				{
					$set: {'totalVotes': (0)}
				}, (error, results) => {
					//check to see if there is an error
					if(error){
						console.log(error)
					}else{
						console.log('updating');
					}
					//check to see if the document was updated
				}
			)
		}else{
			db.collection('images').updateOne(
				{imgSrc: req.body.image},
				{
					$set: {'totalVotes': (total + upDownVote)}
				}, (error, results) => {
					//check to see if there is an error
					if(error){
						console.log(error)
					}else{
						console.log('updating');
					}
					//check to see if the document was updated
				}
			)
		}
	})
	res.redirect('/game');
})

router.get('/standings', (req, res, next) => {
	db.collection('images').find().toArray((error, allResults) => {
		var standingsArray = [];
		allResults.sort((a,b) => {
			return (b.totalVotes - a.totalVotes);
		});
		res.render('standings', {theStandings: allResults});
	})
})

router.get('/resetUserValues', (req, res, next) => {
	db.collection('votes').deleteMany(
		{ip:req.ip},
		(error, results) => {
		}
	)
	res.redirect('/');
})

module.exports = router;
