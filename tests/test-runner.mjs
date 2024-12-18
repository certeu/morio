import { spawn } from 'child_process';
import path from 'path';

const args = process.argv.slice(2);

// Ensure a test name is provided
if (args.length === 0) {
  console.error("Usage: node testRunner.mjs <testName>");
  console.error("Example: node testRunner.mjs ephemeral");
  process.exit(1);
}

const testName = args[0];

// Map test names to file paths
const testFiles = {
  ephemeral: './tests/10_ephemeral.test.mjs',
  otherTest: './tests/20_other_test.mjs', // Add other tests here
};

const testFile = testFiles[testName];
if (!testFile) {
  console.error(`Error: Test "${testName}" not found.`);
  console.error(`Available tests: ${Object.keys(testFiles).join(', ')}`);
  process.exit(1);
}

// Resolve the test file path
const testPath = path.resolve(testFile);

// Spawn a child process to run the test
const child = spawn('node', [testPath], { stdio: 'inherit' });

child.on('close', (code) => {
  process.exit(code); // Exit with the same code as the test process
});
