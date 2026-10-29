import { format, differenceInDays, isAfter, parseISO, startOfDay } from 'date-fns';

export const dateUtils = {
  formatDate(dateStr: string): string {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  },

  getCountdown(dueDateStr: string): { text: string; isOverdue: boolean; days: number } {
    const today = startOfDay(new Date());
    const dueDate = startOfDay(parseISO(dueDateStr));
    const days = differenceInDays(dueDate, today);

    if (days === 0) return { text: 'Due today', isOverdue: false, days };
    const absDays = Math.abs(days);
    const dayText = absDays === 1 ? 'day' : 'days';
    if (days < 0) return { text: `Overdue by ${absDays} ${dayText}`, isOverdue: true, days };
    return { text: `Due in ${days} ${dayText}`, isOverdue: false, days };
  },

  isOverdue(dueDateStr: string): boolean {
    const today = startOfDay(new Date());
    const dueDate = startOfDay(parseISO(dueDateStr));
    return isAfter(today, dueDate);
  }
};
