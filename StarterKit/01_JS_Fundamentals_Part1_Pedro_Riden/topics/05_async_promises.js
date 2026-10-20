import console from 'node:console';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function retryGcashPayment(paymentFn, retries = 3, delayMs = 50) {

  for (let attempt = 0; ; attempt++) {
    try {
      return await paymentFn();
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }
      await sleep(delayMs);
    }
  }
}

export async function runAsyncTests() {
  let attempts = 0;
  const failingFn = async () => {
    attempts++;
    if (attempts < 3) throw new Error('Network Timeout');
    return 'SUCCESS';
  };

  const result = await retryGcashPayment(failingFn, 3, 10);
  console.assert(result === 'SUCCESS', 'Payment eventually succeeds on attempt 3');
  console.assert(attempts === 3, 'Took 3 attempts to succeed');
  console.log('  └─ Module 05 assertions passed.');
}