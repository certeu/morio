output "instance_id" {
  value = aws_instance.test_vm.id
}

output "instance_public_ip" {
  value = aws_instance.test_vm.public_ip
}

output "instance_dns" {
  value = "${random_string.dns_name.result}.test.morio.it"
}