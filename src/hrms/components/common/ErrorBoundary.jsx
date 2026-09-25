import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, Compass } from 'lucide-react';
import { Button } from './Button';
export class ErrorBoundary extends Component {
    state = {
        hasError: false,
        error: null,
        errorInfo: null,
    };
    static getDerivedStateFromError(error) {
        return { hasError: true, error, errorInfo: null };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Bansal Geo HRMS ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }
    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };
    handleGoHome = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/hr';
    };
    render() {
        if (this.state.hasError) {
            return (<div className="min-h-screen bg-[#F4F7F8] dark:bg-[#0D161F] text-slate-900 dark:text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#14202C] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#C8943A] mx-auto flex items-center justify-center shadow-xs">
              <Compass className="w-8 h-8 animate-spin-slow"/>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 mb-2">
                <AlertTriangle className="w-3.5 h-3.5"/>
                <span>Application Recovery</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Something went wrong
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                The application encountered an unexpected issue while rendering this page. You can reload or return to the dashboard safely.
              </p>
            </div>

            {this.state.error && (<div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1721] border border-slate-200/80 dark:border-slate-800 text-left text-xs font-mono text-slate-600 dark:text-slate-400 max-h-28 overflow-y-auto">
                <span className="text-rose-600 dark:text-rose-400 font-bold block mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </span>
              </div>)}

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <Button variant="outline" size="md" onClick={this.handleReset} className="w-full font-semibold border-slate-300 dark:border-slate-700" leftIcon={<RefreshCw className="w-4 h-4"/>}>
                Reload Page
              </Button>
              <Button variant="primary" size="md" onClick={this.handleGoHome} className="w-full font-bold bg-[#1F6F78] hover:bg-[#175960]" leftIcon={<Home className="w-4 h-4"/>}>
                Back to Dashboard
              </Button>
            </div>

            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              Bansal Geo Solutions HRMS • Auto-Recover System
            </p>
          </div>
        </div>);
        }
        return this.props.children;
    }
}
