import { useState, useEffect, useRef } from "react";
import { Edit3, PlusCircle, Trash2 } from "lucide-react";
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
  const [drawerMode, setDrawerMode] = useState(null); // 'add' | 'edit' | 'delete'
  const [selectedUser, setSelectedUser] = useState(null);

  const openAdd = () => { setSelectedUser(null); setDrawerMode('add'); setDrawerOpen(true); };
  const openEdit = (user) => { setSelectedUser(user); setDrawerMode('edit'); setDrawerOpen(true); };
  const openDelete = (user) => { setSelectedUser(user); setDrawerMode('delete'); setDrawerOpen(true); };

  const closeDrawer = () => { setDrawerOpen(false); setDrawerMode(null); setSelectedUser(null); };

  const handleAddSave = (newUser) => {
    // refresh from server to ensure consistent data
    fetchUsers();
    closeDrawer();
  };

  const handleEditSave = (updated) => {
    // refresh from server to ensure consistent data
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
        // re-fetch to reflect server state
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
  if (loading) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Loading users...</p>
      </div>
    );
  }

  return (
    <>
    <div className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-2xl font-semibold">Users</h2>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Search users"
          />
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 transition"
          >
            <PlusCircle size={16} /> Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        {users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No users yet.</p>
            <button onClick={openAdd} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded">Create first user</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2 hidden sm:table-cell">Email</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {users
                  .filter((u) => {
                    const q = query.trim().toLowerCase();
                    if (!q) return true;
                    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
                  })
                  .map((u, idx) => (
                    <tr key={u.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium">
                          {((u.name || '')
                            .split(' ')
                            .map((s) => s[0])
                            .join('')
                            .slice(0,2) || '?')}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{u.name}</div>
                          <div className="text-xs text-gray-500 sm:hidden">{u.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{u.email}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition"
                            title="Edit"
                            aria-label={`Edit ${u.name}`}
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => openDelete(u)}
                            className="p-2 rounded bg-red-50 hover:bg-red-100 transition"
                            title="Delete"
                            aria-label={`Delete ${u.name}`}
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
      <Offcanvas
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={drawerMode === 'add' ? 'Add User' : drawerMode === 'edit' ? 'Edit User' : 'Confirm Delete'}
      >
        {drawerMode === 'add' && (
          <AddUser onSave={handleAddSave} onCancel={closeDrawer} />
        )}
        {drawerMode === 'edit' && (
          <EditUser user={selectedUser} onSave={handleEditSave} onCancel={closeDrawer} />
        )}
        {drawerMode === 'delete' && selectedUser && (
          <div className="p-2">
            <p className="mb-4">Are you sure you want to delete <strong>{selectedUser.name}</strong>?</p>
            <div className="flex gap-2">
              <button onClick={() => handleDeleteConfirm(selectedUser.id)} className="px-3 py-2 bg-red-600 text-white rounded">Delete</button>
              <button onClick={closeDrawer} className="px-3 py-2 bg-gray-200 rounded">Cancel</button>
            </div>
          </div>
        )}
      </Offcanvas>
    </>
  );
}
// end Users
