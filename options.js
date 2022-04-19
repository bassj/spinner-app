module.exports = {
    PORT: 8080,
    DEBUG: process.env.NODE_ENV != 'production',
    SECRET: 'n-fBRt4Xy^:&x`gk',
    TRUST_PROXY: false,
    BCRYPT_SALT_ROUNDS: 10,
};
