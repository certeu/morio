provider "aws" {
  region = "eu-central-1"  # Replace with your desired AWS region
}

resource "aws_key_pair" "ssh_key" {
  key_name   = "my_key_${var.pr_id}"  # Name of the key pair
  public_key = file("~/.ssh/id_rsa.pub")  # Path to your public key file
}

resource "aws_instance" "test_vm" {
  ami           = "ami-0552f4006d8da5f5f"  # Default AMI ID (Amazon Linux 2 or your preferred image)
  instance_type = "t3.medium"               # Default instance type (you can change it if needed)
  subnet_id     = "subnet-04faec9c5fe410b3e"
  key_name      = aws_key_pair.ssh_key.key_name  # Reference the key pair
  vpc_security_group_ids   = ["sg-09a11726f166660ca"]  # Use the existing security group ID
  associate_public_ip_address = true  # Assign a public IP to the instance

  tags = {
    Name = "morio-test-${var.pr_id}-${random_string.dns_name.result}"
    morio = "true"
    pull_request  = "${var.pr_id}"
  }
}

# Generate a random DNS name (e.g., random string of 8 characters)
resource "random_string" "dns_name" {
  length  = 6
  special = false
  upper   = false
}

# Create a Route 53 DNS record
resource "aws_route53_record" "test_instance" {
  zone_id = "Z04114953S6ELFC6IJG0T"  # Replace with your Route 53 hosted zone ID
  name    = "${random_string.dns_name.result}.test.morio.it"  # Random DNS name
  type    = "A"
  ttl     = 86400
  records = [aws_instance.test_vm.public_ip]  # Public IP of the EC2 instance
}