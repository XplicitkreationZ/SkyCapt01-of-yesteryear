import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props){
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error){
    return { hasError: true, error };
  }
  componentDidCatch(error, info){
    console.error("App error:", error, info);
  }
  render(){
    if(this.state.hasError){
      return (
        <div data-testid="error-boundary" className="min-h-screen flex items-center justify-center bg-black text-white p-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-zinc-300 text-sm mb-4">Please refresh the page. If this persists, let us know.</p>
            <pre className="text-xs text-zinc-500 overflow-auto max-h-40">{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
