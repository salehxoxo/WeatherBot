const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
const api = '3bd86dec48eb3831f9b0cf5ad90d13e5';

app.post('/', (req, res) => {
    const intentName = req.body.queryResult.intent.displayName;
    const parameters = req.body.queryResult.parameters;
    const city = parameters['geo-city'];
    let inputDate = parameters['date-time'];
    let Text = '';
    //API call for current weather
    if(intentName == 'currentWeather') {
          axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${api}&units=metric`)
        .then(response => { 
            const weather = response.data.weather[0].description;
            const temp = response.data.main.temp;
            const humidity = response.data.main.humidity;
            const jsonResponse = {
              fulfillment_messages: [
                {
                  text: {
                    text: ['The weather in ' + city + ' is ' + weather + ' with a temperature of ' + temp + 'C and humidity of ' + humidity + '%.'],
                  },
                },
              ],
            };
            res.send(jsonResponse);
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
        });
        return;
    }

    //steps to validate the date
    const d = new Date();
    let inputDateObj = inputDate ? new Date(inputDate) : d;

    d.setHours(0, 0, 0, 0);
    inputDateObj.setHours(0, 0, 0, 0);

    const diffTime = inputDateObj.getTime() - d.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if(diffDays < 0 || diffDays > 4){
        const jsonResponse = {
            fulfillment_messages: [
              {
                text: {
                  text: ['Forecast is only available for today and future 4 dates. Please enter a valid date.'],
                },
              },
            ],
          };
        res.send(jsonResponse);
        return;
    }

    //API call for forecast weather
    const inputDateDay = inputDateObj.getDate();
    
    axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${api}&units=metric`)
    .then(response => { 
        Text = '';
        const Data = response.data.list;
        for(let i=0;i<Data.length;i+=8){
          const currentDate = Data[i].dt_txt.slice(8,10);
          if(parseInt(currentDate) >= inputDateDay){
            const weather = Data[i].weather[0].description;
            const temp = Data[i].main.temp;
            const humidity = Data[i].main.humidity;
            const msg = 'The weather in ' + city + ' on ' + Data[i].dt_txt.slice(0,10) +' is ' + weather + ' with a temperature of ' + temp + 'C and humidity of ' + humidity + '%. ';
            Text = Text.concat("\n\n", msg);
          }

        }
        const jsonResponse = {
          fulfillment_messages: [
            {
              text: {
                text: [Text],
              },
            },
          ],
        };
        res.send(jsonResponse);
    })
    .catch(error => {
        console.error('Error fetching weather data:', error);
    });
        
  
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
