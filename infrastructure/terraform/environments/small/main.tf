# GymTok — small-scale AWS (dev)
# Estimated ~$15–80/mo depending on NAT and usage.
#
# Usage:
#   cd infrastructure/terraform/environments/small
#   terraform init
#   terraform plan
#   terraform apply

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project" {
  type    = string
  default = "gymtok"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "db_password" {
  type      = string
  sensitive = true
}

locals {
  name = "${var.project}-${var.environment}"
  tags = {
    Project     = var.project
    Environment = var.environment
    Scale       = "small"
  }
}

# --- Networking ---
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(local.tags, { Name = "${local.name}-vpc" })
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.tags, { Name = "${local.name}-igw" })
}

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags                    = merge(local.tags, { Name = "${local.name}-public-a" })
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true
  tags                    = merge(local.tags, { Name = "${local.name}-public-b" })
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${var.aws_region}a"
  tags              = merge(local.tags, { Name = "${local.name}-private-a" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = merge(local.tags, { Name = "${local.name}-public-rt" })
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# --- Security groups ---
resource "aws_security_group" "api" {
  name        = "${local.name}-api-sg"
  description = "GymTok API"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

resource "aws_security_group" "db" {
  name        = "${local.name}-db-sg"
  description = "GymTok RDS"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.api.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

# --- S3 ---
resource "aws_s3_bucket" "raw" {
  bucket = "${local.name}-raw-uploads"
  tags   = local.tags
}

resource "aws_s3_bucket" "processed" {
  bucket = "${local.name}-processed-videos"
  tags   = local.tags
}

resource "aws_s3_bucket" "thumbnails" {
  bucket = "${local.name}-thumbnails"
  tags   = local.tags
}

resource "aws_s3_bucket_public_access_block" "raw" {
  bucket                  = aws_s3_bucket.raw.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- SQS (ready for medium scale; optional on small) ---
resource "aws_sqs_queue" "moderation_dlq" {
  name                      = "${local.name}-moderation-dlq"
  message_retention_seconds = 1209600
  tags                      = local.tags
}

resource "aws_sqs_queue" "moderation" {
  name                       = "${local.name}-moderation"
  visibility_timeout_seconds = 300
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.moderation_dlq.arn
    maxReceiveCount     = 3
  })
  tags = local.tags
}

# --- Cognito ---
resource "aws_cognito_user_pool" "main" {
  name = "${local.name}-users"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  tags = local.tags
}

resource "aws_cognito_user_pool_client" "mobile" {
  name         = "${local.name}-mobile"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret                      = false
  explicit_auth_flows                  = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_SRP_AUTH"]
  prevent_user_existence_errors        = "ENABLED"
  enable_token_revocation              = true
  allowed_oauth_flows_user_pool_client = false
}

# --- RDS (single-AZ small) ---
resource "aws_db_subnet_group" "main" {
  name       = "${local.name}-db"
  subnet_ids = [aws_subnet.public_a.id, aws_subnet.public_b.id]
  tags       = local.tags
}

resource "aws_db_instance" "main" {
  identifier             = "${local.name}-postgres"
  engine                 = "postgres"
  engine_version         = "15"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = "gymtok"
  username               = "gymtok"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  deletion_protection    = false
  tags                   = local.tags
}

# --- EC2 t3.micro API ---
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_instance" "api" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.api.id]

  user_data = <<-EOF
              #!/bin/bash
              set -e
              dnf install -y python3.11 python3.11-pip git
              # Clone + run FastAPI (set secrets via SSM/env in real deploy)
              echo "GymTok API host ready — deploy app with systemd or docker"
              EOF

  tags = merge(local.tags, { Name = "${local.name}-api" })
}

# --- Outputs ---
output "vpc_id" {
  value = aws_vpc.main.id
}

output "api_public_ip" {
  value = aws_instance.api.public_ip
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "s3_raw_bucket" {
  value = aws_s3_bucket.raw.bucket
}

output "s3_processed_bucket" {
  value = aws_s3_bucket.processed.bucket
}

output "s3_thumbnails_bucket" {
  value = aws_s3_bucket.thumbnails.bucket
}

output "sqs_moderation_url" {
  value = aws_sqs_queue.moderation.url
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "cognito_app_client_id" {
  value = aws_cognito_user_pool_client.mobile.id
}

output "cognito_jwks_url" {
  value = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}/.well-known/jwks.json"
}

output "env_snippet" {
  value = <<-EOT
    CLOUD_PROVIDER=aws
    AWS_REGION=${var.aws_region}
    DATABASE_URL=postgresql://gymtok:****@${aws_db_instance.main.address}:5432/gymtok
    COGNITO_USER_POOL_ID=${aws_cognito_user_pool.main.id}
    COGNITO_APP_CLIENT_ID=${aws_cognito_user_pool_client.mobile.id}
    COGNITO_JWKS_URL=https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}/.well-known/jwks.json
    S3_BUCKET_RAW=${aws_s3_bucket.raw.bucket}
    S3_BUCKET_PROCESSED=${aws_s3_bucket.processed.bucket}
    S3_BUCKET_THUMBNAILS=${aws_s3_bucket.thumbnails.bucket}
    SQS_QUEUE_URL=${aws_sqs_queue.moderation.url}
    USE_PLACEHOLDERS=false
  EOT
}
