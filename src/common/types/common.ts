export interface WhereConditions {
  id?: { in: number[] } | number;
  name?: { contains: string };
  updated_at?: { gte: Date };
  email?: string;
}

