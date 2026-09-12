const APP_ATTEST_ENV_KEY = 'com.apple.developer.devicecheck.appattest-environment';
const BUILD_ENV_KEY = 'ORCHIDPAY_APP_ATTEST_ENVIRONMENT';
const ALLOWED_APP_ATTEST_ENVIRONMENTS = new Set(['development', 'production']);

module.exports = ({ config }) => {
  const configuredValue = process.env[BUILD_ENV_KEY];
  const isEasBuild = process.env.EAS_BUILD === 'true';

  if (isEasBuild && !configuredValue) {
    throw new Error(`${BUILD_ENV_KEY} is required during EAS Build`);
  }

  const appAttestEnvironment = configuredValue || 'development';

  if (!ALLOWED_APP_ATTEST_ENVIRONMENTS.has(appAttestEnvironment)) {
    throw new Error(`${BUILD_ENV_KEY} must be development or production`);
  }

  return {
    ...config,
    ios: {
      ...config.ios,
      entitlements: {
        ...(config.ios?.entitlements || {}),
        [APP_ATTEST_ENV_KEY]: appAttestEnvironment,
      },
    },
  };
};
