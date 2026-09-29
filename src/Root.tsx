import { useEffect, useState } from 'react'
import App from './App.tsx'
import ReadingPage from './pages/ReadingPage.tsx'

// Minimal hash routing so pages work under any deploy base path
function Root() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return hash === '#/read' ? <ReadingPage /> : <App />
}

export default Root
