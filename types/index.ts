export type UserRole = 'admin' | 'teacher' | 'principal' | 'donor' | 'parent';

export interface User {
  email: string;
  role: UserRole;
  name: string;
  lastLogin?: string;
  createdAt: string;
  schoolId?: string;
}

export interface Student {
  name: string;
  mealServed: boolean;
  time: string;
  photoUrl: string | null;
  // Optional feedback fields for meal reactions and health observations
  mealReaction?: 'happy' | 'little' | 'none';
  healthObservation?: 'tired' | 'sick' | 'active' | null;
  notes?: string;
}

export interface StudentProfile {
  name: string;
  age: number;
  grade: string;
  parentName: string;
  parentContact: string;
  parentEmail?: string;
  createdAt?: string;
}

export interface MealTracking {
  teacherId: string;
  students: Record<string, Student>;
}

export interface InventoryItem {
  name: string;
  quantity: number;
  unit: string;
  supplier: string;
  lastRestocked: string;
  nextOrderDate: string;
}

export interface MealPlanItem {
  mealName: string;
  quantity: number;
  ingredients: string[];
  dietaryRestrictions: string[];
}

export interface MealPlan {
  principalId: string;
  schoolId: string;
  menu: MealPlanItem[];
  date: string;
  status: 'draft' | 'approved';
  createdAt: string;
  approvedAt?: string;
}

export interface Donation {
  donorId: string;
  donorName?: string;
  donorEmail?: string;
  schoolId?: string;
  mealPlanId?: string;
  amount: number;
  mealContribution: number;
  date: string;
  status: 'completed' | 'pending';
  donorMessage: string;
}

export interface Feedback {
  parentId: string;
  feedback: string;
  mealDate: string;
  status: 'submitted' | 'reviewed';
}

export interface Report {
  generatedBy: string;
  dateGenerated: string;
  mealsServed: number;
  shortages: number;
  donationsReceived: number;
  feedbackSummary: string;
}

export interface School {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  contactEmail: string;
  contactPhone: string;
  principalId: string;
  principalName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface Teacher {
  name: string;
  email: string;
  schoolId: string;
  addedBy: string;
  createdAt: string;
  isActive: boolean;
}

export interface DonationRequest {
  schoolId: string;
  schoolName: string;
  principalId: string;
  principalName: string;
  mealPlanId?: string;
  requestedAmount: number;
  purpose: string;
  description: string;
  targetDate: string;
  status: 'active' | 'fulfilled' | 'cancelled';
  createdAt: string;
  fulfilledAmount: number;
}