import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import './Admin.css';

export default function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({ id:'', name:'', game:'' });
  const [error, setError] = useState(null);

  const load = async () => {
    try { setTeams(await apiClient.adminGet('/admin/manage/teams')); }
    catch(e){ setError(e.message); }
  };
  useEffect(()=>{ load(); },[]);

  const onSubmit = async (e) => {
    e.preventDefault(); setError(null);
    try { await apiClient.adminPost('/admin/manage/teams', form); setForm({id:'',name:'',game:''}); load(); }
    catch(e){ setError(e.message); }
  };

  return (
    <div className="admin-container">
      <div className="admin-content page-container">
        <h2>Teams</h2>
        {error && <div className="error">{error}</div>}
        <form className="admin-form" onSubmit={onSubmit}>
          <div className="row">
            <input placeholder="id" value={form.id} onChange={e=>setForm({...form,id:e.target.value})} required />
            <input placeholder="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
            <input placeholder="game" value={form.game} onChange={e=>setForm({...form,game:e.target.value})} required />
          </div>
          <button type="submit">Add Team</button>
        </form>
        <table className="admin-table">
          <thead><tr><th>Id</th><th>Name</th><th>Game</th></tr></thead>
          <tbody>
            {teams.map(t=> (
              <tr key={t.id}><td>{t.id}</td><td>{t.name}</td><td>{t.game}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
