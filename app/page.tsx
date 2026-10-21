import TopicForm from "./TopicForm";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>מחולל בדיחות</h1>
        <p className={styles.subtitle}>בדיחה על כל נושא שתרצו</p>
      </header>
      <TopicForm />
    </main>
  );
}
