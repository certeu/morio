import { execSync } from 'child_process';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { MORIO_GIT_ROOT } from '../config/cli.mjs'

// Function to run Terraform destroy command
const destroyTerraform = (prId) => {
  try {
    console.log(`Starting to destroy the test VM with PR ID: ${prId}`);

    // Define the path to the Terraform configuration
    const terraformDir = resolve(MORIO_GIT_ROOT, 'terraform'); // Adjust path as necessary

    console.log('Initializing Terraform...');
    execSync('terraform init', { cwd: terraformDir, stdio: 'inherit' });

    // Destroy the Terraform configuration (delete the instance)
    console.log('Destroying Terraform configuration...');
    execSync(`terraform destroy -var="pr_id=${prId}" -auto-approve`, {
      cwd: terraformDir, 
      stdio: 'inherit'
    });

    console.log(`Test VM with PR ID ${prId} destroyed successfully.`);
  } catch (error) {
    console.error('Error while running Terraform destroy:', error.message);
    console.error('Stack trace:', error.stack);
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
  destroyTerraform(pr);
} catch (error) {
  console.error('Error reading or parsing JSON file:', error);
  process.exit(1);
}


