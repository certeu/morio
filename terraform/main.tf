provider "aws" {
  region = "eu-central-1"  # Replace with your desired AWS region
}

# Random string generator for DNS names
resource "random_string" "dns_name" {
  count   = var.node_count  # Create a random string for each instance
  length  = 3
  special = false
  upper   = false
}

# SSH Key Pair for Instances
resource "aws_key_pair" "ssh_key" {
  count         = var.node_count  # Create instances equal to node_count
  key_name      = "my_key_${var.pr_id}-${random_string.dns_name[count.index].result}"  # Unique key pair name
  public_key    = file("~/.ssh/id_rsa.pub")  # Path to your public key file
}

# Additional SSH Key 1
resource "aws_key_pair" "additional_ssh_key_1" {
  key_name   = "additional_key_1"
  public_key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEe3xiWGZ6u7h4/Z+MHmvk81uYNVSTlXIGR1bpyUEoa6 admin@cert.europa.eu"
}

# Additional SSH Key 2
resource "aws_key_pair" "additional_ssh_key_2" {
  key_name   = "additional_key_2"
  public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCzR7U6E+BcPdn6Y0NVYoCVbY3+cokh+NBrvfLL/7EiuaqjPLcMB5wp/de8nuUO/BF2WfBpEckwbwmd2UOWZXu5CvICJmq0An3wJ0bY4MlsGAw8bhhYYr+IOl10//6ZX76fmhzSIc3n1i1NEj3K9rHX7dF0qnAeRWaHDGYal3piGHSD7vVH71ruz6628jj7UzzelYErk3S9K5ca4im5kXQZqsgOaZEGLS4st07svPvTgsXSyH8Te9/R2my4uqeAsmfpbCFPKAafX5SCBQFBS1zvP0Y23vWI1YtlrdNitLh8TONP0KO1BgDPP8psljq6dJZ55QCus1mbt44HzHRcfgafMmRX5MzvAwR2nGJ6vCLJyzoe1640iknWxvFr4fUTP3DCdIOrEreeA5G8EoRo8D+AIMALIBsgp4uaqC5pSsZN1T9uZe42Ebh0nIClnwYgK7bdc2bACmQ11Odw3RgfcTUQ0hP9BxP822WLvTYWxWWRYCTNDLk5bXCAMAxZbcIfMcc= admin@levi-virtual-machine"
}

# EC2 Instances
resource "aws_instance" "test_vm" {
  count         = var.node_count
  ami           = "ami-0552f4006d8da5f5f"  # Amazon Linux 2 or preferred AMI ID
  instance_type = "t3.medium"
  subnet_id     = "subnet-04faec9c5fe410b3e"
  key_name      = aws_key_pair.ssh_key[count.index].key_name  # Reference the unique key pair
  vpc_security_group_ids = ["sg-09a11726f166660ca"]
  associate_public_ip_address = true

  user_data = <<-EOF
              #!/bin/bash
              echo "${aws_key_pair.additional_ssh_key_1.public_key}" >> /home/admin/.ssh/authorized_keys
              echo "${aws_key_pair.additional_ssh_key_2.public_key}" >> /home/admin/.ssh/authorized_keys
            EOF

  tags = {
    Name         = "morio-test-${var.pr_id}-${random_string.dns_name[count.index].result}"
    morio        = "true"
    pull_request = "${var.pr_id}"
  }
}

# Route 53 DNS Records
resource "aws_route53_record" "test_instance" {
  count   = var.node_count
  zone_id = "Z04114953S6ELFC6IJG0T"  # Replace with your Route 53 hosted zone ID
  name    = "${random_string.dns_name[count.index].result}.test.morio.it"
  type    = "A"
  ttl     = 86400
  records = [aws_instance.test_vm[count.index].public_ip]
}

# Generate a random string for FQDN
resource "random_string" "fqdn_name" {
  count   = var.node_count > 1 ? 1 : 0
  length  = 3
  special = false
  upper   = false
}

# FQDN Instance
resource "aws_instance" "fqdn_instance" {
  count   = var.node_count > 1 ? 1 : 0
  ami           = "ami-0552f4006d8da5f5f"
  instance_type = "t3.medium"
  subnet_id     = "subnet-04faec9c5fe410b3e"
  key_name      = aws_key_pair.ssh_key[0].key_name
  vpc_security_group_ids = ["sg-09a11726f166660ca"]
  associate_public_ip_address = true

  tags = {
    Name         = "fqdn-instance-${var.pr_id}-${random_string.fqdn_name[0].result}"
    morio        = "true"
    pull_request = "${var.pr_id}"
  }
}

# Route 53 Record for FQDN Instance
resource "aws_route53_record" "fqdn_record" {
  count   = var.node_count > 1 ? 1 : 0
  zone_id = "Z04114953S6ELFC6IJG0T"
  name    = "${random_string.fqdn_name[0].result}-cluster.test.morio.it"
  type    = "A"
  ttl     = 86400
  records = aws_instance.test_vm[*].public_ip
}
