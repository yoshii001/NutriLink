# NutriLink

A comprehensive meal management system for schools that connects administrators, principals, teachers, donors, and parents to ensure proper nutrition for students.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [User Roles & Functionalities](#user-roles--functionalities)
- [Database Structure](#database-structure)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Navigation Architecture](#navigation-architecture)

## Overview

NutriLink is a React Native mobile application built with Expo that streamlines meal management in schools. The system provides role-based access to various features including meal tracking, inventory management, donation management, and feedback collection.

## Technology Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Navigation**: Expo Router (File-based routing)
- **Authentication**: Firebase Authentication
- **Database**: Firebase Realtime Database
- **State Management**: React Context API
- **UI Components**: Custom components with React Native
- **Icons**: Lucide React Native
- **Storage**: AsyncStorage for local data

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo Go app (for mobile testing)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nutrilink
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` (if available)
   - Add your Firebase and Supabase configuration values

4. Start the development server:
```bash
npm run dev
```

5. Run the app:
   - Press `w` for web browser
   - Scan QR code with Expo Go app for mobile
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Email/Password authentication
3. Enable Realtime Database
4. Set up database security rules for role-based access
5. Add Firebase configuration to `.env` file

## Project Structure

```
nutrilink/
├── app/                          # All routes and screens
│   ├── _layout.tsx              # Root layout with AuthProvider
│   ├── index.tsx                # Entry point with routing logic
│   ├── onboarding.tsx           # First-time user onboarding
│   ├── login.tsx                # Login screen
│   ├── profile.tsx              # User profile management
│   ├── settings.tsx             # App settings
│   ├── request-school.tsx       # Principal school registration
│   ├── request-donation.tsx     # Donation request creation
│   ├── manage-teachers.tsx      # Teacher management (Principal)
│   ├── donor-list.tsx           # List of available donation requests
│   ├── meal-plans.tsx           # Meal plan creation/management
│   ├── admin-schools.tsx        # School approval (Admin)
│   ├── admin-users.tsx          # User management (Admin)
│   ├── admin-donations.tsx      # Donation oversight (Admin)
│   ├── principal-dashboard.tsx  # Principal overview
│   ├── +not-found.tsx           # 404 error page
│   └── (tabs)/                  # Tab-based navigation
│       ├── _layout.tsx          # Tab configuration with role-based tabs
│       ├── dashboard.tsx        # Main dashboard (all roles)
│       ├── tracking.tsx         # Meal tracking (Teacher)
│       ├── history.tsx          # Meal history (Teacher)
│       ├── inventory.tsx        # Inventory management (Admin, Principal)
│       ├── menu.tsx             # Menu planning (Principal)
│       ├── donations.tsx        # Donations view (Admin, Donor)
│       ├── feedback.tsx         # Feedback submission (Parent, Admin)
│       ├── reports.tsx          # Reports generation (Admin, Principal)
│       └── admin-dashboard.tsx  # Admin control panel
│
├── components/                  # Reusable UI components
│   ├── LoadingScreen.tsx       # Loading indicator
│   └── SettingsMenu.tsx        # Settings menu component
│
├── contexts/                    # React Context providers
│   └── AuthContext.tsx         # Authentication state management
│
├── services/                    # Business logic and API calls
│   └── firebase/               # Firebase service modules
│       ├── authService.ts           # Authentication operations
│       ├── mealTrackingService.ts   # Meal tracking CRUD
│       ├── inventoryService.ts      # Inventory management
│       ├── mealPlanService.ts       # Meal planning operations
│       ├── donationService.ts       # Donation management
│       ├── donationRequestService.ts # Donation request handling
│       ├── feedbackService.ts       # Feedback operations
│       ├── reportService.ts         # Report generation
│       ├── schoolService.ts         # School management
│       ├── teacherService.ts        # Teacher management
│       └── adminService.ts          # Admin operations
│
├── config/                      # Configuration files
│   └── firebase.ts             # Firebase initialization
│
├── constants/                   # App constants
│   └── theme.ts                # Theme colors and styling
│
├── types/                       # TypeScript type definitions
│   └── index.ts                # All interface definitions
│
├── hooks/                       # Custom React hooks
│   └── useFrameworkReady.ts    # Framework initialization hook
│
├── assets/                      # Static assets
│   └── images/                 # Images and icons
│
├── .env                         # Environment variables
├── app.json                     # Expo configuration
├── package.json                 # Dependencies and scripts
└── tsconfig.json               # TypeScript configuration
```

## User Roles & Functionalities

### 1. Admin
The system administrator with full access to all features.

**Capabilities:**
- View comprehensive dashboard with system-wide statistics
- Approve or reject school registration requests
- Manage all users across the system
- Oversee all donations and transactions
- Review and respond to feedback from parents
- Generate and view detailed reports
- Access inventory management
- Monitor meal tracking across all schools

**Primary Screens:**
- Admin Dashboard
- School Management (`admin-schools.tsx`)
- User Management (`admin-users.tsx`)
- Donation Oversight (`admin-donations.tsx`)
- Inventory Management
- Feedback Review
- Reports

### 2. Principal
School administrators who manage their school's meal programs.

**Capabilities:**
- Register their school for the program
- Create and manage meal plans
- Add and manage teachers in their school
- Create donation requests for their school
- Manage school inventory
- View school-specific reports
- Track meals served in their school
- Approve meal plans before implementation

**Primary Screens:**
- Principal Dashboard (`principal-dashboard.tsx`)
- School Registration (`request-school.tsx`)
- Meal Planning (`meal-plans.tsx`)
- Teacher Management (`manage-teachers.tsx`)
- Donation Requests (`request-donation.tsx`)
- Menu Planning
- Inventory Management
- Reports

### 3. Teacher
Classroom educators who track daily meal distribution.

**Capabilities:**
- Track which students received meals
- Mark meals as served/not served
- Add photos for meal verification
- View historical meal tracking data
- Access their school's meal plans
- View daily meal assignments

**Primary Screens:**
- Dashboard
- Meal Tracking (`tracking.tsx`)
- Meal History (`history.tsx`)

### 4. Donor
Individuals or organizations who contribute financially to meal programs.

**Capabilities:**
- View active donation requests from schools
- Browse available schools needing support
- Make donations to specific schools or meal plans
- View donation history
- See total contributions and impact
- Receive acknowledgments for donations

**Primary Screens:**
- Dashboard
- Donation Requests List (`donor-list.tsx`)
- My Donations (`donations.tsx`)

### 5. Parent
Parents of students who can provide feedback on meal programs.

**Capabilities:**
- Submit feedback about meals
- Rate meal quality
- View feedback history
- See meal plans for their child's school
- Track feedback status (submitted/reviewed)

**Primary Screens:**
- Dashboard
- Feedback Submission (`feedback.tsx`)

## Database Structure

### Firebase Realtime Database Schema

```
{
  "users": {
    "<uid>": {
      "email": "string",
      "role": "admin|teacher|principal|donor|parent",
      "name": "string",
      "lastLogin": "ISO8601",
      "createdAt": "ISO8601",
      "schoolId": "string" (optional)
    }
  },

  "schools": {
    "<schoolId>": {
      "name": "string",
      "address": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string",
      "contactEmail": "string",
      "contactPhone": "string",
      "principalId": "string",
      "principalName": "string",
      "status": "pending|approved|rejected",
      "createdAt": "ISO8601",
      "approvedAt": "ISO8601",
      "approvedBy": "string"
    }
  },

  "teachers": {
    "<teacherId>": {
      "name": "string",
      "email": "string",
      "schoolId": "string",
      "addedBy": "string",
      "createdAt": "ISO8601",
      "isActive": "boolean"
    }
  },

  "mealTracking": {
    "YYYY-MM-DD": {
      "teacherId": "string",
      "students": {
        "<studentId>": {
          "name": "string",
          "mealServed": "boolean",
          "time": "ISO8601",
          "photoUrl": "string|null"
        }
      }
    }
  },

  "inventory": {
    "<itemId>": {
      "name": "string",
      "quantity": "number",
      "unit": "string",
      "supplier": "string",
      "lastRestocked": "ISO8601",
      "nextOrderDate": "ISO8601"
    }
  },

  "mealPlans": {
    "<planId>": {
      "principalId": "string",
      "schoolId": "string",
      "date": "YYYY-MM-DD",
      "menu": [
        {
          "mealName": "string",
          "quantity": "number",
          "ingredients": ["string"],
          "dietaryRestrictions": ["string"]
        }
      ],
      "status": "draft|approved",
      "createdAt": "ISO8601",
      "approvedAt": "ISO8601"
    }
  },

  "donationRequests": {
    "<requestId>": {
      "schoolId": "string",
      "schoolName": "string",
      "principalId": "string",
      "principalName": "string",
      "mealPlanId": "string",
      "requestedAmount": "number",
      "purpose": "string",
      "description": "string",
      "targetDate": "ISO8601",
      "status": "active|fulfilled|cancelled",
      "createdAt": "ISO8601",
      "fulfilledAmount": "number"
    }
  },

  "donations": {
    "<donationId>": {
      "donorId": "string",
      "donorName": "string",
      "donorEmail": "string",
      "schoolId": "string",
      "mealPlanId": "string",
      "amount": "number",
      "mealContribution": "number",
      "date": "ISO8601",
      "status": "completed|pending",
      "donorMessage": "string"
    }
  },

  "feedback": {
    "<feedbackId>": {
      "parentId": "string",
      "feedback": "string",
      "mealDate": "string",
      "status": "submitted|reviewed"
    }
  },

  "reports": {
    "<reportId>": {
      "generatedBy": "string",
      "dateGenerated": "ISO8601",
      "mealsServed": "number",
      "shortages": "number",
      "donationsReceived": "number",
      "feedbackSummary": "string"
    }
  }
}
```

## Environment Variables

Create a `.env` file in the root directory. Only Firebase environment variables are required for the default setup:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Local development & secrets

For local development copy the example file and fill in your keys. Do not commit real secrets.

PowerShell (copy):

```powershell
copy .env.example .env
```

If you use the `dotenv` approach, `app.config.ts` already imports `dotenv/config` so the variables in `.env` will be available when running Expo locally.

For production or CI builds use EAS secrets so sensitive values are not checked into source control. Example (EAS CLI):

```powershell
# create a secret for the EXPO_PUBLIC_FIREBASE_API_KEY
eas secret:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value "<your_api_key>"

# then reference secrets in your eas.json build profile or via EAS environment variables
```

See Expo/EAS docs for more on secrets and environment configuration.

## Available Scripts

```bash
# Start development server
npm run dev

# Type checking
npm run typecheck

# Build for web
npm run build:web

# Run linter
npm run lint
```

## Navigation Architecture

### Primary Navigation: Tab-based

NutriLink uses Expo Router's file-based routing with role-based tab navigation. The tabs displayed depend on the user's role:

**Tab Structure:**
```
app/(tabs)/
├── _layout.tsx        # Dynamic tab configuration
├── dashboard.tsx      # Common to all roles
├── tracking.tsx       # Teacher only
├── history.tsx        # Teacher only
├── inventory.tsx      # Admin, Principal
├── menu.tsx           # Principal only
├── donations.tsx      # Admin, Donor
├── feedback.tsx       # Parent, Admin
├── reports.tsx        # Admin, Principal
└── admin-dashboard.tsx # Admin only
```

### Route Structure

The app uses Expo Router's file-based routing:
- Files in `app/` directory become routes
- `(tabs)/` is a group route for tab navigation
- `_layout.tsx` files configure navigation structure
- Files starting with `+` are special (e.g., `+not-found.tsx`)

### Authentication Flow

1. **Initial Load** (`index.tsx`):
   - Check if onboarding was completed
   - If not, redirect to `/onboarding`
   - Check authentication status
   - If authenticated, redirect to `/(tabs)/dashboard`
   - If not authenticated, redirect to `/login`

2. **Protected Routes**:
   - All tab screens require authentication
   - Role-based access control via `AuthContext`
   - Unauthorized users redirected to login

## Key Features

### Meal Tracking
- Real-time tracking of meal distribution
- Photo verification capability
- Historical data access
- Date-based organization

### Inventory Management
- Track food supplies and quantities
- Supplier management
- Restock scheduling
- Low stock alerts

### Donation System
- Create donation requests
- Browse active requests
- Process donations
- Track donation impact

### Feedback System
- Parent feedback submission
- Admin review and response
- Feedback history tracking
- Status management

### Reporting
- Generate comprehensive reports
- View statistics and metrics
- Export capabilities
- Date range filtering

## Development Notes

### Adding New Roles
1. Update `UserRole` type in `types/index.ts`
2. Add role-specific tabs in `app/(tabs)/_layout.tsx`
3. Create necessary service functions
4. Update database security rules

### Adding New Features
1. Create route file in appropriate directory
2. Add necessary types to `types/index.ts`
3. Create service functions in `services/firebase/`
4. Update tab navigation if needed
5. Add security rules in Firebase

### Testing
- Web: Run `npm run dev` and open browser
- iOS: Use iOS Simulator or Expo Go
- Android: Use Android Emulator or Expo Go

## Support

For issues, questions, or contributions, please contact the development team or create an issue in the repository.

## License

[Specify your license here]
