/**
 * Centralized API & Authentication Error Normalizer for TripSplit.
 * Standardizes backend errors, Axios responses, Firebase auth errors,
 * and network failures into a unified, actionable error contract.
 */

export interface NormalizedError {
  code: string;
  message: string;
  field?: string;
  details?: any;
  status: number;
  isNetworkError: boolean;
  isPlanLimit: boolean;
  isAuthError: boolean;
  isValidationError: boolean;
  rawMessage: string;
  originalError: unknown;
}

const FIREBASE_AUTH_CODE_MAP: Record<string, string> = {
  'auth/invalid-credential': 'The email or password you entered is incorrect.',
  'auth/wrong-password': 'The email or password you entered is incorrect.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/email-already-in-use':
    'An account with this email already exists. Please log in instead.',
  'auth/weak-password':
    'Password is too weak. Please choose a password with at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled':
    'This account has been disabled. Please contact support.',
  'auth/too-many-requests':
    'Too many unsuccessful attempts. Please wait a few moments and try again.',
  'auth/network-request-failed':
    'Network connection issue. Please check your internet connection and try again.',
  'auth/popup-closed-by-user': 'Sign-in window was closed before completion.',
  'auth/cancelled-popup-request': 'Sign-in process was cancelled.',
  'auth/operation-not-allowed': 'Sign-in method is currently not enabled.',
};

const CODE_TO_FRIENDLY_MESSAGE: Record<string, string> = {
  PLAN_LIMIT_REACHED:
    'You have reached your subscription limit. Upgrade your plan to unlock more.',
  FEATURE_NOT_PERMITTED:
    'This feature is not available on your current plan. Upgrade to unlock it.',
  DUPLICATE_MEMBER: 'This user is already a member of this trip.',
  INVITATION_ALREADY_ACCEPTED: 'This invitation has already been accepted.',
  INVITATION_ALREADY_PENDING: 'An invitation is already pending for this user.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  INVALID_TOKEN: 'Authentication expired. Please sign in again.',
  TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  UPLOAD_ERROR:
    'Unable to upload file. Please ensure it is a valid format and size.',
  VALIDATION_ERROR: 'Please review and correct the required fields.',
};

export function normalizeApiError(err: unknown): NormalizedError {
  if (!err) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred.',
      status: 500,
      isNetworkError: false,
      isPlanLimit: false,
      isAuthError: false,
      isValidationError: false,
      rawMessage: '',
      originalError: err,
    };
  }

  const anyErr = err as any;

  // 1. Extract status code
  let status = 500;
  if (typeof anyErr.statusCode === 'number') {
    status = anyErr.statusCode;
  } else if (typeof anyErr.response?.status === 'number') {
    status = anyErr.response.status;
  } else if (anyErr.status) {
    status = Number(anyErr.status) || 500;
  }

  // 2. Extract raw message & details from response payload if present
  const resData = anyErr.response?.data;
  let rawMessage = '';
  let code = anyErr.code || '';
  let details = anyErr.details;
  let field: string | undefined;

  if (resData) {
    // Backend standard format: { success, message, code, details, error: { code, message, details } }
    if (typeof resData === 'string') {
      rawMessage = resData;
    } else if (typeof resData === 'object') {
      rawMessage =
        resData.message ||
        (typeof resData.error === 'string'
          ? resData.error
          : resData.error?.message) ||
        '';

      code =
        resData.code ||
        (typeof resData.error === 'object' ? resData.error?.code : undefined) ||
        code;

      details =
        resData.details ||
        (typeof resData.error === 'object'
          ? resData.error?.details
          : undefined) ||
        details;

      if (details?.field) {
        field = details.field;
      }
    }
  }

  // Fallback to error.message
  if (!rawMessage && anyErr.message) {
    rawMessage = String(anyErr.message);
  }

  // 3. Detect Firebase Auth errors
  let friendlyMessage = '';
  for (const [fbCode, translation] of Object.entries(FIREBASE_AUTH_CODE_MAP)) {
    if (
      rawMessage.includes(fbCode) ||
      code === fbCode ||
      anyErr.code === fbCode
    ) {
      friendlyMessage = translation;
      code = fbCode;
      break;
    }
  }

  // 4. Detect Network / Timeout errors
  const isNetworkError =
    code === 'NETWORK_ERROR' ||
    anyErr.code === 'ECONNABORTED' ||
    anyErr.code === 'ERR_NETWORK' ||
    rawMessage.toLowerCase().includes('network error') ||
    (!anyErr.response && status === 0);

  if (isNetworkError) {
    status = status || 0;
    code = 'NETWORK_ERROR';
    friendlyMessage =
      'Unable to connect to the server. Please check your internet connection.';
  }

  const isTimeout =
    anyErr.code === 'ECONNABORTED' ||
    rawMessage.toLowerCase().includes('timeout');
  if (isTimeout) {
    status = 408;
    code = 'TIMEOUT';
    friendlyMessage = 'The request timed out. Please try again.';
  }

  // 5. Detect Plan Limit errors
  const isPlanLimit =
    code === 'PLAN_LIMIT_REACHED' ||
    code === 'FEATURE_NOT_PERMITTED' ||
    rawMessage.includes('PLAN_LIMIT_REACHED') ||
    rawMessage.toLowerCase().includes('plan limit');

  if (isPlanLimit && !code) {
    code = 'PLAN_LIMIT_REACHED';
  }

  // 6. Category flags
  const isAuthError =
    status === 401 || code === 'UNAUTHORIZED' || code.startsWith('auth/');
  const isValidationError =
    status === 400 || status === 422 || code === 'VALIDATION_ERROR';

  // 7. Resolve display message
  let resolvedMessage = friendlyMessage;
  if (!resolvedMessage) {
    // If backend provided a specific human-readable message, prefer it
    if (
      rawMessage &&
      !rawMessage.startsWith('Firebase: Error') &&
      !rawMessage.startsWith('Request failed with status code')
    ) {
      resolvedMessage = rawMessage;
    } else if (code && CODE_TO_FRIENDLY_MESSAGE[code]) {
      resolvedMessage = CODE_TO_FRIENDLY_MESSAGE[code];
    } else if (status === 404) {
      resolvedMessage = 'The requested resource was not found.';
    } else if (status === 403) {
      resolvedMessage = 'You do not have permission to perform this action.';
    } else if (status >= 500) {
      resolvedMessage =
        'Our servers are experiencing an issue. Please try again shortly.';
    } else {
      resolvedMessage = rawMessage || 'An unexpected error occurred.';
    }
  }

  return {
    code: code || 'UNKNOWN_ERROR',
    message: resolvedMessage,
    field,
    details,
    status,
    isNetworkError,
    isPlanLimit,
    isAuthError,
    isValidationError,
    rawMessage,
    originalError: err,
  };
}
