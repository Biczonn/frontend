import { apiClient } from "@/lib/api";

export type SchoolRecord = Record<string, unknown>;

export interface SchoolCollection {
  records: SchoolRecord[];
  total: number;
}

export type ResourceState =
  | { status: "loading" }
  | { status: "success"; value: SchoolCollection }
  | { status: "error"; message: string };

export type SingleResourceState =
  | { status: "loading" }
  | { status: "success"; value: SchoolRecord | null }
  | { status: "error"; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numericCount(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function findCollection(value: unknown, depth = 0): unknown[] | undefined {
  if (Array.isArray(value)) return value;
  if (!isRecord(value) || depth > 3) return undefined;

  const keys = [
    "data",
    "items",
    "results",
    "records",
    "students",
    "teachers",
    "classSections",
    "class_sections",
    "subjects",
    "academicYears",
    "academic_years",
  ];
  for (const key of keys) {
    if (key in value) {
      const records = findCollection(value[key], depth + 1);
      if (records) return records;
    }
  }
  return undefined;
}

export function normalizeCollection(payload: unknown): SchoolCollection {
  const root = isRecord(payload) ? payload : undefined;
  const nested = root?.data;
  const collectionRoot = isRecord(nested) ? nested : root;
  const records = findCollection(payload);

  if (!records) {
    throw new Error("The data service returned an unexpected response.");
  }

  const total = numericCount(collectionRoot?.total)
    ?? numericCount(collectionRoot?.count)
    ?? numericCount(collectionRoot?.totalCount)
    ?? numericCount(isRecord(collectionRoot?.meta) ? collectionRoot.meta.total : undefined)
    ?? records.length;

  return {
    records: records.filter(isRecord),
    total,
  };
}

export async function fetchSchoolCollection(endpoint: string): Promise<SchoolCollection> {
  const payload = await apiClient<unknown>(endpoint, {
    method: "GET",
    requiresAuth: true,
    cache: "no-store",
  });
  return normalizeCollection(payload);
}

export async function loadResource(endpoint: string): Promise<Exclude<ResourceState, { status: "loading" }>> {
  try {
    return { status: "success", value: await fetchSchoolCollection(endpoint) };
  } catch (reason) {
    return {
      status: "error",
      message: reason instanceof Error ? reason.message : "The records could not be loaded.",
    };
  }
}

export function normalizeSingleRecord(payload: unknown): SchoolRecord | null {
  let current = payload;
  const wrapperKeys = ["data", "active", "user", "activeYear", "active_year", "activeAcademicYear", "active_academic_year", "academicYear", "academic_year"];

  for (let depth = 0; depth < 4; depth += 1) {
    if (Array.isArray(current)) {
      return current.find(isRecord) ?? null;
    }
    if (!isRecord(current)) return null;

    const currentRecord = current;
    const wrapperKey = wrapperKeys.find((key) => key in currentRecord && (isRecord(currentRecord[key]) || Array.isArray(currentRecord[key])));
    if (!wrapperKey) return currentRecord;
    current = currentRecord[wrapperKey];
  }

  return isRecord(current) ? current : null;
}

export async function loadSingleResource(endpoint: string): Promise<Exclude<SingleResourceState, { status: "loading" }>> {
  try {
    const payload = await apiClient<unknown>(endpoint, {
      method: "GET",
      requiresAuth: true,
      cache: "no-store",
    });
    return { status: "success", value: normalizeSingleRecord(payload) };
  } catch (reason) {
    return {
      status: "error",
      message: reason instanceof Error ? reason.message : "The record could not be loaded.",
    };
  }
}

export function recordText(record: SchoolRecord, ...keys: string[]): string {
  for (const key of keys) {
    const value = key.split(".").reduce<unknown>((current, segment) => {
      return isRecord(current) ? current[segment] : undefined;
    }, record);

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

export function recordDate(record: SchoolRecord, ...keys: string[]): Date | null {
  const raw = recordText(record, ...keys);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function recordName(record: SchoolRecord): string {
  const fullName = recordText(record, "fullName", "full_name", "displayName", "display_name", "name", "studentName", "student_name", "teacherName", "teacher_name", "learnerName", "learner_name", "username");
  if (fullName) return fullName;
  const firstName = recordText(record, "firstName", "first_name", "givenName", "given_name");
  const lastName = recordText(record, "lastName", "last_name", "familyName", "family_name", "surname");
  return [firstName, lastName].filter(Boolean).join(" ");
}
