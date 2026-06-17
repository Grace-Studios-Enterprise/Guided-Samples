'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, FolderOpen, LogOut, Sparkles, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { listProjects, deleteProject } from '@/lib/projects'
import type { Project } from '@/lib/projects'

interface Props {
  onNewProject: () => void
  onOpenProject: (projectId: string) => void
  onBack: () => void
}

export default function ProjectsDashboard({ onNewProject, onOpenProject, onBack }: Props) {
  const { user, signOut } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    listProjects(user.id).then(p => { setProjects(p); setLoading(false) })
  }, [user])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this project?')) return
    await deleteProject(id)
    setProjects(ps => ps.filter(p => p.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-green flex items-center justify-center">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">GRACE Enterprise</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block">{user?.name} · {user?.email}</span>
            <button onClick={onBack}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
              <ArrowLeft size={13}/> Back
            </button>
            <button onClick={signOut}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
              <LogOut size={13}/> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
            <p className="text-sm text-gray-500 mt-1">Pick up where you left off, or start something new.</p>
          </div>
          <button onClick={onNewProject} className="btn-primary flex items-center gap-2">
            <Plus size={14}/> New Project
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin text-brand-green"/>
            <span className="text-sm">Loading projects…</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-brand-green/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={28} className="text-brand-green"/>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No projects yet</h3>
            <p className="text-xs text-gray-400 mb-6">Create your first design to get started.</p>
            <button onClick={onNewProject} className="btn-primary flex items-center gap-2 mx-auto">
              <Plus size={14}/> Start First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* New project card */}
            <button onClick={onNewProject}
              className="card border-dashed border-2 border-slate-200 hover:border-brand-green flex flex-col items-center justify-center py-10 gap-3 text-gray-400 hover:text-brand-green transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-brand-green/10 flex items-center justify-center transition-colors">
                <Plus size={20}/>
              </div>
              <span className="text-xs font-medium">New Project</span>
            </button>

            {projects.map(project => (
              <div key={project.id} onClick={() => onOpenProject(project.id)}
                className="card hover:border-brand-green/30 cursor-pointer transition-colors group relative overflow-hidden">
                {/* Thumbnail */}
                <div className="bg-slate-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden" style={{ height: 140 }}>
                  {project.thumbnail_url ? (
                    <img src={project.thumbnail_url} alt={project.name}
                      className="w-full h-full object-contain p-3"/>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <FolderOpen size={28}/>
                      <span className="text-[10px]">No preview</span>
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{project.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Phase {project.phase_reached} · {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={e => handleDelete(project.id, e)}
                    className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5">
                    <Trash2 size={13}/>
                  </button>
                </div>

                {/* Phase progress bar */}
                <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-green rounded-full transition-all"
                    style={{ width: `${(project.phase_reached / 6) * 100}%` }}/>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{project.phase_reached}/6 phases complete</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
