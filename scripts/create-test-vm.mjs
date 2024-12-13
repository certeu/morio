import { execSync } from 'child_process';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { MORIO_GIT_ROOT } from '../config/cli.mjs'

// Function to run Terraform commands
const runTerraform = (prId, nodeCount) => {
  try {
    console.log(`Starting to create the test VMs with PR ID: ${prId} and Node Count: ${nodeCount}`);

    // Define the path to the Terraform configuration
    const terraformDir = resolve(MORIO_GIT_ROOT, 'terraform');  // Assuming the terraform directory is at the root level

    // Change the working directory to the terraform folder
    console.log('Initializing Terraform...');
    execSync('terraform init', { cwd: terraformDir, stdio: 'inherit' });

    // Apply Terraform configuration (create the instance)
    console.log('Applying Terraform configuration...');
    execSync(`terraform apply -var="pr_id=${prId}" -var="node_count=${nodeCount}" -auto-approve`, {
      cwd: terraformDir,
      stdio: 'inherit',
    });

    console.log(`Test VM with PR ID ${prId} created successfully.`);
  } catch (error) {
    console.error('Error running Terraform:', error);
  }
};

// Parse JSON input
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error('Path to the JSON file is required.');
  process.exit(1);
}

try {
  // Read and parse the JSON file from the correct path
  const jsonData = JSON.parse(readFileSync(resolve(MORIO_GIT_ROOT, 'json-templates', jsonFilePath), 'utf-8'));

  // Extract required data
  const { pr, nodes } = jsonData;

  if (!pr || !nodes) {
    console.error('JSON file must contain "pr" and "nodes" fields.');
    process.exit(1);
  }

  // Run Terraform with the extracted data
  runTerraform(pr, nodes);
} catch (error) {
  console.error('Error reading or parsing JSON file:', error);
  process.exit(1);
}
