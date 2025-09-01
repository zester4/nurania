interface HijriDateResponse {
    code: number;
    status: string;
    data: {
        hijri: {
            date: string; // "14-12-1445"
            format: string; // "DD-MM-YYYY"
            day: string; // "14"
            weekday: {
                en: string; // "Al-Jumu'ah"
                ar: string;
            };
            month: {
                number: number; // 12
                en: string; // "Dhū al-Ḥijjah"
                ar: string;
            };
            year: string; // "1445"
        }
    }
}


export const getHijriDate = async (): Promise<string> => {
    try {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;

        const response = await fetch(`https://api.aladhan.com/v1/gToH?date=${formattedDate}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: HijriDateResponse = await response.json();

        if (data.code === 200 && data.data.hijri) {
            const { day, month, year } = data.data.hijri;
            return `${day} ${month.en}, ${year} AH`;
        } else {
            throw new Error("Invalid API response for Hijri date.");
        }
    } catch (error) {
        console.error("Failed to fetch Hijri date:", error);
        // Return a fallback string
        return "Could not load Hijri date";
    }
};
