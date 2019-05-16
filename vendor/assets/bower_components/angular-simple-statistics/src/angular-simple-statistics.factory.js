/**
 * Created by cabargues on 7/12/16.
 *
 * Factory to wrap and expose simple-statistics library as an injectable factory.
 *
 */
(function() {
  'use strict';

  angular
    .module('cabargues.angularSimpleStatistics')
    .factory('ss', ['$window', function($window) {

      // Check $window and simple-statistics exists
      if (!$window || !$window.ss) {
        console.warn('Missing simple-statistics: angular-simple-statistics will not work.');
      }

      // Get a local handle on the global simple-statistics reference.
      var ss = $window.ss;

      // Optional: Delete the global reference to avoid referencing the library without injecting it.
      // delete($window.ss);

      // Return the formerly global reference so that it can be injected
      return (ss);

    }]);
})();