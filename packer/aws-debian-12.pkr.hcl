#
# Packer config for a Morio debian 12 AMI for AWS
# (AMI = Amazon Machine Image, a VM image specific for AWS)
#

#
# Ensure we have the plugins we need
# Run `npm run packer:init to install plugins
#
packer {
  required_plugins {
    amazon = {
      source  = "github.com/hashicorp/amazon"
      version = "~> 1"
    }
  }
}

#
# A Packer config only works with packer variables.
# So the way to use an environment variable in the config
# is to first assign it to a packer variable.
#
variable "morio_version" {
  description = "The version of Morio that this image provides"
  type        = string
  default     = env("MORIO_VERSION")
}

#
# We build in us-east-1 (North Virginia) because that's where
# the base Debiamn images are published.
# It is also where most people are so that make sense too.
#
variable "aws_region" {
  description = "The AWS region in which to deploy the AMI"
  type        = string
  default     = "us-east-1" # This is where the Debian base image is located
}

#
# A t2.micro instance should do that trick
#
variable "instance_type" {
  description = "The AWS EC2 instance type"
  type        = string
  default     = "t2.micro"
}

#
# Source block defines what we want
#
source "amazon-ebs" "debian-bookworm" {
  ami_name        = "morio-${var.morio_version}-debian-12"
  ami_description = "Morio provides the plumbing for your observability needs"
  tags = {
    os             = "debian"
    os_version     = "12"
    debian_release = "bookworm"
    base_ami_id    = "{{ .SourceAMI }}"
    base_ami_name  = "{{ .SourceAMIName }}"
    morio_version  = "${var.morio_version}"
  }
  force_deregister      = true
  force_delete_snapshot = true
  instance_type         = var.instance_type
  region                = var.aws_region
  source_ami_filter {
    filters = {
      name                = "debian-12-amd64-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["136693071363"] # Official Debian AMIs
  }
  ssh_username = "admin" # This is the Debian way
}

#
# Build block defines what to do
#
build {
  sources = ["source.amazon-ebs.debian-bookworm"]

  #
  # Installs Morio on Debian 12
  #
  provisioner "shell" {
    inline = [
      "sudo apt-get update",
      "sudo apt-get upgrade -y",
      "sudo apt-get install -y docker.io curl",
      "curl -s https://packagecloud.io/install/repositories/morio/debian-12/script.deb.sh | sudo bash",
      "sudo apt-get update",
      "sudo apt-get install -y moriod",
      "sudo systemctl enable moriod.service",
    ]
  }
}
