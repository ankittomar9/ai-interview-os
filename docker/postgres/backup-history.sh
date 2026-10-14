#!/usr/bin/env sh
# SPEC-017: Postgres history ledger backup helper
set -eu

BACKUP_DIR="${1:-.}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/history-backup-${TIMESTAMP}.sql"

echo "Backing up interview_session_db to ${BACKUP_FILE}..."
docker exec -t postgres pg_dump -U postgres interview_session_db > "${BACKUP_FILE}"
echo "Backup complete: ${BACKUP_FILE}"
