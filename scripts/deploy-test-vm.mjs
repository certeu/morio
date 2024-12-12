import { execSync } from 'child_process';
import { resolve } from 'path';
import { MORIO_GIT_ROOT } from '../config/cli.mjs';

// Function to run Ansible playbook
const runAnsiblePlaybook = () => {
  try {
    // Define the path to the Ansible playbook directory
    const terraformDir = resolve(MORIO_GIT_ROOT, 'terraform');  // Assuming the terraform directory is at the root level
    const ansibleDir = resolve(MORIO_GIT_ROOT, 'ansible');  // Assuming ansible directory is at the root level

    const instance_dns = execSync('terraform output -raw instance_dns', {
        cwd: terraformDir,
        stdio: 'pipe',
      }).toString().trim();

    // Construct the Ansible command with the IP address and SSH credentials
    const ansibleCommand = `ansible-playbook -i ${instance_dns}, --extra-vars "ansible_ssh_private_key_file=~/.ssh/id_rsa ansible_user=admin ansible_ssh_common_args='-o StrictHostKeyChecking=no' instance_dns=${instance_dns}" ../ansible/playbooks/install_morio.yml`;
    console.log('Running Ansible playbook...');
    execSync(ansibleCommand, { cwd: ansibleDir, stdio: 'inherit' });

    console.log(`Morio installation started on instance ${instance_dns}`);
  } catch (error) {
    console.error('Error running Ansible playbook:', error);
  }
};

runAnsiblePlaybook();