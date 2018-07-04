const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should; 

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} =	require('../config');

chai.use(chaiHttp);

function seedBlogData() {
	const seedData = []; 

	for (let i=1; i<=5; i++) {
		seedData.push(generateBlogData());
	}
	return BlogPost.insertMany(seedData);
}

function generateBlogData() {
	return {
		title: generateTitle(),
		author: {
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName(),
		},
		content: faker.lorem.text(),
	};
}

function generateTitle() {
	const title = ['Me and Only Me', '1983', 'A Catcher in the Sourdough', 'Narcos', "Moby Shark" ];
	return title[Math.floor(Math.random() * title.length)];
}

function tearDownDb() {
	return mongoose.connection.dropDatabase();
}

describe('Blogs API Resource', function() {

	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
		return seedBlogData();
	});

	afterEach(function() {
		return tearDownDb();
	});

	after(function() {
		return closeServer();
	});


	describe('GET Endpoint', function() {
		it('should return all blogs', function() {
			let res;
			return chai.request(app)
				.get('/blogs')
				.then(function(_res) {
					res = _res;
					res.should.have.status(200);
					res.body.should.have.lengthOf.at.least(1);
					return BlogPost.count();
				})
				.then(count => {
					res.body.should.have.lengthOf(count);
				});
		});
		it('should return posts with correct fields', function() {
			let respost;
			return chai.request.(app)
			.get('/posts')
			.then(function(res) {
				res.should.have.status(200);
				res.should.be.json;
				res.should.be.a.('array');
				res.body.should.have.lengthOf.at.least(1)

				res.body.forEach(function(post) {
					post.should.be.a('object');
					post.should.include.keys('id', 'title', 'author', 'created');
				});
				respost = res.body[0];
				return BlogPost.findById(respost.id);			
			})
			.then(post => {
				respost.title.should.equal(post.title);
				respost.content.should.equal(post.content);
				respost.author.should.equal(post.author);
			});
		});	
	});
});