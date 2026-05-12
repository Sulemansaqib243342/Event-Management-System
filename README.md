# EventSphere - Full-Stack Event Management System

EventSphere is a professional, secure, and highly responsive event management platform designed to streamline the process of organizing, managing, and attending events. 

Built with a modern tech stack and a focus on premium user experience, it features real-time analytics, secure authentication, and a robust administrative dashboard.

## 🚀 Key Features

### For Attendees
- **Event Discovery**: Browse and search for upcoming events with categories and filters.
- **Secure Registration**: Register for events with real-time seat availability checks.
- **Resources Hub**: Access downloadable event guides, planning templates, and marketing kits.
- **Responsive Design**: Optimized for mobile, tablet, and desktop viewing.

### For Administrators
- **Analytics Dashboard**: Real-time stats on total revenue, attendees, and registrations.
- **Event Management**: Create, edit, and delete events with a specialized administrative interface.
- **Inline Editing**: Quickly update event titles directly from the management table.
- **Financial Reporting**: Detailed revenue breakdowns per event.
- **Attendee Management**: Full visibility into user registration data and contact information.

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS, JavaScript (ES6+), Bootstrap 5
- **Backend**: Node.js, Express.js
- **Database**: Oracle 19c (Relational Schema)
- **Authentication**: JWT (JSON Web Tokens) with secure cookie/local storage management
- **Aesthetics**: Glassmorphism, Modern Typography (Inter), FontAwesome 6

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/Event-Management-System.git
   ```

2. **Install Dependencies**:
   ```bash
   # Root directory
   npm install
   # Backend directory
   cd backend
   npm install
   ```

3. **Database Configuration**:
   - Ensure Oracle 19c is installed and running.
   - Configure your `.env` file with your Oracle credentials:
     ```env
     DB_USER=your_user
     DB_PASSWORD=your_password
     DB_CONNECTION_STRING=localhost:1521/xe
     JWT_SECRET=your_secret
     ```

4. **Run the Application**:
   ```bash
   # From the backend directory
   npm run dev
   ```

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Created with ❤️ by the EventSphere Team*
