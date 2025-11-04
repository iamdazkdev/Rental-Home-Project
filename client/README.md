# 🏠 Dream Nest - Client Application

> Modern React frontend for the Dream Nest rental home platform with beautiful glass morphism UI and comprehensive authentication system.

## ✨ Features

### 🎨 **Modern UI/UX**
- **Glass Morphism Design**: Beautiful translucent components with backdrop blur effects
- **Responsive Layout**: Seamlessly adapts to all screen sizes (mobile, tablet, desktop)
- **Smooth Animations**: Engaging hover effects and transitions
- **SCSS Architecture**: Modular styling with variables and mixins

### 🔐 **Authentication System**
- **User Registration**: Complete signup flow with profile image upload
- **Secure Login**: JWT-based authentication with comprehensive error handling
- **Form Validation**: Real-time validation with user-friendly error messages
- **Password Security**: Secure password requirements and validation

### 🛠 **State Management**
- **Redux Toolkit**: Modern Redux implementation with RTK Query
- **Redux Persist**: Automatic state persistence across browser sessions
- **User State**: Centralized user authentication and profile management

### 📱 **Pages & Components**
- **HomePage**: Landing page with property listings
- **LoginPage**: Modern authentication interface
- **RegisterPage**: User registration with file upload
- **Responsive Components**: Mobile-first design approach

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Server** running on `http://localhost:3001`

### Installation

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📜 Available Scripts

### `npm start`
- Launches the development server
- Opens [http://localhost:3000](http://localhost:3000) in your browser
- Hot reload enabled for instant development feedback
- Displays lint errors in console

### `npm test`
- Runs the test suite in interactive watch mode
- Automatically re-runs tests when files change
- Includes comprehensive testing utilities

### `npm run build`
- Creates optimized production build in `build/` folder
- Minifies and optimizes all assets
- Includes hashed filenames for cache busting
- Ready for deployment to any static hosting service

### `npm run eject` ⚠️
- **Warning**: This is irreversible!
- Exposes all configuration files for advanced customization
- Only use if you need full control over build configuration

## 🗂 Project Structure

```
client/
├── public/                 # Static assets
│   ├── assets/            # Images and media files
│   ├── index.html         # HTML template
│   └── favicon.ico        # Site favicon
├── src/
│   ├── pages/             # Page components
│   │   ├── auth/          # Authentication pages
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   └── home/          # Home page
│   │       └── HomePage.jsx
│   ├── redux/             # State management
│   │   ├── store.js       # Redux store configuration
│   │   └── state.js       # User slice and actions
│   ├── styles/            # SCSS stylesheets
│   │   ├── variables.scss # Global variables
│   │   ├── breakpoints.scss # Responsive breakpoints
│   │   ├── Login.scss     # Login page styles
│   │   ├── Register.scss  # Register page styles
│   │   └── [other].scss   # Component-specific styles
│   ├── App.js             # Main application component
│   ├── index.js           # Application entry point
│   └── reportWebVitals.js # Performance monitoring
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🔧 Technology Stack

### **Core Technologies**
- **React 19.2.0** - Latest React with concurrent features
- **React Router 7.9.5** - Client-side routing
- **SCSS 1.93.3** - Advanced CSS preprocessing

### **State Management**
- **Redux Toolkit 2.10.0** - Modern Redux implementation
- **React Redux 9.2.0** - React bindings for Redux
- **Redux Persist 6.0.0** - State persistence

### **UI Framework**
- **Material-UI 7.3.4** - React component library
- **Emotion** - CSS-in-JS styling solution

### **Development Tools**
- **React Scripts 5.0.1** - Build toolchain
- **Testing Library** - React testing utilities
- **Web Vitals** - Performance monitoring

## 🎨 Design System

### **Color Palette**
- **Primary**: Gradient blues and purples (`#764ba2` to `#667eea`)
- **Accent**: Pink-red (`#f8395a`)
- **Neutral**: Various gray shades for text and backgrounds

### **Typography**
- **Headings**: Bold, modern fonts with proper hierarchy
- **Body Text**: Clean, readable fonts optimized for web

### **Glass Morphism Effects**
- **Backdrop Blur**: `blur(20px)` for glass effect
- **Transparency**: `rgba(255, 255, 255, 0.95)` for subtle opacity
- **Borders**: Subtle white borders for definition

## 🌐 API Integration

### **Authentication Endpoints**
- **POST** `/auth/register` - User registration
- **POST** `/auth/login` - User authentication

### **Request Configuration**
- **Base URL**: `http://localhost:3001`
- **Headers**: `Content-Type: application/json`
- **Authentication**: JWT tokens stored in localStorage

## 🔒 Security Features

- **Form Validation**: Client-side input validation
- **Password Requirements**: Strong password enforcement
- **File Upload Security**: Image type restrictions
- **XSS Protection**: Proper data sanitization
- **CORS Handling**: Cross-origin request management

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: `< 768px`
- **Tablet**: `768px - 1024px`
- **Desktop**: `> 1024px`

### **Mobile Optimizations**
- Touch-friendly interface elements
- Optimized font sizes and spacing
- Responsive image handling
- Mobile-first CSS approach

## 🚀 Deployment

### **Production Build**
```bash
npm run build
```

### **Deployment Options**
- **Netlify**: Drag and drop `build/` folder
- **Vercel**: Connect GitHub repository
- **GitHub Pages**: Use `gh-pages` package
- **AWS S3**: Static website hosting

## 🐛 Troubleshooting

### **Common Issues**

1. **Server Connection Error**
   - Ensure server is running on port 3001
   - Check CORS configuration
   - Verify API endpoints

2. **Redux Store Issues**
   - Clear localStorage: `localStorage.clear()`
   - Check Redux DevTools for state inspection

3. **Build Failures**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check for TypeScript errors
   - Verify all imports are correct

## 📚 Learn More

- [React Documentation](https://reactjs.org/)
- [Redux Toolkit Guide](https://redux-toolkit.js.org/)
- [Material-UI Components](https://mui.com/)
- [SCSS Documentation](https://sass-lang.com/)
- [React Router Guide](https://reactrouter.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Built with ❤️ by iamdazkdev** | Dream Nest © 2025
