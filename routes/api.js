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
  const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;

  const response = await axios.get(url);

  return {
    stock: response.data.symbol,
    price: response.data.latestPrice
  };
}

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){

      try {

        let stock = req.query.stock;
        let like = req.query.like;

        const hashedIP = hashIP(req.ip);

        // TWO STOCKS
        if (Array.isArray(stock)) {

          const results = [];

          for (let s of stock) {

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
                  results[0].likes - results[1].likes
              },
              {
                stock: results[1].stock,
                price: results[1].price,
                rel_likes:
                  results[1].likes - results[0].likes
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

        return res.status(500).json({
          error: 'error fetching stock data'
        });

      }

    });

};