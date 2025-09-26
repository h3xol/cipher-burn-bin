# SecurePaste PostgreSQL API

This is a Node.js/Express API server that provides PostgreSQL backend support for SecurePaste as an alternative to Supabase.

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+ database
- Git

## Setup Instructions

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE securepaste;
CREATE USER securepaste_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE securepaste TO securepaste_user;
\q
```

### 3. Set up the API Server

```bash
# Navigate to the postgres-api directory
cd postgres-api

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit the .env file with your database credentials
nano .env
```

### 4. Initialize Database Schema

```bash
# Run the schema script
psql -U securepaste_user -d securepaste -f schema.sql
```

### 5. Start the API Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3001`

## Environment Variables

Create a `.env` file with the following variables:

```bash
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=securepaste
DB_USER=securepaste_user
DB_PASSWORD=your_secure_password

# Server Configuration
PORT=3001
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/pastes/:id` - Get paste by ID
- `POST /api/pastes` - Create new paste
- `PUT /api/pastes/:id` - Update paste
- `DELETE /api/pastes/:id` - Delete paste
- `POST /api/storage/upload` - Upload file
- `DELETE /api/storage/:bucket/:filename` - Delete file
- `POST /api/cleanup` - Clean up expired pastes

## Setting up Cleanup Job (Optional)

To automatically clean up expired pastes, you can set up a cron job:

```bash
# Edit crontab
crontab -e

# Add this line to run cleanup every hour
0 * * * * curl -X POST http://localhost:3001/api/cleanup
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check your credentials in `.env` file
- Verify database exists: `psql -U postgres -l`

### Permission Issues
- Make sure the database user has proper permissions
- Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`

### Port Conflicts
- If port 3001 is busy, change `PORT` in `.env` file
- Update the API URL in the frontend database selector

## Production Deployment

For production deployment:

1. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start server.js --name "securepaste-api"
pm2 startup
pm2 save
```

2. Set up reverse proxy with Nginx:
```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

3. Use environment variables for production settings
4. Set up SSL/TLS certificates
5. Configure database backups

## Security Considerations

- Use strong passwords for database users
- Keep PostgreSQL updated
- Configure firewall rules
- Use SSL connections in production
- Regularly backup your database
- Monitor logs for suspicious activity