// utils/formatters.ts

export function formatCurrency(amount: number, currency: string = 'INR'): string {
    const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return formatter.format(amount);
}

export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function formatTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function getRelativeTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    if (diffDays < 365) return `In ${Math.ceil(diffDays / 30)} months`;
    return `In ${Math.ceil(diffDays / 365)} years`;
}

export function getMonthName(month: number): string {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return names[month - 1] || '';
}

/** Abbreviate large numbers: 1,500,000 -> ₹15L, 10,000,000 -> ₹1Cr */
export function formatAmount(amount: number, currency = 'INR'): string {
    if (isNaN(amount) || amount === undefined || amount === null) return `${currency === 'INR' ? '₹' : ''}0`;
    const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '';
    const abs = Math.abs(amount);
    let formatted: string;
    if (abs >= 1_00_00_000) {
        formatted = (abs / 1_00_00_000).toFixed(2).replace(/\.?0+$/, '') + 'Cr';
    } else if (abs >= 1_00_000) {
        formatted = (abs / 1_00_000).toFixed(2).replace(/\.?0+$/, '') + 'L';
    } else if (abs >= 1_000) {
        formatted = (abs / 1_000).toFixed(2).replace(/\.?0+$/, '') + 'K';
    } else {
        formatted = Math.round(abs).toLocaleString('en-IN');
    }
    return `${symbol}${formatted}`;
}

/** 
 * Exported as safeFormatCurrency to fix missing imports globally.
 * This directly uses the abbreviation logic so all cards in the app truncate large numbers automatically.
 */
export const safeFormatCurrency = formatAmount;
