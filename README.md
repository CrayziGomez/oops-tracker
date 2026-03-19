# OOPS - Project Issue Tracker

![OOPS Dashboard](/public/favicon.ico) 

OOPS is a high-performance, visually stunning project management and issue tracking system. Designed with a premium **dark-mode aesthetic** and **glassmorphism** effects, it provides a seamless experience for developers and managers to track bugs, features, and tasks.

## ✨ Key Features

- **📂 Project-Based Organization**: Group issues by project for clean segregation.
- **🛡️ RBAC (Role-Based Access Control)**:
  - **Admins**: Full control over users, projects, and system settings.
  - **Reporters**: Can report issues, update their own tickets, and join discussions.
- **💬 Real-time Discussions**: Interactive comment threads on every issue.
- **📎 Smart Attachments**: Local storage support for logs, images, and documents.
- **📊 Admin Dashboard**: High-level overview of system metrics and user activity.
- **🌑 Premium UI**: Built with Tailwind CSS 4, Lucide icons, and advanced CSS animations.

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: [SQLite](https://sqlite.org/) (Zero-config, local file storage)
- **ORM**: [Prisma 6](https://www.prisma.io/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🛠️ Prerequisites

- **Node.js**: 20.9.0 or higher
- **npm**: 10.x or higher

## 📥 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/CrayziGomez/oops-tracker.git
cd oops-tracker/oops-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment
Copy the example env file and fill in your values:
```bash
cp .env.example .env.local
```

Key values to set in `.env.local`:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secure-random-secret"   # generate: openssl rand -base64 32
AUTH_URL="http://localhost:3000"
SEED_ADMIN_PASSWORD="your-admin-password"
SEED_REPORTER_PASSWORD="your-reporter-password"
```

### 4. Initialize Database
Generate the Prisma client and push the schema to your local SQLite file:
```bash
npx prisma db push
```

### 5. Seed Initial Data (Optional)
Create an initial admin user and sample projects:
```bash
npm run db:seed
```

### 6. Start Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

---

## 🚢 Deployment Guide

### Bare Metal Deployment
1. Build the application:
   ```bash
   npm run build
   ```
2. Run in production mode:
   ```bash
   npm run start
   ```

### Docker Deployment (Recommended)

1. **Copy and configure the compose file**:
   ```bash
   cp docker-compose.example.yml docker-compose.prod.yml
   ```
   Edit `docker-compose.prod.yml` and replace all `<change-me>` placeholders.

2. **Start the application**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
   The database initialises and seeds itself automatically on first boot.

3. **Login Credentials** — defaults shown, override via env vars in your compose file:
   | Role | Default Email | Password |
   | :--- | :--- | :--- |
   | **Admin** | `admin@oops.local` (or `SEED_ADMIN_EMAIL`) | value of `SEED_ADMIN_PASSWORD` |
   | **Reporter** | `reporter@oops.local` (or `SEED_REPORTER_EMAIL`) | value of `SEED_REPORTER_PASSWORD` |

> [!IMPORTANT]
> Change the default passwords in your compose file before first deploy. They are only applied once on initial database creation.

Your data (SQLite database and file uploads) is automatically persisted in Docker volumes.

## ⚙️ Customization & FAQs

### Changing the Port
Change the left-hand port number in your compose file:
```yaml
ports:
  - "8080:3000"  # Replace 8080 with your preferred port
```
Then update `NEXTAUTH_URL` to match, e.g. `http://localhost:8080`.

### Setting your Public URL
The **`AUTH_URL`** in your `.env` file **must match exactly** the URL you use to access the app in your browser. 
* **With a Reverse Proxy (NPM/Nginx)**: Use `https://oops.your-domain.com`
* **Direct Access**: Use `http://your-server-ip:3005` (include the port!)

> [!IMPORTANT]
> If your `AUTH_URL` is incorrect, you will experience login failures or "Invalid Redirect" errors.

## 📂 Project Structure
- `src/app`: Next.js App Router (Routes & APIs)
- `src/components`: UI components (Layout, Providers, etc.)
- `src/lib`: Shared utilities (Auth, Prisma client, Local storage)
- `prisma`: Database schema and migrations
- `public/uploads`: Local directory for issue attachments

## 🤝 Contributing
Feel free to fork the repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License
[MIT](https://choosealicense.com/licenses/mit/)
