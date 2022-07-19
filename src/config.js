const debug = process.env.NODE_ENV != 'production';

const baseConfig = {
    BCRYPT_SALT_ROUNDS: 10,
    TRUST_PROXY: !debug,
    DEBUG: debug,
    APP_LOG_LEVEL: getEnv('APP_LOG_LEVEL') || 'info',
    VERSION: getEnv('npm_package_version') || 'dev',
};

export default {
    ...baseConfig,
    ...getConfig()
};

/**
 * Builds config based on current environment.
 *
 * @returns {object} Config values for the current environment.
 */
function getConfig() {
    if (debug) {
        return {
            PORT: 8080,
            SECRET: 'n-fBRt4Xy^:&x`gk',
        };
    } else {
        return {
            PORT: getEnv('APP_PORT') || 80,
            SECRET: getEnv('APP_SECRET') || panic('Missing "APP_SECRET" environment variable'),
        };
    }
}

/**
 * Reads a variable from the environment.
 *
 * @param {string} envvar The name of the variable to read.
 * @returns {string | undefined} The value of the environment variable. Or undefined.
 */
function getEnv(envvar) {
    return (envvar in process.env) ? process.env[envvar] : undefined;
}


/**
 * Prints an error message to our logger then exits.
 *
 * @param {string} message The message to print to stderr.
 */
async function panic(message) {
    const logger = (await import('logger')).default;
    logger.error(message);
    process.exit(1);
}
