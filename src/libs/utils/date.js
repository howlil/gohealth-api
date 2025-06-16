const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
};

const parseDate = (dateStr) => {
    if (!dateStr) return null;

    // Handle DD-MM-YYYY format
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }

    // Handle ISO format as fallback
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date;
    }

    return null;
};

module.exports = {
    formatDate,
    parseDate
}; 