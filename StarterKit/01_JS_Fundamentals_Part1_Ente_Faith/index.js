import { runFundamentalsTests } from './topics/01_fundamentals.js';
import { runObjectsTests } from './topics/02_objects_and_this.js';
import { runDataStructuresTests } from './topics/03_data_structures.js';
import { runAdvancedFunctionsTests } from './topics/04_advanced_functions.js';
import { runAsyncTests } from './topics/05_async_promises.js';

console.log('==================================================');
console.log('🚀 RUNNING EPISODE 1 MASTER TEST RUNNER');
console.log('==================================================\n');

async function executeTestSuite() {
  try {
    console.log('--- 1. Testing Fundamentals ---');
    runFundamentalsTests();

    console.log('--- 2. Testing Objects & Context ---');
    runObjectsTests();

    console.log('--- 3. Testing Data Structures ---');
    runDataStructuresTests();

    console.log('--- 4. Testing Advanced Functions ---');
    runAdvancedFunctionsTests();

    console.log('--- 5. Testing Async & Promises ---');
    await runAsyncTests();

    console.log('\n==================================================');
    console.log('✅ ALL EPISODE 1 TEST SUITES PASSED LOCALLY!');
    console.log('==================================================');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED AT ASSERTION:');
    console.error(error.message);
    process.exit(1);
  }
}

executeTestSuite();