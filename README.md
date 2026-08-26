# 🚀 Ratul Shee — Full-Stack MERN Portfolio & Admin CMS

An ultra-modern, award-winning developer portfolio built on the **MERN Stack** (MongoDB Atlas, Express.js, Vanilla/React DOM, Node.js) featuring obsidian glassmorphism aesthetics, multi-theme accent switching, Web Audio synthesizer effects, interactive command terminal, MERN architecture pipeline simulator, automated Gmail notification dispatch, and a dedicated **Admin Portal (`/admin`)**.

---

## 🌟 Production Features

- ☁️ **Cloud Database:** Integrated with **MongoDB Atlas** Cloud Cluster (`Cluster0`).
- 📧 **Automated Gmail SMTP Integration:**
  - Auto-forwards copies of all visitor inquiries directly to your Gmail (`ratulshee6@gmail.com`).
  - Auto-sends confirmation receipts to visitors.
  - Built-in **Email Composer & Direct Reply** modal inside the Admin Panel.
- 🎨 **Multi-Theme Engine:** 4 futuristic themes (Emerald, Violet, Cyan, Amber) with instant persistence.
- 🎉 **Canvas Confetti Cannon:** Celebratory particle physics on message sends and CLI triggers.
- 📄 **Interactive Developer Resume:** Full-screen printable CV viewer modal.
- 🔒 **Secure Admin CMS (`/admin`):** Full CRUD for projects, skills, education, profile metadata, and visitor inquiries.
- 📦 **One-Click JSON Backup & Restore:** Snapshot and restore your entire database with 1 click.

---

## ⚡ Quick Start (Local Production Run)

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Active Internet Connection** (for MongoDB Atlas and Gmail SMTP)

### 2. Start the Server
```bash
npm start
```
*(Or use `npm run dev` for auto-reloading in development mode)*

### 3. Open in Browser
- 🌐 **Public Portfolio:** [http://localhost:5000](http://localhost:5000)
- 🔒 **Admin Portal:** [http://localhost:5000/admin](http://localhost:5000/admin)

---

## 🔑 Admin Credentials

- **Username:** `admin`
- **Password:** `admin123`
*(Can be updated anytime inside the Admin Portal under Settings)*

---

## 🌍 Cloud Deployment (Render / Railway / VPS)

To deploy to production cloud hosting (e.g., **Render**, **Railway**, **DigitalOcean**, or **AWS**):

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Production release: MERN Portfolio with MongoDB Atlas and Gmail SMTP"
   git branch -M main
   git remote add origin https://github.com/Ratul-Shee/portfolio.git
   git push -u origin main
   ```
2. **Deploy on Render / Railway**:
   - Create a new **Web Service** pointing to your repository.
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Set Environment Variables in Hosting Dashboard:**
     - `PORT` = `5000` (or leave default provided by host)
     - `MONGO_URI` = `mongodb+srv://ratulshee6_db_user:MFTfHZjEbKo6Xi5N@cluster0.7bmlhok.mongodb.net/portfolio_db?retryWrites=true&w=majority`
     - `JWT_SECRET` = `ratul_shee_super_secret_jwt_key_2026_dev`
     - `GMAIL_USER` = `ratulshee6@gmail.com`
     - `GMAIL_APP_PASSWORD` = `okzvewmksrwsdnlq`
     - `ADMIN_ALERT_EMAIL` = `ratulshee6@gmail.com`
