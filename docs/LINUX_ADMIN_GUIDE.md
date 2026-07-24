# Enterprise Linux Systems Administration & Hardening Baseline
**Target Operating System**: Amazon Linux 2023 / Red Hat Enterprise Linux (RHEL 9)  
**Classification**: System Administration & Security Baseline  

---

## 1. Kernel Parameter Optimization (`/etc/sysctl.d/99-banking-platform.conf`)

High-throughput banking applications require kernel network stack tuning to handle thousands of concurrent TCP sockets without drops.

```ini
# /etc/sysctl.d/99-banking-platform.conf

# Maximum socket receive & send buffer sizes
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216

# Maximum number of connection backlog connections
net.core.somaxconn = 4096
net.ipv4.tcp_max_syn_backlog = 8192

# Reuse TIME_WAIT sockets for new connections when safe
net.ipv4.tcp_tw_reuse = 1

# Reduce TCP keepalive probe timeouts
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_intvl = 15
net.ipv4.tcp_keepalive_probes = 5

# Disable IP packet forwarding (Hardening)
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
```

Apply kernel settings immediately:
```bash
sudo sysctl -p /etc/sysctl.d/99-banking-platform.conf
```

---

## 2. File Descriptor Limits & Security Controls (`/etc/security/limits.d/99-banking.conf`)

Increase open file descriptor soft and hard limits for application service accounts (`ec2-user`, `apache`).

```text
# /etc/security/limits.d/99-banking.conf
ec2-user    soft    nofile    65536
ec2-user    hard    nofile    65536
ec2-user    soft    nproc     32768
ec2-user    hard    nproc     32768

apache      soft    nofile    65536
apache      hard    nofile    65536
```

---

## 3. SELinux Security Policy Management

SELinux operates in `Enforcing` mode across all production servers.

```bash
# Check current SELinux status
sestatus

# Allow Apache to initiate outbound socket connections to Node.js backend (Port 5000)
sudo setsebool -P httpd_can_network_connect 1

# Inspect SELinux audit logs for denials
sudo ausearch -m avc -ts recent | grep httpd
```

---

## 4. System Storage, Filesystem & Disk Management

```bash
# Check disk space utilization
df -hT

# Check inode consumption across mounted partitions
df -i

# Inspect largest directories consuming space in /var
sudo du -ah /var/log | sort -rh | head -n 20

# Clean old dnf package caches
sudo dnf clean all
```

---

## 5. Systemd Service Management & Process Auditing

```bash
# Check status of Apache Web Server
sudo systemctl status httpd

# Restart Apache Web Server
sudo systemctl restart httpd

# Inspect live network sockets bound to ports 80, 443, and 5000
sudo ss -tulpn | grep -E '80|443|5000'

# Trace real-time system resource utilization
top -b -n 1 | head -n 25
```
