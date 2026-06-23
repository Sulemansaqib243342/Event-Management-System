# 🎯 EventSphere — Full-Stack Event Management System

A professional, secure, and feature-rich event management platform built with Node.js, Express, and Oracle 19c. EventSphere streamlines the complete lifecycle of event organization — from creation and discovery to registration and analytics.

🔗 **GitHub:** [Sulemansaqib243342/Event-Management-System](https://github.com/Sulemansaqib243342/Event-Management-System)

---

## ✨ Features

### 👥 For Attendees
- Browse and search events with category filters
- Secure registration with real-time seat availability
- Responsive design across mobile, tablet, and desktop

### 🛠️ For Administrators
- Real-time analytics dashboard — revenue, attendees, registrations
- Full event CRUD (Create, Read, Update, Delete)
- Inline event title editing from management table
- Detailed financial reporting per event
- Complete attendee management with contact data

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+), Bootstrap 5 |
| Backend | Node.js, Express.js |
| Database | Oracle 19c (Relational Schema via OracleDB) |
| Authentication | JWT (JSON Web Tokens) + bcryptjs password hashing |
| Validation | express-validator |
| Dev Tools | Nodemon, dotenv |

---

## 📂 Project Structure

```
Event-Management-System/
│
├── backend/
│   ├── controllers/
│   │   ├── authController.js        # Register, login, JWT issuance
│   │   ├── eventController.js       # Event CRUD operations
│   │   └── registrationController.js
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT verification
│   ├── config/
│   │   └── db.js                    # OracleDB connection setup
│   ├── routes/                      # Express route definitions
│   ├── .env                         # Environment variables
│   └── server.js                    # Entry point
│
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

---

## ⚙️ Installation & Setup

**1. Clone the repository**
```bash
git clone https://github.com/Sulemansaqib243342/Event-Management-System.git
cd Event-Management-System
```

**2. Install backend dependencies**
```bash
cd backend
npm install
```

**3. Configure environment variables**

Create a `.env` file in the `/backend` directory:
```env
DB_USER=your_oracle_user
DB_PASSWORD=your_oracle_password
DB_CONNECTION_STRING=localhost:1521/xe
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

> ⚠️ Requires Oracle 19c installed and running locally.

**4. Run the development server**
```bash
npm run dev
```

The server starts at `http://localhost:5000`

---

## 🔐 API Endpoints

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | ❌ |
| POST | `/api/auth/login` | Login and receive JWT | ❌ |
| GET | `/api/events` | Get all events (with search) | ❌ |
| GET | `/api/events/:id` | Get single event | ❌ |
| POST | `/api/events` | Create new event | ✅ |
| PUT | `/api/events/:id` | Update event | ✅ |
| DELETE | `/api/events/:id` | Delete event | ✅ |
| POST | `/api/registrations` | Register for an event | ✅ |

---

## 💡 Key Concepts Demonstrated

- RESTful API design with Express.js
- JWT-based stateless authentication
- Password hashing with bcryptjs
- Oracle relational database with OracleDB driver
- Input validation and sanitization with express-validator
- MVC architecture (Models, Controllers, Routes)
- CORS configuration for frontend-backend separation
- Environment-based configuration with dotenv

---

## 👨‍💻 Author

**Suleman Saqib**
BS Information Technology — Air University, Islamabad
[LinkedIn](https://www.linkedin.com/in/sulemansaqib/) • [GitHub](https://github.com/Sulemansaqib243342)
