"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const sections = [
  { label: "2", color: "#0f6a53" },
  { label: "5", color: "#2f9f7f" },
  { label: "10", color: "#d19a2a" },
  { label: "20", color: "#d1603d" },
  { label: "30", color: "#d84b55" },
  { label: "50", color: "#6c4aa9" },
  { label: "100", color: "#2a5fbc" },
];
const sectionWeights = [10, 10, 10, 10, 10, 10, 3];

const prizeWord = ["Blessed", "Mubarak", "Joyful", "Golden", "Sparkling"];
const fireworkBursts = new Array(18).fill(null).map((_, index) => ({
  id: index,
  left: `${6 + (index % 6) * 17}%`,
  drift: -120 + (index % 6) * 48,
  peak: -220 - Math.floor(index / 6) * 80,
  delay: (index % 6) * 0.14,
}));
const giverName = "Shoishob";

export default function Home() {
  const [started, setStarted] = useState(false);
  const [name, setName] = useState("");
  const [power, setPower] = useState(68);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const canSpin = name.trim().length > 0;

  const sectionAngle = 360 / sections.length;

  useEffect(() => {
    if (!showCelebration) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShowCelebration(false);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [showCelebration]);

  const wheelGradient = useMemo(() => {
    return sections
      .map((section, index) => {
        const start = index * sectionAngle;
        const end = start + sectionAngle;
        return `${section.color} ${start}deg ${end}deg`;
      })
      .join(", ");
  }, [sectionAngle]);

  const pickWinnerIndex = () => {
    const totalWeight = sectionWeights.reduce((sum, weight) => sum + weight, 0);
    let randomPoint = Math.random() * totalWeight;

    for (let index = 0; index < sectionWeights.length; index += 1) {
      randomPoint -= sectionWeights[index];

      if (randomPoint < 0) {
        return index;
      }
    }

    return sectionWeights.length - 1;
  };

  const spinWheel = () => {
    if (isSpinning) {
      return;
    }

    const winnerIndex = pickWinnerIndex();
    const turns = 9 + Math.floor(power / 10);
    const current = ((rotation % 360) + 360) % 360;
    const targetStop = 360 - (winnerIndex * sectionAngle + sectionAngle / 2);
    let delta = targetStop - current;

    if (delta < 0) {
      delta += 360;
    }

    const totalRotation = rotation + turns * 360 + delta;
    const winnerAmount = sections[winnerIndex].label;
    const flair = prizeWord[Math.floor(Math.random() * prizeWord.length)];

    setIsSpinning(true);
    setResult(null);
    setShowCelebration(false);
    setRotation(totalRotation);

    window.setTimeout(() => {
      setResult({
        amount: winnerAmount,
        title: `${flair} Win`,
      });
      setShowCelebration(true);
      setIsSpinning(false);
    }, 6600);
  };

  const spinAgain = () => {
    setResult(null);
    setShowCelebration(false);
  };

  return (
    <main className="app-shell">
      <div className="ambient-layer" />

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
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.p
              className="kicker"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Eid Celebration
            </motion.p>
            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              Eidi Spinner
            </motion.h1>
            <motion.p
              className="subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Spin the festive wheel and reveal a random Eidi amount from {giverName}.
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
          <motion.section
            key="spinner"
            className="card spin-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="top-row">
              <div>
                {/* <p className="kicker">Choose Recipient</p> */}
                <h2 className="panel-title">Spin & Gift</h2>
              </div>
              <span className="chip">7 prizes</span>
            </div>

            <label className="input-wrap" htmlFor="name">
              <span>Name</span>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Place your name"
              />
            </label>

            <label className="slider-wrap" htmlFor="power">
              <div className="slider-topline">
                <span>Spin energy</span>
                <strong>{power}%</strong>
              </div>
              <input
                id="power"
                className="power-slider"
                type="range"
                min="30"
                max="100"
                value={power}
                onChange={(event) => setPower(Number(event.target.value))}
              />
            </label>

            <div className="wheel-area">
              <div className="pointer" aria-hidden />

              <motion.div
                className="wheel"
                style={{ background: `conic-gradient(${wheelGradient})` }}
                animate={{ rotate: rotation }}
                transition={{ duration: 6.6, ease: [0.08, 0.86, 0.11, 1] }}
              >
                {sections.map((section, index) => {
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
              onClick={spinWheel}
              whileHover={{ scale: isSpinning || !canSpin ? 1 : 1.02 }}
              whileTap={{ scale: isSpinning || !canSpin ? 1 : 0.98 }}
            >
              {isSpinning ? "Spinning..." : canSpin ? "Spin the Wheel" : "Enter Name to Spin"}
            </motion.button>

          </motion.section>
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
              <p className="result-copy">Spin, smile, and receive your Eid gift from {giverName}!</p>
              <motion.button
                className="claim-btn"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={spinAgain}
              >
                Spin Again
              </motion.button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
