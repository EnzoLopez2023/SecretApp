import { LogLevel, type Configuration } from '@azure/msal-browser';

const clientId = '55bf92db-2cec-4e65-ab0d-71bee90d7494';
const tenantId = '52188f12-db6b-46c6-88ff-08c802f0ed3b';

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
  system: {
    loggerOptions: {
      loggerCallback(level, message, containsPii) {
        if (containsPii) {
          return;
        }
        // eslint-disable-next-line no-console
        console.debug(`[MSAL:${LogLevel[level]}] ${message}`);
      },
      logLevel: LogLevel.Warning,
    },
  },
};

export const loginRequest = {
  scopes: ['User.Read'],
};
