#!/bin/bash
# while read line; do export $line; done < .env
docker stop postgresDB
docker rm postgresDB

docker run -d \
--name postgresDB \
-p 5432:5432 \
-e POSTGRES_PASSWORD=mypassword \
-v ${PWD}/pg-data:/var/lib/postgresql/data \
postgres:14.5
# -v ${PWD}/src/database/schema.sql:/usr/src/schema.sql \

# create schema.sql file in container
docker cp ./src/database/schema.sql postgresDB:/src/database/schema.sql
docker exec postgresDB ./src/database/db_setup.sh

