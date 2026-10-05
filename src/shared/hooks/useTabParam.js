import { useSearchParams } from 'react-router-dom'

/*
 * The active tab of a list, kept in the URL (?tab=…) so stat cards and other pages can link straight
 * to a filtered view. Other query params (stage, view) are left as they are.
 */
export function useTabParam(tabs, fallback) {
  const [params, setParams] = useSearchParams()
  const tab = tabs.includes(params.get('tab')) ? params.get('tab') : fallback
  const setTab = (next) => {
    const nextParams = new URLSearchParams(params)
    if (next === fallback) nextParams.delete('tab')
    else nextParams.set('tab', next)
    setParams(nextParams, { replace: true })
  }
  return [tab, setTab]
}

/* Link target for a tab of a list page. */
export const tabLink = (path, tab) => `${path}?tab=${encodeURIComponent(tab)}`
