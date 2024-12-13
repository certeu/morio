import { execSync } from 'child_process';
import { resolve } from 'path';
import { MORIO_GIT_ROOT } from '../config/cli.mjs';

const runPlaybook = (playbook, ansibleDir, dns) => {
  console.log(`Running Ansible playbook (${playbook}) for node: ${dns}`);
  const ansibleCommand = `ansible-playbook -i ${dns}, --extra-vars "ansible_ssh_private_key_file=~/.ssh/id_rsa ansible_user=admin ansible_ssh_common_args='-o StrictHostKeyChecking=no'" ../ansible/playbooks/${playbook}`;
  execSync(ansibleCommand, { cwd: ansibleDir, stdio: 'inherit' });
};

const runAnsiblePlaybooks = async () => {
  try {
    const terraformDir = resolve(MORIO_GIT_ROOT, 'terraform');
    const ansibleDir = resolve(MORIO_GIT_ROOT, 'ansible');

    const instanceDnsList = execSync('terraform output -json instance_dns_names', {
      cwd: terraformDir,
      stdio: 'pipe',
    }).toString();
    const dnsNames = JSON.parse(instanceDnsList);

    if (dnsNames.length === 0) {
      console.error('No DNS names found. Cannot proceed.');
      process.exit(1);
    }

    for (const dns of dnsNames) {
      runPlaybook('stop_morio.yml', ansibleDir, dns);
    }

    for (const dns of dnsNames) {
      runPlaybook('reset_morio.yml', ansibleDir, dns);
    }

    for (const dns of dnsNames) {
      runPlaybook('start_morio.yml', ansibleDir, dns);
    }
  } catch (error) {
    console.error('Error running Ansible playbooks:', error);
  }
};

runAnsiblePlaybooks();
