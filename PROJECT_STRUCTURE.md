# Kids Feed - Meal Management System

This is a React Native Expo application using Firebase Realtime Database for meal tracking and management in schools.

## Technology Stack

- **Frontend**: React Native with Expo
- **Authentication**: Firebase Auth
- **Database**: Firebase Realtime Database
- **Navigation**: Expo Router with Tabs

## Project Structure

```
app/
├── _layout.tsx           # Root layout with AuthProvider
├── index.tsx             # Entry point with auth routing
├── login.tsx             # Login screen
├── +not-found.tsx        # 404 page
└── (tabs)/               # Tab-based navigation
    ├── _layout.tsx       # Tab layout with role-based tabs
    ├── dashboard.tsx     # Dashboard for all roles
    ├── tracking.tsx      # Meal tracking (Teacher)
    ├── history.tsx       # Meal history (Teacher)
    ├── inventory.tsx     # Inventory management (Admin, Principal)
    ├── menu.tsx          # Menu planning (Principal)
    ├── donations.tsx     # Donations (Admin, Donor)
    ├── feedback.tsx      # Feedback (Admin, Parent)
    └── reports.tsx       # Reports (Admin, Principal)

components/
└── LoadingScreen.tsx     # Loading indicator

contexts/
└── AuthContext.tsx       # Authentication context

services/
└── firebase/
    ├── authService.ts            # Authentication functions
    ├── mealTrackingService.ts    # Meal tracking operations
    ├── inventoryService.ts       # Inventory management
    ├── mealPlanService.ts        # Meal planning
    ├── donationService.ts        # Donation management
    ├── feedbackService.ts        # Feedback operations
    └── reportService.ts          # Report generation

config/
└── firebase.ts           # Firebase configuration

types/
└── index.ts              # TypeScript types
```

## User Roles

1. **Admin**: Full access to inventory, donations, feedback, and reports
2. **Teacher**: Track meals and view history
3. **Principal**: Menu planning, inventory, and reports
4. **Donor**: View and make donations
5. **Parent**: Submit feedback

## Firebase Database Structure

```json
{
  "users": {
    "<uid>": {
      "email": "string",
      "role": "admin|teacher|principal|donor|parent",
      "name": "string",
      "lastLogin": "ISO8601",
      "createdAt": "ISO8601"
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
    "YYYY-MM-DD": {
      "principalId": "string",
      "menu": [
        {
          "mealName": "string",
          "quantity": "number",
          "ingredients": ["string"],
          "dietaryRestrictions": ["string"]
        }
      ]
    }
  },
  "donations": {
    "<donationId>": {
      "donorId": "string",
      "amount": "number",
      "mealContribution": "number",
      "date": "ISO8601",
      "status": "completed|pending",
      "donorMessage": "string"
    }
  },
  "feedback": {
    "YYYY-MM-DD": {
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

## Test Accounts

- **Admin**: admin@gmail.com
- **Teacher 1**: teacher1@gmail.com
- **Teacher 2**: teacher2@gmail.com
- **Principal**: principle@gmail.com
- **Donor 1**: donor1@gmail.com
- **Donor 2**: donor2@gmail.com
- **Parent 1**: parent1@gmail.com
- **Parent 2**: parent2@gmail.com

## Features by Role

### Admin
- View dashboard with statistics
- Manage inventory
- View all donations
- Review feedback
- Generate and view reports

### Teacher
- Track student meals (served/not served)
- Add photos for verification
- View meal tracking history

### Principal
- Plan meal menus
- Manage inventory
- View reports

### Donor
- View donation history
- See total contributions

### Parent
- Submit meal feedback
- View feedback history

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type check
npm run typecheck

# Build for web
npm run build:web
```

## Firebase Setup

1. Create a Firebase project
2. Enable Authentication with Email/Password
3. Enable Realtime Database
4. Set up database rules for role-based access
5. Add Firebase config to `.env`

## Environment Variables

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_DATABASE_URL=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=
```
