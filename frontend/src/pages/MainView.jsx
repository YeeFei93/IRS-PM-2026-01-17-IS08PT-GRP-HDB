import { useCallback } from "react";
import Empty from "../components/Empty"
import Loading from "../components/Loading"
import ResultsPane from "../components/ResultsPane"
import Welcome from "../components/Welcome"


export default function MainView({phase, loadMainText, loadStepText, recs, derived, formState, rawCount, latestMonth, highlightedTown, setHighlightedTown}){
    const onCardClick = useCallback((town) => {
        setHighlightedTown(town);
      }, []);
    
      const onJumpMap = useCallback((town) => {
        setActiveTab('map');
        setHighlightedTown(town);
      }, []);
    return (
         <>
              {phase === 'welcome' && <Welcome />}
              {phase === 'loading' && <Loading mainText={loadMainText} stepText={loadStepText} />}
              {phase === 'empty' && <Empty />}
              {phase === 'results' && (
                <ResultsPane
                  recs={recs}
                  grants={derived.grants}
                  effective={derived.effective}
                  cash={formState.cash}
                  cpf={formState.cpf}
                  rawCount={rawCount}
                  latestMonth={latestMonth}
                  mustAmenities={formState.mustAmenities}
                  highlightedTown={highlightedTown}
                  onCardClick={onCardClick}
                  onJumpMap={onJumpMap}
                />
              )}
        </>
    )
}