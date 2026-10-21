"use client";

import { useState } from "react";
import styles from "./page.module.css";

const MAX_TOPIC_LENGTH = 100;

export default function TopicForm() {
  const [topic, setTopic] = useState("");

  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <label htmlFor="topic" className={styles.label}>
        נושא הבדיחה
      </label>
      <input
        id="topic"
        type="text"
        className={styles.input}
        placeholder="מה נושא הבדיחה?"
        maxLength={MAX_TOPIC_LENGTH}
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        dir="auto"
        aria-describedby="topic-counter"
      />
      <span id="topic-counter" className={styles.counter} dir="ltr">
        {topic.length}/{MAX_TOPIC_LENGTH}
      </span>
      {/* Joke generation is wired up in Milestone 2; the button stays disabled until then. */}
      <button type="submit" className={styles.primaryButton} disabled aria-describedby="not-ready">
        צור בדיחה
      </button>
      <p id="not-ready" className={styles.notice}>
        יצירת בדיחות עדיין לא זמינה בגרסה זו.
      </p>
    </form>
  );
}
