# Authentication Setup Guide

## Step-by-Step Process to Get Started

### Step 1: Environment Setup

Create a `.env.local` file in your project root with these variables:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string_here

# JWT Secret (generate a random strong string)
JWT_SECRET=your_super_secret_jwt_key_here

# Setup Key (for first-time Super Admin creation)
SETUP_KEY=your_strong_setup_key_here

# Cloudinary (optional, for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 2: Get MongoDB Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password
7. Paste it into `MONGODB_URI` in your `.env.local`

### Step 3: Generate JWT Secret

Run this command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as `JWT_SECRET` in your `.env.local`

### Step 4: Set Setup Key

Create a strong password for the setup process and add it as `SETUP_KEY` in your `.env.local`

Example:
```env
SETUP_KEY=MyStrongSetupKey2025!@#
```

### Step 5: Install Dependencies

```bash
npm install
```

### Step 6: Create First Super Admin

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit: `http://localhost:3000/auth/setup`

3. Enter:
   - Setup Key (the one you set in `.env.local`)
   - Your full name
   - Your email
   - Your password

4. Click "Create Super Admin"

5. You'll be redirected to the Super Admin dashboard

### Step 7: Create Other Roles

Now that you have a Super Admin account, you can create other users:

**From Super Admin Dashboard:**
1. Create Tenants (operators)
2. Tenants can create Admins
3. Tenants/Admins can create Agents
4. Agents can create Sub-Agents
5. Sub-Agents/Agents can create Players

**Or via Authentication Page:**
- Players can self-register at `/auth` (Register tab)
- Players can join brands using referral codes (Join Brand tab)

### Step 8: Login

Visit `/auth` and:
1. Select your role from the dropdown (Player, Agent, Sub-Agent, Admin, Tenant, Super Admin)
2. Enter your email and password
3. Click "Log In"

You'll be redirected to the appropriate dashboard based on your role.

## Role Hierarchy

```
Super Admin (System Owner)
    ↓
Tenant/Operator (Casino Owner)
    ↓
Admin (Casino Staff)
    ↓
Agent (Shop Owner)
    ↓
Sub-Agent (Shop Staff)
    ↓
Player (End User)
```

## Dashboard URLs

- Super Admin: `/s/dashboard`
- Tenant: `/t/dashboard`
- Admin: `/admin/dashboard`
- Agent: `/a/dashboard`
- Sub-Agent: `/sa/dashboard`
- Player: `/p/dashboard`

## Troubleshooting

### "Setup key invalid"
Make sure the SETUP_KEY in your `.env.local` matches what you enter on the setup page.

### "Super Admin already exists"
You can only create one Super Admin via the setup page. Use the normal login at `/auth` instead.

### "Connection error"
Check that your MONGODB_URI is correct and your database is accessible.

### Can't connect to MongoDB
Make sure you've whitelisted your IP address in MongoDB Atlas Network Access settings.

## Security Notes

1. **Never commit `.env.local`** to version control
2. **Use strong passwords** for all accounts
3. **Keep your SETUP_KEY secret** - delete it from `.env.local` after initial setup if you want
4. **Use HTTPS in production**
5. **The `/auth/setup` route checks if a Super Admin exists** - it won't allow duplicate creation

## Next Steps

After authentication is working:
1. Test creating users of different roles
2. Verify role-based dashboard access
3. Start connecting other features to the backend
4. Test the hierarchy (e.g., Agent creating Sub-Agents, etc.)
