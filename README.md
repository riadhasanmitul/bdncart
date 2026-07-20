# BDNCart 🛒
BDNCart (formerly ShopWave) is a premium, full-stack enterprise e-commerce platform built with modern web technologies. It features a robust multi-role architecture, sleek and dynamic user interfaces, and a scalable backend.
## 🚀 Features
- **Multi-Role Architecture:** Dedicated flows for **Customers**, **Sellers**, and **Admins**.
  - *Customers*: Browse products, manage carts, checkout, and view order history.
  - *Sellers*: Full dashboard to manage inventory, create products, upload images, and edit/delete listings.
  - *Admins*: Complete platform oversight, user management, and moderation.
- **Dynamic UI/UX:** Built with React and Tailwind CSS v4, featuring a beautiful glassmorphism aesthetic, smooth micro-animations, and full responsiveness.
- **Dark Mode Support:** Integrated light and dark mode toggles respecting user and system preferences.
- **Secure Authentication:** JWT-based authentication with secure cookie storage, refresh tokens, and role-based access control.
- **Product Management:** Complete CRUD capabilities for products, dynamic image rendering, and variant management.
- **Order Integrity:** Safe product deletion ensuring historical orders are never corrupted (`ON DELETE SET NULL`).
## 🛠 Tech Stack
**Frontend:**
- React (Vite)
- TypeScript
- Tailwind CSS v4
- React Router DOM
- Axios
**Backend:**
- Node.js & Express.js
- PostgreSQL (Primary Database)
- Redis (Caching & Rate Limiting)
- JWT (Authentication)
- Winston (Logging)
## 📦 Getting Started
### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Redis (Running locally or via Docker)
### 1. Clone the repository
```bash
git clone <your-repo-url>
cd shopwave
```
*(Note: The root directory is named `shopwave`, but the project is BDNCart)*
### 2. Backend Setup
```bash
cd backend
npm install
```
Configure your environment variables by copying the example file:
```bash
cp .env.example .env
```
Ensure your PostgreSQL instance is running and execute the following SQL to set up the database and user:
```sql
CREATE DATABASE bdncart_db;
CREATE ROLE bdncart_user WITH LOGIN PASSWORD 'bdncart_pass';
GRANT ALL PRIVILEGES ON DATABASE bdncart_db TO bdncart_user;
```
Run the database schema initialization scripts (if available in `src/scripts`), and start the backend:
```bash
npm run dev
```
### 3. Frontend Setup
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```
The frontend will run at `http://localhost:5173` and the backend at `http://localhost:3000`.
## 🛡 License
This project is licensed under the MIT License.
