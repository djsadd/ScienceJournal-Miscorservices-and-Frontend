#!/bin/sh
set -eu

psql -v ON_ERROR_STOP=1 \
  -v analytics_password="$ANALYTICS_DB_PASSWORD" \
  --host=db --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" <<'SQL'
SELECT format('CREATE ROLE analytics LOGIN PASSWORD %L', :'analytics_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'analytics') \gexec

ALTER ROLE analytics WITH LOGIN PASSWORD :'analytics_password';

SELECT 'CREATE DATABASE analytics OWNER analytics'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'analytics') \gexec

GRANT ALL PRIVILEGES ON DATABASE analytics TO analytics;
SQL
