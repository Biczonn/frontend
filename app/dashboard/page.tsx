"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Layers3,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { CONFIG } from "@/lib/config";
import {
  loadResource,
  loadSingleResource,
  recordDate,
  recordName,
  recordText,
  type ResourceState,
  type SchoolRecord,
  type SingleResourceState,
} from "@/lib/dashboard-data";
import { useDashboardSearch } from "@/components/dashboard/dashboard-shell";

interface DashboardResources {
  students: ResourceState;
  teachers: ResourceState;
  users: ResourceState;
  classSections: ResourceState;
  subjects: ResourceState;
  academicYears: ResourceState;
}

const loadingResource = (): ResourceState => ({ status: "loading" });
const loadingYear = (): SingleResourceState => ({ status: "loading" });
const loadingResources = (): DashboardResources => ({
  students: loadingResource(),
  teachers: loadingResource(),
  users: loadingResource(),
  classSections: loadingResource(),
  subjects: loadingResource(),
  academicYears: loadingResource(),
});

function shortDate(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function yearTitle(record: SchoolRecord) {
  return recordText(record, "name", "yearName", "year_name", "academicYear", "academic_year", "schoolYear", "label", "year");
}

function activeYearTitle(record: SchoolRecord) {
  const title = yearTitle(record);
  if (title) return title;
  const start = recordText(record, "startYear", "start_year");
  const end = recordText(record, "endYear", "end_year");
  if (start && end) return `${start}–${end}`;
  const startDate = recordDate(record, "startDate", "start_date", "start");
  const endDate = recordDate(record, "endDate", "end_date", "end");
  if (startDate && endDate) return `${startDate.getFullYear()}–${endDate.getFullYear()}`;
  return "Active academic year";
}

function recordIdentifier(record: SchoolRecord, fallback: string) {
  return recordText(record, "id", "studentId", "student_id", "studentNumber", "student_number", "sectionId", "section_id", "subjectId", "subject_id", "code") || fallback;
}

function statusTone(value: string) {
  const status = value.toLowerCase();
  if (["active", "enrolled", "present", "ongoing", "current"].includes(status)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
  }
  if (["pending", "inactive", "upcoming", "not started"].includes(status)) {
    return "bg-amber-50 text-amber-700 ring-amber-600/10";
  }
  if (["withdrawn", "suspended", "archived", "cancelled", "canceled"].includes(status)) {
    return "bg-rose-50 text-rose-700 ring-rose-600/10";
  }
  return "bg-slate-100 text-slate-600 ring-slate-500/10";
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ring-1 ring-inset ${statusTone(value)}`}>
      {value || "Not specified"}
    </span>
  );
}

function MetricCard({
  label,
  resource,
  icon: Icon,
  id,
}: {
  label: string;
  resource: ResourceState;
  icon: LucideIcon;
  id: string;
}) {
  return (
    <article id={id} className="hover-border scroll-mt-24 rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          {resource.status === "loading" ? (
            <div aria-label={`Loading ${label.toLowerCase()}`} className="mt-4 h-9 w-20 animate-pulse rounded bg-slate-200" />
          ) : resource.status === "error" ? (
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-300" aria-label={`${label} unavailable`}>—</p>
          ) : (
            <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-slate-950">
              {resource.value.total.toLocaleString()}
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            {resource.status === "loading" ? "Loading live records" : resource.status === "error" ? "Data unavailable" : "Live records"}
          </p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
          <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
        </span>
      </div>
    </article>
  );
}

function LoadingRows({ count = 4 }: { count?: number }) {
  return (
    <div aria-label="Loading records" className="animate-pulse divide-y divide-slate-100">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-4">
          <span className="size-9 rounded-full bg-slate-200" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-3 w-2/5 rounded bg-slate-200" />
            <span className="block h-2.5 w-1/4 rounded bg-slate-100" />
          </span>
          <span className="h-6 w-16 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
        <BookOpen aria-hidden="true" className="size-5" strokeWidth={1.8} />
      </span>
      <h3 className="mt-4 text-sm font-medium text-slate-800">{title}</h3>
      <p className="mt-1 max-w-xs text-sm leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function DataError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="text-sm font-medium text-slate-800">Records could not be loaded</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="hover-border mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        <RefreshCw aria-hidden="true" className="size-3.5" />
        Retry
      </button>
    </div>
  );
}

function StudentTable({
  resource,
  onRetry,
  query,
}: {
  resource: ResourceState;
  onRetry: () => void;
  query: string;
}) {
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const filtered = useMemo(() => {
    if (resource.status !== "success") return [];
    const records = [...resource.value.records].sort((left, right) => {
      const leftDate = recordDate(left, "enrollmentDate", "enrollment_date", "createdAt", "created_at")?.getTime() ?? 0;
      const rightDate = recordDate(right, "enrollmentDate", "enrollment_date", "createdAt", "created_at")?.getTime() ?? 0;
      return rightDate - leftDate;
    });
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return records;
    return records.filter((record) => JSON.stringify(record).toLowerCase().includes(normalizedQuery));
  }, [resource, query]);

  const pageCount = Math.ceil(filtered.length / pageSize);
  const currentPage = Math.min(page, Math.max(pageCount - 1, 0));
  const visible = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <section id="students" aria-labelledby="students-title" className="hover-border scroll-mt-24 overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 px-5 py-5 sm:px-6">
        <div>
          <h2 id="students-title" className="text-base font-semibold tracking-tight text-slate-900">Student records</h2>
          <p className="mt-1 text-sm text-slate-500">Records returned by the student service</p>
        </div>
        {resource.status === "success" && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium tabular-nums text-slate-600">
            {filtered.length.toLocaleString()} loaded
          </span>
        )}
      </div>

      {resource.status === "loading" ? (
        <LoadingRows />
      ) : resource.status === "error" ? (
        <DataError message={resource.message} onRetry={onRetry} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? "No matching students" : "No student records yet"}
          description={query ? "Try another name, number, class, or status." : "Student records will appear here when they are added to the school database."}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[660px] text-left text-sm">
              <thead className="bg-slate-50/70 text-xs font-medium text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3.5 sm:px-6">Student</th>
                  <th scope="col" className="px-4 py-3.5">Student number</th>
                  <th scope="col" className="px-4 py-3.5">Class / level</th>
                  <th scope="col" className="px-5 py-3.5 sm:px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((student, index) => {
                  const name = recordName(student);
                  const number = recordText(student, "studentNumber", "student_number", "number", "id");
                  const classLevel = recordText(
                    student,
                    "classSection.name",
                    "class_section.name",
                    "classSectionName",
                    "class_section_name",
                    "gradeLevel",
                    "grade_level",
                    "yearLevel",
                    "year_level",
                    "section",
                  );
                  const status = recordText(student, "status", "enrollmentStatus", "enrollment_status");
                  const key = recordIdentifier(student, `${currentPage}-${index}-${name}`);

                  return (
                    <tr key={key} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {name ? name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() : "—"}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-800">{name || "Student record"}</span>
                            <span className="block truncate text-xs text-slate-500">
                              {recordText(student, "email", "contactEmail", "contact_email") || (name ? "Student" : "Name not provided")}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs tabular-nums text-slate-600">{number || "—"}</td>
                      <td className="px-4 py-4 text-slate-600">{classLevel || "—"}</td>
                      <td className="px-5 py-4 sm:px-6"><StatusPill value={status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 px-5 py-3.5 sm:px-6">
            <p className="text-xs text-slate-500">
              Showing <span className="font-medium tabular-nums text-slate-700">{currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, filtered.length)}</span> of <span className="font-medium tabular-nums text-slate-700">{filtered.length}</span> loaded records
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(value - 1, 0))}
                disabled={currentPage === 0}
                aria-label="Previous student records page"
                className="hover-border inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </button>
              <span className="min-w-16 text-center text-xs tabular-nums text-slate-600">{pageCount ? currentPage + 1 : 0} / {pageCount}</span>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(value + 1, pageCount - 1))}
                disabled={currentPage >= pageCount - 1}
                aria-label="Next student records page"
                className="hover-border inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function CollectionList({
  id,
  title,
  description,
  resource,
  icon: Icon,
  emptyTitle,
  emptyDescription,
  renderRecord,
  onRetry,
  limit = 5,
}: {
  id: string;
  title: string;
  description: string;
  resource: ResourceState;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  renderRecord: (record: SchoolRecord, index: number) => { title: string; detail: string; status?: string };
  onRetry: () => void;
  limit?: number;
}) {
  const { query } = useDashboardSearch();
  const records = resource.status === "success" ? resource.value.records : [];
  const filtered = query.trim()
    ? records.filter((record) => JSON.stringify(record).toLowerCase().includes(query.trim().toLowerCase()))
    : records;
  const visible = filtered.slice(0, limit);

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="hover-border scroll-mt-24 overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 px-5 py-5">
        <div>
          <h2 id={`${id}-title`} className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
          <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
        </span>
      </div>

      {resource.status === "loading" ? (
        <LoadingRows count={3} />
      ) : resource.status === "error" ? (
        <DataError message={resource.message} onRetry={onRetry} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={query ? "No matching records" : emptyTitle}
          description={query ? "Try a different search term." : emptyDescription}
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((record, index) => {
            const item = renderRecord(record, index);
            return (
              <li key={recordIdentifier(record, `${id}-${index}`)} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500">
                  <Icon aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">{item.title}</span>
                  <span className="block truncate text-xs text-slate-500">{item.detail || "—"}</span>
                </span>
                {item.status && <StatusPill value={item.status} />}
              </li>
            );
          })}
        </ul>
      )}
      {resource.status === "success" && resource.value.records.length > limit && !query && (
        <p className="border-t border-slate-200/80 px-5 py-3 text-xs text-slate-500">
          Showing {visible.length} of {resource.value.total.toLocaleString()} records returned
        </p>
      )}
    </section>
  );
}

function AcademicYearBanner({ state, onRetry }: { state: SingleResourceState; onRetry: () => void }) {
  return (
    <section aria-label="Active academic year" className="hover-border flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
          <CalendarDays aria-hidden="true" className="size-5" strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">Active academic year</p>
          {state.status === "loading" ? (
            <div aria-label="Loading academic year" className="mt-2 h-6 w-48 animate-pulse rounded bg-slate-200" />
          ) : state.status === "error" ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-sm text-slate-600">The active year could not be loaded.</p>
              <button type="button" onClick={onRetry} className="text-sm font-medium text-slate-800 underline underline-offset-4">Retry</button>
            </div>
          ) : state.value ? (
            <>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{activeYearTitle(state.value)}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {[
                  shortDate(recordDate(state.value, "startDate", "start_date", "start")),
                  shortDate(recordDate(state.value, "endDate", "end_date", "end")),
                ].filter(Boolean).join(" – ") || "Dates not provided by the academic year record"}
              </p>
            </>
          ) : (
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-800">No active academic year set</h2>
          )}
        </div>
      </div>
      {state.status === "success" && state.value && (
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-600" />
          Active
        </span>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const { isChecking } = useAuthGuard({ requireAuth: true });
  const { query } = useDashboardSearch();
  const [reloadKey, setReloadKey] = useState(0);
  const [resources, setResources] = useState<DashboardResources>(loadingResources);
  const [activeYear, setActiveYear] = useState<SingleResourceState>(loadingYear());

  useEffect(() => {
    if (isChecking) return;
    let current = true;

    Promise.all([
      loadResource(CONFIG.ENDPOINTS.STUDENTS),
      loadResource(CONFIG.ENDPOINTS.TEACHERS),
      loadResource(CONFIG.ENDPOINTS.USERS),
      loadResource(CONFIG.ENDPOINTS.CLASS_SECTIONS),
      loadResource(CONFIG.ENDPOINTS.SUBJECTS),
      loadResource(CONFIG.ENDPOINTS.ACADEMIC_YEARS),
      loadSingleResource(CONFIG.ENDPOINTS.ACTIVE_ACADEMIC_YEAR),
    ]).then(([students, teachers, users, classSections, subjects, academicYears, currentYear]) => {
      if (!current) return;
      setResources({ students, teachers, users, classSections, subjects, academicYears });
      setActiveYear(currentYear);
    });

    return () => {
      current = false;
    };
  }, [isChecking, reloadKey]);

  if (isChecking) {
    return (
      <div role="status" aria-label="Verifying session" className="space-y-7 animate-pulse">
        <div className="h-8 w-52 rounded bg-slate-200" />
        <div className="h-24 rounded-xl bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-32 rounded-xl bg-slate-200" />)}
        </div>
      </div>
    );
  }

  const retry = () => {
    setResources(loadingResources());
    setActiveYear(loadingYear());
    setReloadKey((value) => value + 1);
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">School overview</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Good to see you</h1>
          <p className="mt-2 text-sm text-slate-600">A live view of your academic community and records.</p>
        </div>
        <button
          type="button"
          onClick={retry}
          className="hover-border inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <RefreshCw aria-hidden="true" className="size-3.5" />
          Refresh data
        </button>
      </div>

      <AcademicYearBanner state={activeYear} onRetry={retry} />

      <section aria-label="School record totals" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <MetricCard label="Students" resource={resources.students} icon={GraduationCap} id="students-count" />
        <MetricCard label="Teachers" resource={resources.teachers} icon={UsersRound} id="teachers" />
        <MetricCard label="System users" resource={resources.users} icon={UsersRound} id="users-count" />
        <MetricCard label="Class sections" resource={resources.classSections} icon={Layers3} id="class-sections-count" />
        <MetricCard label="Subjects" resource={resources.subjects} icon={BookOpen} id="subjects-count" />
      </section>

      {Object.values(resources).some((resource) => resource.status === "error") && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>Some school data is temporarily unavailable. Values shown above reflect only successful live responses.</span>
          <button type="button" onClick={retry} className="font-medium underline underline-offset-4">Retry all data</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(19rem,0.9fr)]">
        <StudentTable resource={resources.students} onRetry={retry} query={query} />
        <CollectionList
          id="class-sections"
          title="Class sections"
          description="Class-section records from the school data service"
          resource={resources.classSections}
          icon={Layers3}
          emptyTitle="No class sections yet"
          emptyDescription="Class sections will appear here when they are available in the school database."
          onRetry={retry}
          renderRecord={(record) => ({
            title: recordText(record, "name", "sectionName", "section_name", "classSectionName", "class_section_name") || "Class section",
            detail: [
              recordText(record, "subject.name", "subjectName", "subject_name", "subjectCode", "subject_code"),
              recordText(record, "teacher.fullName", "teacher.name", "teacherName", "teacher_name", "teacher.employeeNumber", "teacher.employee_number"),
              recordText(record, "academicYear.name", "academic_year.name", "academicYearName", "academic_year_name"),
            ].filter(Boolean).join(" · "),
            status: recordText(record, "status"),
          })}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CollectionList
          id="teacher-list"
          title="Teachers"
          description="Faculty records from the teacher service"
          resource={resources.teachers}
          icon={UsersRound}
          emptyTitle="No teacher records yet"
          emptyDescription="Teacher records from the database will appear here."
          onRetry={retry}
          renderRecord={(record) => ({
            title: recordName(record) || "Teacher record",
            detail: [
              recordText(record, "employeeNumber", "employee_number"),
              recordText(record, "department.name", "department", "subject.name", "subject_name"),
            ].filter(Boolean).join(" · "),
            status: recordText(record, "status"),
          })}
          limit={6}
        />
        <CollectionList
          id="academic-years"
          title="Academic years"
          description="School calendar records"
          resource={resources.academicYears}
          icon={CalendarDays}
          emptyTitle="No academic years yet"
          emptyDescription="Academic years from the database will be listed here."
          onRetry={retry}
          renderRecord={(record) => {
            const id = recordIdentifier(record, "");
            const activeId = activeYear.status === "success" && activeYear.value
              ? recordIdentifier(activeYear.value, "")
              : "";
            const isActiveFlag = record.isActive === true || record.is_active === true;
            const isActive = isActiveFlag || Boolean(id && activeId && id === activeId)
              || ["active", "current"].includes(recordText(record, "status").toLowerCase())
              || recordText(record, "isActive", "is_active").toLowerCase() === "true";
            return {
              title: yearTitle(record) || "Academic year",
              detail: [
                shortDate(recordDate(record, "startDate", "start_date", "start")),
                shortDate(recordDate(record, "endDate", "end_date", "end")),
              ].filter(Boolean).join(" – "),
              status: isActive ? "Active" : "",
            };
          }}
          limit={6}
        />
        <CollectionList
          id="subject-list"
          title="Subjects"
          description="Subjects in the school catalogue"
          resource={resources.subjects}
          icon={BookOpen}
          emptyTitle="No subjects yet"
          emptyDescription="Subjects from the database will appear here."
          onRetry={retry}
          renderRecord={(record) => ({
            title: recordText(record, "name", "subjectName", "subject_name", "title") || "Subject",
            detail: [
              recordText(record, "subjectCode", "subject_code", "code"),
              recordText(record, "description"),
            ].filter(Boolean).join(" · "),
            status: recordText(record, "status"),
          })}
          limit={6}
        />
      </div>

      <footer className="flex items-center gap-2 border-t border-slate-200/70 pt-5 text-xs text-slate-500">
        Counts reflect the totals returned by the connected school data services.
      </footer>
    </div>
  );
}
