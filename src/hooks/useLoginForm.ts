import React from "react";
import type { Settings } from "../state/settings";
import { generatePassword } from "../lib/crypto";
import { copyText } from "../lib/clipboard";
import { passwordStrength } from "check-password-strength";

export interface LoginFormValues {
  title: string;
  site: string;
  username: string;
  password: string;
  totpSecret: string;
  notes: string;
  category: string;
}

export function useLoginForm({
  open,
  settings,
  onSaveSettings,
  initial,
}: {
  open: boolean;
  settings: Settings;
  onSaveSettings: (next: Settings) => Promise<void>;
  initial?: Partial<LoginFormValues> | null;
}) {
  const [title, setTitle] = React.useState("");
  const [site, setSite] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [totpSecret, setTotpSecret] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [passwordScore, setPasswordScore] = React.useState(0);
  const [newCat, setNewCat] = React.useState("");
  const [addingCategory, setAddingCategory] = React.useState(false);
  const [savingCategory, setSavingCategory] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showTotpSecret, setShowTotpSecret] = React.useState(false);
  const [showScanner, setShowScanner] = React.useState(false);
  const [scannedSecret, setScannedSecret] = React.useState("");
  const lastSecretRef = React.useRef<string | null>(null);

  const initialize = React.useCallback(() => {
    const defaultCat = settings.categories.includes("Personal")
      ? "Personal"
      : "Uncategorized";
    const initCat =
      initial?.category && settings.categories.includes(initial.category)
        ? initial.category
        : defaultCat;
    setTitle(initial?.title ?? "");
    setSite(initial?.site ?? "");
    setUsername(initial?.username ?? "");
    setPassword(initial?.password ?? "");
    setTotpSecret(initial?.totpSecret ?? "");
    setNotes(initial?.notes ?? "");
    setCategory(initCat);
    setNewCat("");
    setAddingCategory(false);
    setSavingCategory(false);
    setShowPassword(false);
    setShowTotpSecret(false);
    setShowScanner(false);
    setScannedSecret("");
    lastSecretRef.current = null;
  }, [initial, settings.categories]);

  React.useEffect(() => {
    if (open) initialize();
  }, [open, initialize]);

  React.useEffect(() => {
    if (!password) {
      setPasswordScore(0);
      return;
    }
    const { id } = passwordStrength(password);
    setPasswordScore(id);
  }, [password]);

  const sortedCategories = React.useMemo(
    () => [...(settings.categories || [])].sort((a, b) => a.localeCompare(b)),
    [settings.categories],
  );

  const genPassword = async () => {
    const pw = generatePassword();
    setPassword(pw);
    try {
      await navigator.clipboard.writeText(pw);
      if (settings.clipboardClearSec) {
        setTimeout(() => {
          navigator.clipboard.writeText("").catch(() => {});
        }, settings.clipboardClearSec * 1000);
      }
    } catch (e) {
      console.error("Failed to copy password", e);
    }
  };

  const addCategory = async () => {
    if (savingCategory) return;
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (settings.categories.includes(trimmed)) {
      setNewCat("");
      setCategory(trimmed);
      setAddingCategory(false);
      return;
    }
    setSavingCategory(true);
    try {
      const next = [...settings.categories, trimmed].sort((a, b) =>
        a.localeCompare(b),
      );
      await onSaveSettings({ ...settings, categories: next });
      setNewCat("");
      setCategory(trimmed);
      setAddingCategory(false);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleQrScan = (data: string) => {
    if (!data) return;
    let secret = "";
    const trimmed = data.trim();
    if (trimmed.startsWith("otpauth://")) {
      try {
        const url = new URL(trimmed);
        secret = url.searchParams.get("secret") || "";
      } catch (e) {
        console.error("Invalid otpauth url", e);
      }
    } else {
      secret = trimmed;
    }
    if (!secret) return;
    const normalized = secret.replace(/[^A-Z2-7]/gi, "").toUpperCase();
    if (normalized === lastSecretRef.current) return;
    lastSecretRef.current = normalized;
    copyText(normalized, settings.clipboardClearSec ?? undefined);
    setScannedSecret(normalized);
    setShowTotpSecret(true);
    setShowScanner(false);
  };

  const copySecret = async () => {
    const secret = scannedSecret || totpSecret;
    if (!secret) return;
    try {
      await copyText(secret, settings.clipboardClearSec ?? undefined);
      alert("TOTP secret copied to clipboard");
    } catch (e) {
      console.error("Failed to copy TOTP secret", e);
      alert("Failed to copy TOTP secret");
    }
  };

  return {
    values: { title, site, username, password, totpSecret, notes, category },
    setTitle,
    setSite,
    setUsername,
    setPassword,
    setTotpSecret,
    setNotes,
    setCategory,
    passwordScore,
    newCat,
    setNewCat,
    addingCategory,
    setAddingCategory,
    savingCategory,
    showPassword,
    setShowPassword,
    showTotpSecret,
    setShowTotpSecret,
    showScanner,
    setShowScanner,
    scannedSecret,
    sortedCategories,
    genPassword,
    addCategory,
    handleQrScan,
    copySecret,
    reset: initialize,
  };
}

export type UseLoginFormReturn = ReturnType<typeof useLoginForm>;
