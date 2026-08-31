// Date and duration helpers for resume experiences and work history.

export const MONTH_NAMES = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
] as const;

const MONTH_MAP: Record<string, number> = {
	jan: 0,
	january: 0,
	feb: 1,
	february: 1,
	mar: 2,
	march: 2,
	apr: 3,
	april: 3,
	may: 4,
	jun: 5,
	june: 5,
	jul: 6,
	july: 6,
	aug: 7,
	august: 7,
	sep: 8,
	sept: 8,
	september: 8,
	oct: 9,
	october: 9,
	nov: 10,
	november: 10,
	dec: 11,
	december: 11
};

export interface MonthYear {
	month: number; // 0-11
	year: number;
}

export function parseMonthYear(str: string | null | undefined): MonthYear | null {
	if (!str) return null;
	const trimmed = str.trim();
	if (!trimmed || trimmed.toLowerCase() === 'present' || trimmed.toLowerCase() === 'current') {
		return null;
	}

	const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})$/);
	if (isoMatch) {
		const year = parseInt(isoMatch[1], 10);
		const month = parseInt(isoMatch[2], 10) - 1;
		if (month >= 0 && month <= 11) return { month, year };
	}

	const myMatch = trimmed.match(/^(\d{1,2})[-/](\d{4})$/);
	if (myMatch) {
		const month = parseInt(myMatch[1], 10) - 1;
		const year = parseInt(myMatch[2], 10);
		if (month >= 0 && month <= 11) return { month, year };
	}

	const words = trimmed.split(/[\s,/-]+/).filter(Boolean);
	if (words.length >= 2) {
		let month = -1;
		let year = -1;

		for (const w of words) {
			const lower = w.toLowerCase();
			if (MONTH_MAP[lower] !== undefined) {
				month = MONTH_MAP[lower];
			} else if (/^\d{4}$/.test(w)) {
				year = parseInt(w, 10);
			} else if (/^\d{1,2}$/.test(w)) {
				const n = parseInt(w, 10);
				if (n >= 1 && n <= 12 && month === -1) {
					month = n - 1;
				}
			}
		}

		if (month >= 0 && year >= 1900) {
			return { month, year };
		}
	}

	if (/^\d{4}$/.test(trimmed)) {
		return { month: 0, year: parseInt(trimmed, 10) };
	}

	return null;
}

export function formatMonthYear(my: MonthYear | null): string {
	if (!my) return '';
	return `${MONTH_NAMES[my.month]} ${my.year}`;
}

export interface DurationResult {
	years: number;
	months: number;
	totalMonths: number;
	formatted: string;
}

export function calculateDuration(
	startDateStr: string | null | undefined,
	endDateStr?: string | null | undefined
): DurationResult | null {
	const start = parseMonthYear(startDateStr);
	if (!start) return null;

	let end: MonthYear;
	const isPresent =
		!endDateStr ||
		endDateStr.trim() === '' ||
		endDateStr.trim().toLowerCase() === 'present' ||
		endDateStr.trim().toLowerCase() === 'current';

	if (isPresent) {
		const now = new Date();
		end = { month: now.getMonth(), year: now.getFullYear() };
	} else {
		const parsedEnd = parseMonthYear(endDateStr);
		if (!parsedEnd) return null;
		end = parsedEnd;
	}

	const totalMonths = (end.year - start.year) * 12 + (end.month - start.month) + 1;
	if (totalMonths <= 0) {
		return { years: 0, months: 0, totalMonths: 0, formatted: '0 mos' };
	}

	const years = Math.floor(totalMonths / 12);
	const remainingMonths = totalMonths % 12;

	let formatted = '';
	if (years > 0 && remainingMonths > 0) {
		formatted = `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
	} else if (years > 0) {
		formatted = `${years} yr${years > 1 ? 's' : ''}`;
	} else {
		formatted = `${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
	}

	return {
		years,
		months: remainingMonths,
		totalMonths,
		formatted
	};
}

export function formatExperienceDateRange(
	startDateStr: string,
	endDateStr: string | null | undefined,
	employmentType?: string | null
): string {
	const cleanStart = startDateStr?.trim() || '';
	const cleanEnd = endDateStr?.trim() || 'Present';
	if (employmentType?.trim()) {
		return `${employmentType.trim()} · ${cleanStart} - ${cleanEnd}`;
	}
	return `${cleanStart} - ${cleanEnd}`;
}
