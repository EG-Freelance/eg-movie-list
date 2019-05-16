angular.module('EgMovieList.Charts', [
  'ui.router',
  'templates',
  'ngMaterial',
  'ngMdIcons',
  'ui.bootstrap',
  'chart.js' // angular charts
])

.config(['$stateProvider', function($stateProvider){
  $stateProvider
    .state('egmovielist.charts', {
      url: '/charts',
      views: {
        'main@': { // target the 'main' ng-view directive
          controller:  'ChartsCtrl as chartsCtrl',
          templateUrl: 'charts/charts.tmpl.html'
        }
      }
    })
  }])
  
.controller('ChartsCtrl', ['$q', '$uibModal', '$http', '$window', '$log', '$location', '$state', '$filter', '$timeout', '$document', function($q, $uibModal, $http, $window, $log, $location, $state, $filter, $timeout, $document){
  var chartsCtrl = this;
  chartsCtrl.get_trend = get_trend;
  chartsCtrl.organize_chart_data = organize_chart_data;
  chartsCtrl.series = "";
  chartsCtrl.year = "";
  chartsCtrl.imdb_id = "";
  chartsCtrl.series_list = {};
  
  function init() {
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
    chartsCtrl.httpCallText = buttonText;
    chartsCtrl.httpCall = {
      'background-color': buttonColor
    }
  }

  function get_trend(series, year, imdb_id) {
    // set url based on params provided
    var canvas = document.getElementById('chart');
    var base_url = 'https://www.omdbapi.com/?apikey=b03879be&'
    if(imdb_id){
      var url = base_url + 'i=' + encodeURI(imdb_id) + '&season=1';
    }else{
      var url = base_url + 't=' + encodeURI(series) + '&y=' + year + '&season=1';
    }
    
    // set render var to make sure we only render the data when all seasons have finished populating
    var renders = 1;
    // clear series_list
    chartsCtrl.series_list = {}
    
    // get info from OMDb API (basic info + S1 data first, then loop to get Sn info)
    $http.get(url)
    .then(function(response){
      if(response.data.Response == "False"){
        if (canvas){
          var ctx = canvas.getContext('2d');
          ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
        }
        chartsCtrl.series_list = {}
        chartsCtrl.chart_title = "Series not found"
        return false;
      }
      var seasons = response.data.totalSeasons;
      chartsCtrl.series_list[1] = response.data.Episodes.filter(function(e){
        return e["Released"] != "N/A";
      });
      chartsCtrl.chart_title = response.data.Title
      
      if(parseInt(seasons) == 1){
        organize_chart_data(chartsCtrl.series_list);
      }else{
        for(var i = 2; i <= parseInt(seasons); i++){
          if(imdb_id){
            var url = base_url + 'i=' + encodeURI(imdb_id) + '&season=' + String(i);
          }else{
            var url = base_url + 't=' + encodeURI(series) + '&y=' + year + '&season=' + String(i);
          }
          
          $http.get(url)
          .then(function(resp){
            chartsCtrl.series_list[resp.data.Season] = resp.data.Episodes.filter(function(e){
              return e["Released"] != "N/A";
            });
            renders++;
            
            // render the chart if the number of seasons pulled is equal to the number of seasons on record
            if(renders == parseInt(seasons)){
              organize_chart_data(chartsCtrl.series_list);
            }
          }, function(data, status) {
            $log.log(data.error + ' ' + status);
          })
        }
      }
    }, function(data, status) {
      $log.log(data.error + ' ' + status);
    })
  }
  
  function organize_chart_data(raw){
    // function to generate static random color scheme
    function getColors(n){
      // function to convert hsl color to rgb
      function hslToRgb(h, s, l){
        var r, g, b;
    
        if(s == 0){
          r = g = b = l; // achromatic
        }else{
          var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1.0/6) return p + (q - p) * 6 * t;
            if(t < 1.0/2) return q;
            if(t < 2.0/3) return p + (q - p) * (2.0/3 - t) * 6;
            return p;
          }
  
          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1.0/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1.0/3);
        }
        
        return "rgba(" + String(Math.round(r * 255)) + "," + String(Math.round(g * 255)) + "," + String(Math.round(b * 255)) + ",opac)";
      }
      
      colors = [];
      // cycle through and create colors
      if(n < 1) { return [hslToRgb(1.0, 1.0, .7)] }
      for(var i = 0; i < n; i++){
        colors.push(hslToRgb((i * (360.0 / n) % 360)/360.0,1.0,.4));
      }

      return colors.sort(function(){ return Math.random() - 0.5 });
    }
    
    // function to get start and end points for dataset // dataset should be [{x: n, y: n}, {...}]
    // function getBestFit(data){
    //   // remove null data
    //   data = data.filter(function(obj){
    //     if(!isNaN(obj['y'])){
    //       return true;
    //     }
    //   });
    //   var xData = data.map(function(v,k){ return v['x'] });
    //   var yData = data.map(function(v,k){ return v['y'] });
    //   var pairs = data.map(function(v,k){ return [v['x'], parseFloat(v['y'])] });
      
    //   var func = ss.linearRegression(pairs);
      
    //   var xMin = ss.min(xData);
    //   var xMax = ss.max(xData);
      
    //   var yLeft = func['b'] + xMin * func['m'];
    //   var yRight = func['b'] + xMax * func['m'];
    //   return [{x: xMin, y: yLeft}, {x: xMax, y: yRight}];
    // }
    
    function getBestFit(data) {
      // remove null data
      data = data.filter(function(obj){
        if(!isNaN(obj['y'])){
          return true;
        }
      });

      var xData = data.map(function(v,k){ return v['x'] });
      // var yData = data.map(function(v,k){ return v['y'] });

      var rV = {},
        N = data.length,
        sumX = 0,
        sumY = 0,
        sumXx = 0,
        sumYy = 0,
        sumXy = 0;

      // can't fit with 0 or 1 point
      if (N < 2) {
        return rV;
      }

      for (var i = 0; i < N; i++) {
        var x = data[i]['x'],
          y = data[i]['y'];
        sumX += x;
        sumY += y;
        sumXx += (x * x);
        sumYy += (y * y);
        sumXy += (x * y);
      }

      // calc slope and intercept
      rV['slope'] = ((N * sumXy) - (sumX * sumY)) / (N * sumXx - (sumX * sumX));
      rV['intercept'] = (sumY - rV['slope'] * sumX) / N;

      var xMin = Math.min(...xData);
      var xMax = Math.max(...xData);

      var yLeft = rV['intercept'] + xMin * rV['slope'];
      var yRight = rV['intercept'] + xMax * rV['slope'];

      return [{x: xMin, y: yLeft}, {x: xMax, y: yRight}];
    }
    
    // scrub raw to make sure we're not trying to get null data
    for(var season in raw){
      if(raw[season].length == 0){
        delete raw[season];
      }
    }
    var seasons = Object.keys(raw).sort(function(e){ parseInt(e) });
    var series_labels = [];
    var labels = [];
    var label_store = [];
    var datasets = [];
    var ep_data = [];
    var colors = getColors(seasons.length);
    // create an empty dataset for each season
    seasons.forEach(function(){
      // push in two empty datasets (one for data, one for trendline) and an empty episode data array
      datasets.push([]);
      datasets.push([]);
      ep_data.push([]);
    });
    
    // for each season
    var i = 0;
    seasons.forEach(function(s){
      series_labels.push("Season " + s.padStart(2, '0'));
      var season_ix = seasons.indexOf(s);
      // for each episode
      raw[s].forEach(function(e){
        label_store.push("S" + s.padStart(2, '0') + "E" + e.Episode.padStart(2, '0'));
        labels.push(i);
        datasets[season_ix * 2].push({ x: i, y: parseFloat(e['imdbRating']) });
        
        ep_data[season_ix].push(e);
        i++;
        // push in imdb rating value if correct dataset -- otherwise, push NaN
      });
      datasets[(season_ix * 2) + 1].push(getBestFit(datasets[season_ix * 2]));
      datasets[(season_ix * 2) + 1] = datasets[(season_ix * 2) + 1].flat();
    });
    
    // remove any seasons with empty data
    datasets = datasets.filter(function(arr){
      return arr[0] != null;
    });
    
    chartsCtrl.dataset = datasets;
    chartsCtrl.labels = labels;
    chartsCtrl.series_labels = series_labels;
    
    var link_base = "https://www.imdb.com/title/"

    chartsCtrl.dataset_override = [];
  
    // set all data and trendlines
    series_labels.forEach(function(s){
      chartsCtrl.dataset_override.push(
        {
          label: s,
          borderWidth: 2,
          type: "line",
          borderColor: colors[series_labels.indexOf(s)].replace("opac", "0.8"),
          backgroundColor: colors[series_labels.indexOf(s)].replace("opac", "0.3"),
          pointBorderColor: colors[series_labels.indexOf(s)].replace("opac", "0.8"),
          pointBackgroundColor: colors[series_labels.indexOf(s)].replace("opac", "0.8"),
          pointHoverBorderColor: colors[series_labels.indexOf(s)].replace("opac", "0.8"),
          pointHoverBackgroundColor: colors[series_labels.indexOf(s)].replace("opac", "0.8")
        },{
          label: "trend",
          borderWidth: 1,
          type: 'line',
          borderDash: [10,5],
          borderColor: colors[series_labels.indexOf(s)].replace("opac", "0.8"),
          backgroundColor: colors[series_labels.indexOf(s)].replace("opac", "0.3"),
          pointBorderColor: colors[series_labels.indexOf(s)].replace("opac", "0.8"),
          pointBackgroundColor: colors[series_labels.indexOf(s)].replace("opac", "0.8"),
          pointHoverBorderColor: colors[series_labels.indexOf(s)].replace("opac", "0.8"),
          pointHoverBackgroundColor: colors[series_labels.indexOf(s)].replace("opac", "0.8")
        });
    });

    chartsCtrl.options = { 
      elements: {
        line: {
          fill: false,
        }
      },
      legend: {
        display: true,
        labels: {
          filter: function(legendItem, chartData){
            if(legendItem.text != "trend"){
              return true;
            }
          }
        }
      },
      hover: {
        mode: 'single'
      },
			tooltips: {
			  mode: 'single',
        callbacks: {
          title: function(tooltipItem) {
            if(tooltipItem[0] != undefined){
              return "Season " + seasons[tooltipItem[0].datasetIndex / 2] + ' Episode ' + ep_data[tooltipItem[0].datasetIndex / 2][tooltipItem[0].index]["Episode"];
            }else{
              return "";
            }
          },
          beforeLabel: function(tooltipItem){
            if((tooltipItem.datasetIndex % 2) == 0){
              return "Title: " + ep_data[tooltipItem.datasetIndex / 2][tooltipItem.index]["Title"];
            }else{
              return "";
            }
          },
          label: function(tooltipItem){
            if((tooltipItem.datasetIndex % 2) == 0){
              return "Score: " + ep_data[tooltipItem.datasetIndex / 2][tooltipItem.index]["imdbRating"];
            }else{
              return "";
            }
          },
          afterLabel: function(tooltipItem){
            if((tooltipItem.datasetIndex % 2) == 0){
              return "Aired: " + ep_data[tooltipItem.datasetIndex / 2][tooltipItem.index]["Released"];
            }else{
              return "";
            }
          }
        },
        filter: function(tooltipItem, data){
          if((tooltipItem.datasetIndex % 2) == 0){
            return true;
          }
        }
      },
      scales: { 
        xAxes: [{ 
          type: 'linear', 
          labels: chartsCtrl.labels,
          position: 'bottom',
          ticks: {
            autoSkip: true,
            autoSkipPadding: 15,
            maxRotation: 75,
            minRotation: 25,
            stepSize: 1,
            userCallback: function(label, index, labels){
              return label_store[label];
            }
          }
        }],
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: "IMDb Rating"
          },
          ticks: {
            min: 0,
            max: 10
          }
        }]
      },
      onClick: function(ev, el){
        var el = el[0];
        // if not clicking on an element
        if(!el || (el._datasetIndex % 2) == 1){ return; }
        var ep_url = ep_data[el._datasetIndex / 2][el._index]["imdbID"]
        $window.open(link_base + ep_url, '_blank');
      }
    };
  }
}]);