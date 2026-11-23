"use client";

import { useMemo, useState } from "react";

type Choice = { key: string; label: string; description?: string };
type Screen = "home" | "scenario" | "analysis" | "complete";

const scenario = {
  id: "1622",
  title: "The Train Station Incident",
  intro: "Read the situation and use the information provided to answer the question.",
  background:
    "On a cold winter night, a robbery disrupted the waiting room at a train station. The guard immediately rushed out to pursue the culprit, but because of the dim night and the snowstorm, he could not clearly see the robber's face. When the guard reached the platform, he found six people there: a middle-aged man arguing with staff about a delay; an elderly man watching the argument; a young man reading a newspaper that almost covered his face; a person in sportswear jogging on the spot to keep warm; an anxious passenger checking a watch; and a person sitting in a heavy coat, shivering. After observing them, the guard pointed to one person.",
  evidence: [
    { id: "E1", source: "Situation", text: "The guard immediately rushed out to pursue the culprit." },
    { id: "E2", source: "Platform observation", text: "The fourth person was dressed in sportswear, jogging on the spot to keep warm." },
    { id: "E3", source: "Platform observation", text: "The sixth person was wrapped in a heavy coat, sitting and shivering while rubbing his hands together." },
  ],
  question: "Who is the guard pointing to?",
  options: [
    { key: "A", label: "The first person who was arguing with the staff." },
    { key: "B", label: "The second person who was watching the argument." },
    { key: "C", label: "The third person who was engrossed in reading his newspaper." },
    { key: "D", label: "The fourth person who was jogging on the spot." },
  ] as Choice[],
  analysis:
    "The robber had just fled at a run, so whoever he was would still be breathing hard and flushed when the guard arrived. Jogging on the spot is the one activity that explains away that exertion in plain sight. The sixth man, still shivering in his coat, shows how cold the platform was for anyone who had been standing still, which the fourth man had not.",
  recommendation: "D",
};

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [initial, setInitial] = useState("");
  const [final, setFinal] = useState("");
  const [initialConfidence, setInitialConfidence] = useState(55);
  const [finalConfidence, setFinalConfidence] = useState(55);
  const [reviewed, setReviewed] = useState(false);

  const initialLabel = useMemo(
    () => scenario.options.find((o) => o.key === initial)?.label,
    [initial]
  );
  const finalLabel = useMemo(
    () => scenario.options.find((o) => o.key === final)?.label,
    [final]
  );

  function reset() {
    setScreen("home");
    setInitial("");
    setFinal("");
    setInitialConfidence(55);
    setFinalConfidence(55);
    setReviewed(false);
  }

  function choices(value: string, onChange: (value: string) => void, name: string) {
    return (
      <div className="options">
        {scenario.options.map((option) => (
          <label className={`option ${value === option.key ? "selected" : ""}`} key={option.key}>
            <input
              type="radio"
              name={name}
              value={option.key}
              checked={value === option.key}
              onChange={() => onChange(option.key)}
            />
            <i />
            <span>
              <b>{option.key}. {option.label}</b>
            </span>
          </label>
        ))}
      </div>
    );
  }

  function confidence(label: string, value: number, onChange: (n: number) => void) {
    return (
      <div className="confidence">
        <div className="sliderHead">
          <label>{label}</label>
          <b>{value}%</b>
        </div>
        <input
          className="range"
          type="range"
          min="0"
          max="100"
          step="5"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <div className="rangeEnds"><span>NOT VERY SURE</span><span>VERY SURE</span></div>
      </div>
    );
  }

  return (
    <main className="shell">
      <header>
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); reset(); }}>
          <span>✳</span> DECISION<span className="green">LAB</span>
        </a>
        <div className="topmeta"><i /> DECISION-MAKING ACTIVITY</div>
      </header>

      <div className="progress"><span style={{ width: screen === "home" ? "0%" : screen === "complete" ? "100%" : screen === "analysis" ? "72%" : "35%" }} /></div>

      {screen === "home" && (
        <section className="hero">
          <div className="heroText">
            <div className="eyebrow">✦ A short decision-making activity</div>
            <h1>Take a look.<br /><em>Make the call.</em></h1>
            <p className="lead">You’ll review a situation, consider the information provided, and make a decision. Take your time and use your own judgment.</p>
            <div className="startrow">
              <button className="btn" onClick={() => setScreen("scenario")}>Get started ↗</button>
              <small>~5 min · one scenario</small>
            </div>
            <small className="asterisk">Please read the situation carefully before answering.</small>
          </div>
          <div className="art">
            <div className="orbit one" /><div className="orbit two" />
            <div className="sticker top">A MOMENT TO THINK</div>
            <div className="brain">
              <div className="brainbar">YOUR THINKING SPACE <span>● ● ●</span></div>
              <div className="emoji">🧠</div>
              <strong>“Let me<br />think this through.”</strong>
              <label>ONE STEP AT A TIME</label>
            </div>
            <div className="bubble"><small>✳ ANOTHER PERSPECTIVE</small><b>New information.</b><span>Consider the details</span></div>
            <div className="sticker bottom">DETAILS MATTER ✦</div>
            <div className="hmm">hmm…</div>
          </div>
          <div className="steps">
            <div><b>01</b><span><strong>Review the situation</strong><small>Read the context and evidence.</small></span></div>
            <div><b>02</b><span><strong>Consider an analysis</strong><small>Review an additional perspective.</small></span></div>
            <div><b>03</b><span><strong>Make your decision</strong><small>Choose the answer that fits best.</small></span></div>
          </div>
        </section>
      )}

      {screen === "scenario" && (
        <section className="study">
          <div className="studyhead">
            <div><div className="eyebrow">CASE FILE · 01 / 01</div><h2>{scenario.title}</h2><p>{scenario.intro}</p></div>
            <div className="stamp">CASE<br />1622</div>
          </div>
          <div className="panel">
            <div className="kicker">THE SITUATION</div>
            <p>{scenario.background}</p>
            <div className="receipts">INFORMATION PROVIDED <small>3 DETAILS</small></div>
            <div className="evidence">
              {scenario.evidence.map((item) => (
                <article key={item.id}><div><b>{item.id}</b><small>{item.source}</small></div><p>{item.text}</p></article>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="kicker">STEP 1 · YOUR INITIAL DECISION</div>
            <h3>{scenario.question}</h3>
            {choices(initial, setInitial, "initial")}
            {confidence("HOW SURE ARE YOU?", initialConfidence, setInitialConfidence)}
            <div className="panelFoot"><small>Your first answer will be recorded before you see the additional analysis.</small><button className="btn" disabled={!initial} onClick={() => setScreen("analysis")}>Continue →</button></div>
          </div>
        </section>
      )}

      {screen === "analysis" && (
        <section className="study">
          <div className="studyhead">
            <div><div className="eyebrow">STEP 2 · ADDITIONAL ANALYSIS</div><h2>Consider another perspective.</h2><p>Your initial answer: <b>{initial}. {initialLabel}</b></p></div>
            <div className="stamp purple">ANALYSIS<br />02</div>
          </div>
          <div className="aiPanel">
            <div className="aihead"><span>✳</span><div><b>Additional analysis</b><small>Another perspective on the situation</small></div></div>
            <p>“{scenario.analysis}”</p>
            <div className="verdict"><small>RECOMMENDED OPTION</small><b>{scenario.recommendation}. {scenario.options.find((o) => o.key === scenario.recommendation)?.label}</b></div>
          </div>
          <div className="panel">
            <div className="kicker">STEP 3 · YOUR FINAL DECISION</div>
            <h3>What is your answer now?</h3>
            {choices(final, setFinal, "final")}
            {confidence("HOW SURE ARE YOU NOW?", finalConfidence, setFinalConfidence)}
            <div className="panelFoot"><small>Choose the answer that best reflects your judgment after reviewing the information.</small><button className="btn" disabled={!final} onClick={() => setScreen("complete")}>Finish activity ↗</button></div>
          </div>
        </section>
      )}

      {screen === "complete" && (
        <section className="done">
          <div className="donebadge">ACTIVITY COMPLETE ✦</div>
          <div className="doneemoji">🎉</div>
          <div className="eyebrow">THANK YOU FOR PARTICIPATING</div>
          <h1>All done.<br /><em>Thank you!</em></h1>
          <p>Your responses have been recorded for this local preview only.</p>
          <div className="summary">
            <div><small>INITIAL ANSWER</small><b>{initial || "—"}</b><span>{initialLabel || "Not selected"}</span></div>
            <div><small>FINAL ANSWER</small><b>{final || "—"}</b><span>{finalLabel || "Not selected"}</span></div>
          </div>
          <div className="disclaimer">This is a local UI preview using one sample case. Responses are held only in this browser session and are not sent to Google Sheets or saved to a research database.</div>
          <button className="btn" onClick={reset}>Return to start ↺</button>
        </section>
      )}

      <footer><span>DECISION LAB © 2026</span><span>THOUGHTFUL DECISIONS, ONE SCENARIO AT A TIME.</span><span>BUILT FOR CURIOUS MINDS ✳</span></footer>
    </main>
  );
}
