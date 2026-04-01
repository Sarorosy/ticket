import React, { useState } from 'react'
import { BASE_URL, API_BASE_URL } from '../utils/constants'
import { useAuth } from '../utils/idb'
import toast from 'react-hot-toast'

const formatDate = (d) => {
    if (!d) return '—'
    try {
        // support 'YYYY-MM-DD HH:mm:ss' by converting space to T
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
            // Directly save without showing comment box for in_progress
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

            // Update local detail object so UI reflects change immediately
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

    return (
        <div className="fixed inset-0 z-10 flex">
            <div className="absolute inset-0 bg-black/40" onClick={closeDetails} />
            <div className="z-50 ml-auto w-full md:w-1/3 bg-white h-full shadow-lg overflow-auto p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Ticket details</h2>
                    <button onClick={closeDetails} className="text-gray-500 hover:text-gray-800">Close</button>
                </div>

                {detailLoading && <div className="text-gray-500">Loading details...</div>}
                {detailError && <div className="bg-red-100 text-red-600 px-3 py-2 rounded">{detailError}</div>}

                {detail && (
                    <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">

                        <div className="flex items-start justify-between flex-wrap gap-3">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">{detail.ticket_id}</h2>
                                <p className="text-sm text-gray-500 capitalize">{detail.type} ticket</p>
                            </div>

                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${detail.status === 'open'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-200 text-gray-700'
                                }`}>
                                {detail.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Created By</p>
                                    <p className="text-sm font-medium text-gray-800">{detail.created_name}</p>
                                    <p className="text-xs text-gray-500">{detail.created_email}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Assigned To</p>
                                    <p className="text-sm font-medium text-gray-800">{detail.assigned_name || 'Unassigned'}</p>
                                    <p className="text-xs text-gray-500">{detail.assigned_email || '—'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Created At</p>
                                    <p className="text-sm text-gray-800">{detail.created_at ? formatDate(detail.created_at) : '—'}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Role</p>
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{detail.role}</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t" />

                        {user?.role == 'agent' && (
                            <div>
                                {!showCommentBox && detail?.status === 'open' && (
                                    <button onClick={() => openAction('in_progress')} className="inline-block px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Mark as In Progress</button>
                                )}

                                {!showCommentBox && detail?.status === 'in_progress' && (
                                    <button onClick={() => openAction('closed')} className="inline-block px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Close Ticket</button>
                                )}

                                {showCommentBox && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-700">Comment</p>
                                        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} className="w-full border rounded-lg p-2 text-sm" />
                                        {actionError && <div className="text-red-600 text-sm">{actionError}</div>}
                                        <div className="flex items-center gap-2">
                                            <button onClick={saveAction} disabled={saving} className="inline-block px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition">{saving ? 'Saving...' : 'Save'}</button>
                                            <button onClick={cancelAction} disabled={saving} className="inline-block px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg">Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
                            <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{detail.description}</div>
                        </div>

                        {detail.type === 'external' && (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                <p className="text-xs text-blue-500 mb-2 font-medium">External Details</p>
                                <div className="text-sm text-gray-700 space-y-1">
                                    <div><strong>Student Code:</strong> {detail.student_code}</div>
                                    <div><strong>Project ID:</strong> {detail.project_id}</div>
                                    <div><strong>Milestone ID:</strong> {detail.milestone_id}</div>
                                </div>
                            </div>
                        )}

                        {detail.file && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Attachment</p>
                                <a href={`${BASE_URL}/public/ticket/${detail.file}`} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-black transition">View File</a>
                            </div>
                        )}

                        {detail.history && detail.history.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">History</p>
                                <div className="space-y-2">
                                    {detail.history.slice().map((h) => (
                                        <>
                                            <div key={h.id} className="flex flex-col items-start gap-3 bg-gray-50 border rounded-lg p-3">
                                                <div className="flex">
                                                    <div className="text-xs text-gray-500 w-36">{formatDate(h.created_at)}</div>
                                                    <div className="text-sm text-gray-700">{h.comment}</div>
                                                </div>
                                            {h.agent_comments && <div className="text-sm text-gray-500 mt-1">Agent Comments: {h.agent_comments}</div>}
                                            </div>
                                        </>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    )
}
