import { useSearchParams } from 'react-router-dom'

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

export const tabLink = (path, tab) => `${path}?tab=${encodeURIComponent(tab)}`
