# Enterprise Production Troubleshooting Matrix & Incident Analysis
**Platform**: Enterprise 3-Tier Digital Banking Platform  
**Classification**: Engineering Operational Reference  

---

## 📋 Comprehensive Incident Matrix Index

| Issue Category | Common Error Code / Symptom | Primary Root Cause | Fast Resolution Command |
| :--- | :--- | :--- | :--- |
| **HTTP Gateway** | `502 Bad Gateway` | Apache cannot reach Node.js (port 5000 down / SELinux) | `sudo setsebool -P httpd_can_network_connect 1 && pm2 restart backendapi` |
| **HTTP Gateway** | `504 Gateway Timeout` | Express route hanging / Database query deadlock | `pm2 reload backendapi` + kill long running SQL |
| **HTTP Service** | `503 Service Unavailable` | ALB Target Group unhealthy / ASG instances terminating | Check target health in AWS CLI & restart Node/Apache |
| **Database** | `ETIMEDOUT` (Port 3306) | RDS Security Group `sg-database` missing ingress from `sg-backend` | Add MySQL Rule 3306 for `sg-backend` in AWS Console |
| **Database** | `ER_TOO_MANY_CONNECTIONS` | Node.js connection pool leakage / unreleased handles | Increase `max_connections` & deploy pool drain fix |
| **Process Control** | `EADDRINUSE :::5000` | Stale Node process occupying port 5000 | `sudo fuser -k 5000/tcp` |
| **Process Control** | `PM2 Script Not Found` | Execution path points to wrong file (`index.js` missing) | Execute `pm2 start index.js` from `/home/ec2-user/bank_portal/backend` |
| **OS System** | `ENOSPC: No space left` | Application logs or Apache access logs filling `/var` | `pm2 flush && sudo journalctl --vacuum-time=1d` |
| **OS System** | `Out of Memory (OOM Killer)` | Node.js V8 heap limit exceeded / memory leak | Increase `--max-old-space-size=2048` |
| **Networking** | `DNS Resolution Failure` | Route 53 Private Hosted Zone not associated with VPC | Associate `rbs.com` with VPC `10.20.0.0/16` |
| **Networking** | `NAT Gateway Timeout` | NAT Gateway in public subnet `10.20.1.0/24` deleted or out of EIPs | Re-allocate Elastic IP & update Private Subnet route tables |

---

## 🔴 1. HTTP 502 Bad Gateway Troubleshooting

### Symptoms
Browser displays `HTTP 502 Bad Gateway` when navigating to `https://api.rebel7781.xyz/api/customer/dashboard`.

### Root Causes
1. Node.js backend process is down / crashed.
2. SELinux policy blocking Apache from making outbound HTTP connections to port 5000.
3. Node.js listening strictly on `127.0.0.1` while Apache proxies to `localhost` (IPv6 `::1` resolution failure).

### Diagnosis
```bash
# 1. Check local health response
curl -Iv http://127.0.0.1:5000/api/health

# 2. Check Apache error logs
sudo tail -n 30 /var/log/httpd/error_log
# Look for: "(111)Connection refused: AH00957: HTTP: attempt to connect to 127.0.0.1:5000 failed"

# 3. Check SELinux denial logs
sudo ausearch -m avc -ts recent | grep httpd
```

### Resolution Steps
```bash
# Fix SELinux permission if denied
sudo setsebool -P httpd_can_network_connect 1

# Restart PM2 process if down
pm2 status
pm2 restart backendapi

# Restart Apache service
sudo systemctl restart httpd
```

---

## 🔴 2. HTTP 504 Gateway Timeout Troubleshooting

### Symptoms
API requests hang for 60 seconds before returning `504 Gateway Timeout`.

### Root Causes
1. Unindexed SQL query locking tables in RDS MySQL (`book.rbs.com`).
2. Express route failing to send `res.json()` or `res.send()` on async error branch.
3. External SMTP/SMS gateway API timing out during user registration.

### Diagnosis
```bash
# 1. Inspect active database queries
mysql -h book.rbs.com -u admin -p -e "SHOW FULL PROCESSLIST;" | grep -v Sleep

# 2. Inspect Node.js event loop lag via PM2
pm2 monit

# 3. Find slow queries in MySQL slow log
aws logs tail /aws/rds/instance/bank-rds-mysql/slowquery --follow
```

### Resolution Steps
```bash
# Kill blocking SQL queries in MySQL
mysql -h book.rbs.com -u admin -p -e "KILL <process_id>;"

# Reload Node.js workers to reset hung event loops
pm2 reload backendapi
```

---

## 🔴 3. Database Connection Timeout (`ETIMEDOUT`)

### Symptoms
Backend startup log displays: `⚠️ MySQL connection failed: connect ETIMEDOUT book.rbs.com:3306`.

### Root Causes
1. Security Group `sg-database` lacks Inbound Rule for Port 3306 from `sg-backend`.
2. EC2 instance and RDS instance placed in different non-peered VPCs.
3. RDS DB instance in `creating` or `modifying` state during maintenance window.

### Diagnosis & AWS Checks
```bash
# 1. Test TCP port reachability from Backend EC2
nc -zv -w 5 book.rbs.com 3306

# 2. Check AWS Security Group Rules via CLI
aws ec2 describe-security-group-rules \
  --filters Name="group-id",Values="sg-database-id"

# 3. Verify RDS Instance Status
aws rds describe-db-instances \
  --db-instance-identifier bank-rds-mysql \
  --query "DBInstances[0].DBInstanceStatus"
```

### Resolution Steps
Add Security Group Inbound Rule:
- Type: `MySQL/Aurora` (`3306`)
- Source: `sg-backend` (or subnet range `10.20.5.0/24` & `10.20.6.0/24`)

---

## 🔴 4. `EADDRINUSE: address already in use :::5000`

### Symptoms
Running `node index.js` or starting PM2 fails with `listen EADDRINUSE: address already in use :::5000`.

### Root Cause
An orphaned Node process or background daemon is already bound to TCP Port 5000.

### Diagnosis & Resolution
```bash
# Find process ID using Port 5000
sudo lsof -i :5000
# OR
sudo netstat -tlpn | grep 5000

# Kill process gracefully or forcefully
sudo fuser -k 5000/tcp
# OR
sudo kill -9 $(sudo lsof -t -i:5000)

# Restart application
pm2 restart backendapi
```

---

## 🔴 5. Unhealthy ALB Target Group / Target Registration Failures

### Symptoms
AWS Application Load Balancer returns HTTP 503. Target Group status shows `Unhealthy` for all registered EC2 targets.

### Root Causes
1. Health check path configured as `/` instead of `/api/health`.
2. Backend security group `sg-backend` blocking ingress from ALB security group `sg-alb`.
3. Application returning 404 or 401 on health check path.

### Diagnosis
```bash
# 1. Describe Target Health via AWS CLI
aws elbv2 describe-target-health \
  --target-group-arn <TARGET_GROUP_ARN>

# 2. Test exact health check endpoint directly on EC2
curl -i http://localhost:5000/api/health
```

### Resolution Steps
1. Ensure `/api/health` returns `HTTP 200 OK` without requiring JWT authentication.
2. Update Target Group health check path in AWS Console to `/api/health`.
3. Verify ALB Security Group (`sg-alb`) is allowed ingress to `sg-backend` on port 5000.

---

## 🔴 6. Memory Leak & OOM Killer Invocation

### Symptoms
Linux kernel kills Node.js process (`Out of memory: Kill process <pid> (node)`). Memory graph in CloudWatch shows steady staircase escalation until crash.

### Root Causes
1. Global state accumulation / uncollected event listeners in Node.js.
2. Caching database responses in global arrays without TTL expiry.

### Diagnosis
```bash
# 1. Inspect dmesg for OOM killer logs
sudo dmesg -T | grep -i oom

# 2. Check Node V8 heap statistics
node --v8-options | grep -i heap
```

### Resolution Steps
1. Set V8 Max Old Space Size in PM2 ecosystem file:
   ```bash
   pm2 start index.js --name "backendapi" --max-memory-restart 1800M
   ```
2. Enable automated PM2 process restart on memory limits to prevent OS kernel panic.

---

## 🔴 7. Disk Space Exhaustion (`ENOSPC`)

### Symptoms
Application fails to write upload files, logs fail to flush, `npm install` throws `ENOSPC: no space left on device`.

### Diagnosis
```bash
# Check filesystem utilization
df -h

# Identify top disk consumers
sudo du -a /var/log /tmp /home/ec2-user | sort -n -r | head -n 15
```

### Resolution Steps
```bash
# Flush PM2 logs
pm2 flush

# Truncate system logs
sudo journalctl --vacuum-size=200M

# Remove orphaned npm cache
npm cache clean --force
```

---

## 🔴 8. DNS Resolution Failures (`book.rbs.com` / `api.rebel7781.xyz`)

### Symptoms
`getaddrinfo ENOTFOUND book.rbs.com` in application logs.

### Root Causes
1. Route 53 Private Hosted Zone `rbs.com` is not associated with VPC `10.20.0.0/16`.
2. VPC DNS Resolution (`enableDnsHostnames` / `enableDnsSupport`) set to `false`.

### Diagnosis & AWS Checks
```bash
# Test resolution via dig
dig +short book.rbs.com

# Verify VPC DNS Settings via AWS CLI
aws ec2 describe-vpc-attribute --vpc-id vpc-12345678 --attribute enableDnsHostnames
aws ec2 describe-vpc-attribute --vpc-id vpc-12345678 --attribute enableDnsSupport
```

### Resolution Steps
Enable VPC DNS Attributes:
```bash
aws ec2 modify-vpc-attribute --vpc-id vpc-12345678 --enable-dns-hostnames '{"Value": true}'
aws ec2 modify-vpc-attribute --vpc-id vpc-12345678 --enable-dns-support '{"Value": true}'
```

---

## 🔴 9. Outdated / Expired SSL Certificate (`NET::ERR_CERT_DATE_INVALID`)

### Symptoms
Browser displays red warning banner `Your connection is not private`.

### Diagnosis
```bash
echo | openssl s_client -servername virat.rebel7781.xyz -connect virat.rebel7781.xyz:443 2>/dev/null | openssl x509 -noout -dates
```

### Resolution Steps
1. For AWS ACM Certificates: ACM automatically renews certificates validated via DNS in Route 53. If validation DNS record was deleted, re-add CNAME validation record in Route 53.
2. For Apache Local Certificates:
   ```bash
   sudo certbot renew --force-renewal
   sudo systemctl reload httpd
   ```

---

## 🔴 10. NAT Gateway Failure & Outbound Egress Interruption

### Symptoms
EC2 instances in private subnets (`10.20.3.0/24`, `10.20.5.0/24`) cannot download yum/npm packages or connect to external payment gateways, while internal API calls continue to work.

### Root Causes
1. NAT Gateway in public subnet (`10.20.1.0/24`) deleted or out of Elastic IPs.
2. Private subnet route table default route `0.0.0.0/0` pointing to incorrect NAT Gateway ID.

### Diagnosis
```bash
# Test outbound connectivity from private subnet EC2
curl -I --connect-timeout 5 https://aws.amazon.com
```

### Resolution Steps
Verify Route Table via AWS CLI:
```bash
aws ec2 describe-route-tables \
  --filters Name="association.subnet-id",Values="subnet-pvt-3a-id" \
  --query "RouteTables[*].Routes"
```
Ensure route `0.0.0.0/0` points to active NAT Gateway `nat-0123456789abcdef0`.
