<div align="center">

# 🔐 SecurePaste

<p align="center">
  <strong>A secure, encrypted paste sharing application</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

<p align="center">
  <a href="https://lovable.dev/projects/3b0575dc-0c7a-4040-a488-5eecc199124a">🚀 Live Demo</a> •
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-tech-stack">Tech Stack</a>
</p>

</div>

---

## 📖 About

SecurePaste is a modern, secure paste sharing application that prioritizes privacy and security. Built with React and Supabase, it provides end-to-end encryption for all shared content, ensuring your sensitive data remains protected.

## ✨ Features

<table>
<tr>
<td>

### 🔒 Security First
- **End-to-End Encryption**: AES client-side encryption
- **Password Protection**: Optional password layers
- **Burn After Reading**: Self-destructing content
- **Zero-Knowledge**: Server never sees your data

</td>
<td>

### 🚀 Modern Experience  
- **File Support**: Upload files up to 15MB
- **Text Sharing**: Up to 500k characters (~0.5MB)
- **Syntax Highlighting**: Code snippets with highlighting
- **Responsive Design**: Perfect on any device

</td>
</tr>
<tr>
<td>

### ⏰ Smart Controls
- **Flexible Expiration**: 1 hour to 1 year, or never
- **Custom Timeouts**: Set your own rules
- **Auto-Cleanup**: Expired content removal

</td>
<td>

### 🎨 Beautiful Interface
- **Dark/Light Theme**: Toggle between modes
- **Cyberpunk Aesthetic**: Modern neon design
- **Smooth Animations**: Delightful interactions

</td>
</tr>
</table>

## 🌐 Live Application

**🔗 [Try SecurePaste Now](https://lovable.dev/projects/3b0575dc-0c7a-4040-a488-5eecc199124a)**

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- **Optional**: PostgreSQL 12+ (for standalone database)

### Database Options

SecurePaste supports two database backends:

#### Option 1: Supabase (Default) 
✅ **Recommended for beginners** - No setup required, everything works out of the box.

#### Option 2: PostgreSQL (Self-hosted)
🔧 **For advanced users** - Full control over your data and infrastructure.

### Local Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Setting up PostgreSQL (Optional)

If you want to use PostgreSQL instead of Supabase:

1. **Install PostgreSQL** (see [PostgreSQL Setup](#postgresql-setup))
2. **Set up the API server** (see [API Server Setup](#api-server-setup))
3. **Configure the frontend** using the database selector in the app

<details>
<summary><strong>📋 Detailed PostgreSQL Setup</strong></summary>

##### Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/)

##### Create Database
```bash
sudo -u postgres psql
CREATE DATABASE securepaste;
CREATE USER securepaste_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE securepaste TO securepaste_user;
\q
```

##### Setup API Server
```bash
cd postgres-api
npm install
cp .env.example .env
# Edit .env with your database credentials
psql -U securepaste_user -d securepaste -f schema.sql
npm run dev
```

The API will run on `http://localhost:3001`

</details>

### Switching Between Databases

Once the app is running, you can switch between Supabase and PostgreSQL:

1. **Open the app** in your browser
2. **Click the database selector** button (bottom-right corner)
3. **Choose your preferred database**:
   - **Supabase**: Works immediately, no setup required
   - **PostgreSQL**: Requires API server setup (see above)

### Alternative Setup Methods

<details>
<summary><strong>🔧 Development Options</strong></summary>

#### Via Lovable (Recommended)
Simply visit the [Lovable Project](https://lovable.dev/projects/3b0575dc-0c7a-4040-a488-5eecc199124a) and start prompting. Changes are auto-committed.

#### GitHub Codespaces
1. Click the **Code** button → **Codespaces** tab
2. Click **New codespace**
3. Edit directly in the browser

#### Direct GitHub Editing
Navigate to files and click the **Edit** (pencil) icon

</details>

## Docker (PostgreSQL)

Postgres is now the only backend; run the full stack with Docker:

1. Copy `.env.example` to `.env` if you also run the app outside Docker (only `VITE_POSTGRES_API_URL` matters).
2. Start everything: `docker-compose up --build`.
3. Services: frontend `http://localhost:4173`, API `http://localhost:3001/api`, Postgres `localhost:5432`, optional pgAdmin `http://localhost:5050`.
4. Data/uploads persist via the `db-data`, `uploads`, and `pgadmin-data` volumes; schema seeds from `postgres-api/schema.init.sql`.
5. If you change the API host/port, update `VITE_POSTGRES_API_URL` in `.env` and the `build.args` in `docker-compose.yml` to match.

## 📱 How to Use

<div align="center">

### Creating a Secure Paste

</div>

| Step | Action | Description |
|------|--------|-------------|
| **1** | 📝 **Content** | Enter text (up to 500k chars) or upload files (up to 15MB) |
| **2** | 🔐 **Security** | Optionally add password protection |
| **3** | ⏰ **Expiration** | Set timeframe (1 hour - 1 year, or never) |
| **4** | 🔥 **Burn Setting** | Enable self-destruct after first view |
| **5** | 🚀 **Create** | Click "Create Encrypted Paste" |
| **6** | 🔗 **Share** | Copy the secure link and share |

## 🛠️ Tech Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=flat-square&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4+-06B6D4?style=flat-square&logo=tailwindcss)

### UI & Components
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Latest-000000?style=flat-square)
![Radix UI](https://img.shields.io/badge/Radix_UI-Latest-8B5CF6?style=flat-square)
![Lucide Icons](https://img.shields.io/badge/Lucide-Icons-F56565?style=flat-square)

### Backend & Database Options
![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E?style=flat-square&logo=supabase)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=flat-square&logo=postgresql)
![Node.js](https://img.shields.io/badge/Node.js-API-339933?style=flat-square&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.18+-000000?style=flat-square&logo=express)

### Security & Utilities
![CryptoJS](https://img.shields.io/badge/CryptoJS-AES-FF6B6B?style=flat-square)
![React Query](https://img.shields.io/badge/TanStack_Query-5.0+-FF4154?style=flat-square)
![React Router](https://img.shields.io/badge/React_Router-6.0+-CA4245?style=flat-square)

</div>

## 🗄️ Database Architecture

SecurePaste supports **dual database backends** for maximum flexibility:

<table>
<tr>
<td width="50%">

### 🚀 Supabase (Managed)
- **✅ Zero Configuration** - Works out of the box
- **🔒 Built-in Auth** - User management included  
- **📁 File Storage** - Integrated file handling
- **🌐 Edge Functions** - Serverless compute
- **📊 Real-time** - Live updates support
- **🎯 Perfect for**: Rapid prototyping, production apps

</td>
<td width="50%">

### 🔧 PostgreSQL (Self-hosted)
- **🎛️ Full Control** - Complete data ownership
- **💰 Cost Effective** - No vendor lock-in
- **🔐 Enhanced Privacy** - Your infrastructure
- **⚡ Custom Logic** - Direct database access
- **📈 Scalable** - Horizontal scaling options
- **🎯 Perfect for**: Enterprise, compliance, custom needs

</td>
</tr>
</table>

## 🚀 Deployment

### Quick Deploy with Lovable
1. Open [Lovable Project](https://lovable.dev/projects/3b0575dc-0c7a-4040-a488-5eecc199124a)
2. Click **Share** → **Publish**
3. Your app is live! 🎉

### Custom Domain Setup
1. Navigate to **Project** → **Settings** → **Domains**
2. Click **Connect Domain**
3. Follow the setup wizard

> 📚 [Custom Domain Guide](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all checks pass

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 💡 Support

Having issues? Check out:
- [Lovable Documentation](https://docs.lovable.dev/)
- [Project Issues](https://github.com/your-username/securepaste/issues)
- [Lovable Discord](https://discord.gg/lovable)

---

<div align="center">

**Made with ❤️ using [Lovable](https://lovable.dev)**

⭐ Star this repo if you find it helpful!

</div>
