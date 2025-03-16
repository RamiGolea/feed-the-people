/**
 * Checks if an error is related to empty arrays in 'in' or 'notIn' filters.
 * 
 * This typically happens when a GraphQL query tries to use an empty array
 * for filtering, which is not supported by the backend.
 * 
 * @param error The error object to check
 * @returns True if the error is related to empty arrays in filters
 */
export function isEmptyArrayFilterError(error: unknown): boolean {
  if (!error) return false;
  
  // Check if the error has a message property
  const errorMessage = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);

  // Check for specific error messaging patterns related to empty arrays in filters
  const emptyArrayPatterns = [
    // Common empty array error patterns
    'empty array for "in" filter',
    'empty array for "notIn" filter',
    'Empty "in" or "notIn" condition',
    'Cannot use an empty array with an IN or NOT IN filter'
  ];

  return emptyArrayPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
}