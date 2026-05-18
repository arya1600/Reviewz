import { useState, useEffect } from 'react';
import { Shield, UserPlus, Trash2, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminSettings() {
  const { user }          = useAuth();
  const [admins, setAdmins]   = useState([]);
  const [email, setEmail]     = useState('');
  const [role, setRole]       = useState('admin');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState(false);
  const [msg, setMsg]         = useState(null);

  async function loadAdmins() {
    setLoading(true);
    const { data } = await supabase.from('admin_users').select('*').order('created_at');
    setAdmins(data || []);
    setLoading(false);
  }

  useEffect(() => { loadAdmins(); }, []);

  async function addAdmin(e) {
    e.preventDefault();
    setAdding(true);
    setMsg(null);

    // Look up the user by email in auth
    // NOTE: Admin user must have already created their Supabase account before being added here.
    // You'll need their auth UUID. This form takes email and requires the user's auth UUID separately.
    setMsg({ type: 'info', text: 'To add an admin: get the user\'s Supabase auth UUID from the Supabase dashboard (Authentication → Users), then insert manually: INSERT INTO admin_users (id, email, role) VALUES (\'<uuid>\', \'email@example.com\', \'admin\');' });
    setAdding(false);
  }

  async function removeAdmin(id) {
    if (!confirm('Remove this admin user?')) return;
    const { error } = await supabase.from('admin_users').delete().eq('id', id);
    if (error) {
      setMsg({ type: 'error', text: `Failed to remove admin: ${error.message}` });
      return;
    }
    setAdmins(prev => prev.filter(a => a.id !== id));
  }

  function copySQL(email, role) {
    const safeEmail = email.replace(/'/g, "''"); // escape single quotes for SQL literal
    const sql = `INSERT INTO admin_users (id, email, role) VALUES ('<AUTH_UUID_HERE>', '${safeEmail}', '${role}');`;
    navigator.clipboard.writeText(sql);
    setMsg({ type: 'success', text: 'SQL copied to clipboard! Replace <AUTH_UUID_HERE> with the user\'s Supabase auth UUID.' });
    setTimeout(() => setMsg(null), 5000);
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Settings</h1>
        <p className="text-slate-500 text-sm mb-6">Manage admin users and platform configuration.</p>

        {/* Current admin info */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">You are signed in as</p>
              <p className="text-sm text-slate-600">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Admin users table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Admin Users</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Email', 'Role', 'Added', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {admins.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{a.email}</p>
                      <p className="text-xs text-slate-400 font-mono">{a.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${a.role === 'super_admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                        {a.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(a.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      {a.id !== user?.id && (
                        <button onClick={() => removeAdmin(a.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add admin */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-1">Add Admin User</h2>
          <p className="text-sm text-slate-500 mb-4">
            The user must first sign up at <a href="/admin/login" className="text-indigo-600 hover:underline">/admin/login</a> using email/password.
            Then get their UUID from the Supabase Dashboard and run the SQL below.
          </p>

          {msg && (
            <div className={`flex items-start gap-2 p-3 rounded-xl mb-4 text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
              {msg.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              {msg.text}
            </div>
          )}

          <form onSubmit={addAdmin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="newadmin@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 font-mono mb-2">SQL to run in Supabase SQL Editor:</p>
              <p className="text-xs font-mono text-slate-700 break-all">
                {`INSERT INTO admin_users (id, email, role) VALUES ('<AUTH_UUID>', '${email || 'email@example.com'}', '${role}');`}
              </p>
            </div>
            <button type="button" onClick={() => copySQL(email || 'email@example.com', role)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 rounded-xl text-white text-sm font-semibold hover:bg-indigo-700">
              <Copy className="w-4 h-4" /> Copy SQL to Clipboard
            </button>
          </form>
        </div>

        {/* Platform info */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mt-6">
          <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Auto-Expiry Setup
          </h3>
          <p className="text-sm text-amber-700">
            To enable daily auto-expiry of subscriptions, schedule a cron job in Supabase (Pro plan required):
          </p>
          <pre className="mt-2 bg-amber-100 rounded-lg p-3 text-xs text-amber-800 overflow-x-auto">
            {`SELECT cron.schedule(\n  'expire-subscriptions',\n  '0 0 * * *',\n  $$SELECT auto_expire_subscriptions()$$\n);`}
          </pre>
          <p className="text-xs text-amber-600 mt-2">
            Without this, subscriptions expire automatically when a customer scans the QR code (real-time check).
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
