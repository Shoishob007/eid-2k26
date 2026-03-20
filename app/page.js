"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { giverName, MAX_SPINS, wheelSections } from "@/lib/game-config";
import FlipToggleNav from "@/app/components/flip-toggle-nav";

const fireworkBursts = new Array(18).fill(null).map((_, index) => ({
  id: index,
  left: `${6 + (index % 6) * 17}%`,
  drift: -120 + (index % 6) * 48,
  peak: -220 - Math.floor(index / 6) * 80,
  delay: (index % 6) * 0.14,
}));
const lanterns = [
  { id: 1, left: "6%", delay: 0 },
  { id: 2, left: "28%", delay: 0.22 },
  { id: 3, left: "54%", delay: 0.11 },
  { id: 4, left: "76%", delay: 0.3 },
  { id: 5, left: "91%", delay: 0.17 },
];
const FIXED_SPIN_POWER = 68;

export default function Home() {
  const searchParams = useSearchParams();
  const shouldOpenSpinnerDirectly = searchParams.get("view") === "spinner";
  const [started, setStarted] = useState(shouldOpenSpinnerDirectly);
  const [name, setName] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [players, setPlayers] = useState([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [incomingSpin, setIncomingSpin] = useState(null);
  const [isNameMenuOpen, setIsNameMenuOpen] = useState(false);
  const wheelControls = useAnimationControls();
  const rotationRef = useRef(0);
  const nameMenuRef = useRef(null);

  const currentPlayer = useMemo(
    () => players.find((player) => player.name === name) ?? null,
    [players, name],
  );

  const selectedPlayerLabel = useMemo(() => {
    if (!name) {
      return "Select a player";
    }

    const selected = players.find((player) => player.name === name);

    if (!selected) {
      return name;
    }

    return `${selected.name}${selected.isOptional ? " (Optional)" : ""}`;
  }, [players, name]);

  const sectionAngle = 360 / wheelSections.length;
  const canSpin = Boolean(name) && Boolean(currentPlayer) && currentPlayer.spinsLeft > 0 && !currentPlayer.hasClaimed;
  const shouldShowFallback = Boolean(currentPlayer) && !currentPlayer.hasClaimed && currentPlayer.spinsLeft === 0;

  const loadDashboard = async (selectedName = "") => {
    setIsDashboardLoading(true);

    try {
      const query = selectedName ? `?name=${encodeURIComponent(selectedName)}` : "";
      const response = await fetch(`/api/dashboard${query}`, { cache: "default" });

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error("DB_TEMP_UNAVAILABLE");
        }

        throw new Error("Could not load dashboard");
      }

      const data = await response.json();
      setPlayers(data.players ?? []);
      setErrorMessage("");
    } catch (error) {
      if (error.message === "DB_TEMP_UNAVAILABLE") {
        setErrorMessage("Database is reconnecting. Please wait a moment and try again.");
      } else {
        setErrorMessage("Could not load player data. Check database connection.");
      }
    } finally {
      setIsDashboardLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!showCelebration) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShowCelebration(false);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [showCelebration]);

  useEffect(() => {
    if (!isNameMenuOpen) {
      return undefined;
    }

    const onPointerDown = (event) => {
      if (!nameMenuRef.current?.contains(event.target)) {
        setIsNameMenuOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === "Escape") {
        setIsNameMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [isNameMenuOpen]);

  const wheelGradient = useMemo(() => {
    return wheelSections
      .map((section, index) => {
        const start = index * sectionAngle;
        const end = start + sectionAngle;
        return `${section.color} ${start}deg ${end}deg`;
      })
      .join(", ");
  }, [sectionAngle]);

  const selectName = async (selectedName) => {
    setName(selectedName);
    setResult(null);
    setInfoMessage("");

    if (!selectedName) {
      return;
    }

    await loadDashboard(selectedName);
  };

  const spinWheel = async () => {
    if (isSpinning || !canSpin) {
      return;
    }

    try {
      setErrorMessage("");
      setInfoMessage("");
      setIsSpinning(true);
      setResult(null);
      setShowCelebration(false);
      let shouldKeepRolling = true;

      const rollingPromise = (async () => {
        while (shouldKeepRolling) {
          const nextRotation = rotationRef.current + 540;
          await wheelControls.start({
            rotate: nextRotation,
            transition: { duration: 0.75, ease: "linear" },
          });
          rotationRef.current = nextRotation;
        }
      })();

      const response = await fetch("/api/spin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, power: FIXED_SPIN_POWER }),
      });

      const data = await response.json();

      if (!response.ok) {
        shouldKeepRolling = false;
        await rollingPromise;
        throw new Error(data.code ?? "SPIN_FAILED");
      }

      shouldKeepRolling = false;
      await rollingPromise;

      const winnerIndex = wheelSections.findIndex(
        (section) => section.label === data.spin.label && section.amount === data.spin.amount,
      );

      const validWinnerIndex = winnerIndex >= 0 ? winnerIndex : 0;
      const turns = 7 + Math.floor(FIXED_SPIN_POWER / 12);
      const current = ((rotationRef.current % 360) + 360) % 360;
      const targetStop = 360 - (validWinnerIndex * sectionAngle + sectionAngle / 2);
      let delta = targetStop - current;

      if (delta < 0) {
        delta += 360;
      }

      const totalRotation = rotationRef.current + turns * 360 + delta;
      await wheelControls.start({
        rotate: totalRotation,
        transition: { duration: 4.9, ease: [0.08, 0.86, 0.11, 1] },
      });
      rotationRef.current = totalRotation;
      setIncomingSpin(data.spin);
      setPlayers(data.players ?? []);
      setResult({
        amount: data.spin.amount,
        title: `${data.spin.flair} Win`,
        spinOrder: data.spin.spinOrder,
      });
      setShowCelebration(true);
      setIsSpinning(false);
    } catch (error) {
      const reason = error.message;
      if (reason === "NO_SPINS_LEFT") {
        setInfoMessage("No spins left. Pick one of your previous spins to claim your Eidi.");
      } else if (reason === "ALREADY_CLAIMED") {
        setInfoMessage("Eidi already claimed for this player.");
      } else if (reason === "DB_TEMP_UNAVAILABLE") {
        setErrorMessage("Database is reconnecting. Please retry your spin in a moment.");
      } else {
        setErrorMessage("Spin could not be completed. Please try again.");
      }

      setIsSpinning(false);
      await loadDashboard(name);
    }
  };

  const claimSpin = async (spinOrder) => {
    if (!name) {
      return;
    }

    try {
      setErrorMessage("");
      setInfoMessage("");

      const response = await fetch("/api/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, spinOrder }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.code ?? "CLAIM_FAILED");
      }

      setPlayers(data.players ?? []);
      setResult(null);
      setShowCelebration(false);
      setInfoMessage(`Locked! ${name} claimed spin #${spinOrder}. Eid Mubarak!`);
    } catch (error) {
      if (error.message === "DB_TEMP_UNAVAILABLE") {
        setErrorMessage("Database is reconnecting. Please retry your claim in a moment.");
      } else {
        setErrorMessage("Could not claim that spin. Try another one.");
      }
    }
  };

  const closeResult = () => {
    setResult(null);
    setShowCelebration(false);
    setIncomingSpin(null);
  };

  return (
    <main className="app-shell">
      <div className="ambient-layer" />
      <div className="lantern-row" aria-hidden>
        {lanterns.map((lantern) => (
          <motion.span
            key={lantern.id}
            className="lantern"
            style={{ left: lantern.left }}
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: lantern.delay }}
          />
        ))}
      </div>

      <AnimatePresence>
        {showCelebration ? (
          <motion.div
            className="celebration-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="celebration-floor" />
            {fireworkBursts.map((burst) => (
              <motion.span
                key={burst.id}
                className="firework"
                style={{ left: burst.left }}
                initial={{ y: 0, x: 0, scale: 0.3, opacity: 0 }}
                animate={{
                  y: [0, burst.peak, burst.peak - 10],
                  x: [0, burst.drift, burst.drift * 1.05],
                  scale: [0.3, 0.45, 1.1],
                  opacity: [0, 0.9, 0],
                }}
                transition={{ duration: 1.7, delay: burst.delay, ease: [0.2, 0.8, 0.2, 1] }}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!started ? (
          <motion.section
            key="welcome"
            className="card welcome-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <motion.p
              className="kicker"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08 }}
            >
              Eid Celebration
            </motion.p>
            <motion.h1
              className="hero-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.14 }}
            >
              Eidi Spinner
            </motion.h1>
            <motion.p
              className="subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18 }}
            >
              Select your name, spin up to {MAX_SPINS} times, and lock whichever spin feels lucky.
            </motion.p>

            <motion.button
              className="action-btn"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStarted(true)}
            >
              Start the Festivity
            </motion.button>
          </motion.section>
        ) : (
          <motion.div
            key="spinner"
            className="game-layout single-column-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22 }}
          >
            {isDashboardLoading ? (
              <section className="card spin-card">
                <div className="top-row">
                  <div className="skeleton-block skeleton-title" />
                  <div className="skeleton-block skeleton-icon" />
                </div>

                <div className="skeleton-stack">
                  <div className="skeleton-block skeleton-input" />
                  <div className="skeleton-block skeleton-pill-row" />
                  <div className="skeleton-block skeleton-input" />
                </div>

                <div className="wheel-skeleton-wrap">
                  <div className="skeleton-wheel" />
                </div>

                <div className="skeleton-block skeleton-button" />
              </section>
            ) : (
              <section className="card spin-card">
                <div className="top-row">
                  <div>
                    <h2 className="panel-title">Spin & Gift</h2>
                    <p className="tiny-copy">Up to {MAX_SPINS} spins per person. Claim any spin you like.</p>
                  </div>
                  <FlipToggleNav to="/leaderboard" label="Flip to leaderboard" />
                </div>

                <label className="input-wrap" htmlFor="name">
                  <span>Choose your name</span>
                  <div className="name-select-shell" ref={nameMenuRef}>
                    <button
                      id="name"
                      type="button"
                      className={`name-select-trigger ${isNameMenuOpen ? "is-open" : ""}`}
                      aria-haspopup="listbox"
                      aria-expanded={isNameMenuOpen}
                      aria-controls="name-listbox"
                      onClick={() => setIsNameMenuOpen((open) => !open)}
                    >
                      <span className={`name-select-trigger-text ${name ? "" : "is-placeholder"}`}>
                        {selectedPlayerLabel}
                      </span>
                    </button>

                    {isNameMenuOpen ? (
                      <div id="name-listbox" className="name-menu" role="listbox" aria-label="Player list">
                        <button
                          type="button"
                          className={`name-option ${name === "" ? "is-active" : ""}`}
                          role="option"
                          aria-selected={name === ""}
                          onClick={() => {
                            setIsNameMenuOpen(false);
                            void selectName("");
                          }}
                        >
                          Select a player
                        </button>
                        {players.map((player) => {
                          const optionLabel = `${player.name}${player.isOptional ? " (Optional)" : ""}`;
                          const isActive = player.name === name;

                          return (
                            <button
                              key={player.id}
                              type="button"
                              className={`name-option ${isActive ? "is-active" : ""}`}
                              role="option"
                              aria-selected={isActive}
                              onClick={() => {
                                setIsNameMenuOpen(false);
                                void selectName(player.name);
                              }}
                            >
                              {optionLabel}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </label>

                {currentPlayer ? (
                  <div className="player-meta">
                    <span className="meta-pill">Spins Used: {currentPlayer.spinsUsed}/{currentPlayer.maxSpins}</span>
                    <span className="meta-pill">Spins Left: {currentPlayer.spinsLeft}</span>
                    <span className={`meta-pill status-${currentPlayer.status}`}>{currentPlayer.status}</span>
                  </div>
                ) : null}

                <div className={`wheel-area ${isSpinning ? "wheel-area-live" : ""}`}>
                  <div className="pointer" aria-hidden />
                  <div className="wheel-glow" aria-hidden />

                  <motion.div
                    className="wheel"
                    style={{ background: `conic-gradient(${wheelGradient})` }}
                    animate={wheelControls}
                    initial={{ rotate: 0 }}
                  >
                    {wheelSections.map((section, index) => {
                      const angle = index * sectionAngle + sectionAngle / 2;

                      return (
                        <div
                          key={section.label}
                          className="wheel-label-slot"
                          style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)` }}
                        >
                          <span
                            className="wheel-label"
                            style={{ transform: `rotate(${-angle}deg)` }}
                          >
                            ৳{section.label}
                          </span>
                        </div>
                      );
                    })}

                    <span className="wheel-center">Eid 🌙 Mubarak</span>
                  </motion.div>
                </div>

                <motion.button
                  className="action-btn"
                  disabled={isSpinning || !canSpin}
                  onClick={() => void spinWheel()}
                  whileHover={{ scale: isSpinning || !canSpin ? 1 : 1.02 }}
                  whileTap={{ scale: isSpinning || !canSpin ? 1 : 0.98 }}
                >
                  {isSpinning ? "Spinning with Barakah..." : canSpin ? "Spin the Wheel" : "Select eligible player"}
                </motion.button>

                {incomingSpin && !isSpinning ? (
                  <p className="tiny-copy accent-copy">
                    Last spin: #{incomingSpin.spinOrder} = ৳{incomingSpin.amount}. You can claim this or keep spinning.
                  </p>
                ) : null}

                {currentPlayer?.spins?.length ? (
                  <div className="history-block">
                    <p className="history-title">Your spin choices</p>
                    <div className="history-list">
                      {currentPlayer.spins.map((spin) => {
                        const isClaimedSpin =
                          currentPlayer.hasClaimed && currentPlayer.claimedSpinOrder === spin.spinOrder;

                        if (currentPlayer.hasClaimed) {
                          return (
                            <span
                              key={spin.id}
                              className={`history-chip ${isClaimedSpin ? "history-chip-claimed" : "history-chip-skipped"}`}
                            >
                              {isClaimedSpin
                                ? `Claimed #${spin.spinOrder} ৳${spin.amount}`
                                : `Skipped #${spin.spinOrder} ৳${spin.amount}`}
                            </span>
                          );
                        }

                        return (
                          <button
                            key={spin.id}
                            type="button"
                            className="history-chip"
                            onClick={() => void claimSpin(spin.spinOrder)}
                          >
                            Claim #{spin.spinOrder} ৳{spin.amount}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {shouldShowFallback ? (
                  <div className="fallback-card">
                    <p className="kicker">Spin limit reached</p>
                    <h3>No spins left, but your fate is already written</h3>
                    <p>
                      Choose one from your spins above to lock your Eidi. Your destiny wheel has spoken.
                    </p>
                  </div>
                ) : null}

                {infoMessage ? <p className="status-note success">{infoMessage}</p> : null}
                {errorMessage ? <p className="status-note error">{errorMessage}</p> : null}
              </section>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result ? (
          <motion.div
            className="result-modal-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="result-modal"
              initial={{ y: 40, scale: 0.92, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 30, scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 170, damping: 18 }}
            >
              <p className="kicker">{result.title}</p>
              <h3 className="result-title">
                {name ? `${name} gets Eidi from ${giverName}` : `Eidi from ${giverName}`}
              </h3>
              <p className="result-amount">৳{result.amount}</p>
              <p className="result-copy">
                Spin #{result.spinOrder} landed! Keep spinning or lock this one as your final Eidi.
              </p>
              <motion.button
                className="claim-btn"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={closeResult}
              >
                Continue
              </motion.button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
