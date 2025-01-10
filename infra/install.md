## Apt repo server

```sh
sudo apt update
sudo apt upgrade -y
sudo apt install -y nginx certbot
sudo systemctl enable nginx
sudo mkdir -p /var/www/install.morio.it/canary
sudo mkdir -p /var/www/install.morio.it/testing
sudo mkdir -p /var/www/install.morio.it/production
sudo mkdir -p /var/www/apt.repo.morio.it
sudo chown -R admin:admin /var/www/apt.repo.morio.it
sudo chown -R admin:admin /var/www/install.morio.it

curl https://raw.githubusercontent.com/certeu/morio/refs/heads/develop/infra/apt.repo/var/www/apt.repo.morio.it/index.html -o /var/www/apt.repo.morio.it/index.html

curl https://raw.githubusercontent.com/certeu/morio/refs/heads/develop/infra/apt.repo/var/www/install.morio.it/production/index.html -o /var/www/install.morio.it/production/index.html
curl https://raw.githubusercontent.com/certeu/morio/refs/heads/develop/infra/apt.repo/var/www/install.morio.it/production/install.sh -o /var/www/install.morio.it/production/install.sh

curl https://raw.githubusercontent.com/certeu/morio/refs/heads/develop/infra/apt.repo/var/www/install.morio.it/testing/index.html -o /var/www/install.morio.it/testing/index.html
curl https://raw.githubusercontent.com/certeu/morio/refs/heads/develop/infra/apt.repo/var/www/install.morio.it/testing/install.sh -o /var/www/install.morio.it/testing/install.sh

curl https://raw.githubusercontent.com/certeu/morio/refs/heads/develop/infra/apt.repo/var/www/install.morio.it/canary/index.html -o /var/www/install.morio.it/canary/index.html
curl https://raw.githubusercontent.com/certeu/morio/refs/heads/develop/infra/apt.repo/var/www/install.morio.it/canary/install.sh -o /var/www/install.morio.it/canary/install.sh

```
