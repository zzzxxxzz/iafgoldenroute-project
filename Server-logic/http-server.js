const express = require("express");
const cors = require("cors");
const app = express();
const request = require("request");

const ENGINE_POWER = 100000;
const TAKEOFF_SPEED = 140;
const MASS_WITHOUT_CARRIAGE = 35000;
const TIME_GIVEN = 60.0000;
const MAX_MASS = 7857.14;

const SERVER_PORT = 3000;
const SERVER_IP = '127.0.0.1'; //local host

const MAX_TEMP = 30
const MIN_TEMP = 15

app.use(cors());
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('Database.sqlite');

//Creating SQL database table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS results (CarriageMass INT, Time INT, Distance INT, OverLoad INT)`);
});

app.get("/", (req, res) => {
  const mass = parseInt(req.query.mass);
  const date = req.query.date;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=30&longitude=35&&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${date}&end_date=${date}`;
  var message = "Success!";

  //Checking input
  if (isNaN(mass)) {
    message = "Bad Request: number parameter is missing or not a number";
    res.set("Access-Control-Allow-Origin", "*");
    res.send(`message-> ${message}\ntime->  err\n overload-> err\n distance-> err\n hours-> err\n`);
    res.end();
    return;
  }

  //Calculating the results
  let results = calculator(mass);

  //Calling API
  request(url, (error, response, body) => {
    if (error) {
      res.set("Access-Control-Allow-Origin", "*");
      message = "Error: API not accessible";
      res.send(`message-> ${message}\ntime->  err\n overload-> err\n distance-> err\n hours-> err\n`);
      res.end();
      return;
    }
    const apiData = JSON.parse(`${body}`); //deseralize
    if(apiData.hasOwnProperty('error')) { //date error
      res.set("Access-Control-Allow-Origin", "*");
      message = "Error: date not available";
      res.send(`message-> ${message}\ntime->  err\n overload-> err\n distance-> err\n hours-> err\n`);
      res.end();        
      return;
    }

    //Checking if temperature is allowed
    if(apiData.daily.temperature_2m_max <= MAX_TEMP && apiData.daily.temperature_2m_max >= MIN_TEMP || apiData.daily.temperature_2m_min <= MIN_TEMP && apiData.daily.temperature_2m_min >= MIN_TEMP) { //can takeoff:
      
      //Logging into SQL DataBase
      db.run(`INSERT INTO results (CarriageMass, Time, Distance, OverLoad) VALUES (${mass}, ${results.time_calculated}, ${results.distance_calculated}, ${results.overloaded_mass})`);
      
      //finding available takeoff times
      var availableTime = new Array();
      for (let i = 0; i < apiData.hourly.temperature_2m.length; i++) {
        if(MIN_TEMP <= apiData.hourly.temperature_2m[i] && apiData.hourly.temperature_2m[i] <= MAX_TEMP){
          availableTime.push(apiData.hourly.time[i].split('T')[1]); //pushing time value
        }
      } 

      //response to client
      res.set("Access-Control-Allow-Origin", "*");
      res.send(`message-> ${message}\ntime->  ${results.time_calculated}s\n overload-> ${results.overloaded_mass}\n distance-> ${results.distance_calculated}\n hours-> ${availableTime}`);
      res.end();
    }
    else { //can't takeoff:
      res.set("Access-Control-Allow-Origin", "*");
      message = "Error: tempeture not valid for takeoff on " + date;
      res.send(`message-> ${message}(${apiData.daily.temperature_2m_max}C°,${apiData.daily.temperature_2m_min}C°)\ntime->  err\n overload-> err\n distance-> err\n hours-> err\n`);
      res.end();
    }
  });
  
});
app.listen(SERVER_PORT, () => {
    console.log('Server is listening on http://' + SERVER_IP + ':' + SERVER_PORT);
});

function calculator(carriage_mass)
{
  let full_mass = carriage_mass + MASS_WITHOUT_CARRIAGE;
  let time_calculated = time(TAKEOFF_SPEED, acceleration(ENGINE_POWER, full_mass)).toFixed(2);
  let distance_calculated = distance(acceleration(ENGINE_POWER, full_mass), time_calculated).toFixed(2);
  console.log(distance_calculated)
  let overloaded_mass = 0;
  if(time_calculated > TIME_GIVEN){
    overloaded_mass = (carriage_mass - MAX_MASS).toFixed(2);
  }
  return {time_calculated, distance_calculated, overloaded_mass};
}

function acceleration(F, m) {
  return F / m;
}
function distance(a, t) {
  return 0.5 * a * t*t;
}
function time(V, a) {
  return V / a;
}