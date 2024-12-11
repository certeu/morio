variable "pr_id" {
  description = "Pull Request ID"
  type        = string
}

variable "ami_id" {
  description = "The AMI ID to launch the EC2 instance"
  type        = string
  default     = "ami-0552f4006d8da5f5f"
}

variable "instance_type" {
  description = "The EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "subnet_id" {
  description = "The VPC subnet ID"
  type        = string
  default     = "subnet-04faec9c5fe410b3e"
}