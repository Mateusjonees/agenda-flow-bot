export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: string;
  type: string;
  status: string;
  metadata?: {
    customer_name?: string;
  };
}
