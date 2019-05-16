angular-simple-statistics
=======

[![Build Status](https://travis-ci.org/cabargues/angular-simple-statistics.svg?branch=master)](https://travis-ci.org/cabargues/angular-simple-statistics)

Angular wrapper for Simple Statistics library (http://simplestatistics.org/).
The wrapper includes:
- A factory to expose all library methods that can be injected and use it in "the angular way".
- A filter to use (some of) Simple Statistics methods directly in your templates.

##Usage

#####1. Install this module 
```
bower install angular-simple-statistics
```

#####2. Include the dependencies in your index.html file:
```html
<script src="bower_components/simple-statistics/dist/simple-statistics.min.js"></script>
<script src="bower_components/angular-simple-statistic/dist/angular-simple-statistics.min.js"></script>
```

#####3. Include the dependencies in your module's definition.
```javascript
angular.module('myModule', ['cabargues.angularSimpleStatistics']);
```

#####4. Inject the factory and use it in your controllers, factories, filters, etc.
More info about Simple Statistics methods can be found here: http://simplestatistics.org/docs/
 ```javascript
 angular
  .module('myModule')
  .controller('myCtrl', ['ss', function(ss) {
    this.minValue = ss.min([1, 2, 3]);
    
  }])
 ```
 
#####5. Use the Simple Statistics methods as a filter in your templates. 
 Currently only those methods requiring one single argument are supported. 
 ```html
 <span>{{[1, 2, 3] | ss: 'standardDeviation' }}</span>
 <span>{{ $ctrl.array | ss: 'geometricMean' }}</span>
 ```
 
 
 
 