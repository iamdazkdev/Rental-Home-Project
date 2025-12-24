# 🏠 Rento - Rental Home Platform

A modern, full-stack rental home platform built with React.js, Node.js, and Flutter. Rento allows users to discover, list, and manage rental properties with a beautiful, responsive interface across web and mobile.

![Rento](https://img.shields.io/badge/Rento-Rental%20Platform-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-success?style=for-the-badge)
![License](https://img.shields.io/badge/license-ISC-green?style=for-the-badge)

## ✨ Features

### 🔐 **Authentication System**

- **User Registration** with profile image upload
- **Secure Login** with JWT tokens
- **Password Validation** with strength requirements
- **Email Validation** and duplicate prevention
- **Modern Glass Morphism UI** design

### 🏡 **Property Management**

- Browse rental properties
- Advanced search and filtering
- Property listing creation
- Image upload for properties
- Detailed property views

### 💻 **Modern UI/UX**

- **Responsive Design** for all devices
- **Glass Morphism** design aesthetic
- **Smooth Animations** and transitions
- **Loading States** and error handling
- **Dark/Light Theme** support

### 🔒 **Security Features**

- **JWT Authentication** with 7-day expiration
- **Password Hashing** with bcrypt (12 salt rounds)
- **File Validation** for image uploads (5MB limit)
- **Input Sanitization** and validation
- **CORS Protection** enabled

## 🛠️ Tech Stack

### **Frontend**

- ![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat&logo=react&logoColor=white)
- ![React Router](https://img.shields.io/badge/React%20Router-7.9.5-CA4245?style=flat&logo=react-router&logoColor=white)
- ![Sass](https://img.shields.io/badge/Sass-1.93.3-CC6699?style=flat&logo=sass&logoColor=white)
- ![Material-UI](https://img.shields.io/badge/Material--UI-7.3.4-0081CB?style=flat&logo=mui&logoColor=white)

### **Backend**

- ![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat&logo=node.js&logoColor=white)
- ![Express.js](https://img.shields.io/badge/Express.js-5.1.0-000000?style=flat&logo=express&logoColor=white)
- ![MongoDB](https://img.shields.io/badge/MongoDB-8.19.2-47A248?style=flat&logo=mongodb&logoColor=white)
- ![JWT](https://img.shields.io/badge/JWT-9.0.2-000000?style=flat&logo=json-web-tokens&logoColor=white)

### **Additional Tools**

- ![Multer](https://img.shields.io/badge/Multer-File%20Upload-orange?style=flat)
- ![bcryptjs](https://img.shields.io/badge/bcryptjs-Password%20Hashing-red?style=flat)
- ![CORS](https://img.shields.io/badge/CORS-Security-blue?style=flat)
- ![dotenv](https://img.shields.io/badge/dotenv-Environment-yellow?style=flat)

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/iamdazkdev/Rental-Home-Project.git
   cd Rental-Home-Project
   ```

2. **Install Server Dependencies**

   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**

   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**

   Create a `.env` file in the `server` directory:

   ```env
   MONGO_URL=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   NODE_ENV=development
   ```

5. **Start the Development Servers**

   **Terminal 1 - Backend Server:**

   ```bash
   cd server
   npm start
   ```

   **Terminal 2 - Frontend Client:**

   ```bash
   cd client
   npm start
   ```

6. **Access the Application**
   - **Frontend:** <http://localhost:3000>
   - **Backend API:** <http://localhost:3001>

## 📁 Project Structure

```
Rental-Home-Project/
├── client/                          # React Frontend
│   ├── public/
│   │   ├── assets/                  # Static images and icons
│   │   └── index.html
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx    # Login page
│   │   │   │   └── RegisterPage.jsx # Registration page
│   │   │   └── HomePage.jsx         # Home page
│   │   ├── styles/                  # SCSS stylesheets
│   │   │   ├── Login.scss
│   │   │   ├── Register.scss
│   │   │   ├── variables.scss       # Color variables
│   │   │   └── breakpoints.scss     # Media queries
│   │   ├── App.js                   # Main App component
│   │   └── index.js                 # Entry point
│   └── package.json
├── server/                          # Node.js Backend
│   ├── models/
│   │   └── User.js                  # User model
│   ├── routes/
│   │   └── auth.js                  # Authentication routes
│   ├── public/
│   │   └── uploads/                 # File upload directory
│   ├── .env                         # Environment variables
│   ├── index.js                     # Server entry point
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Register new user | `firstName`, `lastName`, `email`, `password`, `confirmPassword`, `profileImage` |
| `POST` | `/auth/login` | User login | `email`, `password` |

### Example API Usage

#### Register User

```javascript
const formData = new FormData();
formData.append('firstName', 'John');
formData.append('lastName', 'Doe');
formData.append('email', 'john@example.com');
formData.append('password', 'SecurePass123');
formData.append('confirmPassword', 'SecurePass123');
formData.append('profileImage', fileObject);

fetch('http://localhost:3001/auth/register', {
  method: 'POST',
  body: formData,
});
```

#### Login User

```javascript
fetch('http://localhost:3001/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123',
  }),
});
```

## 🎨 Design System

### **Color Palette**

- **Primary Pink:** `#F8395A` - Main brand color
- **Primary Blue:** `#24355A` - Text and accents
- **Light Grey:** `#F7F8F8` - Backgrounds
- **Grey:** `#bdb9b9` - Secondary text
- **Dark Grey:** `#969393` - Muted text

### **Typography**

- **Primary Font:** System fonts with fallbacks
- **Headings:** Bold (700), letter-spacing optimized
- **Body Text:** Regular (400) and Medium (500)

### **Components**

- **Glass Morphism Cards** with backdrop blur
- **Gradient Backgrounds** for visual depth
- **Smooth Animations** with CSS transitions
- **Responsive Grid System** for all screen sizes

## 🔧 Development

### **Available Scripts**

#### Client (Frontend)

```bash
npm start          # Start development server
npm build          # Build for production
npm test           # Run tests
npm eject          # Eject from Create React App
```

#### Server (Backend)

```bash
npm start          # Start server with nodemon
npm test           # Run tests (placeholder)
```

### **Environment Variables**

Create a `.env` file in the server directory:

```env
# Database
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/rental-home-db

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Environment
NODE_ENV=development
```

## 📱 Mobile Responsiveness

The application is fully responsive with breakpoints:

- **Mobile:** < 580px
- **Tablet:** 580px - 1000px  
- **Desktop:** > 1000px

## 🛡️ Security Features

- **JWT Tokens** with 7-day expiration
- **Password Hashing** with bcrypt (12 salt rounds)
- **Input Validation** and sanitization
- **File Upload Security** with type and size limits
- **CORS Protection** for cross-origin requests
- **Environment Variables** for sensitive data

## 🚀 Deployment

### **Frontend (Vercel/Netlify)**

```bash
cd client
npm run build
# Deploy the build folder
```

### **Backend (Heroku/Railway)**

```bash
cd server
# Set environment variables in hosting platform
# Deploy with your preferred service
```

### **Database (MongoDB Atlas)**

- Create a MongoDB Atlas cluster
- Get connection string
- Update `MONGO_URL` in environment variables

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**iamdazkdev**

- GitHub: [@iamdazkdev](https://github.com/iamdazkdev)
- Project: [Rental-Home-Project](https://github.com/iamdazkdev/Rental-Home-Project)

## 🙏 Acknowledgments

- React.js community for excellent documentation
- Material-UI for beautiful components
- MongoDB for flexible database solutions
- Express.js for robust backend framework

---

<div align="center">
  <p>Made with ❤️ by iamdazkdev</p>
  <p>Rento - Find Your Perfect Home</p>
</div>
