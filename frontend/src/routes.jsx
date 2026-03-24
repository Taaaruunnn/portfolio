import { createBrowserRouter } from 'react-router-dom'
import App from './App'

// Pages
import Home from '@/pages/Home'
import About from '@/pages/About'
import Projects from '@/pages/Projects'
import Skills from '@/pages/Skills'
import LabNotebook from '@/pages/LabNotebook'
import Blog from '@/pages/Blog'
import BlogPost from '@/pages/BlogPost'
import LiveLab from '@/pages/LiveLab'
import SecureAI from '@/pages/SecureAI'

// 404
function NotFound() {
    return (
        <main className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <div className="terminal-box" style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>404</div>
                <div style={{ color: 'var(--accent-orange)', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-3)' }}>
                    segmentation fault (core dumped)
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
                    The page you&#39;re looking for doesn&#39;t exist or has been moved.
                </div>
                <a href="/" className="cyber-btn" style={{ display: 'inline-flex' }}>← Return home</a>
            </div>
        </main>
    )
}

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            { index: true, element: <Home /> },
            { path: 'about', element: <About /> },
            { path: 'projects', element: <Projects /> },
            { path: 'skills', element: <Skills /> },
            { path: 'lab', element: <LabNotebook /> },
            { path: 'blog', element: <Blog /> },
            { path: 'blog/:slug', element: <BlogPost /> },
            { path: 'live-lab', element: <LiveLab /> },
            { path: 'secure-ai', element: <SecureAI /> },
            { path: '*', element: <NotFound /> },
        ],
    },
])
