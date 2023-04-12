
# Strats. Strava statistics page
VPN required for russian users!

## About
Strats a website for monitoring a person's strava activities. Made for analyzing cycling and running information. Uses Strava API, JavaScript and Chart.JS.<br>
Link: [strats.netlify.app](https://strats.netlify.app). Made for mobile phones. <br>
Some countries (including Russia) require VPN to open the page. <br>
Implemented features:
- Distribution of activities by type
- Map of activities
- Day of the week distribution
- Performance review - last 20 activities (cycling/running) review. Analyzes speed and distance and their 5-day moving averages. To get the intended experience, user needs 25 activities of both running and cycling.
- Month distribution

# Setup

The first thing to do is to clone the repository:

$ git clone [https://github.com/petosbratok/strava-statistics](https://github.com/petosbratok/strava-statistics)

Run the index.html file

Customize map by changing **L.mapbox.accessToken** to your own token <br>
How to: [https://youtu.be/J0E-1eYeLlM](https://youtu.be/J0E-1eYeLlM)

See your own statistics after changing **client_id**, **client_secret** and **refresh_token** <br>
How to get required tokens: [https://youtu.be/sgscChKfGyg](https://youtu.be/sgscChKfGyg)
