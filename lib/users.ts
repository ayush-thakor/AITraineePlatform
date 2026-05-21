export const ROLE_LABELS = {
  trainee: "Trainee",
  "content-uploader": "Content Uploader",
  manager: "Manager"
} as const;

export type UserRole = keyof typeof ROLE_LABELS;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type DemoUser = AuthUser & {
  password: string;
  description: string;
};

export const DEMO_USERS: DemoUser[] = [
  {
    id: "trainee-demo",
    name: "Guest Trainee",
    email: "trainee@example.com",
    password: "trainee123",
    role: "trainee",
    description: "Learns from SOP modules, uses support, and submits quizzes."
  },
  {
    id: "uploader-demo",
    name: "Content Uploader",
    email: "uploader@example.com",
    password: "uploader123",
    role: "content-uploader",
    description: "Uploads SOP content and prepares modules for trainees."
  },
  {
    id: "manager-demo",
    name: "Training Manager",
    email: "manager@example.com",
    password: "manager123",
    role: "manager",
    description: "Uploads content and reviews trainee quiz progress."
  }
];

export const UPLOAD_ROLES: UserRole[] = ["content-uploader", "manager"];
export const QUIZ_SUBMIT_ROLES: UserRole[] = ["trainee", "manager"];
export const MANAGER_ROLES: UserRole[] = ["manager"];

export function getRoleHome(role: UserRole) {
  if (role === "manager") {
    return "/manager/progress";
  }

  if (role === "content-uploader") {
    return "/admin/modules";
  }

  return "/trainee";
}
