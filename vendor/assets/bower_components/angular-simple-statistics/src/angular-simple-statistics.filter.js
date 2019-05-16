/**
 * Created by cabargues on 7/12/16.
 */
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
    .filter('ss', function(ss) {
      return function(array, method) {
        // Create an array with the arguments except the function name
        var args = Array.prototype.slice.call(arguments);
        args.splice(1, 1);

        return ss[method].apply(null, args);
      };
    });
})();