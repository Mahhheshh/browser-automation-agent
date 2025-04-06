import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import Layout from './components/layout.tsx'
import { WSProvider } from './components/wsProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WSProvider>
      <Layout >
        <App />
      </Layout>
    </WSProvider>
  </StrictMode>,
)
