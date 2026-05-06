import { useCallback } from 'react';
import useSearchStore from '../stores/useSearchStore';

const useLongTermSearch = () => {
  const mode = useSearchStore(state => state.mode);
  const longTermData = useSearchStore(state => state.longTermData);
  const filters = useSearchStore(state => state.filters);

  const generateSearchPayload = useCallback(() => {
    const basePayload = { ...filters };
    
    if (mode === 'short_term') {
      return basePayload;
    }

    const longTermPayload = {
      ...basePayload,
      isLongTerm: true,
      durationMonths: longTermData.duration,
      isFlexible: longTermData.isFlexible,
    };

    if (longTermData.isFlexible) {
      longTermPayload.flexibleMonths = longTermData.flexibleMonths;
    } else {
      longTermPayload.exactDate = longTermData.exactDate || null;
    }

    return longTermPayload;
  }, [mode, longTermData, filters]);

  const getMinDurationDays = useCallback(() => {
    if (longTermData.duration === 1) return 24;
    return (longTermData.duration - 1) * 30 + 1;
  }, [longTermData.duration]);

  return {
    generateSearchPayload,
    getMinDurationDays,
  };
};

export default useLongTermSearch;
