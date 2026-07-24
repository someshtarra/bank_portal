# Standard Operating Procedures (SOP) & Runbooks
**Platform**: Enterprise 3-Tier Digital Banking Platform  
**Classification**: Operational Engineering Documentation  
**Audience**: DevOps Engineers, Site Reliability Engineers (SRE), On-Call Engineers  

---

## Index of Standard Operating Procedures

| SOP ID | Title | Frequency / Trigger | Target SLA |
| :--- | :--- | :--- | :--- |
| **SOP-101** | Daily Production Health Check Procedure | Daily (07:00 UTC) | 15 Mins |
| **SOP-102** | EC2 Instance Provisioning & Hardening SOP | On-Demand | 30 Mins |
| **SOP-103** | Zero-Downtime Application Deployment SOP | Per Release Schedule | 20 Mins |
| **SOP-104** | PM2 Process Crash & Recovery SOP | Incident Trigger (Alarm) | < 5 Mins |
| **SOP-105** | Apache (`httpd`) Web Server Failure & Recovery SOP | Incident Trigger (Alarm) | < 5 Mins |
| **SOP-106** | Amazon RDS Failover & Database Recovery SOP | Incident Trigger (RDS Alarm) | < 10 Mins |
| **SOP-107** | High Disk Usage & Log Rotation Mitigation SOP | Incident Trigger (> 85% Disk) | 15 Mins |
| **SOP-108** | Memory Leak Investigation & PM2 Heap Dump SOP | Metric Trigger (> 90% RAM) | 20 Mins |
| **SOP-109** | ACM SSL/TLS Certificate Renewal & Verification SOP | 30 Days Prior to Expiry | 30 Mins |
| **SOP-110** | Emergency Rollback Procedure | Deployment Failure Trigger | < 5 Mins |

---

## SOP-101: Daily Production Health Check Procedure

### Purpose
Verify the operational health, network connectivity, security posture, and database synchronization of the 3-Tier Banking Platform prior to peak trading hours.

### Execution Steps

1. **Verify Route 53 & Public DNS Resolution**:
   ```bash
   dig +short virat.rebel7781.xyz
   dig +short api.rebel7781.xyz
   ```
   *Expected Outcome*: Returns Frontend and Backend ALB Canonical CNAMEs.

2. **Validate ALB Endpoint Health Checks**:
   ```bash
   curl -Iv https://api.rebel7781.xyz/api/health
   ```
   *Expected Output*: `HTTP/1.1 200 OK` with payload `{"status":"UP","service":"Banking Portal REST API"}`.

3. **Check Target Group Health Status (AWS CLI)**:
   ```bash
   aws elbv2 describe-target-health \
     --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/tg-backend-api/abc12345 \
     --query "TargetHealthDescriptions[*].[Target.Id,TargetHealth.State]" --output table
   ```
   *Expected Outcome*: All registered targets show `healthy`.

4. **Verify PM2 Process Cluster Status on Application Instances**:
   ```bash
   sudo pm2 status
   ```
   *Expected Outcome*: Process `backendapi` shows status `online` with 0 restarts in past 24 hours.

5. **Verify Database Connectivity & Connection Pool Count**:
   ```bash
   mysql -h book.rbs.com -u admin -p -e "SHOW PROCESSLIST;"
   ```
   *Expected Outcome*: Active connections within normal thresholds (< 50 active threads).

---

## SOP-102: EC2 Instance Provisioning & Hardening SOP

### Purpose
Standardized procedure for manually launching or updating AMI baselines for Presentation/Application Tier instances inside VPC `10.20.0.0/16`.

### Execution Steps

1. **Launch EC2 Instance inside Target Private Subnet**:
   - AMI: Amazon Linux 2023 / RHEL 9 (64-bit x86)
   - Instance Type: `t3.medium` or `c6i.large`
   - Subnet: `10.20.3.0/24` (Presentation) or `10.20.5.0/24` (Application)
   - Security Group: `sg-frontend` or `sg-backend`

2. **System Baseline Hardening**:
   ```bash
   # Update system packages
   sudo dnf update -y

   # Disable unused protocols & services
   sudo systemctl disable bluetooth postfix --now

   # Configure kernel sysctl parameters for high throughput
   sudo sysctl -w net.core.somaxconn=1024
   sudo sysctl -w net.ipv4.tcp_max_syn_backlog=2048
   ```

3. **Node.js & PM2 Installation (Application Tier)**:
   ```bash
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo dnf install -y nodejs
   sudo npm install -g pm2
   sudo pm2 startup systemd -u ec2-user --hp /home/ec2-user
   ```

4. **Apache Setup & Reverse Proxy Module Enablement (Presentation Tier)**:
   ```bash
   sudo dnf install -y httpd mod_ssl
   sudo systemctl enable httpd --now
   sudo setsebool -P httpd_can_network_connect 1
   ```

---

## SOP-103: Zero-Downtime Application Deployment SOP

### Purpose
Deploy new application code releases using PM2 cluster zero-downtime reloads or Auto Scaling Group Instance Refreshes.

### Execution Steps (Option A: Direct PM2 Reload)

1. **Pull Latest Code Artifact on Application Instance**:
   ```bash
   cd /home/ec2-user/bank_portal/backend
   git pull origin main
   npm install --production
   ```

2. **Perform Zero-Downtime PM2 Reload**:
   ```bash
   pm2 reload backendapi --update-env
   ```
   *PM2 reloads workers sequentially. The active HTTP requests are drained before workers restart.*

3. **Verify API Health After Deployment**:
   ```bash
   curl http://localhost:5000/api/health
   ```

### Execution Steps (Option B: ASG Rolling Instance Refresh)

1. **Trigger ASG Instance Refresh via AWS CLI**:
   ```bash
   aws auto-scaling start-instance-refresh \
     --auto-scaling-group-name asg-backend-tier \
     --preferences '{"MinHealthyPercentage": 50, "InstanceWarmup": 300}'
   ```

2. **Monitor Refresh Progress**:
   ```bash
   aws auto-scaling describe-instance-refreshes \
     --auto-scaling-group-name asg-backend-tier
   ```

---

## SOP-104: PM2 Process Crash & Recovery SOP

### Trigger
CloudWatch Alarm `PM2ProcessCrashAlarm` fires or HTTP 502/503 errors spike on ALB.

### Diagnosis & Mitigation Steps

1. **Check PM2 Status**:
   ```bash
   pm2 status
   ```

2. **Inspect Error Logs**:
   ```bash
   pm2 logs backendapi --lines 50 --err
   ```

3. **Check for Port Conflicts (`EADDRINUSE`)**:
   ```bash
   sudo fuser -k 5000/tcp
   ```

4. **Restart Process & Save PM2 State**:
   ```bash
   pm2 restart backendapi
   pm2 save
   ```

5. **If Process Keeps Crashing (Memory Exhaustion)**:
   Increase Node memory limit:
   ```bash
   pm2 start index.js --name "backendapi" --node-args="--max-old-space-size=2048"
   ```

---

## SOP-105: Apache (`httpd`) Web Server Recovery SOP

### Trigger
CloudWatch Alarm `ApacheServiceDown` fires or HTTP 502 Bad Gateway reported by Frontend.

### Execution Steps

1. **Verify Apache Status**:
   ```bash
   sudo systemctl status httpd
   ```

2. **Test Apache Syntax Configuration**:
   ```bash
   sudo httpd -t
   ```

3. **Inspect Apache Error Logs**:
   ```bash
   sudo tail -n 50 /var/log/httpd/error_log
   sudo tail -n 50 /var/log/httpd/bank_portal_error.log
   ```

4. **Check SELinux Network Connection Permission**:
   ```bash
   sudo getsebool httpd_can_network_connect
   # If disabled, enable immediately:
   sudo setsebool -P httpd_can_network_connect 1
   ```

5. **Restart Apache Service**:
   ```bash
   sudo systemctl restart httpd
   ```

---

## SOP-106: Amazon RDS Failover & Database Recovery SOP

### Trigger
CloudWatch Alarm `RDSFailoverEvent` or `DatabaseConnectionTimeout` fires.

### Diagnosis & Execution Steps

1. **Check RDS Multi-AZ Failover Status in AWS Console / CLI**:
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier bank-rds-mysql \
     --query "DBInstances[0].[DBInstanceStatus, Endpoint.Address, MultiAZ]"
   ```

2. **Verify Port 3306 Reachability from Backend EC2**:
   ```bash
   nc -zv book.rbs.com 3306
   ```

3. **If Connection Times Out (`ETIMEDOUT`)**:
   Verify Database Security Group `sg-database` ingress rules:
   ```bash
   aws ec2 describe-security-group-rules \
     --filters Name="group-id",Values="sg-database-id"
   ```
   Ensure inbound rule exists for Port `3306` from `sg-backend` (`10.20.5.0/24` & `10.20.6.0/24`).

4. **Restart Backend API Connection Pool**:
   Once RDS status returns to `available`, reload PM2 to clear dead connection sockets:
   ```bash
   pm2 reload backendapi
   ```

---

## SOP-107: High Disk Usage & Log Rotation SOP

### Trigger
CloudWatch Alarm `DiskSpaceUtilization > 85%`.

### Execution Steps

1. **Identify Large Files & Directories**:
   ```bash
   df -h /
   sudo du -sh /var/log/* /tmp/* /home/ec2-user/.pm2/logs/* | sort -rh | head -n 10
   ```

2. **Truncate PM2 Log Files**:
   ```bash
   pm2 flush
   ```

3. **Clean Apache Logs & Vacuum Journald**:
   ```bash
   sudo journalctl --vacuum-time=3d
   sudo truncate -s 0 /var/log/httpd/*log
   ```

4. **Configure Automatic PM2 Log Rotation**:
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 50M
   pm2 set pm2-logrotate:retain 7
   ```

---

## SOP-108: ACM SSL/TLS Certificate Renewal & Verification SOP

### Purpose
Ensure continuous HTTPS operation across `virat.rebel7781.xyz` and `api.rebel7781.xyz`.

### Execution Steps

1. **Check Certificate Expiry via OpenSSL**:
   ```bash
   echo | openssl s_client -servername virat.rebel7781.xyz -connect virat.rebel7781.xyz:443 2>/dev/null | openssl x509 -noout -dates
   ```

2. **Verify AWS ACM Auto-Renewal Status**:
   ```bash
   aws acm list-certificates --certificate-statuses ISSUED
   ```
   *ACM certificates integrated with Route 53 DNS validation renew automatically 60 days before expiration.*

3. **If Using Custom Apache SSL Certs (`/etc/pki/tls/certs/localhost.crt`)**:
   Renew via Certbot:
   ```bash
   sudo certbot renew --quiet
   sudo systemctl reload httpd
   ```

---

## SOP-110: Emergency Rollback Procedure

### Purpose
Immediately revert application release to previous stable Git commit or ASG Launch Template version during critical production failure.

### Execution Steps

1. **Rollback Git Commit on Backend**:
   ```bash
   cd /home/ec2-user/bank_portal/backend
   git log -n 5 --oneline
   git reset --hard HEAD~1
   npm install --production
   pm2 reload backendapi
   ```

2. **Rollback ASG to Previous Launch Template Version**:
   ```bash
   aws auto-scaling update-auto-scaling-group \
     --auto-scaling-group-name asg-backend-tier \
     --launch-template LaunchTemplateId=lt-12345,Version='$Previous'
   
   aws auto-scaling start-instance-refresh \
     --auto-scaling-group-name asg-backend-tier
   ```

3. **Verify Rollback Status**:
   ```bash
   curl -s https://api.rebel7781.xyz/api/health
   ```
