export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KiB", "MiB", "GiB"];
  let value = bytes / 1024;
  let unit = units[0] ?? "KiB";
  for (let index = 0; index < units.length; index += 1) {
    unit = units[index] ?? unit;
    if (value < 1024 || index === units.length - 1) {
      break;
    }
    value /= 1024;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${unit}`;
}

export function shortDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
