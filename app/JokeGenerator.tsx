"use client";

import { useState } from "react";
import { MAX_TOPIC_LENGTH, clampTopic, countChars } from "@/lib/topic";
import { requestJoke } from "./jokeClient";
import { MESSAGES } from "./messages";
import styles from "./page.module.css";

type RequestStatus = "idle" | "loading" | "error";
type ErrorKind = "refused" | "general";

export default function JokeGenerator() {
  const [draftTopic, setDraftTopic] = useState("");
  const [displayedJoke, setDisplayedJoke] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("idle");
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);

  const isLoading = requestStatus === "loading";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    setRequestStatus("loading");
    setErrorKind(null);
    const result = await requestJoke(draftTopic.trim());

    if (result.ok) {
      setDisplayedJoke(result.joke);
      setRequestStatus("idle");
    } else {
      // The previously displayed joke stays on screen.
      setErrorKind(result.kind);
      setRequestStatus("error");
    }
  }

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label htmlFor="topic" className={styles.label}>
          נושא הבדיחה
        </label>
        <input
          id="topic"
          type="text"
          className={styles.input}
          placeholder="מה נושא הבדיחה?"
          value={draftTopic}
          onChange={(e) => setDraftTopic(clampTopic(e.target.value))}
          dir="auto"
          aria-describedby="topic-counter"
        />
        <span id="topic-counter" className={styles.counter} dir="ltr">
          {countChars(draftTopic)}/{MAX_TOPIC_LENGTH}
        </span>
        <button type="submit" className={styles.primaryButton} disabled={isLoading}>
          צור בדיחה
        </button>
      </form>

      <div className={styles.messages} aria-live="polite">
        {isLoading && <p className={styles.loading}>{MESSAGES.loading}</p>}
        {requestStatus === "error" && (
          <p className={styles.error} role="alert">
            {errorKind === "refused" ? MESSAGES.refused : MESSAGES.generalError}
          </p>
        )}
      </div>

      <div aria-live="polite">
        {displayedJoke !== null && (
          <section className={styles.result}>
            <p className={styles.joke} dir="auto">
              {displayedJoke}
            </p>
          </section>
        )}
      </div>
    </>
  );
}
