/* global require: false */
var gulp = require('gulp');
var path = require('path');
var browserify = require('browserify');
var livereload = require('gulp-livereload');
var transform = require('vinyl-transform');
var jshint = require('gulp-jshint');

gulp.task("browserify", function() {
	var browserified = transform(function(filename) {
		var b = browserify(filename);
		return b.bundle();
	});
	return gulp.src(['./js/**/*.js'])
		.pipe(browserified)
		.pipe(gulp.dest('./build'));
});

gulp.task('lint', function() {
	return gulp.src(['./js/**/*.js', 'gulpfile.js'])
		.pipe(jshint({
			globals: {
			}
		}))
		.pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('watch', ['browserify'], function() {
	gulp.watch("js/*.js", ['browserify']);
	livereload.listen(35729);
});
