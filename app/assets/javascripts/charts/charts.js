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
      var seasons = response.data.totalSeasons;
      chartsCtrl.series_list[1] = response.data.Episodes.filter(function(e){
        return e["Released"] != "N/A";
      });
      chartsCtrl.chart_title = response.data.Title

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
    }, function(data, status) {
      $log.log(data.error + ' ' + status);
    })
  }
  
  // var customTooltips = function(tooltip) {
  // 	// Tooltip Element
  // 	var tooltipEl = document.getElementById('chartjs-tooltip');
  
  // 	if (!tooltipEl) {
  // 		tooltipEl = document.createElement('div');
  // 		tooltipEl.id = 'chartjs-tooltip';
  // 		tooltipEl.innerHTML = '<table></table>';
  // 		this._chart.canvas.parentNode.appendChild(tooltipEl);
  // 	}
  
  // 	// Hide if no tooltip
  // 	if (tooltip.opacity === 0) {
  // 		tooltipEl.style.opacity = 0;
  // 		return;
  // 	}
  
  // 	// Set caret Position
  // 	tooltipEl.classList.remove('above', 'below', 'no-transform');
  // 	if (tooltip.yAlign) {
  // 		tooltipEl.classList.add(tooltip.yAlign);
  // 	} else {
  // 		tooltipEl.classList.add('no-transform');
  // 	}
  
  // 	function getBody(bodyItem) {
  // 		return bodyItem.lines;
  // 	}
  
  // 	// Set Text
  // 	if (tooltip.body) {
  // 		var titleLines = tooltip.title || [];
  // 		var bodyLines = tooltip.body.map(getBody);
  
  // 		var innerHtml = '<thead>';
  
  // 		titleLines.forEach(function(title) {
  // 			innerHtml += '<tr><th>' + title + 'ABCABCABC</th></tr>';
  // 		});
  // 		innerHtml += '</thead><tbody>';
  
  // 		bodyLines.forEach(function(body, i) {
  // 			var colors = tooltip.labelColors[i];
  // 			var style = 'background:' + "#303030";
  // 			style += '; border-color:' + "#909090";
  // 			style += '; border-width: 2px';
  // 			var span = '<span class="chartjs-tooltip-key" style="' + style + '"></span>';
  // 			innerHtml += '<tr><td>' + span + body + '</td></tr>';
  // 		});
  // 		innerHtml += '</tbody>';
  
  // 		var tableRoot = tooltipEl.querySelector('table');
  // 		tableRoot.innerHTML = innerHtml;
  // 	}
  
  // 	var positionY = this._chart.canvas.offsetTop;
  // 	var positionX = this._chart.canvas.offsetLeft;
  
  // 	// Display, position, and set styles for font
  // 	tooltipEl.style.opacity = 0.5;
  // 	tooltipEl.style.left = positionX + tooltip.caretX + 'px';
  // 	tooltipEl.style.top = positionY + tooltip.caretY + 'px';
  // 	tooltipEl.style.fontFamily = tooltip._bodyFontFamily;
  // 	tooltipEl.style.fontSize = tooltip.bodyFontSize + 'px';
  // 	tooltipEl.style.fontStyle = tooltip._bodyFontStyle;
  // 	tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding + 'px';
  // };
  
  function organize_chart_data(raw){
    var seasons = Object.keys(raw).sort(function(e){ return parseInt(e) });
    // var data = [];
    var series_labels = [];
    var labels = [];
    var datasets = [];
    var ep_data = [];
    // create an empty dataset for each season
    seasons.forEach(function(){
      datasets.push([]);
      ep_data.push([]);
    })
    
    // for each season
    seasons.forEach(function(s){
      series_labels.push("Season " + s.padStart(2, '0'));
      // for each episode
      raw[s].forEach(function(e){
        labels.push("S" + s.padStart(2, '0') + "E" + e.Episode.padStart(2, '0'));
        // push in imdb rating value if correct dataset -- otherwise, push NaN
        for(var i = 0; i < seasons.length; i++){
          if(i + 1 == parseInt(s)){
            datasets[i].push(parseFloat(e['imdbRating']));
            ep_data[i].push(e);
          }else{
            datasets[i].push(NaN);
            ep_data[i].push("");
          }
        }
      });
    });

    chartsCtrl.dataset = datasets;
    chartsCtrl.labels = labels;
    chartsCtrl.series_labels = series_labels;
    
    var link_base = "https://www.imdb.com/title/"
    
    chartsCtrl.options = { 
      elements: {
        line: {
          fill: false,
        }
      },
      legend: {
        display: true
      },
      // title: {
      //   display: true,
      //   text: chartsCtrl.chart_title,
      //   fontSize: 30
      // },
			tooltips: {
        callbacks: {
          title: function(tooltipItem) {
            return "Season " + seasons[tooltipItem[0].datasetIndex] + ' Episode ' + ep_data[tooltipItem[0].datasetIndex][tooltipItem[0].index]["Episode"];
          },
          beforeLabel: function(tooltipItem){
            return "Title: " + ep_data[tooltipItem.datasetIndex][tooltipItem.index]["Title"];
          },
          label: function(tooltipItem){
            return "Score: " + ep_data[tooltipItem.datasetIndex][tooltipItem.index]["imdbRating"];
          },
          afterLabel: function(tooltipItem){
            return "Aired: " + ep_data[tooltipItem.datasetIndex][tooltipItem.index]["Released"];
          }
        }
      },
      scales: { 
        xAxes: [{ 
          type: 'category', 
          labels: chartsCtrl.labels
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
        if(!el){ return; }
        var ep_url = ep_data[el._datasetIndex][el._index]["imdbID"]
        $window.open(link_base + ep_url, '_blank');
      }
    }
  }
}]);