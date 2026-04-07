import React, { useState } from 'react'
import { BASE_URL, API_BASE_URL } from '../utils/constants'
import { useAuth } from '../utils/idb'
import toast from 'react-hot-toast'
import { X, User, Calendar, Tag, FileText, ExternalLink, Clock, MessageSquare, Send, CheckCircle, AlertCircle, Loader2, Paperclip, ChevronRight } from 'lucide-react'

const formatDate = (d) => {
    if (!d) return '—'
    try {
        return new Date(String(d).replace(' ', 'T')).toLocaleString()
    } catch (e) {
        return d
    }
}

export default function TicketDetails({
    offcanvasOpen,
    closeDetails,
    detailLoading,
    detailError,
    detail,
    finalFunction
}) {
    if (!offcanvasOpen) return null

    const { user } = useAuth();
    const [showCommentBox, setShowCommentBox] = useState(false)
    const [actionTarget, setActionTarget] = useState(null)
    const [comment, setComment] = useState('')
    const [saving, setSaving] = useState(false)
    const [actionError, setActionError] = useState(null);

    const openAction = (target) => {
        setActionError(null)
        if (target === 'in_progress') {
            const ok = window.confirm('Mark ticket as In Progress?')
            if (!ok) return
            saveAction(target)
            return
        }
        setActionTarget(target)
        setShowCommentBox(true)
        setComment('')
    }

    const cancelAction = () => {
        setShowCommentBox(false)
        setActionTarget(null)
        setComment('')
        setActionError(null)
    }

    const saveAction = async (overrideTarget) => {
        if (!detail) return
        setSaving(true)
        setActionError(null)
        const target = overrideTarget || actionTarget
        const newStatus = target === 'in_progress' ? 'in_progress' : 'closed'
        try {
            const res = await fetch(API_BASE_URL + '/updateticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId: detail.id,
                    status: newStatus,
                    comment: target === 'in_progress' ? null : (comment || null),
                    userId: user?.id ?? null,
                    role: user?.role ?? null,
                }),
            })

            const data = await res.json().catch(() => ({}))

            if (!res.ok || (data && data.status === false)) {
                const msg = (data && data.message) || 'Failed to update ticket'
                throw new Error(msg)
            }

            toast.success((data && data.message) || 'Ticket updated')

            if (detail) {
                detail.status = newStatus
                const entry = {
                    id: data && data.historyId ? data.historyId : Date.now(),
                    comment: comment || `${user?.name || 'Agent'} updated status to ${newStatus}`,
                    created_at: new Date().toISOString(),
                }
                detail.history = Array.isArray(detail.history) ? [...detail.history, entry] : [entry]
            }

            cancelAction()
        } catch (err) {
            setActionError(err?.message || 'Failed to save')
            toast.error(err?.message || 'Failed to save')
        } finally {
            setSaving(false);
            finalFunction();
        }
    }

    const statusConfig = {
        open: { label: 'Open', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
        in_progress: { label: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
        closed: { label: 'Closed', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' }
    }

    const currentStatus = statusConfig[detail?.status] || statusConfig.open

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" 
                onClick={closeDetails} 
            />
            
            {/* Side Panel */}
            <div className="absolute right-0 top-0 h-full w-full md:w-[600px] lg:w-[700px] bg-white shadow-2xl overflow-y-auto animate-slide-in">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Ticket Details</h2>
                        <p className="text-xs text-slate-500 mt-0.5">View and manage ticket information</p>
                    </div>
                    <button 
                        onClick={closeDetails} 
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                    >
                        <X size={16} className="text-slate-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {detailLoading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
                            <p className="text-slate-500 text-sm">Loading ticket details...</p>
                        </div>
                    )}

                    {detailError && (
                        <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={18} className="text-red-600" />
                                <p className="text-red-700 text-sm">{detailError}</p>
                            </div>
                        </div>
                    )}

                    {detail && (
                        <div className="space-y-6">
                            {/* Header Section */}
                            <div className="flex items-start justify-between flex-wrap gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-sm font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                                            {detail.ticket_id}
                                        </span>
                                        <span className="text-xs text-slate-400 capitalize bg-slate-50 px-2 py-0.5 rounded-full">
                                            {detail.type}
                                        </span>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${currentStatus.color}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`}></span>
                                    {currentStatus.label}
                                </span>
                            </div>

                            {/* Two Column Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50 rounded-xl p-4">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                            <User size={12} /> Created By
                                        </p>
                                        <p className="text-sm font-medium text-slate-800">{detail.created_name}</p>
                                        <p className="text-xs text-slate-500">{detail.created_email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                            <User size={12} /> Assigned To
                                        </p>
                                        <p className="text-sm font-medium text-slate-800">{detail.assigned_name || 'Unassigned'}</p>
                                        <p className="text-xs text-slate-500">{detail.assigned_email || '—'}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                            <Calendar size={12} /> Created At
                                        </p>
                                        <p className="text-sm text-slate-800">{detail.created_at ? formatDate(detail.created_at) : '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                            <Tag size={12} /> Role
                                        </p>
                                        <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                            {detail.role}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons - Agent only */}
                            {user?.role === 'agent' && (
                                <div className="border-t border-slate-100 pt-4">
                                    {!showCommentBox && detail?.status === 'open' && (
                                        <button 
                                            onClick={() => openAction('in_progress')} 
                                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
                                        >
                                            <Clock size={16} />
                                            Mark as In Progress
                                        </button>
                                    )}

                                    {!showCommentBox && detail?.status === 'in_progress' && (
                                        <button 
                                            onClick={() => openAction('closed')} 
                                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
                                        >
                                            <CheckCircle size={16} />
                                            Close Ticket
                                        </button>
                                    )}

                                    {showCommentBox && (
                                        <div className="space-y-3 bg-slate-50 rounded-xl p-4">
                                            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <MessageSquare size={16} />
                                                Add Comment
                                            </p>
                                            <textarea 
                                                value={comment} 
                                                onChange={(e) => setComment(e.target.value)} 
                                                rows={4} 
                                                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                                placeholder="Enter your comments here..."
                                            />
                                            {actionError && (
                                                <div className="text-red-600 text-sm flex items-center gap-1">
                                                    <AlertCircle size={14} />
                                                    {actionError}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={saveAction} 
                                                    disabled={saving} 
                                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-md transition-all disabled:opacity-60"
                                                >
                                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                                    {saving ? 'Saving...' : 'Save Comment'}
                                                </button>
                                                <button 
                                                    onClick={cancelAction} 
                                                    disabled={saving} 
                                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Description Section */}
                            <div>
                                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <FileText size={16} />
                                    Description
                                </p>
                                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-100">
                                    {detail.description}
                                </div>
                            </div>

                            {/* External Details */}
                            {detail.type === 'external' && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-blue-600 mb-3 flex items-center gap-1">
                                        <ExternalLink size={12} />
                                        External Details
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500 w-28">Student Code:</span>
                                            <span className="font-mono text-slate-700">{detail.student_code}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500 w-28">Project ID:</span>
                                            <span className="font-mono text-slate-700">{detail.project_id}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500 w-28">Milestone ID:</span>
                                            <span className="font-mono text-slate-700">{detail.milestone_id}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Attachment */}
                            {detail.file && (
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                        <Paperclip size={16} />
                                        Attachment
                                    </p>
                                    <a 
                                        href={`${BASE_URL}/public/ticket/${detail.file}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-all shadow-sm"
                                    >
                                        <ExternalLink size={14} />
                                        View File
                                        <ChevronRight size={14} />
                                    </a>
                                </div>
                            )}

                            {/* History Section */}
                            {detail.history && detail.history.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <Clock size={16} />
                                        History
                                    </p>
                                    <div className="space-y-3">
                                        {detail.history.slice().reverse().map((h, idx) => (
                                            <div key={h.id || idx} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-xs text-slate-500 mb-1">
                                                            {formatDate(h.created_at)}
                                                        </div>
                                                        <div className="text-sm text-slate-700">
                                                            {h.comment}
                                                        </div>
                                                        {h.agent_comments && (
                                                            <div className="text-sm text-slate-500 mt-2 pt-2 border-t border-slate-200">
                                                                Agent Comments: {h.agent_comments}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                .animate-slide-in {
                    animation: slideIn 0.3s ease-out;
                }
            `}</style>
        </div>
    )
}