import { minimatch } from 'minimatch'
import { log } from './lib/utils.mjs'

/**
 * Checks the access policy for a request context
 *
 * Policy rules are evaluated in order (top-to-bottom as they appear in the config).
 * The first policy rule with a matching 'when' condition will determine the result.
 * If no policy rule matches, we return null and fall back to role-based access control (RBAC).
 *
 * @param {Object} context - The request context
 * @param {string} context.url - The request URL
 * @param {string} context.method - The HTTP method (GET, POST, etc.)
 * @param {string} context.role - The user's role
 * @param {string} context.user - The username
 * @param {string} context.provider - The auth provider
 * @param {string[]} context.labels - Array of user labels
 * @param {Object} policy - The policy object (key = rule name, value = rule definition)
 * @returns {boolean|null} - true (allow), false (deny), or null (no match, fall back to RBAC)
 */
export function checkAccessPolicy(context, policy) {
  // Don't bother if we have no policy
  if (!policy || typeof policy !== 'object') return null

  // Iterate through access policy rules in order
  for (const [name, rule] of Object.entries(policy)) {
    /*
     * Check if this rule's 'when' conditions match
     * If it does, return (first match wins)
     * Guard against errors in case people write an invalid rule
     */
    try {
      if (ruleMatches(context, rule.when)) return rule.then.toLowerCase() === 'allow' ? true : false
    } catch (err) {
      log.warn(`Access policy rule "${name}" has invalid structure: ${err?.message}`)
      continue
    }
  }

  // When no rule matches, we return null
  return null
}

/**
 * Checks if a rule's 'when' block matches the request context
 *
 * @param {Object} context - The request context
 * @param {Object} when - The rule's 'when' conditions
 * @returns {boolean} - true if all conditions match (AND logic)
 */
function ruleMatches(context, when) {
  if (!when || typeof when !== 'object') return false

  // All top-level conditions must match (AND logic)
  const conditions = ['url', 'method', 'role', 'user', 'provider', 'label']
  for (const condition of conditions) {
    if (condition in when) {
      // Only label holds an array
      const contextValue = condition === 'label' ? context.labels : context[condition]
      if (!matchCondition(contextValue, when[condition], condition === 'label')) {
        return false
      }
    }
  }

  return true
}

/**
 * Matches a single condition against a context value
 *
 * @param {string|string[]} contextValue - The value from context (can be array for labels)
 * @param {*} conditionDef - The condition definition from the access policy rule
 * @param {boolean} isArray - Whether contextValue is an array (for labels)
 * @returns {boolean} - true if the rule matches
 */
function matchCondition(contextValue, conditionDef, isArray = false) {
  // Simple string match, eg: method: "GET"
  if (typeof conditionDef === 'string')
    return isArray
      ? contextValue && contextValue.includes(conditionDef)
      : contextValue === conditionDef

  // Complex condition with or/and/or_not/and_not
  if (typeof conditionDef === 'object') {
    // Check for simple matcher: { is: "value", glob: "pattern", regex: "pattern" }
    if ('is' in conditionDef || 'glob' in conditionDef || 'regex' in conditionDef) {
      return matchPattern(contextValue, conditionDef, false, isArray)
    }
    // Check for simple NOT matcher: { is_not: "value", glob_not: "pattern", regex_not: "pattern" }
    if ('is_not' in conditionDef || 'glob_not' in conditionDef || 'regex_not' in conditionDef) {
      return matchPattern(contextValue, conditionDef, true, isArray)
    }
    // Check for logical operators
    if ('or' in conditionDef) return matchOr(contextValue, conditionDef.or, isArray)
    if ('and' in conditionDef) return matchAnd(contextValue, conditionDef.and, isArray)
    if ('or_not' in conditionDef) return !matchOr(contextValue, conditionDef.or_not, isArray)
    if ('and_not' in conditionDef) return !matchAnd(contextValue, conditionDef.and_not, isArray)
  }

  return false
}

/**
 * Matches OR logic - at least one must match
 *
 * @param {string|string[]} contextValue - The value from context (can be array for labels)
 * @param {*} conditions - The conditions to match
 * @param {boolean} isArray - Whether contextValue is an array (for labels)
 * @returns {boolean} - true if the rule matches
 */
function matchOr(contextValue, conditions, isArray) {
  // Ensure conditions is alway an array
  if (!Array.isArray(conditions)) conditions = [conditions]

  // If one matches, we're good
  return conditions.some((condition) => {
    if (typeof condition === 'string') {
      if (isArray) return contextValue && contextValue.includes(condition)
      else return contextValue === condition
    }
    if (typeof condition === 'object') return matchPattern(contextValue, condition, false, isArray)

    return false
  })
}

/**
 * Matches AND logic - all must match
 *
 * @param {string|string[]} contextValue - The value from context (can be array for labels)
 * @param {*} conditions - The conditions to match
 * @param {boolean} isArray - Whether contextValue is an array (for labels)
 * @returns {boolean} - true if the rule matches
 */
function matchAnd(contextValue, conditions, isArray) {
  // Ensure conditions is alway an array
  if (!Array.isArray(conditions)) conditions = [conditions]

  // All conditions have to match
  return conditions.every((condition) => {
    if (typeof condition === 'string') {
      if (isArray) return contextValue && contextValue.includes(condition)
      else return contextValue === condition
    }
    if (typeof condition === 'object') return matchPattern(contextValue, condition, false, isArray)

    return false
  })
}

/**
 * Matches a pattern (is/glob/regex) against a value
 *
 * @param {string|string[]} contextValue - The value to match against
 * @param {Object} pattern - Pattern definition with is/glob/regex or is_not/glob_not/regex_not
 * @param {boolean} negate - Whether this is a _not pattern
 * @param {boolean} isArray - Whether contextValue is an array
 * @returns {boolean}
 */
function matchPattern(contextValue, pattern, negate = false, isArray = false) {
  const matchFn = (value) => {
    // Exact match
    if (pattern.is !== undefined) return value === pattern.is
    if (pattern.is_not !== undefined) return value !== pattern.is_not

    // Glob match
    if (pattern.glob !== undefined) return minimatch(value, pattern.glob)
    if (pattern.glob_not !== undefined) return !minimatch(value, pattern.glob_not)

    // Regex match
    if (pattern.regex !== undefined) {
      try {
        return new RegExp(pattern.regex).test(value)
      } catch (e) {
        return false
      }
    }
    if (pattern.regex_not !== undefined) {
      try {
        return !new RegExp(pattern.regex_not).test(value)
      } catch (e) {
        return true // If regex is invalid, treat as not matching
      }
    }

    return false
  }

  if (isArray) {
    // For arrays (labels), check if ANY element matches
    const result = contextValue && contextValue.some(matchFn)
    return negate ? !result : result
  } else {
    const result = matchFn(contextValue)
    return negate ? !result : result
  }
}
