export async function copyText(text?: string, clearSec?: number) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    if (clearSec) {
      setTimeout(() => {
        navigator.clipboard.writeText("").catch((e) => {
          console.error("Failed to clear clipboard", e);
        });
      }, clearSec * 1000);
    }
  } catch (e) {
    console.error("Failed to copy text", e);
  }
}

export async function copyPassword(pw?: string, clearSec?: number) {
  return copyText(pw, clearSec);
}
