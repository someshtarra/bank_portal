# Architecture Decision Records (ADR)
**Platform**: Enterprise 3-Tier Digital Banking Platform  
**Classification**: Internal Engineering Documentation  
**Status**: Active / Approved  

---

## Index of Architecture Decision Records

| ADR ID | Title | Status | Date |
| :--- | :--- | :--- | :--- |
| **ADR-001** | Multi-AZ 3-Tier VPC Subnet Isolation Model | Approved | 2026-01-15 |
| **ADR-002** | Dual-Layer Application Load Balancing & Public/Private Hosted Zone Split | Approved | 2026-01-20 |
| **ADR-003** | Reverse Proxy Pattern using Apache (`httpd`) over Local Unix Socket/Loopback | Approved | 2026-02-02 |
| **ADR-004** | Node.js Process Supervision with PM2 Cluster Mode & Systemd Integration | Approved | 2026-02-10 |
| **ADR-005** | Amazon RDS MySQL Multi-AZ Deployment with Encrypted Storage & Automated Failover | Approved | 2026-02-18 |
| **ADR-006** | Zero-Downtime Rolling Deployment Strategy via ASG & ALB Health Checks | Approved | 2026-03-01 |
| **ADR-007** | State-Offloaded Stateless Application Tier Architecture | Approved | 2026-03-12 |
| **ADR-008** | Least-Privilege IAM Roles & Security Group Hardening Baseline | Approved | 2026-03-25 |
| **ADR-009** | Observability Architecture: Unified CloudWatch Logs, Metrics & Alarm Escalation | Approved | 2026-04-05 |
| **ADR-010** | Disaster Recovery Strategy: Cold Standby Cross-Region Snapshot Replication (RTO < 4h, RPO < 15m) | Approved | 2026-04-18 |

---

## ADR-001: Multi-AZ 3-Tier VPC Subnet Isolation Model

### Context & Problem Statement
The banking platform requires strict compliance with PCI-DSS and ISO 27001 standards. Public network access to application code and database storage must be completely eliminated while supporting 500,000+ active customers and multi-AZ fault tolerance.

### Decision
We adopt a dedicated Amazon VPC (`10.20.0.0/16`) divided across two Availability Zones (`us-east-1a` and `us-east-1b`) into three distinct tiers:
1. **Public Tier (`10.20.1.0/24`, `10.20.2.0/24`)**: Contains Internet Gateways, NAT Gateways, and Public Application Load Balancers (ALB) only.
2. **Presentation / Application Private Tiers (`10.20.3.0/24` to `10.20.6.0/24`)**: Private subnets containing EC2 instances running Apache and Node.js. No public IP addresses assigned. Outbound internet egress routed strictly through NAT Gateways.
3. **Database Isolated Private Tier (`10.20.7.0/24`, `10.20.8.0/24`)**: Strictly isolated private subnets with no route to Internet Gateways or NAT Gateways. Accessible only via Security Group rules from the Application Tier.

### Consequences
* **Positive**: Full network isolation. Complies with banking security standards. Database cannot be reached from internet under any circumstance.
* **Negative**: NAT Gateway transfer costs incurred for outbound patch management and external API calls.

---

## ADR-002: Dual-Layer Application Load Balancing & Public/Private Hosted Zone Split

### Context & Problem Statement
External clients must access the frontend and API over HTTPS, while internal backend components require decoupled DNS resolution that prevents domain spoofing.

### Decision
We implement a dual Route 53 Hosted Zone topology:
* **Public Hosted Zone (`rebel7781.xyz`)**: Resolves `virat.rebel7781.xyz` to the Public Frontend ALB and `api.rebel7781.xyz` to the Public API ALB.
* **Private Hosted Zone (`rbs.com`)**: Resolves internal database endpoints (`book.rbs.com`) strictly within the VPC to the RDS CNAME endpoint.

### Consequences
* Prevents external DNS leak of internal database endpoints.
* Enables AWS Certificate Manager (ACM) wildcard SSL termination on Public ALBs.

---

## ADR-003: Reverse Proxy Pattern using Apache (`httpd`) over Local Loopback

### Context & Problem Statement
Node.js single-threaded event loops should not directly handle raw TLS handshakes or serve static client-side assets (React bundle), which degrades event loop performance.

### Decision
Deploy Apache (`httpd`) on Presentation Tier EC2 instances. Apache serves pre-compiled static React production assets (`dist/`) directly and acts as a high-performance HTTP reverse proxy (`ProxyPass /api http://127.0.0.1:5000/api`) forwarding API traffic to Node.js.

### Consequences
* CPU utilization on Node.js reduced by ~40% for static asset requests.
* Provides fine-grained HTTP request logging, security headers (HSTS, CSP), and request throttling before reaching Node.js.

---

## ADR-004: Node.js Process Supervision with PM2 Cluster Mode

### Context & Problem Statement
Node.js processes can crash due to unhandled exceptions or memory leaks. Automatic process recovery and CPU core utilization across multi-core EC2 instances are mandatory.

### Decision
Utilize **PM2** process manager running in cluster mode (`pm2 start index.js -i max --name "backendapi"`). PM2 is configured as a systemd service to auto-start on EC2 instance boot (`pm2 startup systemd`).

### Consequences
* Zero-downtime process reloads during configuration updates (`pm2 reload backendapi`).
* Automatic restart of crashed workers in under 200ms.

---

## ADR-005: Amazon RDS MySQL Multi-AZ Deployment with Encrypted Storage

### Context & Problem Statement
Financial ledger records require strict ACID compliance, zero data loss in case of hardware failure, and automated failover capabilities without manual DNS intervention.

### Decision
Provision **Amazon RDS MySQL 8.0 Multi-AZ** in subnets `10.20.7.0/24` (Primary) and `10.20.8.0/24` (Synchronous Standby). Storage is encrypted at rest using AWS KMS (`aws/rds`). Automated daily snapshots retained for 35 days with point-in-time recovery (PITR) enabled.

### Consequences
* Failover occurs automatically within 60–120 seconds with endpoint CNAME automatically re-pointed by AWS.
* Read/write latencies kept < 3ms across Availability Zones.

---

## ADR-006: Zero-Downtime Rolling Deployment Strategy

### Context & Problem Statement
Application updates must be deployed without interrupting active customer banking sessions or dropping pending API transactions.

### Decision
Implement Auto Scaling Group (ASG) rolling updates with an instance refresh policy (Minimum Healthy Percentage: 50%, Instance Warmup: 300s). Target Group deregistration delay set to 30 seconds to allow inflight HTTP requests to gracefully complete.

### Consequences
* Eliminates maintenance downtime windows.
* Failed health checks during rolling updates trigger automatic rollback to previous Launch Template revision.

---

## ADR-007: State-Offloaded Stateless Application Tier Architecture

### Context & Problem Statement
Instances in ASG must be fully ephemeral to support horizontal scaling based on CPU/Memory metrics.

### Decision
All session state is offloaded to JWT tokens signed cryptographically with RS256/HS256. User file uploads are stored in S3 or local persistent storage backed by EFS. No local session state is maintained on EC2 disk.

### Consequences
* Any EC2 instance can be terminated or auto-scaled dynamically without logging out users or losing transaction state.

---

## ADR-008: Least-Privilege IAM Roles & Security Group Hardening Baseline

### Context & Problem Statement
Compromise of a single EC2 instance must not allow lateral movement across the cloud infrastructure or AWS account APIs.

### Decision
* EC2 instances attached to specific IAM Instance Profiles with limited policy permissions (S3 read/write, CloudWatch Logs agent write).
* Security Groups restricted strictly to adjacent tiers (e.g., Database Security Group `sg-database` admits ingress on Port 3306 ONLY from `sg-backend`).

### Consequences
* Complete prevention of direct SSH access from public internet (access via AWS Systems Manager Session Manager).

---

## ADR-009: Observability Architecture: Unified CloudWatch Logs & Metrics

### Context & Problem Statement
Full stack visibility is required across HTTP status codes, CPU/Memory metrics, database connection pool exhaustion, and error logs.

### Decision
Deploy Unified CloudWatch Agent across all EC2 instances to stream Apache access/error logs (`/var/log/httpd/`), PM2 logs (`/root/.pm2/logs/`), and system metrics (disk usage, memory utilization) into CloudWatch Log Groups. High-severity metrics trigger PagerDuty/SNS alerts.

### Consequences
* Centralized search and log analysis across auto-scaled instances.
* Real-time alerting on 5xx error spikes or memory leaks.

---

## ADR-010: Disaster Recovery Strategy: Cross-Region Snapshot Replication

### Context & Problem Statement
Total AWS region outage (`us-east-1`) requires business continuity safeguards.

### Decision
Automate cross-region replication of RDS snapshots and S3 backups from `us-east-1` to `us-west-2`. Infrastructure codified in CloudFormation/Terraform modules capable of standing up the entire VPC, ASG, and ALB stack in under 4 hours.

### Target Recovery Metrics
* **RTO (Recovery Time Objective)**: < 4 Hours
* **RPO (Recovery Point Objective)**: < 15 Minutes
