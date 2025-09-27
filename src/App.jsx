import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-wide">
            Single <span className="text-brand-primary">Showcase</span>
          </h1>
          <nav className="flex gap-4 text-sm">
            <NavLink to="/submit" className={({isActive}) => isActive ? 'text-brand-primary' : 'text-white/80'}>Submit</NavLink>
            <NavLink to="/present" className={({isActive}) => isActive ? 'text-brand-primary' : 'text-white/80'}>Presentation</NavLink>
            <NavLink to="/admin" className={({isActive}) => isActive ? 'text-brand-primary' : 'text-white/80'}>Admin</NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-white/10 text-xs text-white/60">
        <div className="mx-auto max-w-6xl px-4 py-3">© {new Date().getFullYear()} Single Showcase</div>
      </footer>
    </div>
  )
}
