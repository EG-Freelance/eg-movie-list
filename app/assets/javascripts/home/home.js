angular.module('EgMovieList.Home', [
  'ui.router',
  'templates',
  'ngMaterial',
  'ngMdIcons',
  'ui.bootstrap',
  'vAccordion',
  'ngFileUpload',
  'ngSanitize',
  'angularUtils.directives.dirPagination'
])

.config(['$stateProvider', function($stateProvider){
  $stateProvider
    .state('egmovielist.home', {
      url: '/',
      views: {
        'main@': { // target the 'main' ng-view directive
          controller:  'HomeCtrl as homeCtrl',
          templateUrl: 'home/home.tmpl.html'
        }
      }
    })
  }])
  
/*.directive('testDirective', function(){
  return {
    template: "<h1>hello bitches</h1>"
  }
})*/
  
.controller('HomeCtrl', ['$q', '$uibModal', '$http', '$window', 'listingsFactory', 'genresFactory', 'actorsFactory', 'directorsFactory', 'writersFactory', 'failuresFactory', '$log', '$location', '$state', '$filter', '$timeout', '$document', 'Upload', function($q, $uibModal, $http, $window, listingsFactory, genresFactory, actorsFactory, directorsFactory, writersFactory, failuresFactory, $log, $location, $state, $filter, $timeout, $document, Upload){
  var homeCtrl = this;
  homeCtrl.listings = [];
  homeCtrl.add_listing = add_listing;
  homeCtrl.import_listing = import_listing;
  homeCtrl.add_rating = add_rating;
  homeCtrl.browseButton = browseButton;
  homeCtrl.uploadFile = uploadFile;
  homeCtrl.sort = 'title';
  homeCtrl.reverseSort = false;
  homeCtrl.sortFunction = sortFunction;
  homeCtrl.icon = 'keyboard_arrow_up';
  homeCtrl.tab = 1;
  homeCtrl.selectTab = function (setTab){
  	homeCtrl.tab = setTab;
  };
  homeCtrl.isSelected = function(checkTab) {
  	return homeCtrl.tab === checkTab;
  };
  homeCtrl.mediaOpts = [['Movie','movie'],['Show or Mini-Series','series'],['Single Episode','episode']];
  homeCtrl.defaultBgColor = 'deepskyblue'
  homeCtrl.defaultClass = {'background-color':homeCtrl.defaultBgColor,'color':'black'};
  homeCtrl.httpCall = homeCtrl.defaultClass;
  homeCtrl.httpCallText = "Submit";
  homeCtrl.httpResponse = httpResponse;
  homeCtrl.updateListing = updateListing;
  homeCtrl.editListing = editListing;
  homeCtrl.deleteListing = deleteListing;
  homeCtrl.removeFailure = removeFailure;
  homeCtrl.removeAllFailures = removeAllFailures;
  homeCtrl.refreshListings = refreshListings;
  homeCtrl.createListing = createListing;
  homeCtrl.itemsPerPage = 50;
  homeCtrl.rpp = homeCtrl.itemsPerPage;
  homeCtrl.exportListings = exportListings;

  function init() {
    homeCtrl.loading = true;
    // collapse commented genres, actors, directors, and writers factories; unnecessary DB calls (contained withing listingsFactory return)
    // if(false){
    // genresFactory.getGenres()
    //   .then(function(response){
    //   homeCtrl.genres = $filter('orderBy')(response.data, 'name');
    // }, function(data, status) {
    //   $log.log(data.error + ' ' + status);
    // });
    
    // actorsFactory.getActors()
    //   .then(function(response){
    //   homeCtrl.actors = $filter('orderBy')(response.data, 'name');
    // }, function(data, status) {
    //   $log.log(data.error + ' ' + status);
    // // });
    
    // directorsFactory.getDirectors()
    //   .then(function(response){
    //   homeCtrl.directors = $filter('orderBy')(response.data, 'name');
    // }, function(data, status) {
    //   $log.log(data.error + ' ' + status);
    // });
    
    // writersFactory.getWriters()
    //   .then(function(response){
    //   homeCtrl.writers = $filter('orderBy')(response.data, 'name');
    // }, function(data, status) {
    //   $log.log(data.error + ' ' + status);
    // });
    // }
    
    listingsFactory.getListings()
      .then(function(response) {
      // set default order for listings from API
      homeCtrl.listings = $filter('orderBy')(response.data, homeCtrl.sort);
      // set genres and order alphabetically
      homeCtrl.genres = $filter('orderBy')(dedupeByKey(
        [].concat.apply([],response.data.map(function(r){
          return r.genres
        })), "name"
      ),'name');
      // set actors and order alphabetically
      
      var people = dedupeByKey([].concat.apply([],response.data.map(function(r){return r.people})),'name', 'role');
      homeCtrl.actors = $filter('orderBy')($filter('filter')(people, {role: 'actor'}),'name');
      homeCtrl.directors = $filter('orderBy')($filter('filter')(people, {role: 'director'}),'name');
      homeCtrl.writers = $filter('orderBy')($filter('filter')(people, {role: 'writer'}),'name');
      
      // set genres, actors, and directors for listings object
      angular.forEach(homeCtrl.listings, function(obj){ 
        // map
        obj.genres=obj.genres.map(function(g){ 
          return g['name']
        }).join(", "); 
        var actors = new Array();
        var directors = new Array();
        var writers = new Array();
        angular.forEach(obj.people, function(p){
          if(p.role === "actor"){
            actors.push(p.name)
          }else if(p.role === "director"){
            directors.push(p.name);
          }else{
            writers.push(p.name);
          };
        });
        obj.actors = actors.join(", ");
        obj.directors = directors.join(", ");
        obj.writers = writers.join(", ");
      });
      // if(homeCtrl.reverseSort){ homeCtrl.listings.reverse() };
      // homeCtrl.listingsToDisplay();
      homeCtrl.loading = false;
    }, function(data, status) {
      $log.log(data.error + ' ' + status);
    });
    
    failuresFactory.getFailures()
      .then(function(response){
      homeCtrl.failures = $filter('orderBy')($filter('filter')(response.data, { 'failed_attempt':'2' } ), 'created_at');
    }, function(data, status) {
      $log.log(data.error + ' ' + status);
    });
    
    // set loading to false
    
  } // end of init
  
  init();
  
  /*********************
  *  Private functions *
  * *******************/
  
  function httpResponse(status){
    var buttonColor;
    var buttonText;
    if(status == "success"){
      buttonColor = "lightgreen";
      buttonText = "SUCCESS!";
    }else if(status == "pending"){
      buttonColor = "yellow";
      buttonText = "PENDING...";
    }else if(status == "failure"){
      buttonColor = "red";
      buttonText = "FAILURE";
    }else{
      buttonColor = homeCtrl.defaultBgColor;
      buttonText = "Submit"
    }
    homeCtrl.httpCallText = buttonText;
    homeCtrl.httpCall = {
      'background-color': buttonColor
    }
  }
  
  function uploadFile(file){
    $http.post('/api/authenticate', {
      password: homeCtrl.ioPassword
    }).then(function(response){
      file.upload = Upload.upload({
        url: '/api/upload_file',
        data: {file: file},
      });
  
      file.upload.then(function (response) {
        httpResponse("success");
        $timeout(function(){ httpResponse("revert") }, 3000);
        $timeout(function() {
          file.result = response.data;
        });
      }, function (response) {
        if (response.status > 0)
          httpResponse("failure");
          $timeout(function(){ httpResponse("revert") }, 3000);
          homeCtrl.errorMsg = response.status + ': ' + response.data;
      }, function (evt) {
        // Math.min is to fix IE which reports 200% sometimes
        file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
      });
    }, function(data, status) {
      $log.log(data.error + ' ' + status);
    })
  }
  
  function exportListings() {
    var today = new Date()
    today = today.getFullYear()+'/'+(today.getMonth() < 10 ? '0' : '') + parseInt(today.getMonth()+1)+'/'+(today.getDate() < 10 ? '0' : '') + today.getDate();
    var fileName = 'Movie Listings ' + today + '.xls'

    var blob = new Blob([document.getElementById('exportable').innerHTML], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
    });
    saveAs(blob, fileName);
  };

  function browseButton(category, query){
    if(category == 'genre'){
      homeCtrl.genreFilter = query;
    }else if(category == 'actor'){
      homeCtrl.actorFilter = query;
    }else if(category == 'director'){
      homeCtrl.directorFilter = query;
    }else if(category == 'writer'){
      homeCtrl.writerFilter = query;
    }else{
      console.log('Invalid input');
    }
  }
  
  function import_listing(imdb_id, search_title, display_title, year, media, season, location, owner, notes, holiday) {
    $http.post('/api/authenticate', {
      password: homeCtrl.ioPassword
    }).then(function(response){
      $http.post('/api/import_listing', {
        imdb_id: imdb_id,
        search_title: search_title,
        display_title: display_title,
        year: year,
        media: media,
        location: location,
        season: season,
        owner: owner,
        notes: notes,
        holiday: holiday
      }).then(function(response){
        init();
        httpResponse("success");
        $timeout(function(){ httpResponse("revert") }, 3000);
      }, function(data, status) {
        httpResponse("failure");
        $timeout(function(){ httpResponse("revert") }, 3000);
        $log.log(data.error + ' ' + status);
      });
    }, function(data, status) {
      $log.log(data.error + ' ' + status);
    })
  }

  function add_listing(title, year, media_type, runtime, location, owner, genres, actors, directors, writers, imdb_rating, rt_rating, notes) {
    $http.post('/api/authenticate', {
      password: homeCtrl.ioPassword
    }).then(function(response){
      $http.post('/api/add_listing', {
        title: title,
        year: year,
        media_type: media_type,
        runtime: runtime,
        location: location,
        owner: owner,
        genres: genres,
        actors: actors,
        directors: directors,
        writers: writers,
        imdb_rating: imdb_rating || 0,
        rt_rating: rt_rating || 0,
        notes: notes
      }).then(function(response){
        homeCtrl.httpResponse("success");
        $timeout(function(){ httpResponse("revert") }, 3000);
        // Instead of running init() automatically, should leave as is and allow user to refresh manually
        // init();
      }, function(data, status) {
        httpResponse("failure");
        $timeout(function(){ httpResponse("revert") }, 3000);
        $log.log(data.error + ' ' + status);
      });
    }, function(data, status) {
      $log.log(data.error + ' ' + status);
    })
  }
  
  function createListing(title){
    homeCtrl.selectTab(2);
    homeCtrl.newListing = {};
    homeCtrl.newListing.title = title;
  }
  
  function add_rating(rating, id){
    $http.post('/api/add_rating', {
      imdb_rating: rating,
      id: id
    }).then(function(response){
    }, function(data, status){
      $log.log(data.error + ' ' + status);
    });
  }
  
  function deleteListing(id){
    $http.post('/api/authenticate', {
      password: homeCtrl.ioPassword
    }).then(function(response){
      $http.delete('/api/delete_listing/' + id  + '.json').then(function(){
        init();
      })
    }, function(data, status) {
      $log.log(data.error + ' ' + status);
    })
  }
  
  function sortFunction(column){
    if(homeCtrl.sort === column){
      homeCtrl.reverseSort = !homeCtrl.reverseSort;
      homeCtrl.icon == 'keyboard_arrow_up' ? homeCtrl.icon = 'keyboard_arrow_down' : homeCtrl.icon = 'keyboard_arrow_up';
    }else{
      homeCtrl.sort = column;
      homeCtrl.reverseSort = false;
      homeCtrl.icon = 'keyboard_arrow_up';
    }
  }
  
  function refreshListings(){
    init();
  }

  /*****************
  * UNIQUE FILTERS *
  * ***************/
  
  // Return object
  function dedupeByKey(arr, key1, key2) {
    const tmp = {};
    return arr.reduce(function(p, c){
      const k1 = c[key1];
      const k2 = c[key2];
      if (tmp[k1+k2]) return p;
      (tmp[k1+k2]) = 1;
      return p.concat(c);
    }, []);
  }
  
  // Return unique value
  // function unique(array){
  //   const unique = [...new Set(array.map(item => item.name))];
  //   console.log(unique)
  // }
  
  /**************************
   * FUNCTIONS FOR FAILURES *
   * ***********************/
   
  function removeFailure(id){
    $http.post('/api/authenticate', {
      password: homeCtrl.ioPassword
    }).then(function(response){
      $http.delete('/api/delete_failure/' + id + '.json').then(function(response){
        failuresFactory.getFailures()
          .then(function(response2){
          homeCtrl.failures = $filter('orderBy')($filter('filter')(response2.data, { 'failed_attempt':'2' } ), 'created_at');
        }, function(data, status) {
          $log.log(data.error + ' ' + status);
        });
      })
    }, function(data, status) {
      $log.log(data.error + ' ' + status);
    })
  }
 
  function removeAllFailures(){
    $http.post('/api/authenticate', {
      password: homeCtrl.ioPassword
    }).then(function(response){
      $http.delete('/api/delete_all_failures').then(function(response){
        failuresFactory.getFailures()
          .then(function(response2){
          homeCtrl.failures = $filter('orderBy')($filter('filter')(response2.data, { 'failed_attempt':'2' } ), 'created_at');
        }, function(data, status) {
          $log.log(data.error + ' ' + status);
        });
      })
    }, function(data, status) {
      $log.log(data.error + ' ' + status);
    })
  }
  
  /***************************
   * FUNCTIONS FOR MODAL USE *
   * ************************/
  
  function updateListing(listing){
    homeCtrl.params = { id: listing.id, title: listing.title, genres: listing.genres, actors: listing.actors, directors: listing.directors, writers: listing.writers, media_type: listing.media_type, location: listing.location, owner: listing.owner, imdb_rating: listing.imdb_rating, rt_rating: listing.rt_rating, year: listing.year, runtime: listing.runtime, plot: listing.plot, poster_url: listing.poster_url, notes: listing.notes, imdb_id: listing.imdb_id};
  }
  
  function editListing(id, title, genres, actors, directors, writers, media_type, location, owner, imdb_rating, rt_rating, year, runtime, plot, poster_url, notes, imdb_id){
    $http.post('/api/authenticate', {
      password: homeCtrl.ioPassword
    }).then(function(response){
      $http.post('/api/edit_listing/', {
        id: id,
        title: title,
        genres: genres,
        actors: actors,
        directors: directors,
        writers: writers,
        media_type: media_type,
        location: location,
        owner: owner,
        imdb_rating: imdb_rating,
        rt_rating: rt_rating,
        year: year,
        runtime: runtime,
        plot: plot,
        poster_url: poster_url,
        notes: notes,
        imdb_id: imdb_id,
        password: homeCtrl.ioPassword
      }).then(function(response2){
        homeCtrl.httpResponse("success");
        $timeout(function(){ httpResponse("revert") }, 3000);
        init();
      }, function(data, status) {
        httpResponse("failure");
        $timeout(function(){ httpResponse("revert") }, 3000);
        $log.log(data.error + ' ' + status);
      });
    }, function(data, status) {
      $log.log(data.error + ' ' + status);
    })
  }

  homeCtrl.animationsEnabled = true;

  homeCtrl.open = function (size, parentSelector) {
    var parentElem = parentSelector ? 
      angular.element($document[0].querySelector('.modal-demo ' + parentSelector)) : undefined;
    var modalInstance = $uibModal.open({
      animation: homeCtrl.animationsEnabled,
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      controller: 'ModalInstanceCtrl',
      templateUrl: 'myModalContent.html',
      controllerAs: 'homeCtrl',
      size: size,
      appendTo: parentElem,
      resolve: {
        params: function () {
          return homeCtrl.params;
        }
      }
    });

    modalInstance.result.then(function(params) {
      if(params[0] == "submit"){
        homeCtrl.editListing(
          params[1], //id
          params[2], //title
          params[3], //genres
          params[4], //actors
          params[5], //directors
          params[6], //writers
          params[7], //media_type
          params[8], //location
          params[9], //owner
          params[10], //imdb_rating
          params[11], //rt_rating
          params[12], //year
          params[13], //runtime
          params[14], //plot
          params[15], //poster_url
          params[16], //notes
          params[17] //imdb_id
        );
      }else{
        homeCtrl.deleteListing(params[1], params[2]);
      }
    }, function () {
      $log.info('Canceled');
    });
  };

  
}])

// Modal Controller
.controller('ModalInstanceCtrl', ['$uibModalInstance', 'params', function ($uibModalInstance, params) {
  var homeCtrl = this;

  homeCtrl.params = params;
  homeCtrl.selected = {
    param: homeCtrl.params[0]
  };

  homeCtrl.ok = function () {
    $uibModalInstance.close(['submit', homeCtrl.params.id, homeCtrl.params.title, homeCtrl.params.genres, homeCtrl.params.actors, homeCtrl.params.directors, homeCtrl.params.writers, homeCtrl.params.media_type, homeCtrl.params.location, homeCtrl.params.owner, homeCtrl.params.imdb_rating, homeCtrl.params.rt_rating, homeCtrl.params.year, homeCtrl.params.runtime, homeCtrl.params.plot, homeCtrl.params.poster_url, homeCtrl.params.notes, homeCtrl.params.imdb_id]);
  };

  homeCtrl.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
  
  homeCtrl.delete = function () {
    $uibModalInstance.close(['delete', homeCtrl.params.id, homeCtrl.ioPassword]);
  };
}])

.component('modalComponent', {
  templateUrl: 'myModalContent.html',
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&'
  },
  controller: function () {
    var comp = this;

    comp.$onInit = function () {
      comp.params = comp.resolve.params;
      comp.selected = {
        param: comp.params[0]
      };
    };

    comp.ok = function () {
      comp.close({$value: comp.selected.param});
    };

    comp.cancel = function () {
      comp.dismiss({$value: 'cancel'});
    };
    
    comp.delete = function () {
      comp.dismiss({$value: 'delete'});
    };
  }
})

.directive('ngReallyClick', [function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.bind('click', function() {
                var message = attrs.ngReallyMessage;
                if (message && confirm(message)) {
                    scope.$apply(attrs.ngReallyClick);
                }
            });
        }
    }
}]);