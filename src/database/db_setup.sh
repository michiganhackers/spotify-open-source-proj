psql -U postgres
CREATE USER admin PASSWORD $POSTGRES_PASSWORD SUPERUSER;
CREATE DATABASE dev OWNER admin

# Connect to dev database
\c dev admin

# Define the schema for dev database by running schema file
# \i C:/src/database/sql