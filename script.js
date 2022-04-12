function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

L.mapbox.accessToken = 'pk.eyJ1IjoicGV0b3NicmF0b2siLCJhIjoiY2wxdWtnNjM5MDB2ZzNkbDNzNzV2MThnbCJ9.--UWf-pthCKugxhxF4kmbQ';
var map = L.mapbox.map('map')
    .setView([59.97, 30.25], 11.5)
    .addLayer(L.mapbox.styleLayer('mapbox://styles/petosbratok/cl1ukjde8000514ltcfj80eto'));

// console.log(map.dragPan.isEnabled())
// map.dragPan.disable();
// Define polyline options
// http://leafletjs.com/reference.html#polyline
var polyline_options = {
    color: 'rgba(212, 55, 134, 0.8)',
    weight: 3,
    opacity: 0.5,
    smoothFactor: 2.5,
};

// Defining a polygon here instead of a polyline will connect the
// endpoints and fill the path.
// http://leafletjs.com/reference.html#polygon
async function getActivities(res) {
  var all_data = [];
  let total_pages = 2;
  var total_requests = total_pages-1;
  var successful_requests = 0;
  for(var page=1; page<total_pages; page++){
    const activities = `https://www.strava.com/api/v3/athlete/activities?access_token=${res.access_token}&per_page=100&page=${page}`
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
          var polyline = L.polyline(line_points, polyline_options).addTo(map);
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
  let run_speed = [];
  let run_distance = [];
  let year = ''; let month = ''; let day = ''; let date = ''
  for (const dataset of all_data) {
    for (const post of dataset) {

      if (post.type == "Run"){
        runs_count += 1;
        if (post.average_speed > 2){
          run_speed.push(post.average_speed*3.6);
        }
      } else {
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

      count += 1;
      distance += (post.distance/1000);
      moving_time += (post.moving_time/60/60);

    }
  }
  console.log(run_speed);
  initializeIntro(count, distance, moving_time, runs_count, ride_count)
  initializePieChart(weekdays)
  initializeRunningChart(run_speed.reverse(), run_distance);

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

// reAuthorize()

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

  for (var weekday in weekdays){
      if (weekdays[weekday] > fav_day_count){
        fav_day = weekday;
        fav_day_count = weekdays[weekday];
      };
  }
  console.log(fav_day)
  $('#fav-day').text(fav_day)
  $('#fav-day').css('opacity', '1');
  const ctx = document.getElementById('myChart').getContext('2d');
  var myChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
          labels: labels,
          datasets: [{
              label: '# of Votes',
              data: data,
              backgroundColor: [
                  'rgba(255, 99, 132, 0.5)',
                  'rgba(54, 162, 235, 0.5)',
                  'rgba(255, 206, 86, 0.5)',
                  'rgba(75, 192, 192, 0.5)',
                  'rgba(153, 102, 255, 0.5)',
                  'rgba(255, 159, 64, 0.5)',
                  'rgba(140, 159, 255, 0.5)'
              ],
              borderColor: [
                  'rgba(255, 99, 132, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)',
                  'rgba(255, 159, 64, 1)',
                  'rgba(140, 159, 255, 1)'
              ],
              borderWidth: 1
          }]
      },
      options: {
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
  });
}

async function initializeRunningChart(speed, distance){
  speed = speed.slice(-26)
  var N = speed.length;
  let length = 25;
  var moveMean = [];
  for (var i = -1; i < N-1; i++)
  {
      var mean = (speed[i] + speed[i-1] + speed[i-2] + speed[i-3] + speed[i-4])/5.0;
      moveMean.push(mean);
  }
  console.log(moveMean)
  const ctx = document.getElementById('runningChart').getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    // Array.from(Array(speed.length).keys())
    data: {
      labels: Array.from(Array(speed.length).keys()).slice(0, -6),
      datasets: [
        {
        label: 'Avg speed',
        data: speed.slice(5, -1),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        cubicInterpolationMode: 'monotone',
        },
        {
        label: '5 Session Moving Average',
        data: moveMean.slice(5, -1),
        fill: false,
        borderColor: 'rgb(192, 75, 192)',
        cubicInterpolationMode: 'monotone',
        },
    ]
  },
  options: {
    scales: {
        x: {
          display: false,
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
