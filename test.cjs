const https = require('https');
https.get('https://docs.google.com/spreadsheets/d/1Sdmr60rcZeBCa2ofswUr9mxIreIj71W9HYM1RRhvfMM/gviz/tq?tqx=out:json&sheet=6th', (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);
  let data = '';
  res.on('data', (d) => {
    data += d;
  });
  res.on('end', () => {
    console.log(data);
  });
}).on('error', (e) => {
  console.error(e);
});
