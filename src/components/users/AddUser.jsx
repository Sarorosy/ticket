import { useState } from "react";
import { API_BASE_URL } from "../../utils/constants";

export default function AddUser({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { name, email, password };
    fetch(API_BASE_URL + '/user/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        const created = data?.user ?? data ?? { id: Date.now(), name, email, role, password };
        onSave?.(created);
      })
      .catch((err) => {
        console.error('Failed to add user', err);
        const newUser = { id: Date.now(), name, email, role, password };
        onSave?.(newUser);
      });
  };

  return (
    <div className="p-4 max-w-md">
      <h2 className="text-lg font-semibold mb-4">Add User</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        {/* <div>
          <label className="block text-sm">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div> */}
        <div className="flex gap-2">
          <button type="submit" className="px-3 py-2 bg-green-600 text-white rounded">Save</button>
          <button type="button" onClick={onCancel} className="px-3 py-2 bg-gray-200 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
