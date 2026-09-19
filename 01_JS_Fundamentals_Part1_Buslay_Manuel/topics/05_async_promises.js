import console from 'node:console';

export async function retryGcashPayment(paymentFn, retries = 3, delayMs = 50) {
  // TODO: Execute paymentFn with retry loop and delay
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await paymentFn();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
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