# DP ENTERPRISES – GarmentFlow Database Architecture

This directory contains database schema definitions and SQL initialization scripts for **DP ENTERPRISES – GarmentFlow**.

## Database Overview
- **Database Engine**: MySQL / MariaDB (InnoDB, `utf8mb4_unicode_ci`)
- **ORM / Migrations**: Prisma ORM (`backend/prisma/schema.prisma`)
- **Default Database Name**: `garmentflow_db`

## Files in this Directory
1. `schema.sql`: Full native MySQL/MariaDB database dump including all tables, primary keys, foreign key constraints, indexes, triggers, and baseline seed data with DP ENTERPRISES settings.
2. `schema.prisma`: Prisma ORM schema copy documenting all 17 business entities and relational mappings.

## Quick Import (Fresh Setup)
To restore or initialize a fresh MySQL database:

```bash
# Using MySQL Command Line client
mysql -u root -p < database/schema.sql

# Or using the built-in batch restore script
restore.bat
```

## Prisma Migration Commands
Managed from `backend/`:
```bash
cd backend
npx prisma db push
node prisma/seed.js
```
