import { execSync } from 'child_process';
import { resolve } from 'path';
import { MORIO_GIT_ROOT } from '../config/cli.mjs'

// Function to run Terraform commands
const runTerraform = (prId) => {
  try {
    console.log(`Starting to create the test VM with PR ID: ${prId}`);

    // Define the path to the Terraform configuration
    const terraformDir = resolve(MORIO_GIT_ROOT, 'terraform');  // Assuming the terraform directory is at the root level

    // Change the working directory to the terraform folder
    console.log('Initializing Terraform...');
    execSync('terraform init', { cwd: terraformDir, stdio: 'inherit' });

    // Apply Terraform configuration (create the instance)
    console.log('Applying Terraform configuration...');
    execSync(`terraform apply -var="pr_id=${prId}" -auto-approve`, { cwd: terraformDir, stdio: 'inherit' });

    console.log(`Test VM with PR ID ${prId} created successfully.`);
  } catch (error) {
    console.error('Error running Terraform:', error);
  }
};

// Get PR ID from the command-line argument
const prId = process.argv[2];

if (!prId) {
  console.error('PR ID is required.');
  process.exit(1);
}

runTerraform(prId);
