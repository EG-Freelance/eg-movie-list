/**
 * Created by cabargues on 2/12/16.
 */
var gulp = require('gulp'),
  sass = require('gulp-sass'),
  plugins = require('gulp-load-plugins')(),
  config = require('./build.conf.js');

/////////////////////////////////////////////////////////////////////////////////////
//
// cleans the build output
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('clean', function (cb) {
  return gulp
    .src(config.buildFolder, {read: false})
    .pipe(plugins.clean());
});



/////////////////////////////////////////////////////////////////////////////////////
//
// runs jshint
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('jshint', function() {
  gulp.src(config.srcJs)
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'))
    .pipe(plugins.jshint.reporter('fail'))
});



/////////////////////////////////////////////////////////////////////////////////////
//
// Build a minified Javascript bundle. If more than one file is concatenated keep an
// eye on the order or use Browserify or similar.
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('build-js', ['clean'], function() {

  return gulp.src(config.srcJs)

    // package
    .pipe(plugins.concat(config.buildJsFilename))
    .pipe(plugins.header(config.banner))
    .pipe(gulp.dest(config.buildFolder))
    .pipe(plugins.filesize())

    // minify
    .pipe(plugins.uglify())
    .pipe(plugins.rename({ extname: '.min.js' }))
    .pipe(gulp.dest(config.buildFolder))
    .pipe(plugins.filesize())
    .on('error', plugins.util.log);

});

/////////////////////////////////////////////////////////////////////////////////////
//
// full build (except sprites), applies cache busting to the main page css and js bundles
//
/////////////////////////////////////////////////////////////////////////////////////

gulp.task('build', [ 'clean', 'jshint', 'build-js'], function() {
});
