


const ENGINE_POWER = 100000;
const TAKEOFF_SPEED = 140;
const MASS_WITHOUT_CARRIAGE = 35000;
const TIME_GIVEN = 60.0000;
const MAX_MASS = 7857.14;


const http = require('http');
const url = require('url');

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('Database.sqlite');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS results (CarriageMass INT, Time INT, Distance INT, OverLoad INT)`);
});




const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.write('Hello World!\n');

  const query = url.parse(request.url, true).query;
  let results = calculator(parseInt(query.mass));


  response.write(`The time calculated is: ${results.time_calculated}\n`);
  response.write(`The distance calculated is: ${results.distance_calculated}\n`);
  response.write(`The overloaded is: ${results.overloaded_mass}\n`);
  
  db.run(`INSERT INTO results (CarriageMass, Time, Distance, OverLoad) VALUES (${query.mass}, ${results.time_calculated}, ${results.distance_calculated}, ${results.overloaded_mass})`, function (error) {
    if (error) {
      response.writeHead(500, {'Content-Type': 'text/plain'});
      response.end(`Error saving the measurements: ${error}\n`);
      return;
    }
    response.end(`The measurements were saved successfully.\n`);
  });
  
  response.end(`done.\n`);
});
server.listen(3000, () => {
    console.log('Server is listening on http://localhost:3000');
});

function calculator(carriage_mass)
{
  let full_mass = carriage_mass + MASS_WITHOUT_CARRIAGE;
  let time_calculated = time(TAKEOFF_SPEED, acceleration(ENGINE_POWER, full_mass));
  let distance_calculated = distance(acceleration(ENGINE_POWER, full_mass), time_calculated);
  let overloaded_mass = 0;
  if(time_calculated > TIME_GIVEN){
    overloaded_mass = carriage_mass - MAX_MASS;
  }
  return {time_calculated, distance_calculated, overloaded_mass};
}


function acceleration(F, m) {
  return F / m;
}
function distance(a, t) {
  return 0.5 * a * t^2;
}
function time(V, a) {
  return V / a;
}