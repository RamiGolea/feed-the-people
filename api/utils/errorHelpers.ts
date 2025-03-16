/**
 * Utility functions for handling common errors in the application
 */

/**
 * Checks if the provided error is related to empty arrays in 'in' or 'notIn' filters
 * 
 * @param error - The error object to check
 * @returns Boolean indicating if this is an empty array filter error
 */
export const isEmptyArrayFilterError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes("in/notIn filters require a non-empty array");
  }
  return false;
};

/**
 * Prepares a filter object that safely handles potentially empty arrays for 'in' and 'notIn' operators
 * 
 * @param field - The field name to filter on
 * @param operator - The operator to use ('in' or 'notIn')
 * @param values - The array of values to filter with
 * @returns A filter object that can be safely used with the API, or null if the array is empty
 */
export const prepareArrayFilter = <T>(
  field: string,
  operator: "in" | "notIn",
  values: T[]
): { [key: string]: { [key: string]: T[] } } | null => {
  if (!values || values.length === 0) {
    return null;
  }

  return {
    [field]: {
      [operator]: values,
    },
  };
};

/**
 * Combines multiple filters safely, removing any null filters
 * 
 * @param filters - Array of filter objects or null values
 * @returns A combined filter object or empty object if all filters are null
 */
export const combineFilters = (
  filters: (Record<string, any> | null)[]
): Record<string, any> => {
  const validFilters = filters.filter(Boolean);
  
  if (validFilters.length === 0) {
    return {};
  }
  
  if (validFilters.length === 1) {
    return validFilters[0] as Record<string, any>;
  }
  
  return {
    AND: validFilters,
  };
};

/**
 * Creates a safe filter for the API that won't throw empty array errors
 * 
 * @param baseFilter - The base filter object
 * @param arrayFilters - Array of potential array filters created with prepareArrayFilter
 * @returns A combined filter object that's safe to use
 */
export const createSafeFilter = (
  baseFilter: Record<string, any> = {},
  ...arrayFilters: (Record<string, any> | null)[]
): Record<string, any> => {
  return combineFilters([baseFilter, ...arrayFilters]);
};