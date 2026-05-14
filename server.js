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

// A. PARCHE DE RED (Para que Localtunnel no muera)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Bypass-Tunnel-Reminder");
  res.header("Bypass-Tunnel-Reminder", "true");
  next();
});

// B. TEST 2: Helmet CSP (Sintaxis ultra-compatible)
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"]
  }
}));

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({origin: '*'})); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

fccTestingRoutes(app);
apiRoutes(app);  
    
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor en puerto ' + listener.address().port);
  if (process.env.NODE_ENV === 'test') {
    console.log('Ejecutando tests funcionales...');
    setTimeout(() => {
      try {
        runner.run();
      } catch(e) {
        console.log('Error en tests');
      }
    }, 3500);
  }
});

module.exports = app;