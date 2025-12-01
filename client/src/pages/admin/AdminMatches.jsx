import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import './Admin.css';

export default function AdminMatches() {
  const [contestId, setContestId] = useState('');
  const [matches, setMatches] = useState([]);
  const [form, setForm] = useState({ id:'', team1:'', team2:'', startTime:'', endTime:'', weight:1 });
  const [error, setError] = useState(null);

  const load = async () => {
    if (!contestId) return;
    try { setMatches(await apiClient.adminGet(`/admin/manage/contests/${contestId}/matches`)); }
    catch(e){ setError(e.message); }
  };
  useEffect(()=>{ load(); },[contestId]);

  const onSubmit = async (e) => {
    e.preventDefault(); setError(null);
    try { await apiClient.adminPost(`/admin/manage/contests/${contestId}/matches`, form); setForm({ id:'', team1:'', team2:'', startTime:'', endTime:'', weight:1 }); load(); }
    catch(e){ setError(e.message); }
  };

  return (
    <div className="admin-container">
      <div className="admin-content page-container">
        <h2>Matches</h2>
        {error && <div className="error">{error}</div>}
        <div className="row">
          <input placeholder="Contest Id" value={contestId} onChange={e=>setContestId(e.target.value)} />
        </div>
        <form className="admin-form" onSubmit={onSubmit}>
          <div className="row">
            <input placeholder="id" value={form.id} onChange={e=>setForm({...form,id:e.target.value})} required />
            <input placeholder="team1" value={form.team1} onChange={e=>setForm({...form,team1:e.target.value})} required />
            <input placeholder="team2" value={form.team2} onChange={e=>setForm({...form,team2:e.target.value})} required />
          </div>
          <div className="row">
            <input placeholder="startTime" value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})} required />
            <input placeholder="endTime" value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})} required />
            <input type="number" placeholder="weight" value={form.weight} onChange={e=>setForm({...form,weight:Number(e.target.value)})} />
          </div>
          <button type="submit" disabled={!contestId}>Create Match</button>
        </form>
        <table className="admin-table">
          <thead><tr><th>Id</th><th>Teams</th><th>Start</th><th>End</th><th>Weight</th><th>Status</th></tr></thead>
          <tbody>
            {matches.map(m=> (
              <tr key={m.id}><td>{m.id}</td><td>{m.team1} vs {m.team2}</td><td>{m.startTime}</td><td>{m.endTime}</td><td>{m.weight}</td><td>{m.state}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
