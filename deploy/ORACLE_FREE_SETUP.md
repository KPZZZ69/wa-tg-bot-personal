# 100% Free Hosting: Oracle Cloud Setup

Oracle Cloud offers an "Always Free" tier giving you an ARM Ampere A1 Compute instance with **4 Cores and 24GB of RAM**. This is vastly superior to any other free tier and is the perfect permanent home for large bots like this one.

## Step 1: Claim the Free Instance
1. Go to [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/) and sign up.
2. Go to **Compute** -> **Instances** -> **Create Instance**.
3. **Image & Shape**: 
   - Change Image to **Ubuntu 22.04 or 24.04**.
   - Change Shape to **Ampere ARM (VM.Standard.A1.Flex)**. Drag the sliders to 4 OCPUs and 24GB RAM.
4. Download your new **SSH Key**.
5. Click **Create** and wait for provisioning.

## Step 2: Open Ports / Networking
1. On your instance page, click your **Subnet**.
2. Click on the **Default Security List** and add an Ingress Rule:
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: `TCP`
   - Destination Port Range: `3000` (for the healthcheck)

## Step 3: Connect and Install Environment
Open your terminal and SSH into your new machine:
```bash
ssh -i ~/Downloads/ssh-key-202X.key ubuntu@<YOUR_INSTANCE_IP>
```

Install Docker and Git:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose git -y
sudo usermod -aG docker ubuntu
newgrp docker
```

## Step 4: Deploy the Bot
```bash
git clone <YOUR_REPO_URL> wa-tg-bot
cd wa-tg-bot
cp .env.example .env

# Edit the configuration
nano .env 
# Paste your GEMINI_API_KEY, GROQ_API_KEY, TELEGRAM tokens, and a random DB encryption key

# Start the bot
docker-compose up -d --build
```

Monitor logs to get the initial WhatsApp QR Code:
```bash
docker-compose logs -f bot
```

Scan the QR code, and your bot will now run natively 24/7 forever for $0.00!
