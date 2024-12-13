variable "pr_id" {
  description = "Pull Request ID"
  type        = string
}

variable "node_count" {
  description = "Number of nodes to create"
  type        = number
  default     = 1  # Default value, can be overridden by user input
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

variable "security_group_id" {
  description = "Security group ID to use for instances"
  type        = string
  default     = "sg-09a11726f166660ca"
}

variable "subnet_id" {
  description = "The VPC subnet ID"
  type        = string
  default     = "subnet-04faec9c5fe410b3e"
}

variable "route53_zone_id" {
  description = "Route 53 Hosted Zone ID"
  type        = string
  default     = "Z04114953S6ELFC6IJG0T"
}