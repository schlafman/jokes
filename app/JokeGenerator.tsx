"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_TOPIC_LENGTH, clampTopic, countChars } from "@/lib/topic";
import { ClipboardIcon, LaughingFace, RefreshIcon, WandIcon } from "./Decorations";
import { requestJoke, type ErrorKind } from "./jokeClient";
import { jokeCardTopic } from "./jokeTitle";
import { MESSAGES } from "./messages";
import styles from "./page.module.css";

type RequestStatus = "idle" | "loading" | "error";

const ERROR_MESSAGES: Record<ErrorKind, string> = {
  refused: MESSAGES.refused,
  rateLimited: MESSAGES.rateLimited,
  timeout: MESSAGES.timeoutError,
  offline: MESSAGES.offlineError,
  invalid: MESSAGES.invalidInput,
  general: MESSAGES.generalError,
};
type CopyState = "idle" | "copied" | "failed";
// The topic is the one the joke was created with (lastSuccessfulTopic).
type DisplayedJoke = { text: string; topic: string };

const COPIED_FEEDBACK_MS = 2000;

export default function JokeGenerator() {
  const [draftTopic, setDraftTopic] = useState("");
  const [displayedJoke, setDisplayedJoke] = useState<DisplayedJoke | null>(null);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("idle");
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  // Set synchronously so rapid clicks cannot start overlapping requests.
  const inFlight = useRef(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLoading = requestStatus === "loading";

  useEffect(() => () => clearCopyTimer(), []);

  function clearCopyTimer() {
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = null;
  }

  async function runRequest(topic: string, previousJoke?: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setRequestStatus("loading");
    setErrorKind(null);

    try {
      const result = await requestJoke(topic, previousJoke);
      if (result.ok) {
        setDisplayedJoke({ text: result.joke, topic });
        clearCopyTimer();
        setCopyState("idle");
        setRequestStatus("idle");
      } else {
        // The previously displayed joke stays on screen.
        setErrorKind(result.kind);
        setRequestStatus("error");
      }
    } finally {
      inFlight.current = false;
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runRequest(draftTopic.trim());
  }

  function handleAnother() {
    if (!displayedJoke) return;
    // Uses the topic of the last successful joke, not the current input value.
    void runRequest(displayedJoke.topic, displayedJoke.text);
  }

  async function handleCopy() {
    if (!displayedJoke) return;
    clearCopyTimer();
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(displayedJoke.text);
      setCopyState("copied");
      copyTimer.current = setTimeout(() => setCopyState("idle"), COPIED_FEEDBACK_MS);
    } catch {
      setCopyState("failed");
    }
  }

  const titleTopic = displayedJoke ? jokeCardTopic(displayedJoke.topic) : null;

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label htmlFor="topic" className={styles.label}>
          {MESSAGES.topicLabel}
        </label>
        <input
          id="topic"
          type="text"
          className={styles.input}
          placeholder={MESSAGES.topicPlaceholder}
          value={draftTopic}
          onChange={(e) => setDraftTopic(clampTopic(e.target.value))}
          // An empty input with dir="auto" renders the Hebrew placeholder LTR.
          dir={draftTopic.trim() ? "auto" : "rtl"}
          autoComplete="off"
          aria-describedby="topic-counter"
        />
        <span id="topic-counter" className={styles.counter} dir="ltr">
          {countChars(draftTopic)}/{MAX_TOPIC_LENGTH}
        </span>
        <button type="submit" className={styles.primaryButton} disabled={isLoading}>
          <WandIcon className={styles.buttonIcon} />
          {MESSAGES.generate}
        </button>
      </form>

      <div className={styles.messages} aria-live="polite">
        {isLoading && (
          <div className={styles.loading}>
            <span className={styles.dots} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>{MESSAGES.loading}</span>
          </div>
        )}
        {requestStatus === "error" && errorKind !== null && (
          // The rate-limit message uses the orange "limit" box from the Style Guide.
          <p className={errorKind === "rateLimited" ? styles.limit : styles.error} role="alert">
            <span className={styles.errorIcon} aria-hidden="true">
              !
            </span>
            {ERROR_MESSAGES[errorKind]}
          </p>
        )}
      </div>

      <div aria-live="polite">
        {displayedJoke !== null && (
          <section className={styles.card} aria-labelledby="joke-title">
            <LaughingFace className={styles.cardFace} />
            <h2 id="joke-title" className={styles.cardTitle}>
              {titleTopic === null ? (
                MESSAGES.cardTitleGeneral
              ) : (
                <>
                  {MESSAGES.cardTitlePrefix} <bdi>{titleTopic}</bdi>
                </>
              )}
            </h2>
            <p className={styles.joke} dir="auto">
              {displayedJoke.text}
            </p>
            <button type="button" className={styles.copyButton} onClick={handleCopy}>
              {copyState === "copied" ? (
                <>
                  <span aria-hidden="true">✓</span> {MESSAGES.copied}
                </>
              ) : (
                <>
                  <ClipboardIcon className={styles.buttonIcon} />
                  {MESSAGES.copy}
                </>
              )}
            </button>
            {copyState === "failed" && <p className={styles.copyError}>{MESSAGES.copyFailed}</p>}
          </section>
        )}
      </div>

      {displayedJoke !== null && (
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleAnother}
          disabled={isLoading}
        >
          <RefreshIcon className={styles.buttonIcon} />
          {MESSAGES.another}
        </button>
      )}
    </>
  );
}
