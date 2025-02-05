import axios from 'axios'
import https from 'https'
import dotenv from 'dotenv'

dotenv.config()

// Function to run Ansible playbook
const configure = async () => {
  try {
    const dnsNames = process.env.MORIO_TEST_DNS_NAMES.split(',')

    let fqdnDns = null
    if (dnsNames.length > 1) fqdnDns = process.env.MORIO_TEST_FQDN

    const firstDns = process.env.MORIO_TEST_HOST

    // Configure Morio via API for the first node
    console.log(`Configuring Morio API for the first node: ${firstDns}`)
    try {
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false, // Ensure you validate the server's certificate
      })

      const payload = {
        cluster: {
          name: 'Morio Test Instance',
          broker_nodes: dnsNames,
          ...(dnsNames.length > 1 && { fqdn: fqdnDns }),
        },
        iam: {
          providers: {
            apikey: {
              provider: 'apikey',
              id: 'apikey',
              label: 'API Key',
            },
            mrt: {},
            local: {
              provider: 'local',
              id: 'local',
              label: 'Morio Account',
            },
          },
        },
      }

      const response = await axios.post(`https://${firstDns}/-/api/setup`, payload, {
        headers: { 'Content-Type': 'application/json' },
        httpsAgent,
      })

      console.log('API setup successful:', response.data)
    } catch (apiError) {
      console.error('Error configuring Morio API:', apiError.response?.data || apiError.message)
    }
  } catch (error) {
    console.error('Error running Ansible playbook:', error)
  }
}

configure()
