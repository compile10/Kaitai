# Official Postgres image plus pg_cron, which deletes expired rows on a schedule
# (see migrations/003_expiry_jobs.sql). The Debian image ships the PGDG apt repo.
FROM postgres:17

RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql-17-cron \
  && rm -rf /var/lib/apt/lists/*

# Background workers run jobs in-process, so pg_cron needs no password to
# connect back to the server. cron.database_name must match POSTGRES_DB.
CMD ["postgres", \
  "-c", "shared_preload_libraries=pg_cron", \
  "-c", "cron.database_name=kaitai", \
  "-c", "cron.use_background_workers=on"]
