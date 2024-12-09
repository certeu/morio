provider "aws" {
  region = "eu-central-1"  # Replace with your desired AWS region
}

resource "aws_instance" "test_vm" {
  ami           = "ami-0552f4006d8da5f5f"  # Default AMI ID (Amazon Linux 2 or your preferred image)
  instance_type = "t3.medium"               # Default instance type (you can change it if needed)
  subnet_id     = "subnet-04faec9c5fe410b3e"

  tags = {
    name = "test-vm-${var.pr_id}"
    morio = "true"
    pull_request  = "${var.pr_id}"
  }
}