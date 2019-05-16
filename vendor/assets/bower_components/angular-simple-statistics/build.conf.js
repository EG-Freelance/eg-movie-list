/**
 * Created by cabargues on 2/12/16.
 */
module.exports = {

  srcJs: [
    'src/angular-simple-statistics.js',
    'src/angular-simple-statistics.factory.js',
    'src/angular-simple-statistics.filter.js',
    '!test/**/*.spec.js',
    '!./node_modules/**',
    '!./bower_components/**'
  ],
  srcSass: [
    './**/*.scss',
    '!./node_modules/**',
    '!./bower_components/**'
  ],
  srcHtml: [
    './**/*.html',
    '!./node_modules/**',
    '!./bower_components/**'
  ],
  tests: 'src/**/*.spec.js',
  buildFolder: 'dist',
  buildJsFilename: 'angular-simple-statistics.js',
  buildCssFilename: 'angular-simple-statistics.css',
  banner: '/*!\n' +
  ' * See LICENSE in this repository for license information\n' +
  ' */\n',
  closureStart: '(function(){\n',
  closureEnd: '\n})();'

};