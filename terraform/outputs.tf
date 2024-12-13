output "instance_id" {
  value = aws_instance.test_vm[*].id
}

output "instance_public_ips" {
  value = aws_instance.test_vm[*].public_ip
}

output "instance_dns_names" {
  value = aws_route53_record.test_instance[*].name
}

output "instance_fqdn_name" {
  value = length(aws_route53_record.fqdn_record) > 0 ? aws_route53_record.fqdn_record[0].name : null
}