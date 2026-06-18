import { useEffect } from 'react';

/* ================================================================== */
/*  Scroll Lock Hook                                                   */
/*  Ref-counted body-scroll lock so stacked modals don't fight over    */
/*  document.body.style.overflow. The first active lock records the     */
/*  prior overflow value and sets 'hidden'; the body is only restored   */
/*  to that saved value once the LAST lock releases (counter -> 0).     */
/* ================================================================== */

let locks = 0;
let prevOverflow = '';

/**
 * Locks body scroll while `active` is true. Multiple concurrent callers are
 * ref-counted: scroll stays locked until every active lock releases, then the
 * original `overflow` value (not a hardcoded `'unset'`) is restored. SSR-safe.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined;

    if (locks === 0) {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    locks += 1;

    return () => {
      locks = Math.max(0, locks - 1);
      if (locks === 0) {
        document.body.style.overflow = prevOverflow;
      }
    };
  }, [active]);
}
