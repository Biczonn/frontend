export const CONFIG = {
  API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://p7-u522.onrender.com",
  STORAGE_KEYS: {
    ACCESS_TOKEN: "accessToken",
    REFRESH_TOKEN: "refreshToken",
  },
  ROUTES: {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    DASHBOARD: "/dashboard",
  },
  ENDPOINTS: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    POSITIONS: "/positions",
    USERS: "/users",
    STUDENTS: "/students",
    TEACHERS: "/teachers",
    CLASS_SECTIONS: "/class-sections",
    SUBJECTS: "/subjects",
    ACADEMIC_YEARS: "/academic-years",
    ACTIVE_ACADEMIC_YEAR: "/academic-years/active",
  },
} as const;
