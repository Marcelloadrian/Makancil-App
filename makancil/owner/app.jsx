// Cafe owner dashboard
const STEPS = ["Submitted", "In Review", "In Development", "Shipped"];
function Owner({ s, set }) {
  const [tab, setTab] = useState("overview"),
    [nf, setNf] = useState({ name: "", cat: "Coffee", price: "" }),
    [rq, setRq] = useState({ title: "", desc: "" });
  const today = new Date().toDateString(),
    pd = s.orders.filter((o) => o.total > 0 && o.status !== "pending_cash");
  const rev = pd
    .filter((o) => new Date(o.created).toDateString() === today)
    .reduce((a, o) => a + o.total, 0);
  const cl = s.orders.filter((o) => o.closedAt),
    avg = cl.length
      ? Math.round(
          cl.reduce((a, o) => a + (o.closedAt - o.created), 0) /
            cl.length /
            60000,
        )
      : 0;
  const busy = s.tables.filter((t) =>
    ["occupied", "reserved", "held"].includes(t.status),
  ).length;
  const hrs = [...Array(13)].map((_, i) => i + 8),
    cnt = hrs.map(
      (h) => pd.filter((o) => new Date(o.created).getHours() === h).length,
    ),
    mx = Math.max(1, ...cnt);
  const sT = (id, p) =>
    set((st) => ({
      ...st,
      tables: st.tables.map((t) => (t.id === id ? { ...t, ...p } : t)),
    }));
  const sM = (id, p) =>
    set((st) => ({
      ...st,
      menu: st.menu.map((m) => (m.id === id ? { ...m, ...p } : m)),
    }));
  const inp =
    "border border-latte rounded-lg px-2 py-1.5 bg-cream text-sm w-full";
  const K = ({ l, v, sub }) => (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="text-xs text-espresso/60">{l}</div>
      <div className="text-2xl font-bold mt-1">{v}</div>
      <div className="text-[11px] text-espresso/50">{sub}</div>
    </div>
  );
  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex gap-1.5 overflow-x-auto mb-4">
        {[
          ["overview", "Overview"],
          ["floor", "Floor & Rules"],
          ["menu", "Menu"],
          ["req", "Feature Requests"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={
              "px-4 py-2 rounded-full text-sm whitespace-nowrap " +
              (tab === k ? "bg-terra text-white" : "bg-latte")
            }
          >
            {l}
          </button>
        ))}
      </div>
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <K
              l="Today’s Revenue"
              v={rp(rev)}
              sub={pd.length + " paid orders"}
            />
            <K
              l="Avg. Turnover Time"
              v={avg ? avg + " min" : "—"}
              sub="order to table closed"
            />
            <K
              l="Occupancy Rate"
              v={Math.round((busy / s.tables.length) * 100) + "%"}
              sub={busy + " of " + s.tables.length + " tables in use"}
            />
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="font-semibold mb-3">Peak Hours (orders)</div>
            <div className="flex items-end gap-1.5 h-40">
              {hrs.map((h, i) => (
                <div
                  key={h}
                  className="flex-1 flex flex-col items-center justify-end h-full"
                >
                  <span className="text-[10px]">{cnt[i] || ""}</span>
                  <div
                    className="w-full rounded-t bg-sage transition-all"
                    style={{ height: (cnt[i] / mx) * 100 + "%", minHeight: 2 }}
                  />
                  <span className="text-[10px] text-espresso/50 mt-1">{h}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="font-semibold mb-3">
              Table Utilization (orders served)
            </div>
            {s.tables.map((t) => {
              const n = pd.filter((o) => o.table === t.id).length;
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-2 text-sm mb-1.5"
                >
                  <span className="w-20">
                    {t.name} · F{t.floor}
                  </span>
                  <div className="flex-1 h-3 bg-latte rounded">
                    <div
                      className="h-full bg-terra rounded"
                      style={{
                        width:
                          (n /
                            Math.max(
                              1,
                              ...s.tables.map(
                                (x) =>
                                  pd.filter((o) => o.table === x.id).length,
                              ),
                            )) *
                            100 +
                          "%",
                      }}
                    />
                  </div>
                  <span className="w-6 text-right">{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {tab === "floor" && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-sm mb-2">
            Default session length (hours)
            <input
              type="number"
              min="1"
              className={inp + " !w-20"}
              value={s.settings.hours}
              onChange={(e) =>
                set((st) => ({
                  ...st,
                  settings: {
                    ...st.settings,
                    hours: Math.max(1, +e.target.value || 1),
                  },
                }))
              }
            />
          </div>
          {s.tables.map((t) => (
            <div
              key={t.id}
              className="grid grid-cols-[1fr_auto_70px_110px] gap-2 items-center"
            >
              <input
                className={inp}
                value={t.name}
                onChange={(e) => sT(t.id, { name: e.target.value })}
              />
              <button
                onClick={() =>
                  sT(t.id, {
                    seats: t.seats === 2 ? 4 : 2,
                    min: t.seats === 2 ? 2 : 1,
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-latte text-sm"
              >
                {t.seats}-seat
              </button>
              <input
                type="number"
                min="1"
                title="Minimum items"
                className={inp}
                value={t.min}
                onChange={(e) =>
                  sT(t.id, { min: Math.max(1, +e.target.value || 1) })
                }
              />
              <select
                className={inp}
                value={t.floor}
                onChange={(e) => sT(t.id, { floor: +e.target.value })}
              >
                <option value={1}>Ground</option>
                <option value={2}>2nd Floor</option>
              </select>
            </div>
          ))}
          <p className="text-xs text-espresso/50">
            Columns: name · capacity · minimum items · floor. Changes appear on
            the customer map instantly.
          </p>
        </div>
      )}
      {tab === "menu" && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <label className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-terra/40 bg-terra/5 p-3 text-sm cursor-pointer">
            <span>
              <b>Upload many photos at once</b>
              <span className="block text-xs text-espresso/60">
                Name files after the menu item: espresso.jpg, es-kopi-susu.jpg,
                matcha-latte.jpg …
              </span>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-terra text-white whitespace-nowrap">
              Choose photos
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) =>
                [...e.target.files].forEach((f) => {
                  const key = f.name.replace(/\.[^.]+$/, "").toLowerCase();
                  const m = s.menu.find(
                    (x) =>
                      x.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === key,
                  );
                  if (m) shrink(f, (d) => sM(m.id, { img: d }));
                })
              }
            />
          </label>
          {s.menu.map((m) => (
            <div key={m.id} className="space-y-1">
              <div className="grid grid-cols-[48px_1fr_110px_auto] gap-2 items-center">
                <label title="Upload photo" className="relative cursor-pointer">
                  <Pic m={m} size="w-12 h-12" />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-terra text-white text-xs grid place-items-center">
                    +
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files[0] &&
                      shrink(e.target.files[0], (d) => sM(m.id, { img: d }))
                    }
                  />
                </label>
                <input
                  className={inp}
                  value={m.name}
                  onChange={(e) => sM(m.id, { name: e.target.value })}
                />
                <input
                  type="number"
                  className={inp}
                  value={m.price}
                  onChange={(e) => sM(m.id, { price: +e.target.value || 0 })}
                />
                <button
                  onClick={() => sM(m.id, { stock: !m.stock })}
                  className={
                    "px-3 py-1.5 rounded-lg text-sm text-white " +
                    (m.stock ? "bg-sage" : "bg-terra")
                  }
                >
                  {m.stock ? "In stock" : "Sold out"}
                </button>
              </div>
              <div className="flex gap-2 pl-14">
                <input
                  className={inp + " !text-xs"}
                  placeholder="…or paste a photo URL / path, e.g. /shared/img/latte.jpg"
                  value={m.img && !m.img.startsWith("data:") ? m.img : ""}
                  onChange={(e) => sM(m.id, { img: e.target.value })}
                />
                {m.img && (
                  <button
                    onClick={() => sM(m.id, { img: "" })}
                    className="text-xs px-2 rounded-lg bg-latte whitespace-nowrap"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-[44px_1fr_120px_110px_auto] gap-2 pt-3 border-t border-latte items-center">
            <label title="Add photo" className="cursor-pointer">
              <Pic
                m={{ img: nf.img, emoji: "📷", name: "photo" }}
                size="w-11 h-11"
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files[0] &&
                  shrink(e.target.files[0], (d) =>
                    setNf((f) => ({ ...f, img: d })),
                  )
                }
              />
            </label>
            <input
              className={inp}
              placeholder="New item name"
              value={nf.name}
              onChange={(e) => setNf({ ...nf, name: e.target.value })}
            />
            <select
              className={inp}
              value={nf.cat}
              onChange={(e) => setNf({ ...nf, cat: e.target.value })}
            >
              {CATS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              type="number"
              className={inp}
              placeholder="Price"
              value={nf.price}
              onChange={(e) => setNf({ ...nf, price: e.target.value })}
            />
            <button
              disabled={!nf.name || !nf.price}
              onClick={() => {
                set((st) => ({
                  ...st,
                  menu: [
                    ...st.menu,
                    {
                      id: "m" + Date.now(),
                      cat: nf.cat,
                      name: nf.name,
                      price: +nf.price,
                      emoji: "🍽️",
                      img: nf.img || "",
                      stock: true,
                    },
                  ],
                }));
                setNf({ name: "", cat: "Coffee", price: "" });
              }}
              className="px-3 rounded-lg bg-espresso text-cream text-sm disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      )}
      {tab === "req" && (
        <div className="grid md:grid-cols-[320px_1fr] gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2 self-start">
            <div className="font-semibold">Request a feature from Makancil</div>
            <input
              className={inp}
              placeholder="Title"
              value={rq.title}
              onChange={(e) => setRq({ ...rq, title: e.target.value })}
            />
            <textarea
              rows="4"
              className={inp}
              placeholder="Describe the change you need"
              value={rq.desc}
              onChange={(e) => setRq({ ...rq, desc: e.target.value })}
            />
            <button
              disabled={!rq.title}
              onClick={() => {
                set((st) => ({
                  ...st,
                  reqs: [
                    {
                      id: "r" + Date.now(),
                      ...rq,
                      status: "Submitted",
                      date: new Date().toISOString().slice(0, 10),
                    },
                    ...st.reqs,
                  ],
                }));
                setRq({ title: "", desc: "" });
              }}
              className="w-full py-2.5 rounded-xl bg-terra text-white disabled:opacity-40"
            >
              Submit ticket
            </button>
          </div>
          <div className="space-y-3">
            {s.reqs.map((r) => {
              const i = STEPS.indexOf(r.status);
              return (
                <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between">
                    <b>{r.title}</b>
                    <span className="text-xs text-espresso/50">{r.date}</span>
                  </div>
                  <p className="text-sm text-espresso/70 mb-3">{r.desc}</p>
                  <div className="flex gap-1">
                    {STEPS.map((x, j) => (
                      <div key={x} className="flex-1">
                        <div
                          className={
                            "h-1.5 rounded " + (j <= i ? "bg-sage" : "bg-latte")
                          }
                        />
                        <div
                          className={
                            "text-[10px] mt-1 " +
                            (j === i ? "font-bold" : "text-espresso/50")
                          }
                        >
                          {x}
                        </div>
                      </div>
                    ))}
                  </div>
                  {i < 3 && (
                    <button
                      onClick={() =>
                        set((st) => ({
                          ...st,
                          reqs: st.reqs.map((x) =>
                            x.id === r.id ? { ...x, status: STEPS[i + 1] } : x,
                          ),
                        }))
                      }
                      className="mt-2 text-xs px-2 py-1 rounded bg-latte"
                    >
                      Dev team: advance status →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
