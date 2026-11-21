// Shared header + page mount
const NAV = [
  ["phone", "Customer Mobile View", "../client/", "client"],
  ["mon", "Staff KDS & Floor Ops", "../staff/", "staff"],
  ["chart", "Cafe Owner Dashboard", "../owner/", "owner"],
];
function Header({ cur, set }) {
  const reset = () => {
    set(() => seed());
    try {
      localStorage.removeItem(MY);
      localStorage.removeItem(SES);
    } catch (e) {}
    location.reload();
  };
  return (
    <header
      className="sticky top-0 z-40 bg-cream/90 backdrop-blur border-b border-latte px-4 py-2.5 flex flex-wrap items-center gap-2 justify-between"
      style={{ paddingTop: "calc(env(safe-area-inset-top,0px) + 0.625rem)" }}
    >
      <div className="flex gap-1.5 overflow-x-auto">
        {NAV.map(([ic, l, href, k]) => (
          <a
            key={k}
            href={href}
            className={
              "px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 whitespace-nowrap transition " +
              (cur === k
                ? "bg-espresso text-cream"
                : "bg-latte hover:bg-latte/70")
            }
          >
            <I n={ic} c="w-4 h-4" />
            {l}
          </a>
        ))}
      </div>
      <button
        onClick={reset}
        className="px-3 py-1.5 rounded-full bg-terra text-white text-sm flex items-center gap-1.5"
      >
        <I n="rot" c="w-4 h-4" />
        Reset / Seed Demo Data
      </button>
    </header>
  );
}
function mount(Comp, cur) {
  function App() {
    const [s, set] = useStore();
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
      const t = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(t);
    }, []);
    return (
      <div className="min-h-screen">
        <Header cur={cur} set={set} />
        <Comp s={s} set={set} now={now} />
      </div>
    );
  }
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
}
