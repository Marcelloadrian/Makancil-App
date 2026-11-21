// Client app: login, home, order (dine-in + pick up), orders, member, settings
const TIERS = [
  ["Bronze", 0],
  ["Silver", 500],
  ["Gold", 1500],
];
const hm = (t) =>
  new Date(t).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
function CustomerApp({ s, set, now, user, pf, setPf, onLogout }) {
  const [my, setMy] = useState(() => {
    try {
      return localStorage.getItem(MY);
    } catch (e) {
      return null;
    }
  });
  const [tab, setTab] = useState("home"),
    [type, setType] = useState("dine"),
    [step, setStep] = useState("map"),
    [floor, setFloor] = useState(1),
    [sel, setSel] = useState(null),
    [slot, setSlot] = useState(slots[0]),
    [cart, setCart] = useState({}),
    [cat, setCat] = useState("Coffee"),
    [drawer, setDrawer] = useState(false),
    [pay, setPay] = useState("qris"),
    [qr, setQr] = useState(false),
    [ext, setExt] = useState(false),
    [vid, setVid] = useState(null),
    [det, setDet] = useState(null);
  const [cfg, setCfg] = useState(false);
  const M = s.members[user],
    tbl = (id) => s.tables.find((t) => t.id === id),
    tstat = (t) => tstatus(t, s.orders, now);
  const mine = s.orders
      .filter((x) => x.cust && x.email === user)
      .sort((a, b) => b.created - a.created),
    act1 = mine.find((x) => x.status !== "closed");
  const o = s.orders.find((x) => x.id === my && x.status !== "closed"),
    dine = ext || type === "dine",
    T = ext && o ? tbl(o.table) : tbl(sel);
  const lines = Object.entries(cart)
    .filter((e) => e[1] > 0)
    .map(([id, q]) => ({ ...s.menu.find((m) => m.id === id), q }));
  const count = lines.reduce((a, l) => a + l.q, 0),
    subtotal = lines.reduce((a, l) => a + l.q * l.price, 0),
    items = lines.map((l) => ({ id: l.id, q: l.q }));
  const fee = 0,
    vch = ext
      ? null
      : M.vouchers.find((v) => v.id === vid && subtotal >= v.min),
    disc = vch
      ? vch.k === "amt"
        ? vch.v
        : vch.k === "pct"
          ? Math.round((subtotal * vch.v) / 100)
          : fee
      : 0;
  const total = Math.max(0, subtotal + fee - disc),
    pts = Math.floor(total / 1000),
    min = ext || !dine ? 1 : T ? T.min : 1,
    met = count >= min,
    inMenu = ext || !dine || step === "menu";
  const ti = TIERS.reduce((a, t, i) => (M.points >= t[1] ? i : a), 0),
    nx = TIERS[ti + 1],
    pc = nx ? ((M.points - TIERS[ti][1]) / (nx[1] - TIERS[ti][1])) * 100 : 100;
  const setQty = (id, d) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + d) }));
  const setMine = (id) => {
    setMy(id);
    try {
      id ? localStorage.setItem(MY, id) : localStorage.removeItem(MY);
    } catch (e) {}
  };
  const upd = (id, p) =>
    set((st) => ({
      ...st,
      orders: st.orders.map((x) => (x.id === id ? { ...x, ...p } : x)),
    }));
  const go = (t) => {
    setType(t);
    setStep("map");
    setCart({});
    setExt(false);
    setTab("order");
  };
  const lab = (x) =>
    x.status === "pending_cash"
      ? "Awaiting cash"
      : x.status === "paid"
        ? x.type === "pickup"
          ? "Preparing"
          : "Confirmed"
        : x.status === "ready"
          ? "Ready!"
          : x.status === "served"
            ? x.timerEnd <= now
              ? "Overtime"
              : "Seated"
            : x.pickedUp
              ? "Picked up"
              : "Completed";
  const clear = () => {
    setCart({});
    setDrawer(false);
    setQr(false);
    setVid(null);
    setStep("map");
    setSel(null);
  };
  const place = (method) => {
    if (dine) {
      const cur = tbl(sel);
      if (!cur || cur.status !== "available") {
        alert("Sorry, that table was just taken. Please pick another.");
        clear();
        return;
      }
    }
    const id = "o" + Date.now(),
      cash = method === "cash",
      od = {
        id,
        cust: true,
        email: user,
        type: dine ? "dine" : "pickup",
        table: dine ? sel : null,
        slot,
        items,
        subtotal,
        fee,
        disc,
        total,
        method,
        status: cash ? "pending_cash" : "paid",
        created: Date.now(),
        timerEnd: null,
        ext: [],
      };
    set((p) => ({
      ...p,
      orders: [...p.orders, od],
      tables: dine
        ? p.tables.map((t) =>
            t.id === sel
              ? { ...t, status: cash ? "held" : "reserved", orderId: id }
              : t,
          )
        : p.tables,
      members: {
        ...p.members,
        [user]: {
          ...p.members[user],
          points: p.members[user].points + (cash ? 0 : pts),
          vouchers: p.members[user].vouchers.filter(
            (v) => v.id !== (vch && vch.id),
          ),
        },
      },
    }));
    if (dine) setMine(id);
    clear();
    setDet(id);
    setTab("orders");
  };
  const extend = () => {
    set((p) => ({
      ...p,
      orders: p.orders.map((x) =>
        x.id === o.id
          ? {
              ...x,
              stay: false,
              total: x.total + total,
              timerEnd: Date.now() + p.settings.hours * H,
              ext: [...x.ext, { items, total }],
            }
          : x,
      ),
      members: {
        ...p.members,
        [user]: { ...p.members[user], points: p.members[user].points + pts },
      },
    }));
    setExt(false);
    clear();
    setDet(o.id);
    setTab("orders");
  };
  const checkout = () => {
    if (!met) return;
    if (ext || pay === "qris") setQr(true);
    else place("cash");
  };
  const adv = (x) => {
    if (x.status === "pending_cash") set(confirmCash(x.id));
    else if (x.status === "paid") {
      if (x.type === "pickup") upd(x.id, { prepared: true, status: "ready" });
      else if (!x.prepared) upd(x.id, { prepared: true });
      else set(approveHandover(x.id));
    } else if (x.status === "ready")
      upd(x.id, { status: "closed", pickedUp: true });
  };
  const advL = (x) =>
    x.status === "pending_cash"
      ? "Confirm Cash Collected"
      : x.status === "paid"
        ? x.type === "pickup"
          ? "Mark Ready for Pickup"
          : !x.prepared
            ? "Mark Prepared"
            : "Approve at Handover"
        : x.status === "ready"
          ? "Handed to Customer"
          : null;

  let body;
  if (tab === "home")
    body = (
      <div className="pb-4">
        <div className="bg-espresso text-cream px-5 pt-5 pb-14 rounded-b-[2rem] flex justify-between items-center">
          <div>
            <div className="text-xs opacity-70">Good day,</div>
            <div className="font-semibold text-lg">{M.name} 👋</div>
          </div>
        </div>
        <button
          onClick={() => setTab("me")}
          className="block text-left mx-4 -mt-10 w-[calc(100%-2rem)] bg-white rounded-2xl p-4 shadow-lg"
        >
          <div className="flex justify-between items-center">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
              {TIERS[ti][0]} Member
            </span>
            <b className="text-xl text-terra">
              {M.points}{" "}
              <span className="text-xs font-normal text-espresso/60">pts</span>
            </b>
          </div>
          <div className="h-2 bg-latte rounded mt-3">
            <div
              className="h-full rounded bg-sage transition-all"
              style={{ width: pc + "%" }}
            />
          </div>
          <div className="text-[11px] text-espresso/60 mt-1.5">
            {nx ? nx[1] - M.points + " pts to " + nx[0] : "Top tier reached 🎉"}{" "}
            · {M.vouchers.length} vouchers
          </div>
        </button>
        <div className="grid grid-cols-2 gap-3 px-4 mt-4">
          {[
            ["dine", "🍽️", "Dine-in", "Book a table", "bg-sage"],
            [
              "pickup",
              "🥡",
              "Pick Up",
              "Order ahead, skip the queue",
              "bg-terra",
            ],
          ].map(([k, e, t, d, c]) => (
            <button
              key={k}
              onClick={() => go(k)}
              className={
                "rounded-2xl p-4 text-left text-white shadow-sm active:scale-95 transition " +
                c
              }
            >
              <div className="text-3xl">{e}</div>
              <div className="font-semibold mt-1">{t}</div>
              <div className="text-xs opacity-90">{d}</div>
            </button>
          ))}
        </div>
        {act1 && (
          <div className="px-4 mt-4">
            <button
              onClick={() => {
                setDet(act1.id);
                setTab("orders");
              }}
              className="w-full bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 text-left border-l-4 border-terra"
            >
              <span className="text-2xl">
                {act1.type === "pickup" ? "🥡" : "🍽️"}
              </span>
              <div className="flex-1 text-sm">
                <b>Active order</b>
                <div className="text-xs text-espresso/60">
                  {lab(act1)} · {rp(act1.total)}
                </div>
              </div>
              <span className="text-terra text-xs">Track</span>
            </button>
          </div>
        )}
        <div className="px-4 mt-5 font-semibold text-sm flex justify-between">
          Popular today
          <button
            onClick={() => setTab("order")}
            className="text-terra text-xs font-normal"
          >
            See menu
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto scroll px-4 mt-2 pb-1">
          {s.menu
            .filter(
              (m) =>
                m.stock &&
                ["m1", "m2", "m4", "m7", "m10", "m12"].includes(m.id),
            )
            .map((m) => (
              <button
                key={m.id}
                onClick={() => setTab("order")}
                className="shrink-0 w-36 bg-white rounded-2xl shadow-sm overflow-hidden text-left"
              >
                <Pic m={m} size="w-full aspect-[4/3]" text="text-5xl" />
                <div className="p-2">
                  <div className="text-xs font-medium leading-tight truncate">
                    {m.name}
                  </div>
                  <div className="text-xs text-terra font-bold">
                    {rp(m.price)}
                  </div>
                </div>
              </button>
            ))}
        </div>
        <div className="px-4 mt-5 font-semibold text-sm">Today’s offers</div>
        <div className="flex gap-3 overflow-x-auto scroll px-4 mt-2">
          {[
            ["Double points weekend", "Earn 2× on every order", "bg-sage"],
            ["Skip the queue", "Order ahead for pick up", "bg-terra"],
            ["Rooftop is open", "Book a 2nd floor table", "bg-espresso"],
          ].map(([a, b, c]) => (
            <div
              key={a}
              className={"shrink-0 w-44 rounded-2xl p-4 text-white " + c}
            >
              <div className="font-semibold text-sm">{a}</div>
              <div className="text-xs opacity-90 mt-1">{b}</div>
            </div>
          ))}
        </div>
      </div>
    );
  else if (tab === "order") {
    const Menu = (
      <div>
        <div className="px-4 pt-3 flex items-center gap-2">
          {dine ? (
            <>
              <button
                onClick={() => {
                  if (ext) {
                    setExt(false);
                    setTab("orders");
                  } else setStep("map");
                }}
                className="p-1.5 rounded-full bg-latte"
              >
                <I n="back" c="w-4 h-4" />
              </button>
              <div className="text-sm">
                <b>{ext ? "Extend session" : "Table " + (T && T.name)}</b>{" "}
                <span className="text-espresso/60">
                  · min {min} item{min > 1 ? "s" : ""}
                </span>
              </div>
            </>
          ) : (
            <>
              <I n="pin" c="w-4 h-4 text-terra shrink-0" />
              <div className="flex-1 min-w-0 text-xs leading-tight">
                <b>Kopi Senja Café</b>
                <div className="text-espresso/60 truncate">
                  Pick up at the counter
                </div>
              </div>
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="bg-latte rounded-lg px-2 py-1.5 text-xs"
              >
                {slots.map((x) => (
                  <option key={x} value={x}>
                    {x === "Now" ? "ASAP (~10 min)" : x}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur px-4 pt-3 pb-2 flex gap-2 overflow-x-auto scroll">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={
                "px-4 py-2 rounded-full text-sm whitespace-nowrap transition " +
                (cat === c
                  ? "bg-terra text-white font-medium"
                  : "bg-white shadow-sm")
              }
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pt-2 pb-32">
          {s.menu
            .filter((m) => m.cat === cat)
            .map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="relative">
                  <Pic m={m} size="w-full aspect-[4/3]" text="text-6xl" />
                  {!m.stock && (
                    <div className="absolute inset-0 grid place-items-center bg-espresso/55 text-white text-xs font-semibold">
                      Sold out
                    </div>
                  )}
                  {m.stock && (
                    <div className="absolute bottom-2 right-2">
                      {cart[m.id] > 0 ? (
                        <div className="flex items-center gap-2 bg-white rounded-full shadow-lg px-1.5 py-1">
                          <button
                            onClick={() => setQty(m.id, -1)}
                            className="w-7 h-7 rounded-full bg-latte grid place-items-center"
                          >
                            <I n="minus" c="w-3.5 h-3.5" />
                          </button>
                          <b className="text-sm w-3 text-center">
                            {cart[m.id]}
                          </b>
                          <button
                            onClick={() => setQty(m.id, 1)}
                            className="w-7 h-7 rounded-full bg-terra text-white grid place-items-center"
                          >
                            <I n="plus" c="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setQty(m.id, 1)}
                          className="w-9 h-9 rounded-full bg-terra text-white shadow-lg grid place-items-center active:scale-90 transition"
                        >
                          <I n="plus" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <div className="font-medium text-[13px] leading-tight min-h-[2.1rem]">
                    {m.name}
                  </div>
                  <div className="text-sm text-terra font-bold mt-1">
                    {rp(m.price)}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
    body = (
      <div>
        {!ext && (
          <div className="px-4 pt-4">
            <div className="bg-latte rounded-full p-1 grid grid-cols-2 text-sm">
              {[
                ["dine", "🍽️ Dine-in"],
                ["pickup", "🥡 Pick Up"],
              ].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => {
                    setType(k);
                    setStep("map");
                    setCart({});
                    setVid(null);
                  }}
                  className={
                    "py-2 rounded-full transition " +
                    (type === k ? "bg-espresso text-cream" : "")
                  }
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
        {inMenu ? (
          Menu
        ) : (
          <div className="p-4 pb-28">
            <div className="bg-white rounded-3xl p-3 shadow-sm space-y-3">
              <div className="flex gap-1.5">
                {[1, 2].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFloor(f)}
                    className={
                      "flex-1 py-1.5 rounded-full text-sm transition " +
                      (floor === f ? "bg-espresso text-cream" : "bg-latte")
                    }
                  >
                    {f === 1 ? "Ground Floor" : "2nd Floor · Rooftop"}{" "}
                    <span className="text-[10px] opacity-70">
                      (
                      {
                        s.tables.filter(
                          (t) => t.floor === f && tstat(t) === "available",
                        ).length
                      }{" "}
                      free)
                    </span>
                  </button>
                ))}
              </div>
              <FloorMap
                tables={s.tables.filter((t) => t.floor === floor)}
                floor={floor}
                tstat={tstat}
                sel={sel}
                setSel={setSel}
                orders={s.orders}
                now={now}
              />
              <p className="text-[11px] text-espresso/50 text-center">
                2-seat tables: min 1 item · 4-seat tables: min 2 items
              </p>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[11px]">
              {Object.entries(ST).map(([k, [l, c]]) => (
                <span key={k} className="flex items-center gap-1">
                  <i
                    className={
                      "w-2.5 h-2.5 rounded-sm border " +
                      c.split(" ").slice(0, 2).join(" ")
                    }
                  />
                  {l}
                </span>
              ))}
            </div>
            <h3 className="font-medium text-sm mt-4 mb-2">Time slot</h3>
            <div className="flex gap-2 overflow-x-auto scroll">
              {slots.map((x) => (
                <button
                  key={x}
                  onClick={() => setSlot(x)}
                  className={
                    "px-3 py-1.5 rounded-full text-sm whitespace-nowrap " +
                    (slot === x ? "bg-espresso text-cream" : "bg-latte")
                  }
                >
                  {x}
                </button>
              ))}
            </div>
            <p className="text-xs text-espresso/60 mt-3">
              Your 3-hour session starts when your order is served at the table.
            </p>
          </div>
        )}
      </div>
    );
  } else if (tab === "orders") {
    const d = s.orders.find((x) => x.id === det);
    body = d ? (
      <div>
        <div className="px-4 pt-3">
          <button
            onClick={() => setDet(null)}
            className="p-1.5 rounded-full bg-latte inline-block"
          >
            <I n="back" c="w-4 h-4" />
          </button>
        </div>
        {d.type === "pickup" ? (
          <Track o={d} s={s} />
        ) : d.status === "closed" ? (
          <div className="p-4">
            <div className="bg-latte rounded-3xl p-6 text-center">
              <div className="font-semibold">Session completed</div>
              <p className="text-sm mt-1">
                Thanks for visiting! You earned {Math.floor(d.total / 1000)}{" "}
                points.
              </p>
            </div>
          </div>
        ) : (
          <Status
            o={d}
            s={s}
            now={now}
            set={set}
            onExtend={() => {
              setExt(true);
              setCart({});
              setStep("menu");
              setTab("order");
            }}
          />
        )}
      </div>
    ) : (
      <div className="p-4 space-y-2.5">
        <h2 className="font-semibold text-lg">My orders</h2>
        {mine.length === 0 && (
          <p className="text-sm text-espresso/50 py-6 text-center">
            No orders yet. Your first one earns points!
          </p>
        )}
        {mine.map((x) => (
          <button
            key={x.id}
            onClick={() => setDet(x.id)}
            className="w-full text-left bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3"
          >
            <span className="text-2xl">
              {x.type === "pickup" ? "🥡" : "🍽️"}
            </span>
            <div className="flex-1">
              <div className="font-medium text-sm">
                {x.type === "pickup" ? "Pick up" : "Table " + x.table}
              </div>
              <div className="text-xs text-espresso/60">
                {hm(x.created)} · {rp(x.total)}
              </div>
            </div>
            <span
              className={
                "text-[11px] px-2 py-1 rounded-full " +
                (x.status === "closed" ? "bg-latte" : "bg-terra/15 text-terra")
              }
            >
              {lab(x)}
            </span>
          </button>
        ))}
      </div>
    );
  } else
    body = (
      <div className="p-4 space-y-4">
        <div className="bg-espresso text-cream rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-terra grid place-items-center text-xl font-bold">
              {M.name[0]}
            </div>
            <div>
              <div className="font-semibold">{M.name}</div>
              <div className="text-xs opacity-70">{M.phone}</div>
            </div>
          </div>
          <div className="flex justify-between items-end mt-4">
            <div>
              <div className="text-xs opacity-70">{TIERS[ti][0]} Member</div>
              <div className="text-3xl font-bold">
                {M.points}
                <span className="text-sm font-normal"> pts</span>
              </div>
            </div>
            <div className="text-xs opacity-70">
              {nx ? nx[1] - M.points + " pts to " + nx[0] : "Top tier"}
            </div>
          </div>
          <div className="h-2 bg-white/20 rounded mt-2">
            <div
              className="h-full rounded bg-sage"
              style={{ width: pc + "%" }}
            />
          </div>
          <div className="flex justify-between text-[10px] opacity-60 mt-1">
            {TIERS.map((t) => (
              <span key={t[0]}>
                {t[0]} {t[1]}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="font-semibold text-sm mb-2">
            My vouchers ({M.vouchers.length})
          </div>
          <div className="space-y-2">
            {M.vouchers.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border-l-4 border-terra"
              >
                <I n="tag" c="w-5 h-5 text-terra" />
                <div className="text-sm flex-1">{v.t}</div>
              </div>
            ))}
            {M.vouchers.length === 0 && (
              <p className="text-xs text-espresso/50">
                No vouchers. Redeem points below.
              </p>
            )}
          </div>
        </div>
        <button
          disabled={M.points < 200}
          onClick={() =>
            set((p) => ({
              ...p,
              members: {
                ...p.members,
                [user]: {
                  ...p.members[user],
                  points: p.members[user].points - 200,
                  vouchers: [
                    ...p.members[user].vouchers,
                    {
                      id: "v" + Date.now(),
                      t: "Rp10k off · min Rp40k",
                      k: "amt",
                      v: 10000,
                      min: 40000,
                    },
                  ],
                },
              },
            }))
          }
          className="w-full py-3 rounded-2xl bg-sage text-white font-medium disabled:opacity-40"
        >
          Redeem 200 pts → Rp10k voucher
        </button>
        <div className="bg-white rounded-2xl p-4 text-xs text-espresso/70 space-y-1 shadow-sm">
          <b className="text-sm text-espresso">How points work</b>
          <div>
            Earn 1 point per Rp1,000 on every paid order (dine-in or pick up).
          </div>
          <div>Silver at 500 pts, Gold at 1,500 pts.</div>
        </div>
      </div>
    );

  return (
    <div className="grid lg:grid-cols-[390px_300px] gap-6 justify-center items-start p-0 sm:p-4">
      <div className={FR}>
        <div className="hidden sm:flex justify-between items-center px-7 pt-2.5 text-[11px] font-semibold">
          <span>{hm(now)}</span>
          <span>▂▄▆ 5G ▭</span>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <button
            onClick={() => setCfg(true)}
            aria-label="Settings"
            className="w-9 h-9 rounded-full bg-white shadow-sm grid place-items-center active:scale-95 transition"
          >
            <I n="sliders" />
          </button>
          <div className="font-bold flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg bg-terra text-white grid place-items-center">
              <I n="coffee" c="w-3.5 h-3.5" />
            </span>
            {
              {
                home: "Makancil",
                order: "Order",
                orders: "My Orders",
                me: "Member",
              }[tab]
            }
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTab("orders");
                setDet(null);
              }}
              aria-label="Notifications"
              className="relative w-9 h-9 rounded-full bg-white shadow-sm grid place-items-center"
            >
              <I n="bell" />
              {act1 && pf.notif !== false && (
                <i className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-terra" />
              )}
            </button>
            <button
              onClick={() => {
                setTab("me");
              }}
              aria-label="Profile"
              className="w-9 h-9 rounded-full bg-terra text-white font-bold grid place-items-center"
            >
              {(M.name || "?")[0]}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll">
          {body}
        </div>
        {tab === "order" &&
          (inMenu ? (
            <button
              onClick={() => setDrawer(true)}
              className="absolute right-4 bottom-[80px] z-10 rounded-full bg-terra text-white pl-4 pr-5 py-3 shadow-xl flex items-center gap-2 active:scale-95 transition"
            >
              <span className="relative">
                <I n="bag" />
                {count > 0 && (
                  <b className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-espresso text-[10px] grid place-items-center">
                    {count}
                  </b>
                )}
              </span>
              <span className="font-semibold text-sm">{rp(subtotal)}</span>
            </button>
          ) : (
            <div className="absolute bottom-[78px] inset-x-0 p-3 bg-gradient-to-t from-cream via-cream to-transparent">
              <button
                disabled={!sel}
                onClick={() => setStep("menu")}
                className="w-full py-3.5 rounded-2xl bg-espresso text-cream font-medium disabled:opacity-40 shadow-lg"
              >
                {sel
                  ? `Order for Table ${sel} · ${slot}`
                  : "Select an available table"}
              </button>
            </div>
          ))}
        <nav
          className="grid grid-cols-4 bg-white rounded-t-3xl shadow-[0_-6px_20px_rgba(59,42,32,0.08)] px-2 pt-2 z-10"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          {[
            ["home", "Home", "home"],
            ["order", "Order", "coffee"],
            ["orders", "Orders", "bag"],
            ["me", "Member", "user"],
          ].map(([k, l, ic]) => (
            <button
              key={k}
              onClick={() => {
                setTab(k);
                if (k !== "orders") setDet(null);
              }}
              className={
                "relative flex flex-col items-center text-[11px] gap-0.5 py-1 transition " +
                (tab === k ? "text-terra font-semibold" : "text-espresso/50")
              }
            >
              <span
                className={
                  "px-4 py-1 rounded-full transition " +
                  (tab === k ? "bg-terra/15" : "")
                }
              >
                <I n={ic} />
              </span>
              {l}
              {k === "orders" && act1 && (
                <i className="absolute top-0 right-6 w-2 h-2 rounded-full bg-terra" />
              )}
            </button>
          ))}
        </nav>
        {cfg && (
          <Settings
            M={M}
            user={user}
            pf={pf}
            setPf={setPf}
            set={set}
            onClose={() => setCfg(false)}
            onLogout={onLogout}
          />
        )}
        {drawer && (
          <div
            className="absolute inset-0 bg-espresso/50 flex items-end z-20"
            onClick={() => setDrawer(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-cream w-full rounded-t-3xl p-5 max-h-[88%] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">
                  {ext
                    ? "Extend your session"
                    : dine
                      ? "Dine-in · Table " + sel
                      : "Pick up order"}
                </h3>
                <button onClick={() => setDrawer(false)}>
                  <I n="x" />
                </button>
              </div>
              {lines.length === 0 && (
                <p className="text-sm text-espresso/60 py-4">
                  Your cart is empty.
                </p>
              )}
              {lines.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center gap-2 py-1.5 text-sm"
                >
                  <span className="flex-1 flex items-center gap-2">
                    <Pic m={l} size="w-8 h-8" text="text-base" />
                    {l.name}
                  </span>
                  <button
                    onClick={() => setQty(l.id, -1)}
                    className="w-6 h-6 rounded-full bg-latte grid place-items-center"
                  >
                    <I n="minus" c="w-3 h-3" />
                  </button>
                  <b className="w-4 text-center">{l.q}</b>
                  <button
                    onClick={() => setQty(l.id, 1)}
                    className="w-6 h-6 rounded-full bg-sage text-white grid place-items-center"
                  >
                    <I n="plus" c="w-3 h-3" />
                  </button>
                  <span className="w-20 text-right">{rp(l.q * l.price)}</span>
                </div>
              ))}
              {dine && (
                <div
                  className={
                    "mt-3 p-3 rounded-xl text-sm " +
                    (met
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800")
                  }
                >
                  <div className="flex justify-between font-medium">
                    <span>{met ? "Minimum met" : "Table minimum"}</span>
                    <span>
                      {Math.min(count, min)}/{min} items minimum met
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/70 rounded mt-2">
                    <div
                      className="h-full rounded bg-sage transition-all"
                      style={{
                        width: Math.min(100, (count / min) * 100) + "%",
                      }}
                    />
                  </div>
                </div>
              )}
              {!ext && (
                <div className="mt-3">
                  <div className="text-xs font-medium mb-1.5">Voucher</div>
                  <div className="flex gap-2 overflow-x-auto scroll">
                    <button
                      onClick={() => setVid(null)}
                      className={
                        "shrink-0 px-3 py-2 rounded-xl text-xs border-2 " +
                        (!vch
                          ? "border-terra bg-terra/10"
                          : "border-latte bg-white")
                      }
                    >
                      None
                    </button>
                    {M.vouchers.map((v) => {
                      const ok = subtotal >= v.min;
                      return (
                        <button
                          key={v.id}
                          disabled={!ok}
                          onClick={() => setVid(v.id)}
                          className={
                            "shrink-0 px-3 py-2 rounded-xl text-xs border-2 text-left disabled:opacity-40 " +
                            (vch && vch.id === v.id
                              ? "border-terra bg-terra/10"
                              : "border-latte bg-white")
                          }
                        >
                          {v.t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {!ext && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    ["qris", "QRIS / E-Wallet", "qr"],
                    [
                      "cash",
                      dine ? "Cash (Staff Assist)" : "Pay at Counter",
                      "cash",
                    ],
                  ].map(([k, l, ic]) => (
                    <button
                      key={k}
                      onClick={() => setPay(k)}
                      className={
                        "border-2 rounded-xl p-3 text-xs flex flex-col items-center gap-1 " +
                        (pay === k
                          ? "border-terra bg-terra/10"
                          : "border-latte bg-white")
                      }
                    >
                      <I n={ic} />
                      {l}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{rp(subtotal)}</span>
                </div>
                {disc > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Voucher</span>
                    <span>-{rp(disc)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base pt-1">
                  <span>Total</span>
                  <span>{rp(total)}</span>
                </div>
                <div className="text-[11px] text-terra">
                  You’ll earn {pts} points
                </div>
              </div>
              <button
                disabled={!met}
                onClick={checkout}
                className="w-full mt-3 py-3.5 rounded-2xl bg-espresso text-cream font-medium disabled:opacity-40"
              >
                {met
                  ? ext || pay === "qris"
                    ? "Pay with QRIS"
                    : dine
                      ? "Place order · Pay cash"
                      : "Place order · Pay at counter"
                  : `Add ${min - count} more item${min - count > 1 ? "s" : ""} to checkout`}
              </button>
            </div>
          </div>
        )}
        {qr && (
          <div className="absolute inset-0 bg-espresso/70 grid place-items-center z-30 p-6">
            <div className="bg-white rounded-3xl p-5 w-full text-center">
              <div className="font-semibold">Scan to pay with QRIS</div>
              <div className="text-2xl font-bold text-terra my-1">
                {rp(total)}
              </div>
              <svg viewBox="0 0 11 11" className="w-44 h-44 mx-auto my-3">
                {[...Array(121)].map((_, i) => {
                  const x = i % 11,
                    y = Math.floor(i / 11),
                    corner =
                      (x < 3 || x > 7) && (y < 3 || y > 7) && !(x > 7 && y > 7);
                  return (
                    corner
                      ? x % 2 === y % 2 || x === 1 || y === 1
                      : (x * 7 + y * 13 + x * y) % 3 === 0
                  ) ? (
                    <rect
                      key={i}
                      x={x}
                      y={y}
                      width="1"
                      height="1"
                      fill="#3b2a20"
                    />
                  ) : null;
                })}
              </svg>
              <button
                onClick={() => (ext ? extend() : place("qris"))}
                className="w-full py-3 rounded-2xl bg-sage text-white font-medium"
              >
                Simulate Successful Payment
              </button>
              <button
                onClick={() => setQr(false)}
                className="mt-2 text-sm text-espresso/60"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      <aside className="hidden sm:block bg-white rounded-3xl p-5 shadow-sm text-sm space-y-3 w-full max-w-[390px] mx-auto lg:max-w-none">
        <div className="font-semibold">Demo helper</div>
        <p className="text-espresso/60 text-xs">
          Play the staff role here, or use the Staff KDS tab. Syncs across tabs.
        </p>
        <div className="text-xs">
          Latest order:{" "}
          <b>
            {act1
              ? (act1.type === "pickup" ? "Pick up" : "Table " + act1.table) +
                " · " +
                lab(act1)
              : "none"}
          </b>
        </div>
        {act1 && advL(act1) && (
          <button
            onClick={() => adv(act1)}
            className="w-full py-2.5 rounded-xl bg-sage text-white"
          >
            Staff: {advL(act1)}
          </button>
        )}
        {my && (
          <button
            onClick={() => {
              setMine(null);
              setDet(null);
            }}
            className="w-full py-2.5 rounded-xl bg-latte"
          >
            Forget current booking
          </button>
        )}
      </aside>
    </div>
  );
}

function Customer({ s, set, now }) {
  const [user, setUser] = useState(() => {
    try {
      return localStorage.getItem(SES);
    } catch (e) {
      return null;
    }
  });
  const [pf, setPf] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PREF)) || {};
    } catch (e) {
      return {};
    }
  });
  useEffect(() => {
    document.documentElement.style.setProperty("--terra", ACC[pf.acc || 0][1]);
    document.documentElement.style.fontSize =
      [14, 16, 18][pf.size == null ? 1 : pf.size] + "px";
    try {
      localStorage.setItem(PREF, JSON.stringify(pf));
    } catch (e) {}
  }, [pf]);
  const login = (e) => {
    setUser(e);
    try {
      localStorage.setItem(SES, e);
    } catch (x) {}
  };
  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(SES);
      localStorage.removeItem(MY);
    } catch (x) {}
  };
  return user && s.members && s.members[user] ? (
    <CustomerApp
      key={user}
      s={s}
      set={set}
      now={now}
      user={user}
      pf={pf}
      setPf={setPf}
      onLogout={logout}
    />
  ) : (
    <Login s={s} set={set} onLogin={login} />
  );
}
function Login({ s, set, onLogin }) {
  const [mode, setMode] = useState("in"),
    [f, setF] = useState({ name: "", email: "", pass: "" }),
    [err, setErr] = useState(""),
    [show, setShow] = useState(false);
  const submit = () => {
    const email = f.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email))
      return setErr("Enter a valid email address.");
    if (f.pass.length < 6)
      return setErr("Password must be at least 6 characters.");
    const u = s.users.find((x) => x.email === email);
    if (mode === "in") {
      if (!u || u.pass !== f.pass)
        return setErr("Incorrect email or password.");
      return onLogin(email);
    }
    if (u) return setErr("That email is already registered.");
    const name = f.name.trim() || email.split("@")[0],
      k = Date.now();
    set((p) => ({
      ...p,
      users: [...p.users, { email, pass: f.pass, name }],
      members: {
        ...p.members,
        [email]: {
          name,
          phone: "",
          points: 0,
          vouchers: [
            {
              id: "w1" + k,
              t: "Welcome · Rp5k off pick up",
              k: "amt",
              v: 5000,
              min: 20000,
            },
            {
              id: "w2" + k,
              t: "Welcome · 20% off first order",
              k: "pct",
              v: 20,
              min: 30000,
            },
          ],
        },
      },
    }));
    onLogin(email);
  };
  const inp =
    "w-full bg-white rounded-xl pl-10 pr-3 py-3 text-sm border border-latte focus:outline-none focus:border-terra";
  const F = ({ ic, children }) => (
    <div className="relative">
      <span className="absolute left-3 top-3 text-espresso/40">
        <I n={ic} c="w-5 h-5" />
      </span>
      {children}
    </div>
  );
  return (
    <div className="flex justify-center p-0 sm:p-4">
      <div className={FR}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll px-6 pt-12 pb-6 flex flex-col">
          <div className="w-16 h-16 rounded-3xl bg-terra text-white grid place-items-center shadow-lg">
            <I n="coffee" c="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mt-5">
            {mode === "in" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-espresso/60 mt-1">
            {mode === "in"
              ? "Sign in to order, earn points and book tables."
              : "Join Makancil and get welcome vouchers."}
          </p>
          <div className="space-y-3 mt-6">
            {mode === "up" && (
              <F ic="user">
                <input
                  className={inp}
                  placeholder="Your name"
                  value={f.name}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                />
              </F>
            )}
            <F ic="mail">
              <input
                className={inp}
                type="email"
                placeholder="Email"
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
              />
            </F>
            <F ic="lock">
              <input
                className={inp}
                type={show ? "text" : "password"}
                placeholder="Password"
                value={f.pass}
                onChange={(e) => setF({ ...f, pass: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              <button
                onClick={() => setShow(!show)}
                className="absolute right-3 top-3 text-xs text-terra"
              >
                {show ? "Hide" : "Show"}
              </button>
            </F>
          </div>
          {err && (
            <div className="mt-3 text-sm text-rose-700 bg-rose-50 rounded-xl px-3 py-2">
              {err}
            </div>
          )}
          <button
            onClick={submit}
            className="mt-5 w-full py-3.5 rounded-2xl bg-terra text-white font-semibold active:scale-95 transition"
          >
            {mode === "in" ? "Sign in" : "Create account"}
          </button>
          {mode === "in" && (
            <button
              onClick={() => {
                setF({ ...f, email: "rina@makancil.id", pass: "demo1234" });
                setErr("");
              }}
              className="mt-3 text-sm text-terra"
            >
              Use demo account
            </button>
          )}
          <div className="mt-auto pt-8 text-center text-sm text-espresso/60">
            {mode === "in" ? "New here? " : "Already a member? "}
            <button
              onClick={() => {
                setMode(mode === "in" ? "up" : "in");
                setErr("");
              }}
              className="text-terra font-semibold"
            >
              {mode === "in" ? "Create account" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function Settings({ M, user, pf, setPf, set, onClose, onLogout }) {
  const up = (p) =>
    set((st) => ({
      ...st,
      members: { ...st.members, [user]: { ...st.members[user], ...p } },
    }));
  const inp =
    "w-full border border-latte rounded-xl px-3 py-2 bg-white text-sm";
  const Tg = ({ k }) => {
    const v = pf[k] !== false;
    return (
      <button
        onClick={() => setPf((p) => ({ ...p, [k]: !v }))}
        className={
          "w-11 h-6 rounded-full p-0.5 transition " +
          (v ? "bg-sage" : "bg-latte")
        }
      >
        <span
          className={
            "block w-5 h-5 rounded-full bg-white shadow transition " +
            (v ? "translate-x-5" : "")
          }
        />
      </button>
    );
  };
  const Sec = ({ t, children }) => (
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-espresso/50">
        {t}
      </div>
      {children}
    </div>
  );
  const Row = ({ l, children }) => (
    <div className="flex items-center justify-between text-sm">
      {l}
      {children}
    </div>
  );
  return (
    <div className="absolute inset-0 z-40 bg-cream flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white shadow-sm"
        >
          <I n="back" c="w-4 h-4" />
        </button>
        <h2 className="font-semibold text-lg">Settings</h2>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden scroll px-4 pb-6 space-y-3">
        <Sec t="Profile">
          <input
            className={inp}
            value={M.name}
            placeholder="Display name"
            onChange={(e) => up({ name: e.target.value })}
          />
          <input
            className={inp}
            value={M.phone}
            placeholder="Phone number"
            onChange={(e) => up({ phone: e.target.value })}
          />
          <div className="text-xs text-espresso/50">Signed in as {user}</div>
        </Sec>
        <Sec t="Appearance">
          <Row l="Accent color">
            <div className="flex gap-2">
              {ACC.map(([n, c], i) => (
                <button
                  key={n}
                  title={n}
                  onClick={() => setPf((p) => ({ ...p, acc: i }))}
                  className={
                    "w-7 h-7 rounded-full border-2 " +
                    ((pf.acc || 0) === i
                      ? "border-espresso scale-110"
                      : "border-white")
                  }
                  style={{ background: "rgb(" + c + ")" }}
                />
              ))}
            </div>
          </Row>
          <Row l="Text size">
            <div className="flex bg-latte rounded-full p-0.5 text-xs">
              {["S", "M", "L"].map((x, i) => (
                <button
                  key={x}
                  onClick={() => setPf((p) => ({ ...p, size: i }))}
                  className={
                    "w-8 py-1 rounded-full " +
                    ((pf.size == null ? 1 : pf.size) === i
                      ? "bg-espresso text-cream"
                      : "")
                  }
                >
                  {x}
                </button>
              ))}
            </div>
          </Row>
        </Sec>
        <Sec t="Notifications">
          <Row l="Order updates">
            <Tg k="notif" />
          </Row>
          <Row l="Sound">
            <Tg k="sound" />
          </Row>
        </Sec>
        <button
          onClick={onLogout}
          className="w-full py-3.5 rounded-2xl bg-white shadow-sm text-rose-700 font-medium flex items-center justify-center gap-2"
        >
          <I n="out" c="w-4 h-4" />
          Sign out
        </button>
        <p className="text-center text-[11px] text-espresso/40">
          Makancil demo · v1.0
        </p>
      </div>
    </div>
  );
}

function Track({ o, s }) {
  const m = (id) => s.menu.find((x) => x.id === id),
    st = o.pickedUp
      ? 3
      : o.status === "ready"
        ? 2
        : o.status === "paid"
          ? 1
          : 0,
    S = ["Order received", "Being prepared", "Ready for pickup", "Picked up"];
  return (
    <div className="p-4 space-y-3">
      <div className="bg-white rounded-3xl p-5 shadow-sm">
        <div className="font-semibold text-lg">
          {S[st]}
          {st === 2 && " 🥡"}
        </div>
        <div className="text-xs text-espresso/60 mb-4">
          {st === 2
            ? "Your order is ready at the counter!"
            : st < 2
              ? "Ready in about 10–15 min"
              : "Enjoy your coffee!"}
        </div>
        {o.status === "pending_cash" && (
          <div className="mb-3 text-xs bg-amber-100 text-amber-900 rounded-xl p-3">
            Please pay {rp(o.total)} at the counter. We start preparing once
            payment is confirmed.
          </div>
        )}
        {S.map((x, i) => (
          <div key={x} className="flex items-center gap-3 mb-3">
            <span
              className={
                "w-6 h-6 rounded-full grid place-items-center text-xs " +
                (i <= st ? "bg-sage text-white" : "bg-latte")
              }
            >
              {i <= st ? <I n="check" c="w-3.5 h-3.5" /> : i + 1}
            </span>
            <span
              className={
                "text-sm " + (i <= st ? "font-medium" : "text-espresso/50")
              }
            >
              {x}
            </span>
          </div>
        ))}
        <div className="rounded-xl bg-latte p-3 text-center">
          <div className="text-[11px] text-espresso/60">
            Pickup code · {o.slot === "Now" ? "ASAP" : o.slot}
          </div>
          <div className="text-2xl font-bold tracking-widest">
            #{o.id.slice(-4)}
          </div>
          <div className="text-[11px] text-espresso/60 mt-1">
            📍 Kopi Senja Café · counter
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm text-sm">
        <div className="font-semibold mb-2">
          Receipt{" "}
          <span className="text-espresso/50 font-normal">
            #{o.id.slice(-5)}
          </span>
        </div>
        {o.items.map(
          (it, i) =>
            m(it.id) && (
              <div key={i} className="flex justify-between py-0.5">
                <span>
                  {it.q}× {m(it.id).name}
                </span>
                <span>{rp(it.q * m(it.id).price)}</span>
              </div>
            ),
        )}
        {o.disc > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Voucher</span>
            <span>-{rp(o.disc)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold border-t border-latte mt-2 pt-2">
          <span>Total · {o.method === "cash" ? "Pay at counter" : "QRIS"}</span>
          <span>{rp(o.total)}</span>
        </div>
        <div className="text-[11px] text-terra mt-1">
          +{Math.floor(o.total / 1000)} points earned
        </div>
      </div>
    </div>
  );
}

function Status({ o, s, now, set, onExtend }) {
  const left = o.timerEnd ? o.timerEnd - now : null,
    over = o.status === "served" && left <= 0,
    m = (id) => s.menu.find((x) => x.id === id);
  const all = [...o.items, ...o.ext.flatMap((e) => e.items)];
  const Receipt = (
    <div className="bg-white rounded-2xl p-4 shadow-sm text-sm mt-4">
      <div className="flex justify-between font-semibold mb-2">
        <span>Digital receipt</span>
        <span className="text-espresso/50 font-normal">#{o.id.slice(-5)}</span>
      </div>
      <div className="text-xs text-espresso/60 mb-2">
        Table {o.table} · {o.slot} · {o.method === "cash" ? "Cash" : "QRIS"}
      </div>
      {all.map(
        (it, i) =>
          m(it.id) && (
            <div key={i} className="flex justify-between py-0.5">
              <span>
                {it.q}× {m(it.id).name}
              </span>
              <span>{rp(it.q * m(it.id).price)}</span>
            </div>
          ),
      )}
      <div className="flex justify-between font-semibold border-t border-latte mt-2 pt-2">
        <span>Total</span>
        <span>{rp(o.total)}</span>
      </div>
    </div>
  );
  if (over)
    return (
      <div className="p-4">
        <div className="bg-rose-700 text-white rounded-3xl p-6 text-center animate-pulse">
          <I n="alert" c="w-10 h-10 mx-auto" />
          <div className="text-xl font-bold mt-2">Overtime!</div>
          <div className="text-sm opacity-90 mt-1">
            Your 3-hour session at Table {o.table} has ended.
          </div>
          <div className="font-mono text-4xl my-3">00:00:00</div>
        </div>
        <button
          onClick={onExtend}
          className="w-full mt-4 py-3.5 rounded-2xl bg-terra text-white font-medium"
        >
          Order More Items to Extend (+3 Hours)
        </button>
        <p className="text-xs text-center text-espresso/60 mt-2">
          Or let staff know you’re leaving — we’ll clean up.
        </p>
        {Receipt}
      </div>
    );
  if (o.status === "served")
    return (
      <div className="p-4">
        <div className="bg-sage text-white rounded-3xl p-6 text-center">
          <div className="font-semibold">
            Order Served — Enjoy your session!
          </div>
          <div className="font-mono text-5xl my-3">{fmt(left)}</div>
          <div className="text-xs opacity-90">
            Table {o.table} · time remaining
          </div>
        </div>
        <button
          onClick={() =>
            set((p) => ({
              ...p,
              orders: p.orders.map((x) =>
                x.id === o.id ? { ...x, timerEnd: x.timerEnd - H } : x,
              ),
            }))
          }
          className="mt-3 w-full py-2 rounded-xl border border-dashed border-espresso/30 text-xs text-espresso/70 flex items-center justify-center gap-1"
        >
          <I n="clock" c="w-3.5 h-3.5" />
          Debug: +1h / Fast-Forward Timer
        </button>
        {Receipt}
      </div>
    );
  if (o.status === "pending_cash")
    return (
      <div className="p-4">
        <div className="bg-amber-100 text-amber-900 rounded-3xl p-6 text-center">
          <I n="cash" c="w-10 h-10 mx-auto" />
          <div className="font-semibold mt-2">Table held!</div>
          <p className="text-sm mt-1">
            A staff member is coming to your table to collect {rp(o.total)}.
          </p>
        </div>
        {Receipt}
      </div>
    );
  return (
    <div className="p-4">
      <div className="bg-blue-100 text-blue-900 rounded-3xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-blue-600 text-white grid place-items-center mx-auto">
          <I n="check" />
        </div>
        <div className="font-semibold mt-2">
          Payment received · Booking Confirmed
        </div>
        <p className="text-sm mt-1">
          Timer starts once your order is served at your table.
        </p>
      </div>
      {Receipt}
    </div>
  );
}
