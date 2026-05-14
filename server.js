'use strict';

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();

// 1. PARCHE PARA TÚNELES (Ngrok / Localtunnel)
// Esto debe ir ANTES de cualquier otro middleware para evitar bloqueos de red
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, ngrok-skip-browser-warning");
  res.header("ngrok-skip-browser-warning", "true");
  res.header("Bypass-Tunnel-Reminder", "true");
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 2. CONFIGURACIÓN DE SEGURIDAD (TEST 2)
// El test de freeCodeCamp es muy estricto con esta sintaxis exacta
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"]
  }
}));

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); // For fcc testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

// For FCC testing purposes
fccTestingRoutes(app);

// Routing for API 
apiRoutes(app);  
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

// Start our server and tests!
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Servidor escuchando en puerto ' + listener.address().port);
  
  // EL TEST 7 DEPENDE DE QUE ESTO SE EJECUTE
  if(process.env.NODE_ENV === 'test') {
    console.log('Ejecutando Tests Funcionales...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        console.log('Tests no válidos:');
        console.error(e);
      }
    }, 2500);
  }
});

module.exports = app; // For testing