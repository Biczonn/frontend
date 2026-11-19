"use client";

import { useState, type Ref } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  autoComplete: "current-password" | "new-password";
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  onBlur,
  autoComplete,
  error,
  inputRef,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
        <span aria-hidden="true" className="ml-0.5 text-slate-400">*</span>
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name="password"
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          required
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : undefined}
          className={`hover-border h-12 w-full rounded-lg border bg-white px-3.5 pr-12 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-500/70 focus-visible:ring-offset-1 ${
            error ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-slate-500"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-r-lg text-slate-500 outline-none hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-500"
        >
          {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
