/* eslint-disable no-param-reassign */
class SX extends Error {
    constructor(args) {
        // eslint-disable-next-line no-param-reassign
        if (typeof args === 'string') args = { message: args };
        args = args || {};
        super();
        this.type = args.type || 'unknownError';
        this.message = args.message || 'Please, contact your system administrator!';
    }
}

class BadRequestError extends SX {
    constructor(args) {
        if (typeof args === 'string') args = { message: args };
        args = args || {};
        super({ message: 'Bad request', ...args, type: 'badRequest' });
        this.errors = args.errors || null;
    }
}
class ForbiddenError extends SX {
    constructor(args) {
        if (typeof args === 'string') args = { message: args };
        args = args || {};
        super({ message: 'Forbidden error', ...args, type: 'forbidden' });
    }
}
class ValidationError extends SX {
    constructor(args) {
        if (typeof args === 'string') args = { message: args };
        args = args || {};
        super({ message: 'Validation error', ...args, type: 'validation' });
        this.errors = args.errors || [];
    }
}
class NotFoundError extends SX {
    constructor(args) {
        if (typeof args === 'string') args = { message: args };
        args = args || {};
        super({ message: 'Not found', ...args, type: 'notFound' });
        this.data = args.data || null;
    }
}
class TimeoutError extends SX {
    constructor(args) {
        if (typeof args === 'string') args = { message: args };
        args = args || {};
        super({ message: 'Timed out', ...args, type: 'timeout' });
        this.data = args.data || null;
    }
}

SX.BadRequestError = BadRequestError;
SX.ForbiddenError = ForbiddenError;
SX.ValidationError = ValidationError;
SX.NotFoundError = NotFoundError;
SX.TimeoutError = TimeoutError;

module.exports = SX;
