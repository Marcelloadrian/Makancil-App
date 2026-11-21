// Shared: 2D floor-plan renderer (used by client + staff)
const SZ = { 2: [22, 19], 4: [30, 25] };
const Deco = ({ x, y, w, h, t }) => (
  <div
    className="absolute grid place-items-center text-[10px] text-espresso/60 bg-espresso/10 border border-dashed border-espresso/30 rounded"
    style={{ left: x + "%", top: y + "%", width: w + "%", height: h + "%" }}
  >
    {t}
  </div>
);
function FloorMap({ tables, floor, tstat, sel, setSel, orders, now }) {
  return (
    <div
      className="relative w-full rounded-2xl border-2 border-espresso/60 overflow-hidden"
      style={{
        aspectRatio: "1/1.05",
        background: "#f3ead9",
        backgroundImage:
          "linear-gradient(#3b2a2010 1px,transparent 1px),linear-gradient(90deg,#3b2a2010 1px,transparent 1px)",
        backgroundSize: "10% 10%",
      }}
    >
      {floor === 1 ? (
        <>
          <Deco x={0} y={0} w={100} h={13} t="☕ Counter / Bar" />
          <Deco x={70} y={86} w={30} h={14} t="Entrance" />
          <Deco x={78} y={30} w={20} h={40} t="Window seats" />
        </>
      ) : (
        <>
          <Deco x={72} y={0} w={28} h={20} t="Stairs ↓" />
          <Deco x={0} y={86} w={50} h={14} t="Terrace" />
        </>
      )}
      {tables.map((t) => {
        const st = tstat(t),
          [lab, cls] = ST[st],
          od = orders.find((x) => x.id === t.orderId),
          [w, h] = SZ[t.seats],
          av = st === "available",
          ch = Array(t.seats / 2).fill(0);
        return (
          <button
            key={t.id}
            disabled={!av || !setSel}
            onClick={() => setSel(t.id)}
            style={{
              left: t.x + "%",
              top: t.y + "%",
              width: w + "%",
              height: h + "%",
            }}
            className={
              "absolute border-2 rounded-xl text-center transition flex flex-col items-center justify-center " +
              cls +
              (sel === t.id ? " ring-4 ring-terra/50 scale-105 z-10" : "") +
              (av && setSel ? "" : " cursor-default")
            }
          >
            {["-top-1.5", "-bottom-1.5"].map((p) => (
              <span
                key={p}
                className={"absolute inset-x-0 flex justify-around px-2 " + p}
              >
                {ch.map((_, i) => (
                  <i
                    key={i}
                    className="w-3 h-1.5 rounded-full bg-espresso/40"
                  />
                ))}
              </span>
            ))}
            <b className="text-sm">{t.name}</b>
            <span className="text-[10px] leading-tight">
              {st === "occupied" && od && od.timerEnd
                ? fmt(od.timerEnd - now)
                : lab}
            </span>
          </button>
        );
      })}
    </div>
  );
}
