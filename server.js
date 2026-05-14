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

// PARCHE DE RED PARA TÚNELES
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Bypass-Tunnel-Reminder");
  res.header("Bypass-Tunnel-Reminder", "true");
  next();
});

// TEST 2: Configuración de Helmet (Sintaxis específica para FCC)
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

const port = process.env.PORT || 3000;
const listener = app.listen(port, () => {
  console.log('Puerto activo: ' + port);
  if (process.env.NODE_ENV === 'test') {
    console.log('Iniciando tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch(e) {
        console.log('Error en ejecución de tests');
      }
    }, 1500);
  }
});

module.exports = app;