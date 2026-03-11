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
Create a `.env` file in the root directory:
```env
# Database (SQLite)
DATABASE_URL="file:./dev.db"

# NextAuth
AUTH_SECRET="your-secure-random-secret"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true
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

### Docker Deployment
The app is designed to be lightweight. When using Docker, ensure you mount a volume for the SQLite database and the uploads directory to persist data.

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
# IMPORTANT: Ensure /app/prisma/dev.db and /app/public/uploads are mounted as volumes
CMD ["npm", "run", "start"]
```

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
