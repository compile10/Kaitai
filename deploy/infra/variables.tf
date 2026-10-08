variable "region" {
  description = "AWS region for the Lightsail instance"
  type        = string
  default     = "us-east-1"
}

variable "domain" {
  description = "Cloudflare zone and public hostname served through the tunnel"
  type        = string
  default     = "kaitai.app"
}

variable "bundle_id" {
  description = "Lightsail plan; small_3_0 is 2 GB RAM for $12 per month"
  type        = string
  default     = "small_3_0"
}

variable "ssh_public_key_path" {
  description = "Public key installed for the ubuntu user"
  type        = string
  default     = "~/.ssh/kaitai-beta.pub"
}

variable "ssh_cidrs" {
  description = "IPv4 CIDRs allowed to reach SSH; the only open inbound port"
  type        = list(string)

  validation {
    condition     = length(var.ssh_cidrs) > 0 && alltrue([for cidr in var.ssh_cidrs : can(cidrhost(cidr, 0)) && cidr != "0.0.0.0/0"])
    error_message = "Provide at least one valid CIDR, and do not open SSH to 0.0.0.0/0."
  }
}

variable "alert_email" {
  description = "Recipient for AWS budget alerts"
  type        = string
}

variable "monthly_budget_usd" {
  description = "Account-wide monthly budget that triggers alerts"
  type        = string
  default     = "25"
}
