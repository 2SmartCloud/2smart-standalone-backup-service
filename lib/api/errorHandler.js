const ChistaException = require('chista/Exception').default;
const SX = require('./services/utils/SX');

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(error, req, res, next) {
    let statusCode = 500;

    if (error instanceof SX.NotFoundError) statusCode = 404;
    else if (error instanceof SX.ForbiddenError) statusCode = 403;
    else if (error instanceof SX.ValidationError) statusCode = 412;
    else if (error instanceof SX.BadRequestError) statusCode = 400;

    res.status(statusCode);
    res.send({ status: 0, error: dumpError(error) });
};

function dumpError(error) {
    if (error instanceof ChistaException) return error.toHash();

    return {
        code    : 'SERVER_ERROR',
        message : 'Please, contact your system administartor!'
    };
    // const errObj = {
    //     type   : error.type || 'SERVER_ERROR',
    //     errors : (error instanceof SX) ? error.errors : []
    // };

    // if (!errObj.errors || !errObj.errors.length) {
    //     errObj.message = error instanceof SX ? error.message : 'Please, contact your system administartor!';
    // }

    // return {
    //     code   : error.code || 'SERVER_ERROR',
    //     errors : (error instanceof SX) ? error.errors : []
    // };
}
