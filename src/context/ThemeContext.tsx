"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'glass'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  const applyTheme = (newTheme: Theme) => {
    document.documentElement.classList.remove('light', 'dark', 'glass')
    document.documentElement.classList.add(newTheme)
    setThemeState(newTheme)
    localStorage.setItem('ag_theme', newTheme)
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('ag_theme') as Theme
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const initialTheme = savedTheme || systemTheme
    
    applyTheme(initialTheme)
  }, [])

  const toggleTheme = () => {
    const nextTheme: Theme = 
      theme === 'light' ? 'dark' : 
      theme === 'dark' ? 'glass' : 'light'
    applyTheme(nextTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
