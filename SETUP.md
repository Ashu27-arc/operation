# Task Management App - Setup Instructions

## Prerequisites
- Node.js installed
- MongoDB running on localhost:27017
- Expo CLI installed

## Starting the Application

### 1. Start MongoDB
Make sure MongoDB is running on port 27017:
```bash
# Check if MongoDB is running
netstat -ano | findstr :27017
```

### 2. Start Backend Server
Open a terminal and navigate to the backend folder:
```bash
cd E:\crud\operations-backend
npm start
```

**If port 5000 is already in use, use the restart script:**
```bash
npm run restart
```

This will automatically kill any existing process on port 5000 and start the server.

The backend will start on `http://localhost:5000`

### 3. Start Frontend App
Open another terminal and navigate to the frontend folder:
```bash
cd E:\crud\operation
npm start
```

This will start the Expo development server.

## Troubleshooting

### Network Error / Backend Not Accessible

1. **Check if backend is running:**
   ```bash
   netstat -ano | findstr :5000
   ```

2. **If port 5000 is in use by another process:**
   ```bash
   # Find the process using port 5000
   netstat -ano | findstr :5000
   
   # Kill the process (replace PID with actual process ID)
   taskkill /F /PID <PID>
   
   # Restart backend
   cd E:\crud\operations-backend
   npm start
   ```

3. **For Android Emulator:**
   The app is configured to use `http://10.0.2.2:5000/api` which is the Android emulator's localhost equivalent.

4. **For iOS Simulator:**
   Use `http://localhost:5000/api`

5. **For Web:**
   Use `http://localhost:5000/api`

### Environment Variables

Frontend (`.env`):
```
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

Backend (`.env`):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskmanagement
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d
```

## API Endpoints

### Auth
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user

### Tasks
- GET `/api/tasks` - Get all tasks for logged in user
- GET `/api/tasks/:id` - Get single task
- POST `/api/tasks` - Create new task
- PUT `/api/tasks/:id` - Update task
- DELETE `/api/tasks/:id` - Delete task

## Default User
Register a new user through the app, or use the API directly.

## Development Tips

1. Always start MongoDB first
2. Start backend server before frontend
3. Check terminal outputs for errors
4. If you change environment variables, restart the servers
