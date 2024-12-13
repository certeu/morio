import { execSync } from 'child_process';
import { resolve } from 'path';
import axios from 'axios';
import https from 'https';
import { MORIO_GIT_ROOT } from '../config/cli.mjs';

// Function to run Ansible playbook
const runAnsiblePlaybook = async () => {
  try {
    // Define the path to the Ansible playbook directory
    const terraformDir = resolve(MORIO_GIT_ROOT, 'terraform');  // Assuming terraform directory is at the root level
    const ansibleDir = resolve(MORIO_GIT_ROOT, 'ansible');  // Assuming ansible directory is at the root level

    // Get the DNS names from Terraform output
    const instanceDnsList = execSync('terraform output -json instance_dns_names', {
      cwd: terraformDir,
      stdio: 'pipe',
    }).toString();

    // Parse the DNS names from Terraform output
    const dnsNames = JSON.parse(instanceDnsList);

    // Check if there's at least one DNS name
    if (dnsNames.length === 0) {
      console.error('No DNS names found. Cannot proceed with Ansible playbook.');
      process.exit(1);
    }

    let fqdnDns = null;
    if (dnsNames.length > 1) {
      fqdnDns = execSync('terraform output -raw instance_fqdn_name', {
        cwd: terraformDir,
        stdio: 'pipe',
      }).toString();
    }

    // Log the DNS names for debugging
    console.log(`Found DNS names: ${dnsNames.join(', ')}`);

    const firstDns = dnsNames[0];

    // Run Ansible playbook for each node
    for (const dns of dnsNames) {
      console.log(`Running Ansible playbook for node: ${dns}`);
      const ansibleCommand = `ansible-playbook -i ${dns}, --extra-vars "ansible_ssh_private_key_file=~/.ssh/id_rsa ansible_user=admin ansible_ssh_common_args='-o StrictHostKeyChecking=no'" ../ansible/playbooks/install_morio.yml`;
      execSync(ansibleCommand, { cwd: ansibleDir, stdio: 'inherit' });
    }

    console.log('Waiting for the installation to complete...');
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 60 seconds

    // Configure Morio via API for the first node
    console.log(`Configuring Morio API for the first node: ${firstDns}`);
    try {
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false, // Ensure you validate the server's certificate
      });

      const payload = {
        cluster: {
          name: "Morio Test Instance",
          broker_nodes: dnsNames,
          ...(dnsNames.length > 1 && { fqdn: fqdnDns }),
        },
        iam: {
          providers: {
            apikey: {
              provider: "apikey",
              id: "apikey",
              label: "API Key",
            },
            mrt: {},
            local: {
              provider: "local",
              id: "local",
              label: "Morio Account",
            },
          },
        },
      };
    
      const response = await axios.post(`https://${firstDns}/-/api/setup`, payload, {
        headers: { 'Content-Type': 'application/json' },
        httpsAgent
      });

      console.log('API setup successful:', response.data);
    } catch (apiError) {
      console.error('Error configuring Morio API:', apiError.response?.data || apiError.message);
    }
  } catch (error) {
    console.error('Error running Ansible playbook:', error);
  }
};

runAnsiblePlaybook();
