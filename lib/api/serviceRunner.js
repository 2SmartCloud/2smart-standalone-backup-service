const dotProp = require('dot-prop');
const Debugger      = require('homie-sdk/lib/utils/debugger');
const errorHandler = require('./errorHandler');

const debug = new Debugger(process.env.DEBUG || '*');

debug.initEvents();

function defaultReponseBuilder(req, res, next, result) {
    if (typeof result === 'object') res.send({ status: 1, ...result });
    else res.send(result);
}

function defaultParamBuilber(req) {
    return {  ...req.params, ...req.query, ...req.body };
}

module.exports = {
    makeServiceRunner(
        serviceClass,
        paramBuilder = defaultParamBuilber,
        responseBuilder = defaultReponseBuilder
    ) {
        return async (req, res, next) => {
            const params = paramBuilder(req);
            const context = dotProp.get(req, 'session.context', {});

            console.log('!!debug', !!debug);
            console.log(debug);

            const service = new serviceClass({ context, debug });

            try {
                // TODO Use logger with masking
                debug.info('serviceRunner', `RUNNING SERVICE ${ serviceClass.name }`);
                debug.info('serviceRunner', `WITH PARAMS ${ JSON.stringify(params) }`);

                const result = await service.run(params);

                debug.info('serviceRunner', `RESULT: ${result && JSON.stringify(result)}`);

                return responseBuilder(req, res, next, result);
            } catch (error) {
                debug.error(error);

                return errorHandler(error, req, res, next);
            }
        };
    }
};
