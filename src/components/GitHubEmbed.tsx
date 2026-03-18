"use client"

import { Star, GitFork, Book } from 'lucide-react'

interface GitHubEmbedProps {
  repoName: string
  stars: number
  forks: number
  language: string
  description?: string
}

export default function GitHubEmbed({ repoName, stars, forks, language, description }: GitHubEmbedProps) {
  return (
    <a 
      href={`https://github.com/${repoName}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block group mt-3 bg-card border border-border rounded-xl p-4 hover:border-foreground/20 transition-all hover:bg-foreground/5"
    >
      <div className="flex items-center gap-2 mb-2">
        <Book size={16} className="text-foreground/40 group-hover:text-foreground transition-colors" />
        <span className="text-sm font-bold text-blue-500 group-hover:underline truncate">{repoName}</span>
      </div>
      
      {description && (
        <p className="text-xs text-foreground/50 mb-4 line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-[10px] font-bold text-foreground/40">{language}</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-foreground/40">
          <Star size={12} />
          <span className="text-[10px] font-black">{stars}</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-foreground/40">
          <GitFork size={12} />
          <span className="text-[10px] font-black">{forks}</span>
        </div>
      </div>
    </a>
  )
}
