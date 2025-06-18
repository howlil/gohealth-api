const Logger = require('../libs/logger/Logger');

class PaginationMiddleware {
    static normalizePageNumber() {
        return (req, res, next) => {
            // Handle page=0 for backward compatibility
            if (req.query && req.query.page !== undefined) {
                const page = parseInt(req.query.page);
                if (!isNaN(page) && page === 0) {
                    Logger.debug('Converting page=0 to page=1 for backward compatibility');
                    req.query.page = '1';
                }
            }
            next();
        };
    }
}

module.exports = PaginationMiddleware; 