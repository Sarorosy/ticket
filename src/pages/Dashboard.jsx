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

  const filteredTickets = tickets.filter((t) =>
    `${t.ticket_id} ${t.description} ${t.created_name} ${t.created_email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const statusColor = (status) => {
    if (status === 'open') return 'bg-green-100 text-green-700'
    if (status === 'closed') return 'bg-gray-200 text-gray-700'
    return 'bg-yellow-100 text-yellow-700'
  }

  const formatDate = (d) => {
    if (!d) return '—'
    try {
      // support 'YYYY-MM-DD HH:mm:ss' by converting space to T
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Tickets</h1>
          <p className="text-sm text-gray-500">Manage and track all support tickets</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={fetchTickets}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm shadow hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* States */}
      {loadingTickets && (
        <div className="text-center py-10 text-gray-500">Loading tickets...</div>
      )}

      {error && (
        <div className="bg-red-100 text-red-600 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {!loadingTickets && filteredTickets.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          No tickets found.
        </div>
      )}

      {/* Table Card */}
      {!loadingTickets && filteredTickets.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">

              <thead className="bg-gray-50 text-gray-600 uppercase text-xs sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left">Ticket</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Details</th>
                  {user?.role === 'admin' && (
                    <th className="px-4 py-3 text-left">Role</th>
                  )}
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-t border-gray-200 hover:bg-blue-50 transition"
                  >

                    {/* Ticket ID */}
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-800">
                        {ticket.ticket_id}
                      </div>
                      <div className="text-xs text-gray-400 capitalize">
                        {ticket.type}
                      </div>
                    </td>

                    {/* User */}
                    <td className="px-4 py-4">
                      <div className="text-gray-800 text-sm font-medium">
                        {ticket.created_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {ticket.created_email || 'Unknown'}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-4 max-w-sm">
                      <div
                        className="truncate text-gray-700"
                        title={ticket.description}
                      >
                        {ticket.description}
                      </div>

                      {ticket.type === 'external' && (
                        <div className="text-xs text-gray-400 mt-1">
                          {ticket.student_code} • Project #{ticket.project_id}
                        </div>
                      )}
                    </td>

                    {/* Role */}
                    {user?.role === 'admin' && (
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {ticket.role}
                        </span>
                      </td>
                    )}

                    {/* Action */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => openDetails(ticket.id ?? ticket.ticket_id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition"
                      >
                        View
                      </button>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-gray-500 text-xs">
                      {new Date(ticket.created_at).toLocaleString()}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  )
}

export default Dashboard