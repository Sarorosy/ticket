import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../utils/constants";

export default function EditUser({ user, onSave, onCancel }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setRole(user.role || "user");
      setPassword("");
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const updated = { ...user, name, email, role };
    if (password) {
      updated.password = password;
    }

    // send update to API
    fetch(`${API_BASE_URL}/user/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: updated.id, ...updated }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update user");
        return res.json();
      })
      .then((data) => {
        // assume server returns the updated user in `data.user` or `data`
        const serverUser = data?.user ?? data ?? updated;
        onSave?.(serverUser);
      })
      .catch((err) => {
        console.error("Update user failed:", err);
        // fallback to local update
        onSave?.(updated);
      });
  };

  return (
    <div className="p-4 max-w-md">
      <h2 className="text-lg font-semibold mb-4">Edit User</h2>
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
            type="password"
            placeholder="Leave blank to keep current password"
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
