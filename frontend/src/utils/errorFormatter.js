
export function parseApiError(error) {
  // Handle network errors
  if (error instanceof TypeError) {
    return 'Network error. Please check your connection.'
  }

  // Extract payload from API error
  const payload = error.payload
  const detail = payload?.detail

  // Handle string detail (most business and auth errors)
  if (typeof detail === 'string') {
    return detail
  }

  // Handle validation array (422 errors)
  if (Array.isArray(detail)) {
    return detail
      .map((err) => {
        const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : 'field'
        return `${field}: ${err.msg}`
      })
      .join('; ')
  }

  // Handle generic message
  if (error.message) {
    return error.message
  }

  return 'An unexpected error occurred'
}

export function formatValidationErrors(validationArray) {
  if (!Array.isArray(validationArray)) {
    return validationArray
  }

  return validationArray
    .map((err) => {
      const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : 'field'
      return `${field}: ${err.msg}`
    })
    .join('; ')
}
