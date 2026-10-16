# ── AWS: Lightsail host ───────────────────────

resource "aws_lightsail_key_pair" "deploy" {
  name       = "kaitai-beta"
  public_key = file(pathexpand(var.ssh_public_key_path))
}

resource "aws_lightsail_instance" "web" {
  name              = "kaitai-beta"
  availability_zone = "${var.region}a"
  blueprint_id      = "ubuntu_24_04"
  bundle_id         = var.bundle_id
  key_pair_name     = aws_lightsail_key_pair.deploy.name
  ip_address_type   = "dualstack"
  user_data         = file("${path.module}/bootstrap.sh")

  add_on {
    type          = "AutoSnapshot"
    snapshot_time = "18:00" # UTC
    status        = "Enabled"
  }

  lifecycle {
    # The mongo-data volume lives on this disk; replacing the instance wipes it.
    prevent_destroy = true
    ignore_changes  = [user_data, key_pair_name]
  }
}

resource "aws_lightsail_static_ip" "web" {
  name = "kaitai-beta-ip"
}

resource "aws_lightsail_static_ip_attachment" "web" {
  static_ip_name = aws_lightsail_static_ip.web.name
  instance_name  = aws_lightsail_instance.web.name
}

# Replaces Lightsail's defaults. Web traffic arrives through the outbound
# tunnel, so SSH is the only inbound port.
resource "aws_lightsail_instance_public_ports" "web" {
  instance_name = aws_lightsail_instance.web.name

  port_info {
    protocol  = "tcp"
    from_port = 22
    to_port   = 22
    cidrs     = var.ssh_cidrs
  }
}

# ── AWS: cost alert ───────────────────────────

resource "aws_budgets_budget" "monthly" {
  name         = "kaitai-beta-monthly"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_usd
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }
}

# ── Cloudflare: tunnel, DNS, zone settings ────

data "cloudflare_zone" "this" {
  filter = {
    name = var.domain
  }
}

locals {
  zone_id    = data.cloudflare_zone.this.zone_id
  account_id = data.cloudflare_zone.this.account.id
}

# No tunnel_secret: Cloudflare generates it, so no connector credential is
# stored in state. Fetch the token with the command in outputs.tf.
resource "cloudflare_zero_trust_tunnel_cloudflared" "web" {
  account_id = local.account_id
  name       = "kaitai-beta"
  config_src = "cloudflare"
}

resource "cloudflare_zero_trust_tunnel_cloudflared_config" "web" {
  account_id = local.account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.web.id

  config = {
    ingress = [
      {
        hostname = var.domain
        service  = "http://web:3000" # Compose service name
      },
      {
        service = "http_status:404"
      },
    ]
  }
}

resource "cloudflare_dns_record" "apex" {
  zone_id = local.zone_id
  name    = var.domain
  type    = "CNAME"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.web.id}.cfargotunnel.com"
  proxied = true
  ttl     = 1 # automatic; required for proxied records
}

# Zone-wide settings. Removing an entry stops managing it but does not revert it.
locals {
  zone_settings = {
    always_use_https  = "on"
    min_tls_version   = "1.2"
    rocket_loader     = "off" # rewrites scripts; breaks the nonce CSP
    email_obfuscation = "off" # injects a script the CSP blocks
  }
}

resource "cloudflare_zone_setting" "this" {
  for_each   = local.zone_settings
  zone_id    = local.zone_id
  setting_id = each.key
  value      = each.value
}
