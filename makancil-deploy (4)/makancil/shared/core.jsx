// Shared: constants, icons, demo seed data, localStorage store, staff actions

const { useState, useEffect } = React;
const KEY = "makancil_master_state",
  MY = "makancil_my_order",
  SES = "makancil_session",
  PREF = "makancil_prefs",
  H = 3600000;
const ACC = [
  ["Terracotta", "200 102 74"],
  ["Ocean", "37 99 235"],
  ["Plum", "147 51 234"],
  ["Forest", "21 128 61"],
];
const FR =
  "relative w-full sm:w-[390px] mx-auto shrink-0 h-[calc(100dvh-4.5rem)] sm:h-[780px] sm:max-h-[calc(100dvh-5.5rem)] bg-cream sm:rounded-[2.5rem] sm:border-[10px] border-espresso sm:shadow-2xl overflow-hidden flex flex-col";
const rp = (n) => "Rp " + n.toLocaleString("id-ID");
const fmt = (ms) => {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
    .map((x) => String(x).padStart(2, "0"))
    .join(":");
};
const P = {
  plus: "M5 12h14M12 5v14",
  minus: "M5 12h14",
  x: "M18 6 6 18M6 6l12 12",
  check: "M20 6 9 17l-5-5",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
  bag: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  coffee:
    "M10 2v2M14 2v2M6 2v2M16 8h1a4 4 0 0 1 0 8h-1M4 8h12v9a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z",
  rot: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5",
  cash: "M2 6h20v12H2zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  qr: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v7h-3M14 20h3",
  alert:
    "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
  phone:
    "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 18h.01",
  mon: "M2 3h20v14H2zM8 21h8M12 17v4",
  chart: "M3 3v18h18M18 17V9M13 17V5M8 17v-3",
  back: "M15 18l-6-6 6-6",
  home: "M3 10.5 12 3l9 7.5V21H3zM9 21v-6h6v6",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  tag: "M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42zM7 7h.01",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  sliders:
    "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
  bell: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  out: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  mail: "M3 5h18v14H3zM3 7l9 6 9-6",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
};
const I = ({ n, c = "w-5 h-5" }) => (
  <svg
    className={c}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={P[n]} />
  </svg>
);

// Menu photo: shows the uploaded photo / URL, falls back to the emoji
function Pic({ m, size = "w-11 h-11", text = "text-2xl" }) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [m.img]);
  return m.img && !bad ? (
    <img
      src={m.img}
      alt={m.name}
      onError={() => setBad(true)}
      className={size + " rounded-xl object-cover shrink-0"}
    />
  ) : (
    <div
      className={
        size +
        " " +
        text +
        " grid place-items-center bg-gradient-to-br from-latte to-amber-100 rounded-xl shrink-0"
      }
    >
      {m.emoji}
    </div>
  );
}
// Resize an uploaded photo to max 480px JPEG so it fits in localStorage
const shrink = (file, cb) => {
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 480 / Math.max(im.width, im.height)),
        c = document.createElement("canvas");
      c.width = im.width * k;
      c.height = im.height * k;
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      cb(c.toDataURL("image/jpeg", 0.78));
    };
    im.src = r.result;
  };
  r.readAsDataURL(file);
};

const MENU = [
  ["Coffee", "Espresso", 22000, "☕"],
  ["Coffee", "Es Kopi Susu", 28000, "🧋"],
  ["Coffee", "Flat White", 34000, "☕"],
  ["Coffee", "Manual Brew V60", 38000, "🫖"],
  ["Non-Coffee", "Matcha Latte", 36000, "🍵"],
  ["Non-Coffee", "Es Teh Tarik", 24000, "🥤"],
  ["Non-Coffee", "Hot Chocolate", 32000, "🍫"],
  ["Pastries", "Butter Croissant", 30000, "🥐"],
  ["Pastries", "Pain au Chocolat", 34000, "🥮"],
  ["Pastries", "Banana Bread", 26000, "🍞"],
  ["Mains", "Nasi Goreng Kampung", 48000, "🍳"],
  ["Mains", "Chicken Katsu Sandwich", 52000, "🥪"],
  ["Mains", "Truffle Mushroom Toast", 56000, "🍄"],
].map((m, i) => ({
  id: "m" + i,
  cat: m[0],
  name: m[1],
  price: m[2],
  emoji: m[3],
  // Photo: drop /shared/img/<name-with-dashes>.jpg and it shows automatically.
  // Missing file => falls back to the emoji. Edit this line to use other paths/URLs.
  img: "/shared/img/" + m[1].toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".jpg",
  stock: true,
}));
const CATS = ["Coffee", "Non-Coffee", "Pastries", "Mains"];
const seed = () => {
  const n = Date.now();
  const L = {
    T1: [1, 5, 24],
    T2: [1, 5, 50],
    T3: [1, 5, 76],
    T5: [1, 38, 24],
    T6: [1, 38, 60],
    T4: [2, 5, 24],
    T7: [2, 38, 24],
    T8: [2, 38, 60],
  };
  const tables = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"].map(
    (id, i) => ({
      id,
      name: id,
      seats: i < 4 ? 2 : 4,
      min: i < 4 ? 1 : 2,
      status: "available",
      orderId: null,
      floor: L[id][0],
      x: L[id][1],
      y: L[id][2],
    }),
  );
  const sv = (id, t, end) => ({
    id,
    table: t,
    slot: "Now",
    items: [],
    total: 0,
    method: "qris",
    status: "served",
    created: n,
    timerEnd: end,
    ext: [],
  });
  const orders = [
    sv("s1", "T2", n + 1.5 * H),
    sv("s2", "T8", n - 60000),
    { ...sv("s3", "T3", null), status: "paid" },
    { ...sv("s4", "T6", null), status: "pending_cash", method: "cash" },
  ];
  const st = {
    T2: ["occupied", "s1"],
    T8: ["occupied", "s2"],
    T3: ["reserved", "s3"],
    T6: ["held", "s4"],
    T5: ["cleaning", null],
  };
  const hist = [8, 9, 10, 10, 11, 12, 12, 12, 13, 14, 15, 16, 16, 17, 19].map(
    (h, i) => {
      const d = new Date();
      d.setHours(h, 10, 0, 0);
      return {
        ...sv("h" + i, "T" + [1, 2, 3, 5, 6, 4, 7, 8][i % 8], null),
        status: "closed",
        total: 40000 + i * 7000,
        created: d.getTime(),
        closedAt: d.getTime() + (2 + (i % 3) * 0.5) * H,
      };
    },
  );
  return {
    v: 6,
    users: [{ email: "rina@makancil.id", pass: "demo1234", name: "Rina" }],
    members: {
      "rina@makancil.id": {
        name: "Rina",
        phone: "0812-3456-7890",
        points: 320,
        vouchers: [
          {
            id: "v1",
            t: "Rp10k off · min Rp50k",
            k: "amt",
            v: 10000,
            min: 50000,
          },
          { id: "v2", t: "20% off · min Rp30k", k: "pct", v: 20, min: 30000 },
          {
            id: "v3",
            t: "Rp5k off pick up · min Rp20k",
            k: "amt",
            v: 5000,
            min: 20000,
          },
        ],
      },
    },
    tables: tables.map((t) =>
      st[t.id] ? { ...t, status: st[t.id][0], orderId: st[t.id][1] } : t,
    ),
    menu: MENU,
    orders: [...orders, ...hist],
    settings: { hours: 3 },
    reqs: [
      {
        id: "r1",
        title: "Loyalty stamp card",
        desc: "Digital stamp per 10 coffees in the customer app.",
        status: "In Review",
        date: "2026-11-10",
      },
    ],
  };
};
const tstatus = (t, orders, now) => {
  if (t.status === "occupied") {
    const o = orders.find((x) => x.id === t.orderId);
    if (o && o.timerEnd <= now) return "overtime";
  }
  return t.status;
};
const save = (v) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch (e) {}
};
function useStore() {
  const load = () => {
    try {
      const r = localStorage.getItem(KEY),
        j = r ? JSON.parse(r) : null;
      return j && j.v === 6 ? j : null;
    } catch (e) {
      return null;
    }
  };
  const [s, setS] = useState(() => load() || seed());
  useEffect(() => {
    if (!load()) save(s);
    const f = (e) => {
      if (e.key === KEY && e.newValue)
        try {
          setS(JSON.parse(e.newValue));
        } catch (_) {}
    };
    addEventListener("storage", f);
    return () => removeEventListener("storage", f);
  }, []);
  const set = (fn) =>
    setS((p) => {
      const n = fn(p);
      save(n);
      return n;
    });
  return [s, set];
}
// shared staff-side actions (reused by KDS in Module 2)
const confirmCash = (id) => (s) => {
  const o = s.orders.find((x) => x.id === id);
  return {
    ...s,
    members:
      o.cust && s.members[o.email]
        ? {
            ...s.members,
            [o.email]: {
              ...s.members[o.email],
              points: s.members[o.email].points + Math.floor(o.total / 1000),
            },
          }
        : s.members,
    orders: s.orders.map((x) => (x.id === id ? { ...x, status: "paid" } : x)),
    tables: s.tables.map((t) =>
      t.id === o.table ? { ...t, status: "reserved" } : t,
    ),
  };
};
const approveHandover = (id) => (s) => {
  const o = s.orders.find((x) => x.id === id);
  return {
    ...s,
    orders: s.orders.map((x) =>
      x.id === id
        ? {
            ...x,
            status: "served",
            timerEnd: Date.now() + s.settings.hours * H,
          }
        : x,
    ),
    tables: s.tables.map((t) =>
      t.id === o.table ? { ...t, status: "occupied" } : t,
    ),
  };
};

const ST = {
  available: [
    "Available",
    "bg-emerald-100 border-emerald-500 text-emerald-800",
  ],
  held: ["Held", "bg-amber-100 border-amber-500 text-amber-800"],
  reserved: ["Reserved", "bg-blue-100 border-blue-500 text-blue-800"],
  occupied: ["Occupied", "bg-red-100 border-red-500 text-red-800"],
  overtime: [
    "Overtime",
    "bg-rose-700 border-rose-900 text-white animate-pulse",
  ],
  cleaning: ["Cleaning", "bg-stone-200 border-stone-400 text-stone-600"],
};
const slots = (() => {
  const d = new Date(Math.ceil(Date.now() / 9e5) * 9e5);
  return [
    "Now",
    ...[0, 1, 2, 3].map((i) => {
      const t = new Date(d.getTime() + (i + 1) * 18e5);
      return t.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }),
  ];
})();
