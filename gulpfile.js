"use strict";

var gulp = require('gulp');
var chokidar = require('chokidar');
var prefixer = require('gulp-autoprefixer');
var plumber = require('gulp-plumber');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync');

var debug = require('gulp-debug');

var onErrorHandler = function(err) {
	browserSync.notify('Error while gernerating content');
	console.log(err.toString());
	this.emit('end');
};

/**
 * Copy the flat html files
 */
gulp.task('html-build', function() {
	gulp.src('*.html').pipe(gulp.dest('_site'));
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('html-rebuild', ['html-build'], function() {
	browserSync.reload();
});

gulp.task('browser-sync', ['html-build', 'sass', 'font'], function() {
	browserSync({
		port: 63024,
		server: {
			baseDir: '_site'
		},
		ui: {
			port: 62812
		}
	});
});

/**
 * Collect the roboto font from materialize
 */
gulp.task('font', function() {
	return gulp.src('external/materialize/fonts/*/*')
		.pipe(gulp.dest('_site/assets/fonts'));
});

/**
 * Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('sass', function() {
	return gulp.src(['sass/screen.scss', 'sass/responsive.scss', 'sass/timeline.scss'])
		.pipe(plumber({
			handleError: onErrorHandler
		}))
		.pipe(sourcemaps.init())
		.pipe(sass({
			includePaths: ['sass', 'external/materialize/sass']
		}).on('error', sass.logError))
		.pipe(prefixer({
			browsers: ['last 2 versions', 'ie >= 9', 'and_chr >= 2.3']
		}))
		.pipe(sourcemaps.write('maps'))
		.pipe(gulp.dest('_site/assets/css'))
		.pipe(browserSync.reload({
			stream: true
		}));
});

/**
 * Watch scss files for changes & recompile
 */
gulp.task('watch', function() {
	var coptions = {
		awaitWriteFinish: {
			stabilityThreshold: 500
		}
	};
	var sasswatch = chokidar.watch('./sass/**/*.scss', coptions);
	sasswatch.on('ready', function() {
		sasswatch.on('all', function(e, path) {
			if (e === 'add' || e === 'change' || e === 'unlink') {
				console.log('File ' + path + ' chaged with event ' + e);
				gulp.start('sass');
			}
		});
	});

	var htmlwatch = chokidar.watch('*.html', coptions);
	htmlwatch.on('ready', function() {
		htmlwatch.on('all', function(e, path) {
			if (e === 'add' || e === 'change' || e === 'unlink') {
				console.log('File ' + path + ' chaged with event ' + e);
				gulp.start('html-rebuild');
			}
		});
	});
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch']);