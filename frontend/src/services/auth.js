/**
 * auth.js — Cognito authentication using AWS Amplify Auth
 * Handles sign-in, sign-out, and token retrieval.
 */

const REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1';
const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;

const AUTH_URL = `https://cognito-idp.${REGION}.amazonaws.com/`;

/**
 * Sign in with email + password using Cognito USER_PASSWORD_AUTH flow.
 * Returns { idToken, accessToken, userId, email }
 */
export async function signIn(email, password) {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    },
    body: JSON.stringify({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.__type || 'Sign in failed');
  }

  const tokens = data.AuthenticationResult;
  const payload = parseJwt(tokens.IdToken);

  return {
    idToken: tokens.IdToken,
    accessToken: tokens.AccessToken,
    refreshToken: tokens.RefreshToken,
    userId: payload.sub,
    email: payload.email,
    displayName: payload.email,
  };
}

/**
 * Sign up a new user with email + password.
 */
export async function signUp(email, password) {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
    },
    body: JSON.stringify({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: 'email', Value: email }],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.__type || 'Sign up failed');
  return data;
}

/**
 * Confirm sign up with the verification code sent to email.
 */
export async function confirmSignUp(email, code) {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp',
    },
    body: JSON.stringify({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.__type || 'Confirmation failed');
  return data;
}

/**
 * Sign out — clears local session storage.
 */
export function signOut() {
  sessionStorage.removeItem('crm_session');
}

/**
 * Decode JWT payload without verifying signature (client-side only).
 */
function parseJwt(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}
