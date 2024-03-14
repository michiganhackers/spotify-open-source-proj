
# Spotify Shared Sessions Application

## Prerequisites
1. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** installed on your system
2. Access to a Spotify Premium account (Spotify API Player calls require this)

## Getting Started

To begin, clone the official github repository
> git clone https://github.com/michiganhackers/spotify-open-source-proj.git

or navigate to your local repository and pull latest changes.

### PostgreSQL Setup
Download [Docker Desktop](https://www.docker.com/products/docker-desktop/) if you don't already have it installed.

Locally install postgres:14.5 on your machine by running:

> **docker pull postgres:14.5**

Make sure your path is set to the top level of this directory, then run **pg_startup.sh** in your terminal using:

> **./pg_startup.sh**

If you are getting 
> **bash: Permission Denied**

try running 
> **chmod +x pg_startup.sh**.

Then rerun
> **./pg_startup.sh**

This should spin up a docker container preset for postgresql that you will use for development of the application.

**More setup instructions to come once database schema is created**

### Next.js Application Setup

To run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

