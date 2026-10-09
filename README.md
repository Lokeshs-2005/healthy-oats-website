# Healthy Oats Website

A full-stack web application for a healthy oatmeal and fitness food brand.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

**Create `.env` in project root:**
```env
FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
```

**Create `client/.env`:**
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_API_URL=http://localhost:5000
```

### 3. Start Development Servers
```bash
npm run dev
```

- **Frontend:** http://localhost:5173/
- **Backend:** http://localhost:5000/

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication
- **Storage:** Cloudinary

## Features

### Public Features
- Product catalog with search and filters
- Product detail pages
- Mobile-responsive design
- WhatsApp integration
- Contact page

### Admin Features
- Secure admin dashboard
- Product management (CRUD)
- Category management
- Add-ons management
- Image uploads
- Site settings

## Project Structure

```
├── client/          # React frontend
├── server/          # Express backend
├── .env            # Server environment variables
├── client/.env     # Client environment variables
└── firestore.rules # Database security rules
```

## Setup Requirements

1. **Firebase Project**
   - Create project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Enable Authentication (Email/Password)
   - Download service account key
   - Deploy security rules from `firestore.rules`

2. **Cloudinary Account**
   - Sign up at [Cloudinary](https://cloudinary.com)
   - Get API credentials from dashboard

3. **Admin User**
   - Create first user in Firebase Authentication console
   - Use credentials to login at `/admin/login`

## Available Scripts

```bash
npm run dev          # Run both frontend and backend
npm run dev:client   # Run frontend only
npm run dev:server   # Run backend only
npm run build        # Build for production
npm test             # Run tests
```

## API Endpoints

### Public
- `GET /api/products` - Get all products
- `GET /api/categories` - Get categories
- `GET /api/addons` - Get add-ons
- `GET /api/site-settings` - Get settings

### Admin (Auth Required)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `POST /api/admin/upload-image` - Upload image

## Security

- Environment variables for secrets
- Firebase Authentication for admin
- Firestore security rules
- CORS configuration
- Input validation

## License

MIT License - See LICENSE file

## Documentation

All detailed documentation has been moved to `extra_files_to_delete/` folder and can be deleted after setup.

## Support

For issues or questions, refer to the code comments or Firebase/Cloudinary documentation.
