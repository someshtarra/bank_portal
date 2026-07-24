# Production Runbook, Incident Response & Capacity Planning
**Platform**: Enterprise 3-Tier Digital Banking Platform  
**Classification**: Operational Engineering Reference  
**Audience**: On-Call Engineers, SREs, Incident Commanders  

---

## 1. Incident Severity Classification & Escalation Matrix

| Severity Level | Impact Criteria | Response SLA | Resolution Target | Escalation Path |
| :--- | :--- | :--- | :--- | :--- |
| **P1 - Critical** | Complete platform outage, database failure, critical security breach | **< 15 Mins** | **< 2 Hours** | On-Call SRE -> Lead DevOps -> VP of Infrastructure |
| **P2 - High** | Degradation of core features (e.g. money transfer failures > 5%), single AZ failure | **< 30 Mins** | **< 4 Hours** | On-Call SRE -> Lead Backend Engineer |
| **P3 - Medium** | Minor feature issues, non-blocking admin portal errors | **< 2 Hours** | **< 24 Hours** | SRE Team -> Sprint Backlog |
| **P4 - Low** | Cosmetical issues, minor log warnings | **< 24 Hours** | **Next Sprint** | Engineering Team |

---

## 2. Disaster Recovery Strategy (Cross-Region Backup)

### Recovery Metrics
* **RTO (Recovery Time Objective)**: **< 4 Hours**
* **RPO (Recovery Point Objective)**: **< 15 Minutes**

### Automated Backup Pipeline
1. **Database Snapshots**: Amazon RDS Multi-AZ automated snapshots created every 24 hours, retained for 35 days. Transaction logs (binary logs) copied to S3 every 5 minutes for point-in-time recovery (PITR).
2. **Cross-Region Replication**: Automated Lambda script copies RDS snapshots and S3 uploads from `us-east-1` (Primary) to `us-west-2` (Disaster Recovery Region).

### Disaster Recovery Execution Runbook (Region Failover)

```
                       [ Disaster Recovery Triggered ]
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
  [ 1. Update Route 53 DNS ]                   [ 2. Promote RDS Replica ]
  Point rebel7781.xyz to DR                    Promote us-west-2 snapshot
  CloudFront / ALB Endpoint                     to active primary DB
               │                                             │
               └──────────────────────┬──────────────────────┘
                                      │
                                      ▼
                      [ 3. Launch ASG in DR Region ]
                      Provision EC2 instances via IaC
                      (Terraform / CloudFormation)
```

---

## 3. Scaling & Capacity Strategy

### Horizontal Scaling Policy (Auto Scaling Group)
- **Target CPU Utilization**: 60%
- **Target Network In/Out**: 500 MB/s
- **Scale-Out Policy**: Add 2 instances when CPU > 70% for 3 consecutive 1-minute evaluation periods.
- **Scale-In Policy**: Remove 1 instance when CPU < 30% for 15 consecutive 1-minute evaluation periods.

### Capacity Benchmark (Per Instance Baseline)

| Component | Instance Type | Max Concurrent Connections | Max Requests Per Second (RPS) |
| :--- | :--- | :--- | :--- |
| **Frontend Web (`httpd`)** | `t3.medium` (2 vCPU, 4GB) | 2,500 Concurrent HTTPs | 1,200 RPS |
| **Backend API (Node.js)** | `c6i.large` (2 vCPU, 4GB) | 1,500 Active API Sockets | 850 RPS |
| **Database (MySQL RDS)** | `db.r6g.xlarge` (4 vCPU, 32GB) | 2,000 DB Connections | 3,500 Query RPS |

---

## 4. Production Readiness & Go-Live Checklist

### Pre-Deployment Verification
- [x] VPC Subnet Isolation verified (Private subnets have no direct public IP routes).
- [x] Security Group ingress rules locked down to least-privilege source groups.
- [x] Database 3NF Schema initialized and validated against migration scripts.
- [x] V8 Memory heap limit configured in PM2 (`--max-memory-restart 1800M`).
- [x] Apache `httpd` SSL termination verified with valid ACM / TLS certificates.
- [x] CloudWatch Unified Logs Agent active and streaming access/error logs.
- [x] All 5xx error alarms connected to PagerDuty/SNS notification channels.
- [x] Database automated backups and binary logging confirmed active.
- [x] Target Group Health Checks verifying `/api/health` with `HTTP 200 OK`.
- [x] Disaster Recovery cross-region snapshot replication tested.
