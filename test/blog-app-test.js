const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should(); 

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} =	require('../config');

chai.use(chaiHttp);

function seedBlogPostData() {
  console.info('seed blog data');
  const seedData = [];
  for (let i = 1; i <= 5; i++) {
    seedData.push({
      author: {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName()
      },
      title: faker.lorem.sentence(),
      content: faker.lorem.text()
    });
  }
  return BlogPost.insertMany(seedData);
}


function tearDownDb() {
	return mongoose.connection.dropDatabase();
}


describe('Blogs API Resource', function() {

	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
		return seedBlogPostData();
	});

	afterEach(function() {
		return tearDownDb();
	});

	after(function() {
		return closeServer();
	});


	describe('GET Endpoint', function() {
		it('should return all blogs', function() {
			return chai.request(app)
				.get('/posts')
				.then(res => {
					res.should.have.status(200);
					res.body.should.have.lengthOf.at.least(1);
					return BlogPost.count();
					res.body.should.have.lengthOf(count);
					//return BlogPost.count();
				})
				/*.then(count => {
					res.body.should.have.lengthOf(count);
				});*/
		});
		it('should return posts with correct fields', function() {
			let respost;
			return chai.request(app)
			.get('/posts')
			.then(function(res) {
				res.should.have.status(200);
				res.should.be.json;
				res.should.be.a('object');
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
				respost.author.should.equal(post.authorName);
			});
		});	
	});

	describe('POST Endpoint', function() {
		it('should add a new post', function() {
			const newPost = {
				title: faker.lorem.sentence(),
				author: {
					firstName: faker.name.firstName(),
       				lastName: faker.name.lastName()
				},
				content: faker.lorem.text()
			};
			return chai.request(app)
				.post('/posts')
				.send(newPost)
				.then(res => {
					res.should.have.status(201);
					res.should.be.json;
					res.should.be.a('object');
					res.body.should.include.keys('id', 'title', 'content', 'author', 'created');
					res.body.title.should.equal(newPost.title);
          			res.body.id.should.not.be.null;
          			res.body.author.should.equal(`${newPost.author.firstName} ${newPost.author.lastName}`);
          			res.body.content.should.equal(newPost.content);
          			return BlogPost.findById(res.body.id);
				})
				.then(function (post) {
          		post.title.should.equal(newPost.title);
          		post.content.should.equal(newPost.content);
          		post.author.firstName.should.equal(newPost.author.firstName);
          		post.author.lastName.should.equal(newPost.author.lastName);
          	});
		});
	});
	describe('PUT endpoint', function () {

    // strategy:
    //  1. Get an existing post from db
    //  2. Make a PUT request to update that post
    //  4. Prove post in db is correctly updated
    	it('should update fields you send over', function () {
      		const updateData = {
        		title: 'cats cats cats',
        		content: 'dogs dogs dogs',
        		author: {
          			firstName: 'foo',
          			lastName: 'bar'
        		}
      		};

      		return BlogPost
        		.findOne()
        		.then(post => {
        			updateData.id = post.id;

          			return chai.request(app)
            		.put(`/posts/${post.id}`)
            		.send(updateData);
        		})
        		.then(res => {
          			res.should.have.status(204);
          			return BlogPost.findById(updateData.id);
        		})
        		.then(post => {
          			post.title.should.equal(updateData.title);
          			post.content.should.equal(updateData.content);
          			post.author.firstName.should.equal(updateData.author.firstName);
          			post.author.lastName.should.equal(updateData.author.lastName);
        		});
    	});
  	});

  describe('DELETE endpoint', function () {
    // strategy:
    //  1. get a post
    //  2. make a DELETE request for that post's id
    //  3. assert that response has right status code
    //  4. prove that post with the id doesn't exist in db anymore
    	it('should delete a post by id', function () {
			let post;
			return BlogPost
        		.findOne()
        		.then(_post => {
          			post = _post;
          			return chai.request(app).delete(`/posts/${post.id}`);
        		})
        		.then(res => {
          			res.should.have.status(204);
          			return BlogPost.findById(post.id);
        		})
        		.then(_post => {
          // when a variable's value is null, chaining `should`
          // doesn't work. so `_post.should.be.null` would raise
          // an error. `should.be.null(_post)` is how we can
          // make assertions about a null value.
          			should.not.exist(_post);
        		});
    	});
  	});
});