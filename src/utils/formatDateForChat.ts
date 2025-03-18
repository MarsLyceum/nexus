export const formatDateForChat = (date: Date): string => {
    // Get current date and calculate yesterday.
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    // Helper function to compare only the year, month, and day.
    const isSameDay = (d1: Date, d2: Date): boolean =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    // Format the time portion.
    const hours = date.getHours() % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    const timeString = `${hours}:${minutes} ${ampm}`;

    // Return the formatted string based on whether the date is today, yesterday, or another day.
    if (isSameDay(date, now)) {
        return `Today at ${timeString}`;
    }

    if (isSameDay(date, yesterday)) {
        return `Yesterday at ${timeString}`;
    }

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year} ${timeString}`;
};
