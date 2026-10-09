output "static_ip" {
  value = aws_lightsail_static_ip.web.ip_address
}

output "ssh" {
  value = "ssh -i ${trimsuffix(pathexpand(var.ssh_public_key_path), ".pub")} ubuntu@${aws_lightsail_static_ip.web.ip_address}"
}

output "tunnel_id" {
  value = cloudflare_zero_trust_tunnel_cloudflared.web.id
}

# Prints the connector token without storing it in state.
output "tunnel_token_command" {
  value = "curl -fsS -H \"Authorization: Bearer $CLOUDFLARE_API_TOKEN\" https://api.cloudflare.com/client/v4/accounts/${local.account_id}/cfd_tunnel/${cloudflare_zero_trust_tunnel_cloudflared.web.id}/token | jq -r .result"
}
