var gulp = require('gulp');
var path = require('path');
var browserify = require('browserify');
var livereload = require('gulp-livereload');
var transform = require('vinyl-transform');

gulp.task("browserify", function() {
	var browserified = transform(function(filename) {
		var b = browserify(filename);
		return b.bundle();
	});
	return gulp.src(['./js/*.js'])
		.pipe(browserified)
		.pipe(gulp.dest('./build'));
/*

	var bundler = browserify({
		entries: ['js/app'],
		extensions: ['.js'],
		cache: {},
		packageCache: {}
		// fullPaths: true
	});

	var bundle = function() {
		return bundler
			.bundle()
			.pipe(source("bundle.js"))
			.pipe(gulp.dest("build"));
		
	};

	return bundle();*/
});

gulp.task('watch', ['browserify'], function() {
	gulp.watch("js/app.js", ['browserify']);
	livereload.listen(35729);
});
