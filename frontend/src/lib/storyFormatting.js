export function formatRelativeTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const formatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto"
  });

  if (absMs < hour) {
    return formatter.format(Math.round(diffMs / minute), "minute");
  }

  if (absMs < day) {
    return formatter.format(Math.round(diffMs / hour), "hour");
  }

  if (absMs < 7 * day) {
    return formatter.format(Math.round(diffMs / day), "day");
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

export function formatShortDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function formatHugLabel(count) {
  const normalizedCount = Number(count || 0);
  return `${normalizedCount} Hug${normalizedCount === 1 ? "" : "s"} received`
}

export function formatSupportActionLabel(count, hasHugged) {
  const normalizedCount = Number(count || 0);
  const label = hasHugged ? "Hug sent" : "Send a Hug";
  return `${label} • ${normalizedCount}`
}
