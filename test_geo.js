const https = require('https');
https.get('https://get.geojs.io/v1/ip/geo.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
