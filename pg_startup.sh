#!/bin/bash
docker run -d \
--name postgres \
-p 5432:5432 \
-e POSTGRES_PASSWORD=secret_password \
-v ${PWD}/postgres-docker:/var/lib/postgresql/data \
postgres:14.5