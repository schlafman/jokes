import { Burst, LaughingFace, Rays, Star } from "./Decorations";
import JokeGenerator from "./JokeGenerator";
import { MESSAGES } from "./messages";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <Burst className={styles.burst} />
        <LaughingFace className={styles.headerFace} />
        <Star className={styles.starOne} />
        <Star className={styles.starTwo} />
        <Rays className={styles.rays} />
        <h1 className={styles.title}>{MESSAGES.title}</h1>
        <p className={styles.subtitle}>{MESSAGES.subtitle}</p>
      </header>
      <div className={styles.panel}>
        <JokeGenerator />
      </div>
    </main>
  );
}
