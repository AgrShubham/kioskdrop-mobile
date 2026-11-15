#!/bin/sh

# Ensure prisma directory exists
mkdir -p /app/prisma 2>/dev/null || true

# If dev.db is missing (e.g. fresh empty persistent volume mounted by Railway), restore from pre-seeded template
if [ ! -f /app/prisma/dev.db ] && [ -f /app/prisma/dev-seed.db ]; then
  echo "==> Initializing /app/prisma/dev.db from pre-seeded template..."
  cp /app/prisma/dev-seed.db /app/prisma/dev.db 2>/dev/null || true
fi

# Ensure read-write permissions for the database and WAL lock files
chmod 666 /app/prisma/dev.db 2>/dev/null || true
chmod 777 /app/prisma 2>/dev/null || true

echo "==> Starting KioskDrop Enterprise Server on port ${PORT:-3000}..."
exec "$@"
