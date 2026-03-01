const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const getOrdinalSuffix = (day: number): string => {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
};

const toLocalDate = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const formatSectionDate = (dateStr: string): string => {
  const localDate = toLocalDate(new Date(dateStr));
  const today = toLocalDate(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (localDate.getTime() === today.getTime()) return "Today";
  if (localDate.getTime() === yesterday.getTime()) return "Yesterday";

  const day = localDate.getDate();
  return `${day}${getOrdinalSuffix(day)} ${MONTHS[localDate.getMonth()]} ${localDate.getFullYear()}`;
};

export const formatFullDate = (dateStr: string): string => {
  const localDate = toLocalDate(new Date(dateStr));
  const day = localDate.getDate();
  const dayOfWeek = DAYS[localDate.getDay()];
  return `${dayOfWeek} ${day}${getOrdinalSuffix(day)} ${MONTHS[localDate.getMonth()]} ${localDate.getFullYear()}`;
};

export const toLocalDateKey = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
