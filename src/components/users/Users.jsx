import { useState, useEffect, useRef } from "react";
import { Edit3, PlusCircle, Trash2, Search, UserPlus, Users as UsersIcon, Mail, Shield, X, Loader2 } from "lucide-react";
import { API_BASE_URL } from "../../utils/constants";
import Offcanvas from "../../components/Offcanvas";
import AddUser from "./AddUser";
import EditUser from "./EditUser";

export default function Users() {
  const [users, setUsers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const deleteUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const mountedRef = useRef(true);

  const fetchUsers = () => {
    setLoading(true);
    fetch(API_BASE_URL + '/users')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (!mountedRef.current) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data && data.users)
          ? data.users
          : [];
        setUsers(list);
      })
      .catch((err) => {
        if (mountedRef.current) {
          console.error('Failed to fetch users', err);
          setUsers([]);
        }
      })
      .finally(() => { if (mountedRef.current) setLoading(false); });
  };

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const openAdd = () => { setSelectedUser(null); setDrawerMode('add'); setDrawerOpen(true); };
  const openEdit = (user) => { setSelectedUser(user); setDrawerMode('edit'); setDrawerOpen(true); };
  const openDelete = (user) => { setSelectedUser(user); setDrawerMode('delete'); setDrawerOpen(true); };

  const closeDrawer = () => { setDrawerOpen(false); setDrawerMode(null); setSelectedUser(null); };

  const handleAddSave = (newUser) => {
    fetchUsers();
    closeDrawer();
  };

  const handleEditSave = (updated) => {
    fetchUsers();
    closeDrawer();
  };

  const handleDeleteConfirm = (id) => {
    fetch(API_BASE_URL + '/user/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(() => {
        fetchUsers();
        closeDrawer();
      })
      .catch((err) => {
        console.error('Failed to delete user', err);
        alert('Failed to delete user. Please try again.');
      });
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchUsers();
    return () => { mountedRef.current = false; };
  }, []);

  const filteredUsers = users.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className="animate-spin text-blue-600" />
          <p className="text-slate-500 text-sm">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <UsersIcon size={20} className="text-white" />
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    User Management
                  </h1>
                </div>
                <p className="text-slate-500 text-sm ml-13">
                  Manage and control all system users
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-64 transition-all"
                    aria-label="Search users"
                  />
                </div>
                <button
                  onClick={openAdd}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all"
                >
                  <UserPlus size={16} />
                  Add User
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {users.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl px-5 py-3 shadow-sm border border-slate-100">
                <p className="text-xs text-slate-500">Total Users</p>
                <p className="text-2xl font-bold text-slate-800">{users.length}</p>
              </div>
              <div className="bg-white rounded-xl px-5 py-3 shadow-sm border border-slate-100">
                <p className="text-xs text-slate-500">Active</p>
                <p className="text-2xl font-bold text-emerald-600">{users.filter(u => u.status !== 'inactive').length}</p>
              </div>
              <div className="bg-white rounded-xl px-5 py-3 shadow-sm border border-slate-100">
                <p className="text-xs text-slate-500">Search Results</p>
                <p className="text-2xl font-bold text-blue-600">{filteredUsers.length}</p>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            {users.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UsersIcon size={32} className="text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">No users yet</p>
                <p className="text-slate-400 text-sm mt-1">Get started by creating your first user</p>
                <button 
                  onClick={openAdd} 
                  className="mt-4 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <UserPlus size={16} />
                  Create first user
                </button>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Email</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u, idx) => (
                        <tr 
                          key={u.id} 
                          className="group hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-transparent transition-all duration-200"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                <span className="text-white font-semibold text-sm">
                                  {((u.name || '')
                                    .split(' ')
                                    .map((s) => s[0])
                                    .join('')
                                    .slice(0, 2) || '?')}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800">{u.name}</div>
                                <div className="text-xs text-slate-400 sm:hidden">{u.email}</div>
                              </div>
                            </div>
                           </td>
                          <td className="px-6 py-4 hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <Mail size={14} className="text-slate-400" />
                              <span className="text-slate-600">{u.email}</span>
                            </div>
                           </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEdit(u)}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all group/edit"
                                title="Edit"
                                aria-label={`Edit ${u.name}`}
                              >
                                <Edit3 size={16} className="text-slate-600 group-hover/edit:text-blue-600" />
                              </button>
                              <button
                                onClick={() => openDelete(u)}
                                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-all group/delete"
                                title="Delete"
                                aria-label={`Delete ${u.name}`}
                              >
                                <Trash2 size={16} className="text-red-500 group-hover/delete:text-red-700" />
                              </button>
                            </div>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer with count */}
                {filteredUsers.length !== users.length && (
                  <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-xs text-slate-500">
                      Showing {filteredUsers.length} of {users.length} users
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Offcanvas Drawer */}
      <Offcanvas
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={drawerMode === 'add' ? 'Add New User' : drawerMode === 'edit' ? 'Edit User' : 'Delete User'}
      >
        {drawerMode === 'add' && (
          <AddUser onSave={handleAddSave} onCancel={closeDrawer} />
        )}
        {drawerMode === 'edit' && (
          <EditUser user={selectedUser} onSave={handleEditSave} onCancel={closeDrawer} />
        )}
        {drawerMode === 'delete' && selectedUser && (
          <div className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Confirm Delete</h3>
              <p className="text-slate-600 mb-4">
                Are you sure you want to delete <strong className="text-slate-800">{selectedUser.name}</strong>?
                <br />
                <span className="text-sm text-slate-400">This action cannot be undone.</span>
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => handleDeleteConfirm(selectedUser.id)} 
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all"
                >
                  Delete User
                </button>
                <button 
                  onClick={closeDrawer} 
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </Offcanvas>
    </>
  );
}