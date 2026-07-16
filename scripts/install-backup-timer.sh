#!/bin/bash
# Installs the nightly backup as a systemd timer. Idempotent — safe to re-run.
#
# A timer rather than cron: it survives reboots, records status in journalctl,
# and Persistent=true means a backup missed while the box was off runs on boot.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cat > /etc/systemd/system/vendora-backup.service <<EOF
[Unit]
Description=Nightly backup of the yerevan.digital database and uploads
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=$REPO_DIR/scripts/backup.sh
# The dump is I/O heavy; keep it out of the way of serving traffic.
Nice=10
IOSchedulingClass=idle
EOF

cat > /etc/systemd/system/vendora-backup.timer <<'EOF'
[Unit]
Description=Run the yerevan.digital backup nightly

[Timer]
OnCalendar=*-*-* 03:20:00
# Catch up if the box was off at 03:20.
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
EOF

chmod +x "$REPO_DIR/scripts/backup.sh"
systemctl daemon-reload
systemctl enable --now vendora-backup.timer

echo "Installed. Next run:"
systemctl list-timers vendora-backup.timer --no-pager
