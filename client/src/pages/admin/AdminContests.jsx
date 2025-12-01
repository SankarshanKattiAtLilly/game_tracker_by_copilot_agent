import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import './Admin.css';

export default function AdminContests() {
  const [contests, setContests] = useState([]);
  const [form, setForm] = useState({ id:'', name:'', description:'', game:'', teams:[], enrolledUsers:[] });
  const [games, setGames] = useState([]);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const res = await apiClient.adminGet('/admin/manage/contests');
      setContests(res);
      const meta = await apiClient.adminGet('/admin/manage/meta');
      setGames(meta.games || []);
      setForm(f => ({ ...f, id: meta.nextContestId || f.id }));
    } catch (e) { setError(e.message); }
  };
  useEffect(()=>{ load(); },[]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.adminPost('/admin/manage/contests', form);
      const meta = await apiClient.adminGet('/admin/manage/meta');
      setForm({ id: meta.nextContestId || '', name:'', description:'', game:'', teams:[], enrolledUsers:[] });
      load();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="admin-container">
      <div className="admin-content page-container">
        <h2>Contests</h2>
        {error && <div className="error">{error}</div>}
        <form className="admin-form" onSubmit={onSubmit}>
          <div className="row">
            <input placeholder="id" value={form.id} disabled />
            <input placeholder="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
          </div>
          <div className="row">
            <select value={form.game} onChange={e=>setForm({...form,game:e.target.value})} required>
              <option value="">Select game</option>
              {games.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <textarea placeholder="description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
          <button type="submit">Create Contest</button>
        </form>

        <table className="admin-table">
          <thead><tr><th>Id</th><th>Name</th><th>Game</th><th>Teams linked</th><th>Enrolled</th></tr></thead>
          <tbody>
            {contests.map(c=> (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.game || '-'}</td>
                <td>{Array.isArray(c.teams)? c.teams.length:0}</td>
                <td>{Array.isArray(c.enrolledUsers)? c.enrolledUsers.length:0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
