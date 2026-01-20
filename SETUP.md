# Goal Betting Authentication Setup Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (optional, for image uploads)

## Environment Variables Setup

1. Create a `.env.local` file in the root directory
2. Copy contents from `.env.local.example`
3. Update the following variables:

### Required Variables

#### MongoDB Connection
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/goal-betting?retryWrites=true&w=majority
```
- Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a new cluster (free tier available)
- Get your connection string from "Connect" > "Connect your application"
- Replace `username`, `password`, and `cluster` with your details

#### JWT Secret
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```
- Generate a strong random string (at least 32 characters)
- You can use: `openssl rand -base64 32` in terminal
- Keep this secret and never commit to version control

### Optional Variables

#### Cloudinary (For Avatar Uploads)
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```
- Sign up at [Cloudinary](https://cloudinary.com)
- Go to Dashboard to find your credentials
- Free tier: 25GB storage, 25GB bandwidth/month

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Testing Authentication

### Create Test Accounts

You can signup with any role through the API or frontend:

**Super Admin:**
- Go to `/s/login` and click "Create Account"
- Use role: `superadmin`

**Tenant Admin:**
- Go to `/t/login` and click "Create Account"
- Use role: `tenant_admin`

**Admin:**
- Go to `/admin/login` and click "Create Account"
- Use role: `admin`

**Agent:**
- Go to `/a/login` or `/auth/login?role=agent`
- Use role: `agent`

**Sub-Agent:**
- Go to `/sa/login`
- Use role: `sub_agent`

**Player:**
- Go to `/auth/signup` or `/auth/login?role=player`
- Use role: `player`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login to account
- `GET /api/auth/me` - Get current user (requires Bearer token)
- `POST /api/auth/logout` - Logout

### Request Examples

**Signup:**
```json
POST /api/auth/signup
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "player"
}
```

**Login:**
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123",
  "role": "player"
}
```

**Get Current User:**
```
GET /api/auth/me
Headers: {
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

## Database Schema

### User Model Fields
- `fullName` - User's full name
- `email` - Unique email address
- `phone` - Phone number
- `password` - Hashed password (bcrypt)
- `role` - User role (player, agent, sub_agent, admin, tenant_admin, superadmin)
- `balance` - Account balance
- `avatar` - Avatar URL
- `isActive` - Account status
- `parentAgentId` - For sub-agents (references parent agent)
- `tenantId` - For admins (references tenant)
- `commissionRate` - Agent commission percentage
- `profitPercentage` - Agent profit share
- `permissions` - Admin permissions object
- `lastLogin` - Last login timestamp
- `createdAt` - Account creation date
- `updatedAt` - Last update date

## Security Features

- Passwords hashed with bcrypt (10 rounds)
- JWT-based authentication
- Token expiration (7 days default)
- Role-based access control
- Protected API routes
- Input validation
- MongoDB injection prevention

## Troubleshooting

### MongoDB Connection Issues
- Verify your IP is whitelisted in MongoDB Atlas
- Check connection string format
- Ensure database user has proper permissions

### JWT Token Issues
- Make sure JWT_SECRET is set
- Check token in localStorage/cookies
- Verify token hasn't expired

### API Errors
- Check browser console for detailed errors
- Verify API endpoints are correct
- Check request headers include Bearer token

## Production Deployment

1. Update environment variables for production
2. Use strong JWT_SECRET (32+ characters)
3. Enable MongoDB authentication
4. Set up proper CORS policies
5. Use HTTPS for all API calls
6. Implement rate limiting
7. Add monitoring and logging

## Support

For issues or questions:
- Check the console for error messages
- Verify all environment variables are set
- Test API endpoints with Postman/Insomnia
- Review MongoDB connection status
