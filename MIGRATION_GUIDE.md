# Route Structure Migration Guide

## Before vs After Comparison

### OLD STRUCTURE (Flat Routes)
```
app/
├── (tabs)/
│   ├── admin-dashboard.tsx
│   ├── dashboard.tsx
│   └── ...
├── admin-users.tsx          ❌ Flat file
├── admin-schools.tsx        ❌ Flat file
├── admin-donations.tsx      ❌ Flat file
├── principal-dashboard.tsx  ❌ Flat file
├── manage-teachers.tsx      ❌ Flat file (ambiguous)
├── meal-plans.tsx           ❌ Flat file (ambiguous)
├── donor-list.tsx           ❌ Flat file (ambiguous)
├── request-donation.tsx     ❌ Flat file (ambiguous)
├── request-school.tsx       ❌ Flat file (ambiguous)
├── index.tsx
├── login.tsx
├── profile.tsx
└── settings.tsx
```

### NEW STRUCTURE (Stakeholder Namespaced)
```
app/
├── (tabs)/
│   ├── admin-dashboard.tsx
│   ├── dashboard.tsx
│   └── ...
├── admin/                   ✅ Admin namespace
│   ├── users.tsx
│   ├── schools.tsx
│   └── donations.tsx
├── principal/               ✅ Principal namespace
│   ├── dashboard.tsx
│   ├── manage-teachers.tsx
│   ├── meal-plans.tsx
│   ├── donor-list.tsx
│   ├── request-donation.tsx
│   └── request-school.tsx
├── donor/                   ✅ Donor namespace (ready for expansion)
│   └── index.tsx
├── parent/                  ✅ Parent namespace (ready for expansion)
│   └── index.tsx
├── teacher/                 ✅ Future: Teacher namespace
├── index.tsx
├── login.tsx
├── profile.tsx
└── settings.tsx
```

## Route Mapping Table

| Old Route | New Route | Stakeholder | Status |
|-----------|-----------|-------------|--------|
| `/admin-users` | `/admin/users` | Admin | ✅ Migrated |
| `/admin-schools` | `/admin/schools` | Admin | ✅ Migrated |
| `/admin-donations` | `/admin/donations` | Admin | ✅ Migrated |
| `/principal-dashboard` | `/principal/dashboard` | Principal | ✅ Migrated |
| `/manage-teachers` | `/principal/manage-teachers` | Principal | ✅ Migrated |
| `/meal-plans` | `/principal/meal-plans` | Principal | ✅ Migrated |
| `/donor-list` | `/principal/donor-list` | Principal | ✅ Migrated |
| `/request-donation` | `/principal/request-donation` | Principal | ✅ Migrated |
| `/request-school` | `/principal/request-school` | Principal | ✅ Migrated |
| N/A | `/donor` | Donor | ✅ Placeholder created |
| N/A | `/parent` | Parent | ✅ Placeholder created |

## Updated Navigation Calls

### Admin Dashboard
```typescript
// File: app/(tabs)/admin-dashboard.tsx

// ❌ OLD
router.push('/admin-users')
router.push('/admin-schools')
router.push('/admin-donations')

// ✅ NEW
router.push('/admin/users')
router.push('/admin/schools')
router.push('/admin/donations')
```

### Principal Dashboard
```typescript
// File: app/principal/dashboard.tsx

// ❌ OLD
router.push('/manage-teachers')
router.push('/meal-plans')
router.push('/donor-list')
router.push('/request-donation')
router.push('/request-school')

// ✅ NEW
router.push('/principal/manage-teachers')
router.push('/principal/meal-plans')
router.push('/principal/donor-list')
router.push('/principal/request-donation')
router.push('/principal/request-school')
```

## Stakeholder Responsibilities

### 🔴 Admin
- **Routes**: `/admin/*`
- **Responsibilities**: 
  - User management
  - School approval/rejection
  - Donation oversight
  - System-wide analytics
  
### 🔵 Principal
- **Routes**: `/principal/*`
- **Responsibilities**: 
  - School dashboard
  - Teacher management
  - Meal plan creation/approval
  - Donation requests
  - School registration
  - Donor tracking

### 🟢 Donor
- **Routes**: `/donor/*`
- **Responsibilities** (future): 
  - Browse donation requests
  - Make donations
  - View donation history
  - Track impact

### 🟡 Parent
- **Routes**: `/parent/*`
- **Responsibilities** (future): 
  - View child's meal history
  - Provide feedback
  - View meal plans

### 🟠 Teacher
- **Routes**: `/teacher/*` (not yet implemented)
- **Responsibilities** (future): 
  - Track student meals
  - Record meal consumption
  - Generate reports

## Migration Checklist

- [x] Create stakeholder folders
- [x] Move admin files to `app/admin/`
- [x] Move principal files to `app/principal/`
- [x] Create donor placeholder
- [x] Create parent placeholder
- [x] Update route references in admin dashboard
- [x] Update route references in principal dashboard
- [x] Delete original flat files
- [x] Verify TypeScript compilation
- [x] Test Metro bundler
- [x] Create documentation
- [ ] Update README.md (optional)
- [ ] Update PROJECT_STRUCTURE.md (optional)
- [ ] Add teacher routes (future)
- [ ] Implement donor pages (future)
- [ ] Implement parent pages (future)

## Benefits of New Structure

### 1. **Clear Ownership**
Each stakeholder has their own namespace, making it obvious who owns what functionality.

### 2. **Easier Navigation**
URLs are self-documenting:
- `/admin/users` - clearly an admin function
- `/principal/meal-plans` - clearly a principal function

### 3. **Simplified Maintenance**
When fixing a principal-related bug, you know exactly where to look: `app/principal/`

### 4. **Better Scalability**
Adding new features for a stakeholder is straightforward - just add files to their folder.

### 5. **Improved Security**
Route guards can be applied at the folder level based on user roles.

## Code Examples

### Role-Based Access Control
```typescript
// app/admin/_layout.tsx (future enhancement)
export default function AdminLayout() {
  const { userData } = useAuth();
  
  if (userData?.role !== 'admin') {
    return <Redirect href="/" />;
  }
  
  return <Slot />;
}
```

### Shared Components
```typescript
// Future organization
components/
├── admin/          // Admin-specific components
├── principal/      // Principal-specific components
├── shared/         // Shared across all stakeholders
└── ui/             // Generic UI components
```
