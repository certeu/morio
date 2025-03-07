- Client: (via 'join' command) will ask to join cluster
- API: generates a certificate, key, CA cert, UUID, and apikey secret and provides it
- API: Client is registered in the inventory database
- API: Client record is published to Kafka inventory topic
- Client: configures things, starts the systemd listener service
- todo: handle config/vars to/from client


client commands:

- push: Pushes list of enabled modules and vars to the database
- pull: Pulls config from database, reconfigures agent (template, and enable/disable modules)
- fetch: Pulls config, but does nothing
- reload: Reloads/Reconfigures agents
- report: Trigger a report


TODO:
- Publish to kafka
- Handle UI stuff




