import { useEffect, useState } from 'react';
import {
  getInterestScores,
  getTopInterests,
  loadUserInterests,
  subscribeInterests,
  InterestScores,
} from '../lib/userInterests';

export function useUserInterests() {
  const [scores, setScores] = useState<InterestScores>(() => getInterestScores());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadUserInterests().then((loaded) => {
      setScores(loaded);
      setReady(true);
    });
    return subscribeInterests(setScores);
  }, []);

  const topInterests = getTopInterests(3);

  return { scores, topInterests, ready, version: Object.values(scores).join(',') };
}
