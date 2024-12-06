import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Function to run Terraform destroy command
const destroyTerraform = (prId) => {
  try {
    console.log(`Starting to destroy the test VM with PR ID: ${prId}`);

    // Resolve the current directory of this file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Define the path to the Terraform configuration
    const terraformDir = resolve(__dirname, '../terraform'); // Adjust path as necessary

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

// Get PR ID from the command-line arguments
const prId = process.argv[2];

if (!prId) {
  console.error('PR ID is required.');
  process.exit(1);
}

destroyTerraform(prId);
