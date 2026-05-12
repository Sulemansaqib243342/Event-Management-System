const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/events',
  method: 'GET'
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let body = '';
  res.on('data', d => {
    body += d;
  });
  res.on('end', () => {
    console.log(body);
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.end();
