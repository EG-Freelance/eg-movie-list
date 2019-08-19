(function(){
  var episodesFactory = ['$http', function($http){
    var factory = {};
    
    factory.getEpisodes = function(imdb_id){
      return $http.get("api/episodes/" + imdb_id);
    }
    
    return factory;
  }];
  
  angular.module('EgMovieList').factory('episodesFactory', episodesFactory);
  
}());