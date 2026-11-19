"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import {
  BookOpen,
  CalendarCheck2,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import { clearTokens, getAccessToken } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { loadSingleResource, recordName, recordText } from "@/lib/dashboard-data";

const DashboardSearchContext = createContext({
  query: "",
  setQuery: (_query: string) => {},
});

export function useDashboardSearch() {
  return useContext(DashboardSearchContext);
}

interface SessionClaims {
  sub?: unknown;
  id?: unknown;
  userId?: unknown;
  user_id?: unknown;
  name?: unknown;
  username?: unknown;
  email?: unknown;
  role?: unknown;
  position?: unknown;
}

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/dashboard#students", icon: GraduationCap },
  { label: "Teachers", href: "/dashboard#teacher-list", icon: UsersRound },
  { label: "Class sections", href: "/dashboard#class-sections", icon: BookOpen },
  { label: "Subjects", href: "/dashboard#subject-list", icon: BookOpen },
  { label: "Academic years", href: "/dashboard#academic-years", icon: CalendarCheck2 },
] as const;

function claimLabel(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function initialsFor(name: string) {
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "B";
}

function NavigationLinks({
  pathname,
  currentHash,
  onNavigate,
}: {
  pathname: string;
  currentHash: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Primary navigation" className="flex-1 px-3 py-6">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Workspace
      </p>
      <ul className="space-y-1">
        {navigation.map(({ label, href, icon: Icon }) => {
          const isDashboard = href === "/dashboard";
          const section = isDashboard ? "" : href.split("#")[1];
          const active = pathname === "/dashboard" && (isDashboard ? !currentHash : currentHash === section);

          return (
            <li key={label}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                  active
                    ? "bg-slate-100 font-medium text-slate-950"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon aria-hidden="true" className={`size-[17px] ${active ? "text-slate-800" : "text-slate-400 group-hover:text-slate-600"}`} strokeWidth={1.8} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight aria-hidden="true" className="size-3.5 text-slate-400" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Sidebar({
  pathname,
  currentHash,
  accountName,
  role,
  onNavigate,
  onLogout,
  onClose,
  loggingOut,
}: {
  pathname: string;
  currentHash: string;
  accountName: string;
  role: string;
  onNavigate?: () => void;
  onLogout: () => void | Promise<void>;
  onClose?: () => void;
  loggingOut: boolean;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      <div className="flex h-[68px] items-center justify-between border-b border-slate-200/80 px-5">
        <Link href="/dashboard" onClick={onNavigate} className="inline-flex items-center gap-3 text-slate-950">
          <span className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <BookOpen aria-hidden="true" className="size-4" strokeWidth={1.8} />
          </span>
          <span className="text-sm font-semibold tracking-tight">Biczon</span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
          className="inline-flex size-12 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>

      <NavigationLinks pathname={pathname} currentHash={currentHash} onNavigate={onNavigate} />

      <div className="border-t border-slate-200/80 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
            {initialsFor(accountName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-slate-800">{accountName}</span>
            <span className="mt-0.5 inline-flex max-w-full rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{role}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => void onLogout()}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-wait disabled:opacity-60"
        >
          <LogOut aria-hidden="true" className="size-4 text-slate-400" strokeWidth={1.8} />
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [currentHash, setCurrentHash] = useState("");
  const [accountName, setAccountName] = useState("School account");
  const [role, setRole] = useState("Member");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const syncHash = () => setCurrentHash(window.location.hash.slice(1));
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    let current = true;
    let userId = "";
    try {
      const claims = jwtDecode<SessionClaims>(token);
      const name = claimLabel(claims.name) || claimLabel(claims.username) || claimLabel(claims.email);
      const roleClaim = claimLabel(claims.role) || claimLabel(claims.position);
      const idClaim = claims.sub ?? claims.id ?? claims.userId ?? claims.user_id;
      if (name) setAccountName(name);
      if (roleClaim) setRole(roleClaim);
      if (typeof idClaim === "string" || typeof idClaim === "number") userId = String(idClaim);
    } catch {
      // The JWT is only used to personalize the shell; auth remains enforced by the existing guard/API.
    }

    if (userId) {
      void loadSingleResource(`${CONFIG.ENDPOINTS.USERS}/${encodeURIComponent(userId)}`).then((result) => {
        if (!current || result.status !== "success" || !result.value) return;
        const name = recordName(result.value) || recordText(result.value, "email", "userName", "user_name");
        const profileRole = recordText(result.value, "role.name", "role.title", "role", "position.name", "position", "userRole", "user_role");
        if (name) setAccountName(name);
        if (profileRole) setRole(profileRole);
      });
    }

    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mobileOpen && !dialog.open) dialog.showModal();
    if (!mobileOpen && dialog.open) dialog.close();
  }, [mobileOpen]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await apiClient(CONFIG.ENDPOINTS.LOGOUT, {
        method: "POST",
        requiresAuth: true,
      });
    } catch {
      // Clear the local session even if the server-side logout request is unavailable.
    } finally {
      clearTokens();
      router.replace(CONFIG.ROUTES.LOGIN);
    }
  };

  const title = pathname === "/dashboard"
    ? "Dashboard"
    : pathname.split("/").filter(Boolean).at(-1)?.replaceAll("-", " ") ?? "Dashboard";

  return (
    <DashboardSearchContext.Provider value={{ query, setQuery }}>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200/80 bg-white lg:block">
          <Sidebar
            pathname={pathname}
            currentHash={currentHash}
            accountName={accountName}
            role={role}
            onLogout={handleLogout}
            loggingOut={loggingOut}
          />
        </aside>

        <div className="min-h-screen lg:pl-64">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
            <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                aria-haspopup="dialog"
                aria-expanded={mobileOpen}
                className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 lg:hidden"
              >
                <Menu aria-hidden="true" className="size-5" />
              </button>

              <span className="hidden min-w-32 text-sm font-semibold tracking-tight text-slate-900 sm:block">{title}</span>

              <search className="mx-auto w-full max-w-md">
                <label className="relative block">
                  <span className="sr-only">Search dashboard records</span>
                  <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search records…"
                    className="hover-border h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-base text-slate-800 outline-none placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-slate-500/70"
                  />
                </label>
              </search>

              <div className="flex shrink-0 items-center gap-2 border-l border-slate-200 pl-3 sm:pl-4">
                <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 md:block">{accountName}</span>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600" title="Role from the user record or signed-in session">
                  {role}
                </span>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </main>
        </div>

        <dialog
          ref={dialogRef}
          aria-label="Dashboard navigation"
          onClose={() => setMobileOpen(false)}
          onCancel={(event) => {
            event.preventDefault();
            setMobileOpen(false);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setMobileOpen(false);
          }}
          className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(18rem,calc(100vw_-_1.5rem))] max-w-none border-0 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/40"
        >
          <Sidebar
            pathname={pathname}
            currentHash={currentHash}
            accountName={accountName}
            role={role}
            onNavigate={() => setMobileOpen(false)}
            onLogout={handleLogout}
            onClose={() => setMobileOpen(false)}
            loggingOut={loggingOut}
          />
        </dialog>
      </div>
    </DashboardSearchContext.Provider>
  );
}
