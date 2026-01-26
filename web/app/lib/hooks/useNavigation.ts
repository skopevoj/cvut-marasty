import { useQuizStore, useDataStore, usePeerStore } from "../stores";
import { usePeer } from "../providers/PeerProvider";
import { selectSubject } from "../actions/subjectActions";

/**
 * Hook for quiz navigation actions.
 * Handles next, prev, goTo, shuffle.
 */
export function useNavigation() {
  const quizStore = useQuizStore();
  const dataStore = useDataStore();
  const peerStore = usePeerStore();
  const { broadcastMessage } = usePeer();

  const next = () => {
    const { queue, currentIndex } = quizStore;
    if (currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextQ = queue[nextIndex];
      quizStore.setCurrentIndex(nextIndex);
      quizStore.resetAnswers();

      if (peerStore.isConnected && nextQ) {
        broadcastMessage({ type: "navigate", data: { questionId: nextQ.id } });
      }
    }
  };

  const prev = () => {
    const { queue, currentIndex } = quizStore;
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevQ = queue[prevIndex];
      quizStore.setCurrentIndex(prevIndex);
      quizStore.resetAnswers();

      if (peerStore.isConnected && prevQ) {
        broadcastMessage({ type: "navigate", data: { questionId: prevQ.id } });
      }
    }
  };

  const goTo = async (questionId: string) => {
    const { questions, currentSubject } = dataStore;
    const { queue } = quizStore;

    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    if (!currentSubject || currentSubject.code !== question.subjectCode) {
      selectSubject(question.subjectCode);
    }

    const index = queue.findIndex((q) => q.id === questionId);
    if (index !== -1) {
      quizStore.setCurrentIndex(index);
      quizStore.resetAnswers();

      if (peerStore.isConnected) {
        broadcastMessage({ type: "navigate", data: { questionId } });
      }
    }
  };

  const shuffle = () => {
    const { queue } = quizStore;
    const shuffled = [...queue];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    quizStore.setQueue(shuffled);
    quizStore.setCurrentIndex(0);
    quizStore.resetAnswers();
  };

  return { next, prev, goTo, shuffle };
}
