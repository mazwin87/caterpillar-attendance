import { vi } from 'vitest'

/**
 * Creates a chainable Supabase query builder that resolves to `result`.
 * Chain methods return `self`, terminal methods resolve the promise.
 * The builder is also thenable so `await builder` works without `.single()`.
 */
export function makeQueryBuilder(result = { data: null, error: null }) {
  const self = {
    select:      () => self,
    eq:          () => self,
    neq:         () => self,
    in:          () => self,
    gte:         () => self,
    lte:         () => self,
    is:          () => self,
    filter:      () => self,
    order:       () => self,
    limit:       () => self,
    inner:       () => self,
    insert:      () => self,
    update:      () => self,
    delete:      () => self,
    upsert:      () => self,
    single:      () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
    then:        (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch:       (fn) => Promise.resolve(result).catch(fn),
    finally:     (fn) => Promise.resolve(result).finally(fn),
  }
  return self
}

/** Shorthand for a successful query result */
export const ok = (data) => makeQueryBuilder({ data, error: null })

/** Shorthand for a failed query result */
export const fail = (msg) => makeQueryBuilder({ data: null, error: { message: msg } })
