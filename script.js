function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

L.mapbox.accessToken = 'pk.eyJ1IjoicGV0b3NicmF0b2siLCJhIjoiY2wxdWtnNjM5MDB2ZzNkbDNzNzV2MThnbCJ9.--UWf-pthCKugxhxF4kmbQ';
var map = L.mapbox.map('map')
    .setView([59.97, 30.25], 12)
    .addLayer(L.mapbox.styleLayer('mapbox://styles/petosbratok/cl1ukjde8000514ltcfj80eto'));

var polyline_options = {
    color: '#BDD9BF',
    weight: 3,
    opacity: 0.7,
    smoothFactor: 2.5,
};
var polyline_options_2 = {
    color: '#E5BEED',
    weight: 3,
    opacity: 0.4,
    smoothFactor: 2.5,
};

async function getActivities(res) {
  var all_data = [];
  let total_pages = 2;
  var total_requests = total_pages-1;
  var successful_requests = 0;
  for(var page=1; page<total_pages; page++){
    const activities = `https://www.strava.com/api/v3/athlete/activities?access_token=${res.access_token}&per_page=60&page=${page}`
    fetch(activities)
      .then((res) => res.json())
      .then(async function(data){

        all_data.push(data)
        if (page == total_pages){
          successful_requests +=1
        }
        if (successful_requests == total_requests){
          await analize(all_data)
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
  console.log('hi')
  let runs_count = 0
  let ride_count = 0
  let moving_time = 0
  let distance = 0
  let count = 0
  let weekdays = {'Monday':0, 'Tuesday':0, 'Wednesday':0, 'Thursday':0, 'Friday':0, 'Saturday':0, 'Sunday':0, };
  let months = {'January':0, 'February':0, 'March':0, 'April':0, 'May':0, 'June':0, 'July':0, 'August':0, 'September':0, 'October':0, 'November':0, 'December': 0};
  let run_speed = [];
  let run_distance = [];
  var longest_distance = 0; var longest_speed = 0; var longest_name = '';
  var fastest_speed = 0; var fastest_distance = 0; var fastest_name = '';
  let year = ''; let month = ''; let day = ''; let date = ''; let month_name = '';
  for (const dataset of all_data) {
    for (const post of dataset) {

      if (post.type == "Run"){
        runs_count += 1;
      } else {
        if (post.average_speed > 2){
          run_speed.push(post.average_speed*3.6);
          if ((post.distance/1000) > longest_distance){
            longest_speed = (post.average_speed * 3.6).toFixed(1);
            longest_distance = (post.distance/1000).toFixed(1);
          }
        }
        if (post.distance > 3000){
          run_distance.push(post.distance/1000);
          if ((post.average_speed * 3.6) > fastest_speed){
            fastest_speed = (post.average_speed * 3.6).toFixed(1);
            fastest_distance = (post.distance/1000).toFixed(1);
          }
        }
        ride_count += 1
      }
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
      distance += (post.distance/1000);
      moving_time += (post.moving_time/60/60);

    }
  }
  initializeIntro(count, distance, moving_time, runs_count, ride_count)
  initializePieChart(weekdays)
  initializeRunningChart(run_speed.reverse());
  initializeRunningChartDistance(run_distance.reverse());
  initializeChartMonths(months);
  $('#fastest-speed').html(fastest_speed);
  $('#fastest-distance').html(fastest_distance);
  $('#longest-speed').html(longest_speed);
  $('#longest-distance').html(longest_distance);
}

function initializeIntro(count, distance, moving_time, runs_count, ride_count){
  var distance_part = parseInt(distance - 800);
  $('.total-training').css('opacity', '1');
  animateValue("count", 0, count, 3000);
  animateValue("distance", distance_part, (distance).toFixed(), 3000);
  animateValue("moving_time", 0, (moving_time).toFixed(), 3000);


  let runs_count_percentage = (runs_count)/(runs_count + ride_count) * 100
  let cycling_count_percentage = (ride_count)/(runs_count + ride_count) * 100
  $('.running-ratio-filled').width(runs_count_percentage + '%');
  $('.cycling-ratio-filled').width(cycling_count_percentage + '%');
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

            client_id: '80748',
            client_secret: 'dd7bfd8626e77e41d351f7a76a85be61531a5ceb',
            refresh_token: '33d2cf7c17d96d25428a3190515a237c4e19f84b',
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
  let background_color = ['#673C4F','#7F557D','#726E97','#7698B3','#83B5D1','#8A95A5','#B9C6AE'];
  let background_days = {'Monday': '#673C4F', 'Tuesday': '#7F557D', 'Wednesday': '#726E97', 'Thursday': '#7698B3', 'Friday': '#83B5D1', 'Saturday': '#8A95A5', 'Sunday': '#B9C6AE', };
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
  var myChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
          labels: labels,
          datasets: [{
              label: '# of Votes',
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

async function initializeRunningChart(speed){
  speed = speed.slice(-26)
  var N = speed.length;
  let length = 25;
  var moveMean = [];
  for (var i = 0; i < N; i++)
  {
      var mean = (speed[i] + speed[i-1] + speed[i-2] + speed[i-3] + speed[i-4])/5.0;
      moveMean.push(mean);
  }
  speed.push('naenae')
  moveMean.push('naenae')
  const ctx = document.getElementById('runningChartSpeed').getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    // Array.from(Array(speed.length).keys())
    data: {
      labels: Array.from(Array(speed.length).keys()).slice(0, -6),
      datasets: [
        {
        label: 'Average speed',
        data: speed.slice(5, -1),
        fill: false,
        borderColor: '#7699D4',
        cubicInterpolationMode: 'monotone',
        },
        {
        label: '5 Session Moving Average',
        data: moveMean.slice(5, -1),
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
}

async function initializeRunningChartDistance(distance){
  distance = distance.slice(-26)
  var N = distance.length;
  let length = 25;
  var moveMean = [];
  for (var i = 0; i < N; i++)
  {
      var mean = (distance[i] + distance[i-1] + distance[i-2] + distance[i-3] + distance[i-4])/5.0;
      moveMean.push(mean);
  }
  distance.push('naenae')
  moveMean.push('naenae')
  console.log(distance)
  console.log(moveMean)
  const ctx = document.getElementById('runningChartDistance').getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    // Array.from(Array(distance.length).keys())
    data: {
      labels: Array.from(Array(distance.length).keys()).slice(0, -6),
      datasets: [
        {
        label: 'Average distance',
        data: distance.slice(5, -1),
        fill: false,
        borderColor: '#CE6D8B',
        cubicInterpolationMode: 'monotone',
        },
        {
        label: '5 Session Moving Average',
        data: moveMean.slice(5, -1),
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
}

async function initializeChartMonths(months){
  let labels = [];
  let data = [];
  for (var month in months){
      labels.push(month.slice(0, 3));
      data.push(months[month])
  }
  console.log(data)
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
  var myChart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: labels,
          datasets: [{
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
}

reAuthorize()
