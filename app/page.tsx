import Link from "next/link";

export default function Home() {
  return (
    <main>
      <div className="container">
        <nav className="nav">
          <div className="logo">TiffinLedger</div>
          <div className="navlinks">
            <a href="#features">Features</a>
            <a href="#audience">Who it helps</a>
            <Link href="/login">Owner login</Link>
          </div>
        </nav>

        <section className="hero">
          <div>
            <span className="badge">Built for everyday tiffin businesses</span>
            <h1>Bill only for the lunches you actually served.</h1>
            <p className="lead">
              TiffinLedger keeps subscriptions, pauses, deliveries and month-end
              billing in one simple dashboard. Search customers by phone and see
              active or paused customers instantly.
            </p>
            <div className="actions">
              <Link className="btn btn-primary" href="/register">Create owner account</Link>
              <Link className="btn btn-secondary" href="/login">Open dashboard</Link>
            </div>
          </div>

          <div className="card preview">
            <div className="preview-row"><span>Priya Mehta</span><span className="status paused">PAUSED</span></div>
            <div className="preview-row"><span>Monthly plan</span><strong>₹2,800</strong></div>
            <div className="preview-row"><span>Weekdays served</span><strong>17</strong></div>
            <div className="preview-row"><span>Daily rate</span><strong>₹127.27</strong></div>
            <div style={{marginTop: 18}}>
              <span className="muted">Month-end bill</span>
              <div className="bill-total">₹2,164</div>
            </div>
          </div>
        </section>

        <section className="section" id="features">
          <h2>Everything the owner needs</h2>
          <div className="grid3">
            <div className="card feature"><h3>Subscribe</h3><p>Add a customer, phone number and monthly plan price. Their subscription becomes the source for billing.</p></div>
            <div className="card feature"><h3>Pause / Resume</h3><p>Record travel, festival or other pauses. Paused weekdays are excluded from the delivered-day count.</p></div>
            <div className="card feature"><h3>Pro-rated bills</h3><p>At month-end, the dashboard calculates the daily plan rate and charges only for served weekdays.</p></div>
          </div>
        </section>

        <section className="section" id="audience">
          <h2>Made for small tiffin operators</h2>
          <p className="lead">Replace spreadsheets and memory with a small, practical system that keeps customer status and billing history consistent.</p>
          <div className="grid3">
            <div className="card"><h3>01 · Search</h3><p className="muted">Find customers quickly by name or phone.</p></div>
            <div className="card"><h3>02 · Status</h3><p className="muted">Know who is active and who is currently paused.</p></div>
            <div className="card"><h3>03 · Next</h3><p className="muted">Future features: WhatsApp bill delivery, online payments and delivery-route planning.</p></div>
          </div>
        </section>

        <footer className="footer">TiffinLedger · Simple billing for home-style lunch delivery.</footer>
      </div>
    </main>
  );
}
