# #!/bin/bash
# docker stop postgresDB1
# docker rm postgresDB1

# source .env

# docker run -d \
# --name postgresDB1 \
# -p 5433:5432 \
# -e POSTGRES_PASSWORD=${PG_PASSWORD} \
# -e POSTGRES_USER=${PG_USER} \
# -v ${PWD}/src/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql \
# postgres:14.5


docker stop postgresDB
docker rm postgresDB

source .env

docker run -d \
--name postgresDB \
-p 5432:5432 \
-e POSTGRES_PASSWORD=spotify \
-e POSTGRES_USER=dev \
-v ${PWD}/src/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql \
postgres:14.5


