import { ref, get, set, remove, push, update } from 'firebase/database';
import { database } from '@/config/firebase';
import { MealPlan } from '@/types';

export const getAllMealPlans = async (): Promise<Record<string, MealPlan>> => {
  const plansRef = ref(database, 'mealPlans');
  const snapshot = await get(plansRef);

  if (!snapshot.exists()) {
    return {};
  }

  return snapshot.val() as Record<string, MealPlan>;
};

export const getMealPlanByDate = async (date: string): Promise<MealPlan | null> => {
  const planRef = ref(database, `mealPlans/${date}`);
  const snapshot = await get(planRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as MealPlan;
};

export const saveMealPlan = async (date: string, plan: MealPlan): Promise<void> => {
  const planRef = ref(database, `mealPlans/${date}`);
  await set(planRef, plan);
};

export const deleteMealPlan = async (date: string): Promise<void> => {
  const planRef = ref(database, `mealPlans/${date}`);
  await remove(planRef);
};

export const createMealPlan = async (plan: Omit<MealPlan, 'createdAt'>): Promise<string> => {
  const plansRef = ref(database, 'mealPlans');
  const newPlanRef = push(plansRef);

  const mealPlan: MealPlan = {
    ...plan,
    createdAt: new Date().toISOString(),
  };

  await set(newPlanRef, mealPlan);
  return newPlanRef.key!;
};

export const getMealPlanById = async (planId: string): Promise<MealPlan | null> => {
  const planRef = ref(database, `mealPlans/${planId}`);
  const snapshot = await get(planRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as MealPlan;
};

export const getMealPlansBySchoolId = async (schoolId: string): Promise<Record<string, MealPlan>> => {
  const plans = await getAllMealPlans();
  const schoolPlans: Record<string, MealPlan> = {};

  Object.entries(plans).forEach(([id, plan]) => {
    if (plan.schoolId === schoolId) {
      schoolPlans[id] = plan;
    }
  });

  return schoolPlans;
};

export const updateMealPlan = async (planId: string, updates: Partial<MealPlan>): Promise<void> => {
  const planRef = ref(database, `mealPlans/${planId}`);
  await update(planRef, updates);
};

export const approveMealPlan = async (planId: string): Promise<void> => {
  const planRef = ref(database, `mealPlans/${planId}`);
  await update(planRef, {
    status: 'approved',
    approvedAt: new Date().toISOString(),
  });
};

export const deleteMealPlanById = async (planId: string): Promise<void> => {
  const planRef = ref(database, `mealPlans/${planId}`);
  await remove(planRef);
};