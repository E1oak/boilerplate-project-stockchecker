'use strict';

const axios = require('axios');
const crypto = require('crypto');

const stocks = {};

function hashIP(ip) {
  return crypto
    .createHash('sha256')
    .update(ip)
    .digest('hex');
}

async function getStockData(symbol) {

  const response = await axios.get(
    `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`
  );

  return {
    stock: response.data.symbol,
    price: response.data.latestPrice
  };

}

module.exports = function (app) {

  // FCC TEST ROUTE
  app.get('/api/app-info', function(req, res) {

    res.json({
      status: 'success'
    });

  });

  // STOCK ROUTE
  app.get('/api/stock-prices', async function(req, res) {

    try {

      let stock = req.query.stock;
      let like = req.query.like;

      const hashedIP = hashIP(req.ip);

      // TWO STOCKS
      if (Array.isArray(stock)) {

        const results = [];

        for (const s of stock) {

          const data = await getStockData(s);

          if (!stocks[data.stock]) {

            stocks[data.stock] = {
              likes: []
            };

          }

          if (
            like === 'true' &&
            !stocks[data.stock].likes.includes(hashedIP)
          ) {

            stocks[data.stock].likes.push(hashedIP);

          }

          results.push({
            stock: data.stock,
            price: data.price,
            likes: stocks[data.stock].likes.length
          });

        }

        return res.json({

          stockData: [

            {
              stock: results[0].stock,
              price: results[0].price,
              rel_likes:
                results[0].likes -
                results[1].likes
            },

            {
              stock: results[1].stock,
              price: results[1].price,
              rel_likes:
                results[1].likes -
                results[0].likes
            }

          ]

        });

      }

      // ONE STOCK
      const data = await getStockData(stock);

      if (!stocks[data.stock]) {

        stocks[data.stock] = {
          likes: []
        };

      }

      if (
        like === 'true' &&
        !stocks[data.stock].likes.includes(hashedIP)
      ) {

        stocks[data.stock].likes.push(hashedIP);

      }

      return res.json({

        stockData: {
          stock: data.stock,
          price: data.price,
          likes: stocks[data.stock].likes.length
        }

      });

    } catch (err) {

      console.error(err);

      return res.status(500).json({
        error: 'Server Error'
      });

    }

  });

};