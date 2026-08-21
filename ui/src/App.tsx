import { useEffect, useState } from 'react';
import Widget from './Widget.tsx';
import Terminal from './Terminal.tsx';

function App() {
  const [windowLabel, setWindowLabel] = useState<string>('terminal');

  useEffect(() => {
    // Check if we are running in Tauri
    const isTauri = typeof window !== 'undefined' && '__TAURI_METADATA__' in window;
    if (isTauri) {
      import('@tauri-apps/api/window').then(({ getCurrent }) => {
        setWindowLabel(getCurrent().label);
      }).catch((e) => {
        console.error("Failed to load Tauri window API:", e);
      });
    } else {
      // Non-tauri fallback: parse query param or default to terminal
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      if (view === 'widget' || view === 'terminal') {
        setWindowLabel(view);
      }
    }
  }, []);

  if (windowLabel === 'widget') {
    return <Widget />;
  }

  return <Terminal />;
}

export default App;
