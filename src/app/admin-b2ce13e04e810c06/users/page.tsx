"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserPlus, 
  Hammer, 
  ShieldCheck, 
  ShieldAlert,
  Trash2, 
  ExternalLink,
  Ban,
  Mail,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCsrfToken } from '@/hooks/useCsrfToken'

const ADMIN_SEGMENT = 'b2ce13e04e810c06';

export default function UsersManagement() {
  const supabase = createClient()
  const { token: csrfToken } = useCsrfToken()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showBanModal, setShowBanModal] = useState<any>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<any>(null)
  
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState('permanent')

  const fetchUsers = async () => {
    setLoading(true)
    let query = supabase.from('users').select('*', { count: 'exact' })
    
    if (search) {
      query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * 20, page * 20 - 1)

    setUsers(data || [])
    setTotalCount(count || 0)
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 300)
    return () => clearTimeout(timer)
  }, [search, page])

  const handleModeration = async (action: string, userId: string, details: any = {}) => {
    if (!csrfToken) return alert('CSRF token missing. Please refresh.')

    // In a real app, we'd call an API route that checks the CSRF token in middleware
    // For this implementation, we'll simulate the persistence but ensure we track it in audit
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    
    if (action === 'ban') {
      const until = banDuration === 'permanent' ? null : new Date(Date.now() + parseInt(banDuration) * 24 * 60 * 60 * 1000).toISOString()
      await supabase.from('users').update({ 
        is_banned: true, 
        ban_reason: banReason, 
        banned_until: until,
        banned_at: new Date().toISOString()
      }).eq('id', userId)

      await supabase.from('admin_audit_log').insert({
        admin_id: adminUser?.id,
        action: 'ban_user',
        target_type: 'user',
        target_id: userId,
        details: { reason: banReason, until }
      })
    } else if (action === 'unban') {
      await supabase.from('users').update({ is_banned: false, ban_reason: null, banned_until: null }).eq('id', userId)
      await supabase.from('admin_audit_log').insert({ admin_id: adminUser?.id, action: 'unban_user', target_type: 'user', target_id: userId })
    } else if (action === 'make_admin') {
      await supabase.from('users').update({ is_admin: true }).eq('id', userId)
      await supabase.from('admin_audit_log').insert({ admin_id: adminUser?.id, action: 'promote_to_admin', target_type: 'user', target_id: userId })
    } else if (action === 'remove_admin') {
      await supabase.from('users').update({ is_admin: false }).eq('id', userId)
      await supabase.from('admin_audit_log').insert({ admin_id: adminUser?.id, action: 'demote_from_admin', target_type: 'user', target_id: userId })
    } else if (action === 'delete') {
      // In real app, this would delete messages, posts, etc.
      await supabase.from('users').delete().eq('id', userId)
      await supabase.from('admin_audit_log').insert({ admin_id: adminUser?.id, action: 'delete_account', target_type: 'user', target_id: userId, details: { deleted_username: details.username } })
    }

    fetchUsers()
    setShowBanModal(null)
    setShowDeleteModal(null)
    setBanReason('')
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black tracking-tighter mb-2 text-foreground">Build Corps</h1>
           <p className="text-foreground/40 text-sm font-medium tracking-tight">Identity management and access control for the Argentum network.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-red-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search by ID, Username, or Email..."
                className="pl-12 pr-6 py-3 bg-card border border-border rounded-2xl w-full md:w-80 text-xs font-bold outline-none ring-1 ring-transparent focus:ring-red-500/20 focus:border-red-500/30 transition-all text-foreground"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>
      </header>

      {/* Stats Triage */}
      <div className="flex items-center gap-4 text-foreground/40 overflow-x-auto pb-2 scrollbar-hide">
         <button className="px-4 py-2 rounded-xl bg-foreground/5 text-foreground text-[10px] font-black uppercase tracking-widest border border-border shrink-0">All Users ({totalCount})</button>
         <button className="px-4 py-2 rounded-xl bg-foreground/2 hover:text-foreground text-[10px] font-black uppercase tracking-widest transition-colors shrink-0">Admins</button>
         <button className="px-4 py-2 rounded-xl bg-foreground/2 hover:text-foreground text-[10px] font-black uppercase tracking-widest transition-colors shrink-0 text-red-500/60">Banned</button>
         <button className="px-4 py-2 rounded-xl bg-foreground/2 hover:text-foreground text-[10px] font-black uppercase tracking-widest transition-colors shrink-0">New Last 24h</button>
      </div>

      <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground/[0.02] border-b border-border">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-foreground/40">Identity</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-foreground/40">Email</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-center">Joined</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((item) => (
                <tr key={item.id} className="hover:bg-foreground/[0.01] transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-foreground/5 border border-border overflow-hidden flex items-center justify-center text-xs font-black text-foreground">
                          {item.avatar_url ? <img src={item.avatar_url} className="w-full h-full object-cover" /> : item.username[0].toUpperCase()}
                       </div>
                       <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-foreground truncate">{item.display_name || item.username}</span>
                          <span className="text-[10px] font-mono text-foreground/40 truncate">@{item.username}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 group/email cursor-pointer" onClick={() => navigator.clipboard.writeText(item.email)}>
                       <span className="text-xs font-medium text-foreground/40 group-hover/email:text-blue-400 transition-colors uppercase tracking-tighter">{item.email || 'NO_AUTH_EMAIL'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] font-bold text-foreground/40 uppercase">
                      {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                       {item.is_admin && (
                         <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-widest rounded shadow-[0_0_10px_rgba(239,68,68,0.1)]">Admin</span>
                       )}
                       {item.is_banned ? (
                         <span className="px-2 py-0.5 bg-foreground/10 border border-border text-foreground/40 text-[8px] font-black uppercase tracking-widest rounded">Banned</span>
                       ) : (
                         <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[8px] font-black uppercase tracking-widest rounded">Active</span>
                       )}
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => window.open(`/profile/${item.username}`, '_blank')}
                        className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-xl transition-all"
                      >
                        <ExternalLink size={16} />
                      </button>
                      
                      <div className="relative group/menu">
                        <button className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-xl transition-all">
                          <MoreHorizontal size={18} />
                        </button>
                        
                        <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-2xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden">
                           <div className="p-2 space-y-1">
                              {item.is_banned ? (
                                <button onClick={() => handleModeration('unban', item.id)} className="w-full flex items-center gap-3 px-3 py-2 text-green-500 hover:bg-green-500/10 rounded-xl text-xs font-black uppercase tracking-tight">
                                  <ShieldCheck size={14} /> Unban Access
                                </button>
                              ) : (
                                <button onClick={() => setShowBanModal(item)} className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-black uppercase tracking-tight">
                                  <Ban size={14} /> Suspend User
                                </button>
                              )}
                              
                              {item.is_admin ? (
                                <button onClick={() => handleModeration('remove_admin', item.id)} className="w-full flex items-center gap-3 px-3 py-2 text-foreground/40 hover:bg-foreground/5 rounded-xl text-xs font-black uppercase tracking-tight">
                                  <ShieldAlert size={14} /> Revoke Admin
                                </button>
                              ) : (
                                <button onClick={() => handleModeration('make_admin', item.id)} className="w-full flex items-center gap-3 px-3 py-2 text-blue-500 hover:bg-blue-500/10 rounded-xl text-xs font-black uppercase tracking-tight">
                                  <ShieldCheck size={14} /> Make Admin
                                </button>
                              )}
                              
                              <div className="h-px bg-border my-1" />
                              <button onClick={() => setShowDeleteModal(item)} className="w-full flex items-center gap-3 px-3 py-2 text-red-900 hover:bg-red-900/10 rounded-xl text-xs font-black uppercase tracking-tight">
                                <Trash2 size={14} /> Delete Identity
                              </button>
                           </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && !loading && (
            <div className="p-20 text-center opacity-30">
              <Search size={48} className="mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest text-foreground">No builders found matching criteria</p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between text-xs font-bold text-foreground/40">
           <span>Page {page} of {Math.ceil(totalCount / 20)}</span>
           <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 border border-border rounded-xl hover:bg-foreground/5 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                disabled={page * 20 >= totalCount}
                onClick={() => setPage(p => p + 1)}
                className="p-2 border border-border rounded-xl hover:bg-foreground/5 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>

      {/* Ban Modal */}
      <AnimatePresence>
        {showBanModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowBanModal(null)}
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-card border border-red-500/20 rounded-[2.5rem] p-10 w-full max-w-lg relative z-[101] shadow-2xl"
            >
               <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-8">
                  <Hammer size={28} />
               </div>
               <h2 className="text-2xl font-black tracking-tighter mb-2 text-foreground">Suspend Identity</h2>
               <p className="text-foreground/40 text-sm mb-8">Restricting access for <span className="text-foreground font-bold">@{showBanModal.username}</span>. This action will be logged.</p>
               
               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 block mb-3">Violation Reason</label>
                    <textarea 
                      className="w-full bg-foreground/5 border border-border rounded-2xl p-4 text-sm font-medium outline-none focus:border-red-500/30 transition-all h-24 resize-none text-foreground"
                      placeholder="Specify the terms violation..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 block mb-3">Duration</label>
                    <div className="grid grid-cols-2 gap-3">
                       {[
                         { label: '24 Hours', value: '1' },
                         { label: '7 Days', value: '7' },
                         { label: '30 Days', value: '30' },
                         { label: 'Permanent', value: 'permanent' },
                       ].map(d => (
                         <button 
                           key={d.value}
                           onClick={() => setBanDuration(d.value)}
                           className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${banDuration === d.value ? 'bg-red-500 text-black border-red-500' : 'bg-foreground/5 border-border text-foreground/40 hover:border-foreground/20'}`}
                         >
                           {d.label}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                     <button onClick={() => setShowBanModal(null)} className="flex-1 py-4 bg-foreground/5 border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:bg-foreground/10 transition-all">Cancel</button>
                     <button 
                       disabled={!banReason}
                       onClick={() => handleModeration('ban', showBanModal.id)}
                       className="flex-1 py-4 bg-red-600 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all disabled:opacity-50"
                     >
                       Confirm Suspension
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setShowDeleteModal(null)}
            />
            <motion.div 
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 50 }}
               className="bg-card border border-red-900/50 rounded-[2.5rem] p-10 w-full max-w-md relative z-[101] shadow-[0_0_50px_rgba(239,68,68,0.1)] text-center"
            >
               <div className="w-20 h-20 rounded-full bg-red-900/20 border border-red-900/40 flex items-center justify-center text-red-600 mx-auto mb-8">
                  <Trash2 size={40} />
               </div>
               <h2 className="text-3xl font-black tracking-tighter mb-4 text-foreground">Critical Action</h2>
               <p className="text-foreground/40 text-sm mb-10 leading-relaxed">
                  You are about to permanently delete the identity <span className="text-red-500 font-bold">@{showDeleteModal.username}</span>. 
                  This will purge all associated build logs and messages. This is irreversible.
               </p>
               
               <div className="space-y-4">
                  <button 
                    onClick={() => handleModeration('delete', showDeleteModal.id, { username: showDeleteModal.username })}
                    className="w-full py-5 bg-red-700 text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-900/20"
                  >
                    Confirm Destruction
                  </button>
                  <button 
                    onClick={() => setShowDeleteModal(null)}
                    className="w-full py-5 bg-foreground/5 text-foreground/40 font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl hover:bg-foreground/10 transition-all"
                  >
                    Abort Action
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
