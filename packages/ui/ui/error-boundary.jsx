import { Component } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { Button } from './button'

function DefaultFallback() {
  const { t } = useTranslation()
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center shadow-soft"
    >
      <h2 className="text-[16px] font-semibold text-foreground">{t('common.crash_title')}</h2>
      <p className="max-w-md text-[14px] text-muted-foreground">{t('common.crash_desc')}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.location.reload()}
        className="mt-1 gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        {t('common.reload')}
      </Button>
    </div>
  )
}

/**
 * Catches render-time exceptions in its subtree and shows a fallback instead of
 * unmounting the whole app (white screen). Reset by remounting via `resetKey`.
 */
export class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Uncaught render error:', error, info)
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? <DefaultFallback />
    return this.props.children
  }
}
