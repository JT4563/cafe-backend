
/**
 * response.util.ts
 * Helper to standardize API responses.
 */

export function success(data: any, message = 'OK') {
  return { success: true, message, data };
}

export function fail(message = 'Error', details?: any) {
  return { success: false, message, details };
}
