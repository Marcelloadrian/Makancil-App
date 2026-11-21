// Staff KDS & floor operations
function Staff({ s, set, now }) {
  const mn = (id) => s.menu.find((m) => m.id === id),
    act = s.orders.filter((o) => o.status !== "closed");
  const pend = act.filter((o) => o.status === "pending_cash"),
    prep = act.filter((o) => o.status === "paid");
  const ready = act.filter((o) => o.status === "ready"),
    over = s.tables.filter((t) => tstatus(t, s.orders, now) === "overtime"),
    clean = s.tables.filter((t) => t.status === "cleaning");
  const upd = (id, p) =>
    set((st) => ({
      ...st,
      orders: st.orders.map((o) => (o.id === id ? { ...o, ...p } : o)),
    }));
  const leave = (t) =>
    set((st) => ({
      ...st,
      orders: st.orders.map((o) =>
        o.id === t.orderId
          ? { ...o, status: "closed", closedAt: Date.now() }
          : o,
      ),
      tables: st.tables.map((x) =>
        x.id === t.id ? { ...x, status: "cleaning", orderId: null } : x,
      ),
    }));
  const cleaned = (t) =>
    set((st) => ({
      ...st,
      tables: st.tables.map((x) =>
        x.id === t.id ? { ...x, status: "available" } : x,
      ),
    }));
  const B =
    "w-full py-3.5 rounded-xl font-medium text-white active:scale-95 transition ";
  const Items = ({ o }) => (
    <div className="text-sm text-espresso/70">
      {o.type === "pickup" && (
        <div>
          🥡 Pick up · #{o.id.slice(-4)} · {o.slot === "Now" ? "ASAP" : o.slot}
        </div>
      )}
      {o.items.length
        ? o.items.map(
            (it, i) =>
              mn(it.id) && (
                <div key={i}>
                  {it.q}× {mn(it.id).name}
                </div>
              ),
          )
        : "(seed order, no items)"}
    </div>
  );
  const Col = ({ t, n, c, children }) => (
    <section className="bg-white rounded-3xl p-4 shadow-sm">
      <h2 className="font-semibold flex items-center justify-between mb-3">
        {t}
        <span className={"text-xs px-2 py-0.5 rounded-full text-white " + c}>
          {n}
        </span>
      </h2>
      <div className="space-y-3">
        {children}
        {n === 0 && <p className="text-sm text-espresso/40">All clear.</p>}
      </div>
    </section>
  );
  return (
    <div className="p-4 max-w-7xl mx-auto grid gap-4 lg:grid-cols-3">
      <Col t="💵 Cash Verification" n={pend.length} c="bg-amber-500">
        {pend.map((o) => (
          <div
            key={o.id}
            className="border-2 border-amber-400 bg-amber-50 rounded-2xl p-3 animate-pulse"
          >
            <div className="flex justify-between font-semibold">
              <span>
                {o.type === "pickup" ? "🥡 Pick up" : "Table " + o.table}
              </span>
              <span>{rp(o.total)}</span>
            </div>
            <Items o={o} />
            <button
              onClick={() => set(confirmCash(o.id))}
              className={B + "bg-amber-600 mt-2"}
            >
              Confirm Cash Collected
            </button>
          </div>
        ))}
      </Col>
      <Col t="👨‍🍳 Prep & Handover" n={prep.length} c="bg-blue-600">
        {prep.map((o) => (
          <div
            key={o.id}
            className="border border-blue-200 bg-blue-50 rounded-2xl p-3"
          >
            <div className="flex justify-between font-semibold">
              <span>
                {o.type === "pickup" ? "🥡 Pick up" : "Table " + o.table}
              </span>
              <span className="text-xs font-normal">
                {o.prepared ? "Prepared" : "Preparing"}
              </span>
            </div>
            <Items o={o} />
            {o.type === "pickup" ? (
              <button
                onClick={() => upd(o.id, { prepared: true, status: "ready" })}
                className={B + "bg-blue-600 mt-2"}
              >
                Mark Ready for Pickup
              </button>
            ) : o.prepared ? (
              <button
                onClick={() => set(approveHandover(o.id))}
                className={B + "bg-sage mt-2"}
              >
                Approve at Handover (starts timer)
              </button>
            ) : (
              <button
                onClick={() => upd(o.id, { prepared: true })}
                className={B + "bg-blue-600 mt-2"}
              >
                Mark Prepared
              </button>
            )}
          </div>
        ))}
      </Col>
      <div className="space-y-4">
        <Col t="🥡 Ready for Pickup" n={ready.length} c="bg-sage">
          {ready.map((o) => (
            <div
              key={o.id}
              className="border border-emerald-200 bg-emerald-50 rounded-2xl p-3"
            >
              <b>Waiting at the counter</b>
              <Items o={o} />
              <button
                onClick={() => upd(o.id, { status: "closed", pickedUp: true })}
                className={B + "bg-sage mt-2"}
              >
                Handed to Customer
              </button>
            </div>
          ))}
        </Col>
        <Col t="🚨 Overtime & Turnover" n={over.length} c="bg-rose-700">
          {over.map((t) => {
            const o = s.orders.find((x) => x.id === t.orderId);
            return (
              <div
                key={t.id}
                className="bg-rose-700 text-white rounded-2xl p-3 animate-pulse"
              >
                <div className="font-bold">OVERTIME PING · {t.name}</div>
                <div className="text-xs opacity-90 mb-2">
                  {o.stay
                    ? "Customer staying: waiting for extra order"
                    : "3-hour session ended"}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => upd(o.id, { stay: true })}
                    className="py-3 rounded-xl bg-white text-rose-700 font-medium text-sm"
                  >
                    Customer Stays (Extends)
                  </button>
                  <button
                    onClick={() => leave(t)}
                    className="py-3 rounded-xl bg-espresso text-white font-medium text-sm"
                  >
                    Customer Leaves
                  </button>
                </div>
              </div>
            );
          })}
        </Col>
        <Col t="🧽 Needs Cleaning" n={clean.length} c="bg-stone-500">
          {clean.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between bg-stone-100 rounded-2xl p-3"
            >
              <b>Table {t.name}</b>
              <button
                onClick={() => cleaned(t)}
                className="px-4 py-2.5 rounded-xl bg-sage text-white text-sm"
              >
                Mark Table Cleaned
              </button>
            </div>
          ))}
        </Col>
      </div>
      <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
        {[1, 2].map((f) => (
          <div key={f}>
            <div className="text-sm font-medium mb-1">
              {f === 1 ? "Ground Floor" : "2nd Floor · Rooftop"}
            </div>
            <FloorMap
              tables={s.tables.filter((t) => t.floor === f)}
              floor={f}
              tstat={(t) => tstatus(t, s.orders, now)}
              orders={s.orders}
              now={now}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
