'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost/blog-app';
exports.PORT = process.env.PORT || 8080;
exports.TEST_DATABASE_URL = proces.env.TEST_DATABASE_URL || 'mongodb://localhost/test-blog-app'