import { Outlet, ScrollRestoration } from 'react-router-dom'

import '@/styles/theme.css'
import '@/styles/animations.css'
import '@/styles/premium.css'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import CustomCursor from '@/components/ui/CustomCursor'
import './App.css'
import bgVideo from '@/assets/video.mp4'

export default function App() {
  return (
    <>
      <CustomCursor />
      <video
        autoPlay
        loop
        muted
        playsInline
        className="global-bg-video"
      >
        <source src={bgVideo} type="video/mp4" />
      </video>
      <div className="global-bg-overlay"></div>

      <ScrollRestoration />
      <Navbar />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <Footer />
    </>
  )
}
