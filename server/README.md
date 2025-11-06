# Rental Home Project - Server

Backend API server for the Rental Home Project built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd rental-home-project/server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` file with your actual values.

4. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:3001` (or your configured PORT).

## 📋 Environment Setup

### Required Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
MONGO_URL=mongodb://localhost:27017/rental-home-db
DB_NAME=rental-home-db

# Server
PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### MongoDB Setup Options

#### Option 1: Local MongoDB

1. Install MongoDB on your machine
2. Use connection string: `mongodb://localhost:27017/rental-home-db`

#### Option 2: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string and update `MONGO_URL`

## 🛠️ API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login

### Listings

- `GET /listing` - Get all listings
- `POST /listing/create` - Create new listing
- `GET /listing/:id` - Get listing by ID
- `PUT /listing/:id` - Update listing
- `DELETE /listing/:id` - Delete listing

## 📁 Project Structure

```
server/
├── constants/          # App constants
├── models/            # MongoDB models
├── routes/            # API routes
├── public/            # Static files
│   └── uploads/       # Uploaded images
├── .env.example       # Environment template
├── .gitignore         # Git ignore rules
├── index.js           # App entry point
└── package.json       # Dependencies
```

## 🔧 Development

### Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
```

### File Upload

- Images are stored in `public/uploads/`
- Maximum file size: 50MB
- Allowed formats: JPEG, PNG, WebP, GIF

## 🚨 Common Issues

### Port Already in Use

If port 3001 is busy, change `PORT` in `.env` file.

### Database Connection Failed

- Check MongoDB is running
- Verify `MONGO_URL` in `.env`
- Ensure database name exists

### File Upload Errors

- Check `public/uploads/` directory exists
- Verify file permissions
- Check file size limits

## 🔒 Security Notes

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS
- [ ] Enable CORS for specific domains only
- [ ] Set up rate limiting
- [ ] Use environment variables for all secrets

### Generate Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📖 Additional Configuration

### Email Service (Optional)

For features like password reset:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Cloud Storage (Optional)

For Cloudinary integration:

```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🐛 Debugging

### Enable Debug Logs

```bash
DEBUG=rental-app:* npm run dev
```

### Check Server Health

```bash
curl http://localhost:3001/
```

## 📞 Support

If you encounter issues:

1. Check this README
2. Verify environment variables
3. Check server logs
4. Ensure database is running

---

**Happy coding! 🎉**
