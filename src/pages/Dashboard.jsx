import React, { useEffect, useState } from 'react'
import { API_BASE_URL } from '../utils/constants'
import { useAuth } from '../utils/idb'
import TicketDetails from '../components/TicketDetails'

function Dashboard() {
  const { user, loading } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [offcanvasOpen, setOffcanvasOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(null)
  const [detail, setDetail] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState(null)
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [updating, setUpdating] = useState(false)

  const fetchTickets = async () => {
    setLoadingTickets(true)
    setError(null)
    try {
      const res = await fetch(API_BASE_URL + '/fetchtickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (user?.id || user?.st_id) ?? null,
          role: user?.role ?? null,
        }),
      })

      if (!res.ok) throw new Error('Network response was not ok')
      const data = await res.json().catch(() => ({}))

      if (Array.isArray(data.tickets)) setTickets(data.tickets)
      else if (Array.isArray(data.data)) setTickets(data.data)
      else if (Array.isArray(data)) setTickets(data)
      else setTickets([])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to fetch tickets')
    } finally {
      setLoadingTickets(false)
    }
  }

  useEffect(() => {
    if (!loading && user) fetchTickets()
  }, [user, loading])

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const filteredTickets = tickets.filter((t) =>
    `${t.ticket_id} ${t.description} ${t.created_name} ${t.created_email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentTickets = filteredTickets.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage)

  const statusColor = (status) => {
    if (status === 'open') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (status === 'closed') return 'bg-slate-100 text-slate-600 border-slate-200'
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }

  const statusDot = (status) => {
    if (status === 'open') return 'bg-emerald-500'
    if (status === 'closed') return 'bg-slate-400'
    return 'bg-amber-500'
  }

  const formatDate = (d) => {
    if (!d) return '—'
    try {
      return new Date(String(d).replace(' ', 'T')).toLocaleString()
    } catch (e) {
      return d
    }
  }

  const openDetails = async (ticketId) => {
    setOffcanvasOpen(true)
    setDetail(null)
    setDetailError(null)
    setDetailLoading(true)

    try {
      const res = await fetch(API_BASE_URL + '/fetchticketbyid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, userId: user?.id ?? null, role: user?.role ?? null }),
      })

      if (!res.ok) throw new Error('Network response was not ok')
      const data = await res.json().catch(() => ({}))

      if (data.ticket) setDetail(data.ticket)
      else if (data.data) setDetail(data.data)
      else setDetail(data)
    } catch (err) {
      console.error(err)
      setDetailError(err.message || 'Failed to fetch ticket details')
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetails = () => {
    setOffcanvasOpen(false)
    setDetail(null)
    setDetailError(null)
    setDetailLoading(false)
  }

  // Edit ticket functions
  const openEditModal = (ticket) => {
    setEditingTicket(ticket)
    setEditDescription(ticket.description || '')
    setEditStatus(ticket.status || 'open')
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditingTicket(null)
    setEditDescription('')
    setEditStatus('')
    setUpdating(false)
  }

  const handleUpdateTicket = async () => {
    if (!editingTicket) return
    
    setUpdating(true)
    try {
      const res = await fetch(API_BASE_URL + '/updateticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: editingTicket.id,
          description: editDescription,
          status: editStatus,
          userId: user?.id ?? null,
          role: user?.role ?? null,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || (data && data.status === false)) {
        const msg = (data && data.message) || 'Failed to update ticket'
        toast.error(msg)
        return
      }

      toast.success('Ticket updated successfully')
      fetchTickets() // Refresh the list
      closeEditModal()
    } catch (err) {
      console.error(err)
      toast.error(err?.message || 'Network error while updating ticket')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto px-6 py-8" style={{ maxWidth: "calc(100% - 150px)" }}>
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Manage Tickets
              </h1>
              <p className="text-slate-500 text-sm mt-1">Manage and track all support requests</p>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-64 transition-all"
                />
              </div>

              <button
                onClick={fetchTickets}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${loadingTickets ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loadingTickets && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 text-sm">Loading tickets...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loadingTickets && filteredTickets.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No tickets found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search</p>
          </div>
        )}

        {/* Modern Table */}
        {!loadingTickets && filteredTickets.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Ticket</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">User</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Details</th>
                    {user?.role === 'admin' && (
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Role</th>
                    )}
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
                    <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentTickets.map((ticket, idx) => (
                    <tr 
                      key={ticket.id} 
                      className="group hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-transparent transition-all duration-200"
                    >
                      {/* Ticket ID */}
                      <td className="px-5 py-4">
                        <div className="font-mono font-semibold text-slate-800 text-sm">
                          {ticket.ticket_id}
                        </div>
                        <div className="inline-flex mt-1">
                          <span className="text-xs text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded-full">
                            {ticket.type}
                          </span>
                        </div>
                        </td>

                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="text-slate-800 text-sm font-medium">
                          {ticket.created_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {ticket.created_email || 'Unknown'}
                        </div>
                        </td>

                      {/* Description */}
                      <td className="px-5 py-4">
                        <div className="text-slate-600 text-sm max-w-xs truncate" title={ticket.description}>
                          {ticket.description}
                        </div>
                        {ticket.type === 'external' && (
                          <div className="text-xs text-slate-400 mt-1">
                            {ticket.student_code} • #{ticket.project_id}
                          </div>
                        )}
                        </td>

                      {/* Role - Admin only */}
                      {user?.role === 'admin' && (
                        <td className="px-5 py-4">
                          <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            {ticket.role}
                          </span>
                          </td>
                      )}

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusColor(ticket.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot(ticket.status)}`}></span>
                          {ticket.status}
                        </span>
                        </td>

                      {/* Date */}
                      <td className="px-5 py-4">
                        <div className="text-slate-500 text-xs">
                          {formatDate(ticket.created_at)}
                        </div>
                        </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* View Button */}
                          <button
                            onClick={() => openDetails(ticket.id ?? ticket.ticket_id)}
                            className="p-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          
                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(ticket)}
                            className="p-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-all shadow-sm hover:shadow-md"
                            title="Edit Ticket"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  Showing <span className="font-medium text-slate-700">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium text-slate-700">{Math.min(indexOfLastItem, filteredTickets.length)}</span>{' '}
                  of <span className="font-medium text-slate-700">{filteredTickets.length}</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      currentPage === 1
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white text-slate-700 hover:bg-slate-100 shadow-sm'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) pageNum = i + 1
                    else if (currentPage <= 3) pageNum = i + 1
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                    else pageNum = currentPage - 2 + i
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                            : 'bg-white text-slate-700 hover:bg-slate-100 shadow-sm'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      currentPage === totalPages
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white text-slate-700 hover:bg-slate-100 shadow-sm'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <TicketDetails
          offcanvasOpen={offcanvasOpen}
          closeDetails={closeDetails}
          detailLoading={detailLoading}
          detailError={detailError}
          detail={detail}
          finalFunction={fetchTickets}
        />

        {/* Edit Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeEditModal} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-modal-slide-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800">Edit Ticket</h3>
                <button
                  onClick={closeEditModal}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Ticket ID
                  </label>
                  <input
                    type="text"
                    value={editingTicket?.ticket_id || ''}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Enter ticket description..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateTicket}
                  disabled={updating}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-slide-in {
          animation: modalSlideIn 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}

export default Dashboard