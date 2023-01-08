function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var run_speed = []; var bike_speed = [];
var run_dates = []; var bike_dates = [];
var run_distance = []; var bike_distance = [];
var longest_distance_c = 0; var longest_speed_c = 0; var longest_name_c = '';
var fastest_speed_c = 0; var fastest_distance_c = 0; var fastest_name_c = '';
var longest_distance_r = 0; var longest_speed_r = 0; var longest_name_r = '';
var fastest_speed_r = 0; var fastest_distance_r = 0; var fastest_name_r = '';
var showDays = 20; var meanDays = 10;

const background_color = ['#673C4F','#7F557D','#726E97','#7698B3','#83B5D1','#BFEDEF','#E5F9E0'];
const background_days = {'Monday': '#673C4F', 'Tuesday': '#7F557D', 'Wednesday': '#726E97', 'Thursday': '#7698B3', 'Friday': '#83B5D1', 'Saturday': '#BFEDEF', 'Sunday': '#E5F9E0', };

L.mapbox.accessToken = mapbox_token;
const map = L.mapbox.map('map')
    .setView([59.97, 30.25], 12)
    .addLayer(L.mapbox.styleLayer('mapbox://styles/petosbratok/cl1ukjde8000514ltcfj80eto'));

const polyline_options = {
    color: '#BDD9BF',
    weight: 3,
    opacity: 0.7,
    smoothFactor: 2.5,
};
const polyline_options_2 = {
    color: '#E5BEED',
    weight: 3,
    opacity: 0.4,
    smoothFactor: 2.5,
};

async function getActivities(res) {
  var all_data = [];
  let total_pages = 5;
  let request_size = [0, 100, 100, 100, 100]
  var total_requests = total_pages-1;
  var successful_requests = 0;
  for(var page=1; page<total_pages; page++){
    const activities = `https://www.strava.com/api/v3/athlete/activities?access_token=${res.access_token}&per_page=${request_size[page]}&page=${page}`
    fetch(activities)
      .then((res) => res.json())
      .then(async function(data){

        all_data.push(data)
        if (page == total_pages){
          successful_requests +=1
        }
        if (successful_requests == total_requests){
          let dates = []
          let data_sorted = [[], [], []]
          for (let dataset of all_data){
            date = dataset[0].start_date_local;
            year = +date.substring(0, 4);
            month = +date.substring(5, 7);
            dates.push(year*100 + month)
          }
          dates.sort(function(a, b) {
            return a - b;
          });
          dates.reverse()
          let count = 0
          for (let dataset of all_data){
            date = dataset[0].start_date_local
            year = +date.substring(0, 4);
            month = +date.substring(5, 7);
            date = (year*100 + month)
            index = dates.indexOf(date)
            data_sorted[index] = all_data[count]
            count += 1;
          }
          await analize(data_sorted)
        }


        for(var x=0; x<data.length; x++){
          try{
          var coordinates = L.Polyline.fromEncoded(data[x].map.summary_polyline).getLatLngs()
          } catch (e) {}
          var line_points = [];
          for(var coord=0; coord<coordinates.length; coord++){
            line_points.push([coordinates[coord].lat, coordinates[coord].lng]);
          }
          if ( data[x].type == 'Run'){
            var polyline = L.polyline(line_points, polyline_options).addTo(map);
          } else {
            var polyline = L.polyline(line_points, polyline_options_2).addTo(map);
          }
        }
      })
  }
}

async function analize(all_data){
  let runs_time = 0; let ride_time = 0; let swim_time = 0
  let moving_time = 0; let distance = 0; let count = 0
  let weekdays = {'Monday':0, 'Tuesday':0, 'Wednesday':0, 'Thursday':0, 'Friday':0, 'Saturday':0, 'Sunday':0, };
  let months = {'January':0, 'February':0, 'March':0, 'April':0, 'May':0, 'June':0, 'July':0, 'August':0, 'September':0, 'October':0, 'November':0, 'December': 0};
  let year = ''; let month = ''; let day = ''; let date = ''; let month_name = '';

  for (const dataset of all_data) {
    for (const post of dataset) {
      date = post.start_date_local;
      year = +date.substring(0, 4);
      month = +date.substring(5, 7);
      day = +date.substring(8, 10);
      date = (month + ', ' + day + ', ' + year).toString()
      date = new Date(date);
      dayOfTheWeek = date.toLocaleString('en-us', {weekday: 'long'});
      weekdays[dayOfTheWeek] += 1;
      month_name = date.toLocaleString('en-us', { month: 'long' })
      months[month_name] += 1;
      count += 1;
      
      distance_curr = parseFloat((post.distance/1000).toFixed(1))
      speed = parseFloat((post.average_speed*3.6).toFixed(1))
      distance += distance_curr
      moving_time += (post.moving_time/60/60);
      info = `${month_name.substring(0, 3)} ${day}, ${year}; ${distance_curr} km at ${speed} km/h`

      if (post.type == "Run"){
        if (distance_curr > 2 && (post.average_speed > 2)){
          run_speed.push(speed);
          run_dates.push(info)
          if (distance_curr > longest_distance_r){
            longest_speed_r = speed
            longest_distance_r = distance_curr
          }
          run_distance.push(distance_curr);
          if (speed > fastest_speed_r){
            fastest_speed_r = speed;
            fastest_distance_r = distance_curr
          }
        }
        runs_time += (post.moving_time/60/60);
      } else if (post.type == "Ride") {
        if ((post.distance > 10000) && (post.average_speed > 5)){
          bike_speed.push(post.average_speed*3.6);
          bike_dates.push(info)
          if ((post.distance/1000) > longest_distance_c){
            longest_speed_c = (post.average_speed * 3.6).toFixed(1);
            longest_distance_c = (post.distance/1000).toFixed(1);
          }
          bike_distance.push(post.distance/1000);
          if ((post.average_speed * 3.6) > fastest_speed_c){
            fastest_speed_c = (post.average_speed * 3.6).toFixed(1);
            fastest_distance_c = (post.distance/1000).toFixed(1);
          }
        }
        ride_time += (post.moving_time/60/60)
      } else {
        swim_time += (post.moving_time/60/60)
      }
    }
  }
  
  reverse_arrays()

  initializeIntro(count, distance, moving_time, runs_time, ride_time, swim_time)
  initializePieChart(weekdays)
  initializeChartSpeed(bike_speed, bike_dates);
  initializeChartDistance(bike_distance, bike_dates);
  initializeChartMonths(months);
  $('#fastest-speed').html(fastest_speed_c);
  $('#fastest-distance').html(fastest_distance_c);
  $('#longest-speed').html(longest_speed_c);
  $('#longest-distance').html(longest_distance_c);
}

function reverse_arrays(){
  bike_distance.reverse()
  bike_speed.reverse()
  bike_dates.reverse()
  run_speed.reverse();
  run_distance.reverse();
  run_dates.reverse()
}

function initializeIntro(count, distance, moving_time, runs_time, ride_time, swim_time){
  var distance_part = parseInt(distance - 800);
  $('.total-training').css('opacity', '1');
  animateValue("count", 0, count, 3000);
  animateValue("distance", distance_part, (distance).toFixed(), 3000);
  animateValue("moving_time", 0, (moving_time).toFixed(), 3000);

  let overall_time = runs_time + swim_time + ride_time
  fill_ratio('.cycling-ratio-filled', ride_time, overall_time)
  fill_ratio('.running-ratio-filled', runs_time, overall_time)
  fill_ratio('.swimming-ratio-filled', swim_time, overall_time)
}

function fill_ratio(html_element_name, sport_count, overall_time){
  count_percentage = sport_count / overall_time * 100
  $(html_element_name).width(count_percentage + '%');
}

function reAuthorize(){
  const auth_link = "https://www.strava.com/oauth/token"
  fetch(auth_link,{
    method: 'post',
    headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'

    },

    body: JSON.stringify({

            client_id: client_id,
            client_secret: client_secret,
            refresh_token: refresh_token,
            grant_type: 'refresh_token'
        })
  }).then((res) => res.json())
      .then(res => getActivities(res))

}

function animateValue(id, start, end, duration) {
    if (start === end) return;
    var range = end - start;
    var current = start;
    var increment = end > start? 1 : -1;
    var stepTime = Math.abs(Math.floor(duration / range));
    var obj = document.getElementById(id);
    var timer = setInterval(function() {
        current += increment;
        obj.innerHTML = current;
        if (current == end) {
            clearInterval(timer);
        }
    }, stepTime);
}

function initializePieChart(weekdays){
  let labels = [];
  let data = [];
  for (var weekday in weekdays){
      labels.push(weekday);
      data.push(weekdays[weekday])
  }
  let fav_day;
  let fav_day_count = 0;
  let fav_day_color = '';
  for (var weekday in weekdays){
      if (weekdays[weekday] > fav_day_count){
        fav_day = weekday;
        fav_day_color = background_days[weekday]
        fav_day_count = weekdays[weekday];
      };
  }
  $('#fav-day').text(fav_day)
  $('#fav-day').css('opacity', '1');
  $('.fav-day-container').css("background-color", fav_day_color);
  const ctx = document.getElementById('myChart').getContext('2d');
  var data_percentage = []
  var sum = data.reduce((a, b) => a + b, 0)
  for (let data_i of data){
    data_percentage.push(data_i/sum)
  }
  var myChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
          labels: labels,
          datasets: [{
              data: data,
              backgroundColor: background_color,
              borderWidth: 0
          }]
      },
      options: {
        plugins: {
            legend: {
                labels: {
                    font: {
                        size: 18,
                    }
                }
            }
        }
    }
  });
}

async function initializeChartSpeed(speed, info){
  speed = speed.slice(-1 * (showDays + 1 + meanDays))
  info = info.slice(-1 * (showDays + 1))
  var N = speed.length;
  var moveMean = [];
  for (var i = 0; i < (showDays+meanDays+1); i++)
  {
      var mean = speed.slice(i-meanDays+1,i+1).reduce((a, b) => a + b, 0)/meanDays;
      moveMean.push(mean);
  }
  speed.push('naenae')
  moveMean.push('naenae')
  const ctx = document.getElementById('runningChartSpeed').getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    // Array.from(Array(speed.length).keys())
    data: {
      // labels: Array.from(Array(speed.length).keys()).slice(0, -6),
      labels: info,
      datasets: [
        {
        label: 'Average speed',
        data: speed.slice(meanDays, -1),
        fill: false,
        borderColor: '#7699D4',
        cubicInterpolationMode: 'monotone',
        },
        {
        label: meanDays + ' Session Moving Average',
        data: moveMean.slice(meanDays, -1),
        fill: false,
        borderColor: '#D8DBE2',
        cubicInterpolationMode: 'monotone',
        borderDash: [10,5],
        },
    ]
  },
  options: {
    scales: {
        x: {
          display: false,
        }
    },
    elements:{
                point:{
                    borderWidth: 0,
                    radius: 10,
                    backgroundColor: 'rgba(0,0,0,0)'
                }
            },
    plugins: {
        legend: {
            labels: {
              font: {
                size: 18,
              }
            }
        },
    }
}
  })
  window.chartSpeed = myChart;
}

async function initializeChartDistance(distance, info){
  distance = distance.slice(-1 * (showDays + 1 + meanDays))
  info = info.slice(-1 * (showDays + 1))
  var N = distance.length;
  var moveMean = [];
  for (var i = 0; i < (showDays+meanDays+1); i++)
  {
      var mean = distance.slice(i-meanDays+1,i+1).reduce((a, b) => a + b, 0)/meanDays;
      moveMean.push(mean);
  }
  distance.push('naenae')
  moveMean.push('naenae')
  const ctx = document.getElementById('runningChartDistance').getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: info,
      datasets: [
        {
        label: 'Distance',
        data: distance.slice(meanDays, -1),
        fill: false,
        borderColor: '#CE6D8B',
        cubicInterpolationMode: 'monotone',
        },
        {
        label: meanDays + ' Session Moving Average',
        data: moveMean.slice(meanDays, -1),
        fill: false,
        borderColor: '#CEBBC9',
        cubicInterpolationMode: 'monotone',
        borderDash: [10,5],
        },
    ]
  },
  options: {
    scales: {
        x: {
          display: false,
        }
    },
    elements:{
                point:{
                    borderWidth: 0,
                    radius: 10,
                    backgroundColor: 'rgba(0,0,0,0)'
                }
            },
    plugins: {
        legend: {
            labels: {
                // This more specific font property overrides the global property
                font: {
                    size: 18,
                    color: "red",
                }
            }
        }
    }
}
  })
  window.chartDistance = myChart;
}

async function initializeChartMonths(months){
  let labels = [];
  let data = [];
  for (var month in months){
      labels.push(month.slice(0, 3));
      data.push(months[month])
  }
  let fav_day;
  let fav_day_count = 0;

  for (var month in months){
      if (months[month] > fav_day_count){
        fav_day = month;
        fav_day_count = months[month];
      };
  }
  $('#fav-month').text(fav_day)
  $('#fav-month').css('opacity', '1');
  const ctx = document.getElementById('monthChart').getContext('2d');
  var myChart2 = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: labels,
          datasets: [
            {
              label: 'Month distribution',
              data: data,
              backgroundColor: '#C1F3F3',
              // borderColor: '#319AE1',
              borderWidth: 3
            }]
      },
      options: {
        scales: {
            x: {
              font: {
                size: 18,
              }
            }
        },
        plugins: {
            legend: {
                labels: {
                    // This more specific font property overrides the global property
                    font: {
                        size: 18,
                        color: "blue",
                    }
                }
            }
        },
    }
  });
  window.chartMonths = myChart;
}

function toggleCycling() {
  $('#running').addClass('mute');
  $('#cycling').removeClass('mute');
  chartSpeed.destroy();
  initializeChartSpeed(bike_speed, bike_dates);
  chartDistance.destroy();
  initializeChartDistance(bike_distance, bike_dates);
  $('#fastest-speed').html(fastest_speed_c);
  $('#fastest-distance').html(fastest_distance_c);
  $('#longest-speed').html(longest_speed_c);
  $('#longest-distance').html(longest_distance_c);
}

function toggleRunning() {
  $('#running').removeClass('mute');
  $('#cycling').addClass('mute');
  chartSpeed.destroy();
  initializeChartSpeed(run_speed, run_dates);
  chartDistance.destroy();
  initializeChartDistance(run_distance, run_dates);
  $('#fastest-speed').html(fastest_speed_r);
  $('#fastest-distance').html(fastest_distance_r);
  $('#longest-speed').html(longest_speed_r);
  $('#longest-distance').html(longest_distance_r);
}

reAuthorize()
