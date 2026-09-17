"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: string; name: string; phone: string; planPrice: number; status: "ACTIVE" | "PAUSED";
};

export default function Dashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, active: 0, paused: 0 });
  const [bill, setBill] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", planPrice: "" });
  const [message, setMessage] = useState("");

  async function load() {
    const params = new URLSearchParams({ q: query, status, sort, order, page: String(page), limit: "8" });
    const res = await fetch(`/api/customers?${params}`);
    if (res.status === 401) { location.href = "/login"; return; }
    const data = await res.json();
    setCustomers(data.customers);
    setPages(data.pagination.pages);
    setStats(data.stats);
  }

  useEffect(() => { load(); }, [query, status, sort, order, page]);

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({...form, planPrice: Number(form.planPrice)})
    });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error || "Could not add customer"); return; }
    setForm({name:"", phone:"", planPrice:""});
    setFormOpen(false);
    setMessage("Customer added.");
    setPage(1);
    load();
  }

  async function togglePause(customer: Customer) {
    const action = customer.status === "ACTIVE" ? "pause" : "resume";
    const res = await fetch(`/api/customers/${customer.id}/${action}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error || "Action failed"); return; }
    setMessage(action === "pause" ? "Customer paused." : "Customer resumed.");
    load();
  }

  async function showBill(customer: Customer) {
    const month = new Date().toISOString().slice(0,7);
    const res = await fetch(`/api/bills/${customer.id}?month=${month}`);
    const data = await res.json();
    if (!res.ok) { setMessage(data.error || "Could not calculate bill"); return; }
    setBill(data);
  }

  async function logout() {
    await fetch("/api/auth/logout", {method:"POST"});
    location.href = "/";
  }

  return (
    <main>
      <div className="container">
        <nav className="nav">
          <div className="logo">TiffinLedger</div>
          <button className="btn btn-secondary small" onClick={logout}>Logout</button>
        </nav>

        <div className="dashboard-head">
          <div><span className="badge">Owner dashboard</span><h1 style={{fontSize: 42, marginBottom: 0}}>Customers & billing</h1></div>
          <button className="btn btn-primary" onClick={() => setFormOpen(true)}>+ Add customer</button>
        </div>

        {message && <div className="card" style={{marginBottom: 16}}>{message}</div>}

        <section className="stats">
          <div className="card"><div className="muted">Total customers</div><div className="stat-value">{stats.total}</div></div>
          <div className="card"><div className="muted">Active</div><div className="stat-value">{stats.active}</div></div>
          <div className="card"><div className="muted">Paused</div><div className="stat-value">{stats.paused}</div></div>
        </section>

        <div className="toolbar">
          <input placeholder="Search name or phone…" value={query} onChange={e => {setQuery(e.target.value); setPage(1);}} />
          <select value={status} onChange={e => {setStatus(e.target.value); setPage(1);}}>
            <option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="PAUSED">Paused</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="name">Sort: name</option><option value="planPrice">Sort: plan price</option><option value="status">Sort: status</option><option value="createdAt">Sort: newest</option>
          </select>
          <button className="btn btn-secondary small" onClick={() => setOrder(order === "asc" ? "desc" : "asc")}>{order === "asc" ? "↑ Asc" : "↓ Desc"}</button>
        </div>

        <section className="card table-wrap">
          <table>
            <thead><tr><th>Customer</th><th>Phone</th><th>Plan</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {customers.map(c => <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.phone}</td>
                <td>₹{c.planPrice.toLocaleString("en-IN")}</td>
                <td><span className={`status ${c.status === "ACTIVE" ? "active" : "paused"}`}>{c.status}</span></td>
                <td><div className="row-actions">
                  <button className="btn btn-secondary small" onClick={() => showBill(c)}>Bill</button>
                  <button className="btn btn-secondary small" onClick={() => togglePause(c)}>{c.status === "ACTIVE" ? "Pause" : "Resume"}</button>
                </div></td>
              </tr>)}
              {!customers.length && <tr><td colSpan={5}>No customers found.</td></tr>}
            </tbody>
          </table>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14}}>
            <span className="muted" style={{fontSize:13}}>Page {page} of {pages}</span>
            <div className="row-actions">
              <button className="btn btn-secondary small" disabled={page <= 1} onClick={() => setPage(p => p-1)}>Previous</button>
              <button className="btn btn-secondary small" disabled={page >= pages} onClick={() => setPage(p => p+1)}>Next</button>
            </div>
          </div>
        </section>

        {formOpen && <div className="modal-backdrop" onClick={() => setFormOpen(false)}>
          <div className="card modal" onClick={e => e.stopPropagation()}>
            <h2>Add customer</h2>
            <form className="form" onSubmit={addCustomer}>
              <label>Name</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
              <label>Phone</label><input required inputMode="numeric" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
              <label>Monthly plan price (₹)</label><input required type="number" min="1" value={form.planPrice} onChange={e=>setForm({...form,planPrice:e.target.value})}/>
              <div className="actions"><button className="btn btn-primary">Add</button><button type="button" className="btn btn-secondary" onClick={()=>setFormOpen(false)}>Cancel</button></div>
            </form>
          </div>
        </div>}

        {bill && <div className="modal-backdrop" onClick={() => setBill(null)}>
          <div className="card modal" onClick={e => e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",gap:10}}><div><h2 style={{marginTop:0}}>{bill.customer.name}</h2><div className="muted">{bill.month} · {bill.customer.phone}</div></div><button className="btn btn-secondary small" onClick={()=>setBill(null)}>Close</button></div>
            <div className="bill" style={{marginTop:22}}>
              <div className="muted">Month-end bill</div><div className="bill-total">₹{bill.amount.toLocaleString("en-IN")}</div>
              <div className="two-col">
                <div className="card"><div className="muted">Plan</div><strong>₹{bill.customer.planPrice.toLocaleString("en-IN")}</strong></div>
                <div className="card"><div className="muted">Daily rate</div><strong>₹{bill.dailyRate.toFixed(2)}</strong></div>
                <div className="card"><div className="muted">Weekdays</div><strong>{bill.plannedWeekdays}</strong></div>
                <div className="card"><div className="muted">Delivered</div><strong>{bill.deliveredDays}</strong></div>
              </div>
              <div className="muted">Calculation: monthly plan ÷ planned weekdays × delivered weekdays.</div>
            </div>
          </div>
        </div>}
      </div>
    </main>
  );
}
