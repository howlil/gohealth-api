const { formatDate } = require('../libs/utils/date');

const dateFormatter = (req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        if (data && typeof data === 'object') {
            const formatDates = (obj) => {
                if (!obj || typeof obj !== 'object') return obj;

                if (Array.isArray(obj)) {
                    return obj.map(item => formatDates(item));
                }

                const result = { ...obj };
                for (const key in result) {
                    if (result[key] instanceof Date) {
                        result[key] = formatDate(result[key]);
                    } else if (typeof result[key] === 'object') {
                        result[key] = formatDates(result[key]);
                    }
                }
                return result;
            };

            data = formatDates(data);
        }
        return originalJson.call(this, data);
    };
    next();
};

module.exports = dateFormatter; 